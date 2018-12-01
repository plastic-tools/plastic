import { isObjectLike } from "./types";

// Alias some common types to make code easier to read.

export type AsyncIteratorResult<T> = Promise<IteratorResult<T>>;
export type AnyIteratorResult<T = any> =
  | IteratorResult<T>
  | AsyncIteratorResult<T>;
export type AnyIterable<T = any> = AsyncIterable<T> | Iterable<T>;
export type AnyIterator<T = any> = AsyncIterator<T> | Iterator<T>;

// Constants allow reuse of same instance when returning iterator results

export const ITERATOR_DONE_RESULT: IteratorResult<any> = {
  done: true,
  value: undefined
};

export const ASYNC_ITERATOR_DONE_RESULT = Promise.resolve(ITERATOR_DONE_RESULT);

export const EMPTY_ASYNC_ITERATOR: AsyncIterableIterator<any> = {
  next() {
    return ASYNC_ITERATOR_DONE_RESULT;
  },
  [Symbol.asyncIterator]() {
    return this;
  }
};

// Type guards

/** Returns true and casts type if `x` appears to be an iterator result */
export const isIteratorResult = <T = unknown>(x: any): x is IteratorResult<T> =>
  isObjectLike(x) && "boolean" === typeof x.done && (x.done || "value" in x);

/**
 * Returns true and casts type if `x` appears to be an iterator.
 *
 * At runtime we can't tell the difference between a regular iterator and an
 * async iterator without actually calling the function. Only rely on this test
 * exclusively if you know for sure the value cannot be an regular iterator (or
 * if your usage will not matter).
 */
export const isIterator = <T = unknown>(x: any): x is Iterator<T> =>
  isObjectLike(x) &&
  "function" === typeof x.next &&
  (undefined === x.return || "function" === typeof x.return) &&
  (undefined === x.throw || "function" === typeof x.throw);

// prettier-ignore
/**
 * Returns true and casts type of `x` appears to be an async iterator.
 *
 * At runtime we can't tell the difference between a regular iterator and an
 * async iterator without actually calling the function. Only rely on this test
 * exclusively if you know for sure the value cannot be an regular iterator (or
 * if your usage will not matter).
 */
export const isAsyncIterator =
  (isIterator as unknown) as (<T = unknown>(x: any) => x is AsyncIterator<T>);

/** Returns true and casts type if `x` appears to be an iterable */
export const isIterable = <T = unknown>(x: any): x is Iterable<T> =>
  isObjectLike(x) && "function" === typeof x[Symbol.iterator];

/** Returns true and casts type if `x` appears to be an async iterable */
export const isAsyncIterable = <T = unknown>(x: any): x is AsyncIterable<T> =>
  isObjectLike(x) && "function" === typeof x[Symbol.asyncIterator];
