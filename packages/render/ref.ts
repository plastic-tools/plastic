import { Ref } from "./types";

/**
 * Returns a reused function for a given target/key that will set the value
 */
export const ref = <T extends Object, K extends keyof T>(
  target: T,
  key: K
): Ref<T[K]> => {
  const keys = refs.get(target) || refs.set(target, new Map()).get(target);
  return keys.get(key) || keys.set(key, x => (target[key] = x)).get(key);
};
const refs = new WeakMap<Object, Map<any, Ref<any>>>();

export const applyRef = <T>(ref: Ref<T>, value: T) => {
  if (ref) ref(value);
};

export default ref;
