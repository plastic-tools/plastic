/**
 * @module types
 * General types and type guards not otherwise related to a specific module
 */

/** Casts if the `x` can be treated as an open object type */
export const isObjectLike = (x: any): x is any =>
  !!x && ("object" === typeof x || "function" === typeof x);

/** Casts as a system promise if `x` is promise like. */
export const isPromiseLike = <T = unknown>(x: any): x is Promise<T> =>
  isObjectLike(x) && "function" === typeof x.then;
