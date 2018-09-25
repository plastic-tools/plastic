import { reactor, PropertyKey, ComputeFn } from "./reactor";

const $ComputeWrapper = Symbol();

interface CacheFn {
  <T>(
    target: Object,
    key: PropertyKey,
    desc: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T>;

  /**
   * Returns true if the property is cached and appears valid
   */
  validate(target: Object, key: PropertyKey): boolean;

  /**
   * Invalidates the cache on the property, forcing it recompute. Returns
   * true if the cache was invalidated. Throws if the property is not setup
   * to cache.
   */
  invalidate(target: Object, key: PropertyKey): boolean;

  /** Set during a getter to the prior value for easy reuse */
  readonly prior: any;
}

/**
 * Decorator you can apply to a computed property or method that will compute
 * and cache the results. This is only necessary to use when computing the
 * property may be expensive or you want to easily reuse the results.
 *
 * TODO: more docs
 */
export const cache = (<T>(
  target: Object,
  key: PropertyKey,
  desc: TypedPropertyDescriptor<T>
): TypedPropertyDescriptor<T> =>
  desc.get
    ? makeProperty(target, key, desc)
    : makeMethod(target, key, desc)) as CacheFn;

cache.validate = (target: Object, key: PropertyKey) => {
  const fn = getComputeFn(target, key);
  return (fn && reactor.validateFn(fn, target)) || false;
};

cache.invalidate = (target: Object, key: PropertyKey) => {
  const fn = getComputeFn(target, key);
  if (fn) reactor.invalidate(fn, target);
  return !!fn;
};

Object.defineProperty(cache, "prior", {
  get() {
    return this[$Prior];
  }
});

// ..........................
// HELPERS
//

const $Prior = Symbol();

// needed to lookup for validate
const computeFns = new WeakMap<Object, Map<PropertyKey, ComputeFn>>();

const getComputeFn = (target: Object, key: PropertyKey): ComputeFn => {
  if (!target) return null;
  const fns = computeFns.get(target);
  return fns && fns.has(key)
    ? fns.get(key)
    : getComputeFn(Object.getPrototypeOf(target), key);
};

const setComputeFn = (target: Object, key: PropertyKey, fn: ComputeFn) => {
  let fns = computeFns.get(target);
  if (!fns) fns = computeFns.set(target, new Map()).get(target);
  fns.set(key, fn);
};

const makeComputeFn = <T>(getter: () => T) => (prior: T, target: Object) => {
  const saved = cache[$Prior];
  cache[$Prior] = prior;
  let ret: T;
  try {
    ret = getter.call(target);
  } finally {
    cache[$Prior] = saved;
  }
  return ret;
};

const makeProperty = <T>(
  target: Object,
  key: PropertyKey,
  { configurable, enumerable, get, set }: TypedPropertyDescriptor<T>
) => {
  const desc: TypedPropertyDescriptor<T> = { configurable, enumerable, set };
  const fn = makeComputeFn(get);
  setComputeFn(target, key, fn);
  desc.get = function() {
    return reactor.compute(fn, this);
  };
  return desc;
};

const makeMethod = <T>(
  _: Object,
  key: PropertyKey,
  desc: TypedPropertyDescriptor<T>
): TypedPropertyDescriptor<T> => {
  desc.value = wrap(desc.value as any, key) as any;
  return desc;
};

const wrap = <T>(fn: ComputeFn<T>, key: PropertyKey = fn.name): (() => T) => {
  if (!fn[$ComputeWrapper]) {
    fn[$ComputeWrapper] = function() {
      if (arguments.length > 0) {
        throw new TypeError("You cannot pass parameters to compute methods");
      }
      return reactor.compute(fn, this);
    };
    fn.displayName = fn.displayName || `@compute(${String(key)})`;
  }
  return fn[$ComputeWrapper];
};

export default cache;
