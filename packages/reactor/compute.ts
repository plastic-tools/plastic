import { PropertyKey, reactor, ComputeFn } from "./reactor";

const $ComputeWrapper = Symbol();

/**
 * Marks a method as computed. This will automatically cache the result of
 * the method, depending on the parameters you pass to it. Always declare an
 * optional final "prior" parameter, which will be the prior return value
 * when the function was called.
 *
 * This decorator can only be used for methods or functions. To augment a
 * property use `@track`.
 */
export function compute<T>(fn: ComputeFn<T>): () => T;
export function compute<F extends ComputeFn>(
  target: Object,
  key: PropertyKey,
  desc: TypedPropertyDescriptor<F>
): TypedPropertyDescriptor<F>;
export function compute<T, F extends ComputeFn<T>>(
  targetOrFn: Object | F,
  key?: PropertyKey,
  desc?: TypedPropertyDescriptor<F>
): (() => T) | TypedPropertyDescriptor<F> {
  if ("function" === typeof targetOrFn) return wrap(targetOrFn);
  desc.value = wrap(desc.value, key) as F;
  return desc;
}

// ...............................
// HELPERS
//

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
