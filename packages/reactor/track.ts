import { reactor, PropertyKey, ComputeFn } from "./reactor";

interface TrackFn {
  (target: Object, key: PropertyKey): void;
  <T>(
    target: Object,
    key: PropertyKey,
    desc: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T>;

  /**
   * Returns false if the property's return value is computed and will
   * need to be recomputed the next time you get it.
   */
  validate(target: Object, key: PropertyKey): boolean;

  /**
   * Invalidates the property, if it is computed. Causes it to be recomputed
   * the next time it is called. Returns true if the property was invalidated.
   */
  invalidate(target: Object, key: PropertyKey): boolean;

  /** Set during a getter to the prior value for easy reuse */
  readonly prior: any;
}

/**
 * Decorator that will cause a property to be tracked for automatic updates.
 * TODO: more docs
 */
export const track = ((
  target: Object,
  key: PropertyKey,
  desc?: TypedPropertyDescriptor<any>
) =>
  desc
    ? desc.get
      ? makeComputedDescriptor(target, key, desc)
      : makeStaticDescriptor(target, key, desc)
    : installStatic(target, key)) as TrackFn;

track.validate = (target: Object, key: PropertyKey) => {
  const fn = getComputeFn(target, key);
  return (fn && reactor.validate(fn, target)) || false;
};

track.invalidate = (target: Object, key: PropertyKey) => {
  const fn = getComputeFn(target, key);
  if (fn) reactor.invalidate(fn, target);
  return !!fn;
};

Object.defineProperty(track, "prior", {
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
  const saved = track[$Prior];
  track[$Prior] = prior;
  let ret: T;
  try {
    ret = getter.call(target);
  } finally {
    track[$Prior] = saved;
  }
  return ret;
};

const makeComputedDescriptor = <T>(
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

const makeStaticDescriptor = <T>(
  target: Object,
  key: PropertyKey,
  {
    configurable,
    enumerable,
    writable = true,
    value
  }: TypedPropertyDescriptor<T> = {}
) => {
  const desc: TypedPropertyDescriptor<T> = { configurable, enumerable };
  desc.get = function() {
    return reactor.get(key, target);
  };
  if (writable)
    desc.set = function(v: T) {
      reactor.set(key, v, target);
    };
  if (value !== undefined) reactor.initialize(key, value, target);
  return desc;
};

const installStatic = (target: Object, key: PropertyKey) => {
  const desc = makeStaticDescriptor(target, key);
  Object.defineProperty(target, key, desc);
};

export default track;
