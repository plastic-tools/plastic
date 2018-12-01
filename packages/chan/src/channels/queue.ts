import {
  AnyIteratorResult,
  ASYNC_ITERATOR_DONE_RESULT,
  AsyncIteratorResult,
  ITERATOR_DONE_RESULT
} from "@plastic/utils";
import { $PipeInput, Channel } from "../core";

interface QueueWriter<T> {
  /** Posts a new value to the channel. */
  put(value: T): void;

  /** Closes the channel if it's not already closed */
  close(): void;

  /** Closes the channel with an error, if it's not already closed */
  error(reason?: any): void;
}

interface QueueItem<T> extends AsyncIteratorResult<T> {
  put?: (result: AnyIteratorResult<T>) => void;
}

class QueueChannel<T> implements Channel<T>, QueueWriter<T> {
  private _writer?: QueueWriter<T>;
  private _history = new WeakMap<QueueItem<T>, QueueItem<T>>();
  private _next?: QueueItem<T>; // next item to return
  private _unput?: QueueItem<T>; // first unput item
  private _top?: QueueItem<T>;

  put(value: T) {
    this._put({ done: false, value });
  }

  close() {
    this._put(ITERATOR_DONE_RESULT);
  }

  error(reason?: any) {
    this._put(Promise.reject(reason));
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<T> {
    return this;
  }

  next(): AsyncIteratorResult<T> {
    // if there is no next item, get an unput item, otherwise just return next
    if (!this._next) {
      const item = this._createUnputItem(this._top);
      if (this._top) this._history.set(this._top, item);
      this._top = item;
      if (!this._unput) this._unput = item;
      return item;
    } else {
      const item = this._next;
      this._next = this._history.get(this._next);
      return item;
    }
  }

  [$PipeInput]() {
    return (
      this._writer ||
      (this._writer = {
        put: value => this.put(value),
        close: () => this.close(),
        error: (reason?: any) => this.error(reason)
      })
    );
  }

  /** If there is an unput item, resolve it. otherwise add to top of queue */
  private _put(result: AnyIteratorResult<T>) {
    const resolved = this._resolveNextUnputItem(result);
    if (!resolved) {
      const item = this._createItem(result, this._top);
      if (this._top) this._history.set(this._top, item);
      this._top = item;
      if (!this._next) this._next = item;
    }
  }

  /** Resolves next unput item if there is one. Returns false otherwise */
  private _resolveNextUnputItem(result: AnyIteratorResult<T>) {
    // catchip any resolved unput items
    while (this._unput && !this._unput.put) {
      this._unput = this._history.get(this._unput);
    }
    if (!this._unput) return false;
    this._unput.put!(result);
    this._unput = this._history.get(this._unput);
    return true;
  }

  private async _createItem(value: AnyIteratorResult<T>, prior?: QueueItem<T>) {
    const done = prior ? (await prior).done : false;
    return done ? ASYNC_ITERATOR_DONE_RESULT : value;
  }

  // creates an unput item that will delete it's `put` once resolved
  private _createUnputItem(prior?: QueueItem<T>): QueueItem<T> {
    let result: AnyIteratorResult<T> | undefined;
    let resolve: ((result: AnyIteratorResult<T>) => void) | undefined;
    const item: QueueItem<T> = this._createItem(
      new Promise(fn => {
        if (result) fn(result);
        else resolve = fn;
      }),
      prior
    );
    item.put = (value: AnyIteratorResult<T>) => {
      item.put = undefined;
      if (resolve) resolve(value);
      else result = value;
    };
    return item;
  }
}

/**
 * Returns a channel that you can write to imperatively. If you pass this
 * as the input parameter to `pipe()`, it will also install a `QueueWriter`
 * API on the returned pipe, allowing you to continue to write the pipe.
 *
 * Closes when you call `close()`. Throws when you call `error()`.
 */
export const queue = <T>() => new QueueChannel<T>();
export default queue;
