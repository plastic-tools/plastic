// tslint:disable only-arrow-functions
import reactor from "./reactor";

interface NoncomputedProperty<T> {
  enumerable?: boolean;
  configurable?: boolean;
  writable?: boolean;
  value?: T;
  get: void;
  set: void;
}

/**
 * Decorator that will cause a property to be tracked for automatic updates.
 * TODO: more docs
 */
export const track = <T>(
  target: object,
  key: PropertyKey,
  desc?: NoncomputedProperty<T>
) => {
  const install = makeStaticDescriptor(target, key, desc as any);
  Object.defineProperty(target, key, install);
};

const makeStaticDescriptor = <T>(
  target: object,
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
    return reactor.get(key, target, value);
  };
  if (writable)
    desc.set = function(v: T) {
      reactor.set(key, v, target);
    };
  return desc;
};

export default track;
