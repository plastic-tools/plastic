// tslint:disable max-classes-per-file
import {
  AnyIterator,
  ASYNC_ITERATOR_DONE_RESULT,
  AsyncIteratorResult
} from "@plastic/utils";
import { Channel, ChannelFilter } from "../core";

class RepeaterChannel<T> implements Channel<T> {
  protected get iter() {
    return this._iter || (this._iter = this.input[Symbol.asyncIterator]());
  }

  // start point to repeat for all listeners, unless there is a history
  private _unresolved?: AsyncIteratorResult<T>;

  // most recently retrieved value
  private _top?: AsyncIteratorResult<T>;

  /** how many items from start to top of history */
  private _depth = 0;

  private _history = new WeakMap<
    AsyncIteratorResult<T>,
    AsyncIteratorResult<T>
  >();

  private _start?: AsyncIteratorResult<T>;
  private _iter?: AnyIterator<T>;

  constructor(readonly input: Channel<T>, readonly limit: number) {}

  after(prior?: AsyncIteratorResult<T>): AsyncIteratorResult<T> {
    if (!prior) this.prune();
    let next = prior ? this._history.get(prior) : this._start;
    if (!next) {
      // at top, go get the next unresolved value and add it to the top
      next = this.fetch(this._top);
      if (this._top) this._history.set(this._top, next);
      this._top = next;
      if (!this._unresolved) this._unresolved = next;
      if (!this._start) this._start = this._unresolved;
    }
    return next;
  }
  [Symbol.asyncIterator](): AsyncIterableIterator<T> {
    return new RepeaterChannelIterator(this);
  }

  /** if depth exceeds limit, move forward start until it isn't */
  protected prune() {
    while (
      this._start &&
      this._start !== this._unresolved &&
      this._depth > this.limit
    ) {
      this._start = this._history.get(this._start);
      this._depth--;
    }
    if (!this._start && (this._unresolved || this._depth > 0)) {
      this._start = this._unresolved;
      this._depth = 0;
    }
  }

  /** Retrieves the raw value from the upstream channel when needed */
  protected async fetch(
    prior?: AsyncIteratorResult<T>
  ): AsyncIteratorResult<T> {
    let done = true;
    try {
      done = prior ? (await prior).done : false;
      return done ? ASYNC_ITERATOR_DONE_RESULT : await this.iter.next();
    } finally {
      // unresolved should equal us since future results are waiting on this
      this._unresolved = this._history.get(this._unresolved!);
      if (!done) this._depth++;
    }
  }
}

class RepeaterChannelIterator<T> implements AsyncIterableIterator<T> {
  prior?: AsyncIteratorResult<T>;
  constructor(readonly input: RepeaterChannel<T>) {}
  next() {
    return (this.prior = this.input.after(this.prior));
  }
  [Symbol.asyncIterator]() {
    return this;
  }
}

/**
 * Returns a channel filter that will store up to `limit` history and repeat to
 * new listeners. If you set limit to 0, then allows multiple concurrent
 * downstream listeners without storing any history. Setting to 1 will replay
 * most recent output (good for stores). The default stores all history and
 * replays for each new listener.
 *
 * Closes when input channel closes. Throws when input channel throws.
 *
 * @param input channel to repeat
 * @param limit (Optional) maximum history to save for future iterators
 */
export function repeat<T>(input: Channel<T>, limit?: number): Channel<T>;
export function repeat(limit: number): ChannelFilter;
export function repeat(
  inputOrLimit: Channel | number,
  limit = Number.MAX_SAFE_INTEGER
): Channel | ChannelFilter {
  if ("number" === typeof inputOrLimit) {
    limit = inputOrLimit;
    return <T>(input: Channel<T>) => repeat(input, limit);
  } else {
    const input = inputOrLimit;
    return new RepeaterChannel(input, limit);
  }
}

export default repeat;
