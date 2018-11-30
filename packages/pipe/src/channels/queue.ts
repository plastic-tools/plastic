import { ITERATOR_DONE_RESULT } from "@plastic/utils";
import BufferChannel from "../buffer";
import { WritableChannel } from "../types";

/**
 * A writable, FIFO queue that can be read from and written to independently.
 * Also conforms to the channel protocols, so you can use it anywhere you
 * might use a channel.
 *
 * This is the workhorse of the library. Most channels you create are instances
 * of this class, therefore it is optimized to ensure the memory consumed and
 * performance cost pairs to the way it is used. In particular, avoid
 * work done on each instance creation. It also avoids creating new iterator
 * instances until you try to iterate more than once.
 *
 */
export class QueueChannel<T> implements WritableChannel<T>, AsyncIterable<T> {
  private _buffer = new BufferChannel<T>();

  get writable() {
    return this._buffer.writable;
  }

  /**
   * Adds the passed value to the queue. Throws an exception if queue is
   * no longer writable.
   */
  put(value: T) {
    if (!this._buffer.writable) throw Error(`queue not writable`);
    this._buffer.put({ done: false, value });
  }

  /** Adds a done item to the queue and marks it as closed. */
  close() {
    if (!this.writable) return this;
    this._buffer.put(ITERATOR_DONE_RESULT);
    return this;
  }

  /** Adds the error to the queue and marks it as closed. */
  error(reason?: any) {
    if (!this.writable) return this;
    const final = Promise.reject(reason);
    this._buffer.put(final);
    this._buffer.final = final;
    return this;
  }

  remember(limit = Number.MAX_SAFE_INTEGER) {
    this._buffer.remember(limit);
  }

  [Symbol.asyncIterator]() {
    return this._buffer[Symbol.asyncIterator]();
  }
}

export const queue = <T = unknown>() => new QueueChannel<T>();
export default queue;
