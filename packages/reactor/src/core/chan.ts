// tslint:disable max-classes-per-file

import {
  AnyIterator,
  EMPTY_ASYNC_ITERATOR,
  isAsyncIterable,
  isAsyncIterator,
  isIterable,
  isIterator,
  isPromiseLike
} from "@plastic/utils";
import { Channel } from "./types";

/** All the different input types `chan()` can convert to a channel */
export type ChannelSource<T = unknown> =
  | AsyncIterable<T>
  | Iterable<T>
  | AnyIterator<T>
  | Promise<T>;

async function* iterated<T>(iter: AnyIterator<T>) {
  while (true) {
    const { done, value } = await iter.next();
    if (!done || value !== undefined) yield value;
    if (done) break;
  }
}

async function* resolved<T>(promise: Promise<T>) {
  yield await promise;
}

// Maintain iterable semantics
class IterableChannel<T> implements AsyncIterable<T> {
  private _iter?: AsyncIterator<T>;
  constructor(readonly iterable: Iterable<T>) {}
  [Symbol.asyncIterator](): AsyncIterator<T> {
    const iter = this.iterable[Symbol.iterator]();
    return (iter as IterableIterator<any>) === this.iterable
      ? this._iter || (this._iter = iterated(iter)[Symbol.asyncIterator]())
      : chan(iter)[Symbol.asyncIterator]();
  }
}

const channels = new WeakMap<ChannelSource<any>, Channel<any>>();

/**
 * Converts a channel source to an async iterable channel, reusing prior
 * instances if possible, unless `reuse` is false.
 * @param source channel source
 */
export const chan = <T>(source: ChannelSource<T>, reuse = true): Channel<T> => {
  if ("object" !== typeof source) source = EMPTY_ASYNC_ITERATOR;
  let ret = reuse ? channels.get(source) : undefined;
  if (ret) return ret;
  ret = isAsyncIterable(source)
    ? source
    : isIterable(source)
    ? new IterableChannel(source)
    : isIterator(source) || isAsyncIterator(source)
    ? iterated(source)
    : isPromiseLike(source)
    ? resolved(source)
    : EMPTY_ASYNC_ITERATOR;
  if (reuse) channels.set(source, ret);
  return ret;
};

/** Returns true and casts if the value can be converted to a channel */
chan.test = <T = any>(x: any): x is ChannelSource<T> =>
  "object" === typeof x &&
  (isAsyncIterable(x) ||
    isIterable(x) ||
    isIterator(x) ||
    isAsyncIterator(x) ||
    isPromiseLike(x));

export default chan;
