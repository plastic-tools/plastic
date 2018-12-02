import { Channel } from "../core";

interface NextFn {
  <T>(input: Channel<T>, iter?: unknown): Promise<T>;
  iter(input: Channel): unknown;
}

/**
 * Returns a promise that resolves to the next value from the channel. If you
 * call this method without the second optional `iter` parameter, this will
 * always act like a new iterator, meaning it will return whatever is the
 * first value of the channel would return to new iterators. IF you want to
 * keep track of your progress, you can get an iterator reference from
 * `next.iter()` first.
 *
 * @param input The input channel
 * @param iter (Optional) iterator to continue progress
 */
export const next = (async (input: Channel, iter: unknown = next.iter(input)) =>
  (await (iter as AsyncIterator<any>).next()).value) as NextFn;

/**
 * Returns an iterator token you can pass to `next()` to continue receiving
 * new value. The value of this token is opaque.
 */
next.iter = <T>(input: Channel<T>): unknown => input[Symbol.asyncIterator]();

export default next;
