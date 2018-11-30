// tslint:disable max-classes-per-file

import {
  AnyIteratorResult,
  ASYNC_ITERATOR_DONE_RESULT,
  AsyncIteratorResult,
  isPromiseLike,
  ITERATOR_DONE_RESULT
} from "@plastic/utils";

type BufferItemValue<T> = IteratorResult<T> | AsyncIteratorResult<T>;

interface BufferItem<T> extends AsyncIteratorResult<T> {
  /** If set, you can call to resolve this history item. */
  put?: (value: BufferItemValue<T>) => void;
}

/**
 * @internal
 *
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
export class BufferChannel<T> implements AsyncIterableIterator<T> {
  /** The current history limit for the buffer */
  get limit() {
    return this._limit;
  }

  private get _items() {
    return this._itemsvar || (this._itemsvar = new WeakMap());
  }

  /** Oldest unput item. Consumed by calls to `put()` */
  private get _unput() {
    // move the unput item marker to the latest unresolved item
    while (this._unputvar && !this._unputvar.put) {
      this._unputvar = this._items.get(this._unputvar);
      this._size++;
    }
    return this._unputvar;
  }

  get writable() {
    return this.final === undefined;
  }

  /** Set once queue has closed */
  final?: BufferItem<T>;

  private _limit: number;

  private _itemsvar?: WeakMap<BufferItem<T>, BufferItem<T>>;

  /** Value to be returned for readers with no prior */
  private _start?: BufferItem<T>;

  private _unputvar?: BufferItem<T>;

  /** Most recently read item. If undefined, no reading yet. Return start */
  private _top?: BufferItem<T>;

  private _size = 0;

  private _depth = 0;

  private _prior?: AsyncIteratorResult<T>;
  private _iterated?: number;

  constructor(limit = 0) {
    this._limit = limit >= 0 ? limit : 0;
  }

  remember(limit = Number.MAX_SAFE_INTEGER) {
    this._limit = limit;
    return this;
  }

  /**
   * @internal
   * Returns a promise for the next item put to the history. If you pass
   * `prior`, returns promise will be for the item that is emitted after
   * that item. If no items are in the queue, `this.fetch()` will be called,
   * giving the queue a chance to pull a new value if needed.
   */
  after(prior?: AsyncIteratorResult<T>): AsyncIteratorResult<T> {
    // always return final state except when asked for prior history
    const final = this.final;
    if (final && (!prior || prior === final || prior === this._top)) {
      return final;
    }

    if (!prior) {
      // no prior = new iterator. return initial value
      this._prune();
      if (this._start) return this._start!;
    } else if (prior !== this._top) {
      // caller thinks prior is in history.
      const ret = this._items.get(prior);
      if (!ret) throw Error(`prior not found in history`);
      return ret;
    }

    // need a new top, give fetch a chance
    const fetched = this.fetch();
    if (fetched) return this.put(fetched);

    // no next value available, make an unput item for later
    const item = this._createUnputBufferItem(this._top);
    this._addToTop(item);
    if (!this._unputvar) this._unputvar = item;
    return item;
  }

  next(): AsyncIteratorResult<T> {
    return (this._prior = this.after(this._prior));
  }

  // return self as iterator first time to avoid unecessary object creation
  [Symbol.asyncIterator](): AsyncIterableIterator<T> {
    const iterated = (this._iterated = (this._iterated || 0) + 1);
    return iterated === 1 ? this : new BufferIterator(this);
  }

  /** Adds a new iterator result to the queue. */
  put(result: BufferItemValue<T>): BufferItem<T> {
    let item = this._unput;
    const limit = this._limit;
    if (item) {
      item.put!(result);
      this._unputvar = this._items.get(item);
      this._size++;
    } else if (limit <= 0 && !isPromiseLike(result)) {
      // fastpath: no unput items to fill, history is disabled, and the
      // result is accessible. process now and drop on the floor.
      if (result.done) this.final = ASYNC_ITERATOR_DONE_RESULT;
      item = ASYNC_ITERATOR_DONE_RESULT;
    } else {
      // no unput items to fill, so just add to the end of the queue, to be
      // read by future calls to next
      item = this._createBufferItem(result, this._top);
      this._addToTop(item);
      this._size++;
    }
    return item;
  }

  /**
   * Called when an iterator tries to retrieve the next item and the queue is
   * empty. Subclasses override this to go fetch the next item on demand.
   * The default implementation does nothing.
   */
  protected fetch(): undefined | IteratorResult<T> | AsyncIteratorResult<T> {
    return;
  }

  /**
   * Creates a new item that will resolve to the passed. Not yet added to
   * queue.
   */
  private async _createBufferItem(
    value: BufferItemValue<T>,
    prior?: BufferItem<T>
  ) {
    try {
      let result = prior && (await prior);
      if (!result || !result.done) result = await value;
      if (result && result.done) this.final = ASYNC_ITERATOR_DONE_RESULT;
      return result;
    } catch (reason) {
      this.final = Promise.reject(reason);
      throw reason;
    }
  }

  /** Creates a new item that will resolve later once a value is put to it. */
  private _createUnputBufferItem(prior?: BufferItem<T>) {
    let result: undefined | BufferItemValue<T>;
    let put: undefined | ((value: BufferItemValue<T>) => void);
    const item: BufferItem<T> = this._createBufferItem(
      new Promise(resolve => {
        if (result !== undefined) resolve(result);
        else put = resolve;
      }),
      prior
    );
    item.put = value => {
      if (put) put(value);
      else result = value;
      item.put = put = undefined;
    };
    return item;
  }

  private _prune() {
    const limit = this._limit;
    if (limit <= 0) {
      if (this._size === 0) return;
      this._start = this._unput;
      this._depth = Math.max(0, this._depth - this._size);
      this._size = 0;
    } else if (this._size >= limit) {
      const stop = this._unput;
      while (this._start && this._start !== stop && this._size >= limit) {
        this._start = this._items.get(this._start);
        this._size--;
        this._depth--;
      }
      this._size = Math.max(0, this._size);
      this._depth = Math.max(0, this._depth);
    }
  }

  private _addToTop(item: BufferItem<T>) {
    if (this._top) this._items.set(this._top, item);
    this._top = item;
    if (!this._start) this._start = item;
    this._depth++;
  }
}

class BufferIterator<T> implements AsyncIterableIterator<T> {
  prior?: AsyncIteratorResult<T>;
  constructor(readonly channel: BufferChannel<T>) {}
  next() {
    return (this.prior = this.channel.after(this.prior));
  }

  [Symbol.asyncIterator]() {
    return this;
  }
}

export default BufferChannel;
