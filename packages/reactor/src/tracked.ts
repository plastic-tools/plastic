import Atom from "./atom";
import ComputedValue from "./computed-value";
import { PropertyValue } from "./types";

// ......................
// HELPERS
//

const $Properties = Symbol();
const $Owner = Symbol();

interface PropertyValues {
  [key: string]: PropertyValue;
  [$Owner]?: Object;
}
const EMPTY_PROPERTY_VALUES = {};
function getPropertyValues(target: Object, writable = true) {
  const pvals: PropertyValues = target[$Properties];
  return pvals && target === pvals[$Owner]
    ? pvals
    : writable
      ? (target[$Properties] = { [$Owner]: target })
      : EMPTY_PROPERTY_VALUES;
}

function getPropertyValue(target: Object, key: string): PropertyValue {
  if (!target || target === Object.prototype) return null;
  let pval = getPropertyValues(target, false)[key];
  if (!pval) {
    pval = getPropertyValue(Object.getPrototypeOf(target), key);
    if (pval) pval = setPropertyValue(target, key, pval.clone());
  }
  return pval;
}

function setPropertyValue(target: Object, key: string, pval: PropertyValue) {
  getPropertyValues(target, true)[key] = pval;
  return pval;
}

const getters: { [key: string]: () => any } = {};
function makeGetter(key: string) {
  return (
    getters[key] ||
    (getters[key] = function() {
      const pval = getPropertyValue(this, key);
      return pval && pval.get();
    })
  );
}

const setters: { [key: string]: (v: any) => void } = {};
function makeSetter(key: string) {
  return (
    setters[key] ||
    (setters[key] = function(v: any) {
      getPropertyValue(this, key).set(v);
    })
  );
}

const makeAtomDescriptor = <T>(
  target: Object,
  key: string,
  {
    configurable = true,
    enumerable = true,
    writable = true,
    value
  }: TypedPropertyDescriptor<T> = {}
) => {
  const desc: TypedPropertyDescriptor<T> = { configurable, enumerable };
  desc.get = makeGetter(key);
  if (writable) desc.set = makeSetter(key);
  setPropertyValue(target, key, new Atom(value));
  return desc;
};

const makeComputedDescriptor = <T>(
  target: Object,
  key: string,
  {
    configurable = true,
    enumerable = true,
    get,
    set
  }: TypedPropertyDescriptor<T> = {}
) => {
  const desc: TypedPropertyDescriptor<T> = { configurable, enumerable };
  desc.get = makeGetter(key);
  if (set) desc.set = makeSetter(key);
  setPropertyValue(target, key, new ComputedValue(get, set));
  return desc;
};

const installAtom = (target: Object, key: string) => {
  const desc = makeAtomDescriptor(target, key);
  Object.defineProperty(target, key, desc);
};

// ......................
// DECORATOR
//

interface TrackedFn {
  (target: Object, key: string): void;
  <T>(
    target: Object,
    key: string,
    desc: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T>;

  /** Returns the property value associated with the key, if defined */
  value(target: Object, key: string): PropertyValue;

  /** Invalidates the tracked property, if supported. Returns true if success */
  invalidate(target: Object, key: string): boolean;
}

/**
 * Marks a property as a tracked variable.
 */
const tracked = ((
  target: Object,
  key: string,
  desc?: TypedPropertyDescriptor<any>
) =>
  desc
    ? desc.get
      ? makeComputedDescriptor(target, key, desc)
      : makeAtomDescriptor(target, key, desc)
    : installAtom(target, key)) as TrackedFn;
tracked.value = getPropertyValue;
tracked.invalidate = (target: Object, key: string) => {
  const pval = tracked.value(target, key);
  if (pval && "function" === typeof pval.invalidate) {
    pval.invalidate();
  } else return false;
};

export default tracked;