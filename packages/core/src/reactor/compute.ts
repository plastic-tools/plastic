// tslint:disable only-arrow-functions
import ComputedValue from "./computed-value";
import reactor from "./reactor";
import { ComputeFn } from "./types";

type ComputePropertyFn<T = any, O extends object = object> = ComputeFn<T, [O]>;

interface ComputeDecorator {
  <T>(
    target: object,
    key: PropertyKey,
    desc: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T>;

  /** Set during a getter to the prior value for easy reuse */
  readonly prior: any;

  /**
   * Returns true if the property is cached and appears valid
   */
  validate(target: object, key: PropertyKey): boolean;

  /**
   * Invalidates the cache on the property, forcing it recompute. Returns
   * true if the cache was invalidated. Throws if the property is not setup
   * to cache.
   */
  invalidate(target: object, key: PropertyKey): boolean;
}

/**
 * Decorator you can apply to a computed property or method that will compute
 * and cache the results. This is only necessary to use when computing the
 * property may be expensive or you want to easily reuse the results.
 *
 * TODO: more docs
 */
export const compute = (<T>(
  target: object,
  key: PropertyKey,
  desc: TypedPropertyDescriptor<T>
): TypedPropertyDescriptor<T> =>
  desc.get
    ? makeProperty(target, key, desc)
    : makeMethod(target, key, desc)) as ComputeDecorator;

compute.validate = (target: object, key: PropertyKey) => {
  const fn = getComputeFn(target, key);
  const val = fn && ComputedValue.get(fn, target);
  return (val && reactor.validate(val)) || false;
};

compute.invalidate = (target: object, key: PropertyKey) => {
  const fn = getComputeFn(target, key);
  const val = fn && ComputedValue.get(fn, target);
  if (val) val.invalidate();
  return !!val;
};

Object.defineProperty(compute, "prior", {
  get() {
    return this[$Prior];
  }
});

// ..........................
// HELPERS
//

const $Prior = Symbol();

// needed to lookup for validate
const computeFns = new WeakMap<object, Map<PropertyKey, ComputePropertyFn>>();

const getComputeFn = (target: object, key: PropertyKey): ComputePropertyFn => {
  if (!target) return null;
  const fns = computeFns.get(target);
  return fns && fns.has(key)
    ? fns.get(key)
    : getComputeFn(Object.getPrototypeOf(target), key);
};

const setComputeFn = (
  target: object,
  key: PropertyKey,
  fn: ComputePropertyFn
) => {
  let fns = computeFns.get(target);
  if (!fns) fns = computeFns.set(target, new Map()).get(target);
  fns.set(key, fn);
};

const makeComputeFn = <T>(getter: () => T) => (prior: T, target: object) => {
  const saved = compute[$Prior];
  compute[$Prior] = prior;
  let ret: T;
  try {
    ret = getter.call(target);
  } finally {
    compute[$Prior] = saved;
  }
  return ret;
};

const makeProperty = <T>(
  target: object,
  key: PropertyKey,
  { configurable, enumerable, get, set }: TypedPropertyDescriptor<T>
) => {
  const desc: TypedPropertyDescriptor<T> = { configurable, enumerable, set };
  const fn = makeComputeFn(get);
  setComputeFn(target, key, fn);
  desc.get = function() {
    return ComputedValue.get(fn, target).get();
  };
  return desc;
};

const makeMethod = <T>(
  _: object,
  key: PropertyKey,
  desc: TypedPropertyDescriptor<T>
): TypedPropertyDescriptor<T> => {
  throw new TypeError("@compute decorator not yet supported on methods");
  // desc.value = wrap(desc.value as any, key) as any;
  // return desc;
};

export default compute;
