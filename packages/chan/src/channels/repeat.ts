// tslint:disable max-classes-per-file
import {
  AnyIterator,
  ASYNC_ITERATOR_DONE_RESULT,
  AsyncIteratorResult
} from "@plastic/utils";
import { Channel, ChannelFilter, ChannelTransform } from "../types";

class RepeaterChannel<T> implements Channel<T> {
  protected get iter() {
    return this._iter || (this._iter = this.input[Symbol.asyncIterator]());
  }

  protected history = new WeakMap<
    AsyncIteratorResult<T>,
    AsyncIteratorResult<T>
  >();

  protected start?: AsyncIteratorResult<T>;

  // start point to repeat for all listeners, unless there is a history
  protected unresolved?: AsyncIteratorResult<T>;

  // most recently retrieved value
  protected top?: AsyncIteratorResult<T>;

  /** how many items from start to top of history */
  protected depth = 0;
  private _iter?: AnyIterator<T>;

  constructor(readonly input: Channel<T>, readonly limit: number) {}

  after(prior?: AsyncIteratorResult<T>): AsyncIteratorResult<T> {
    if (!prior) {
      console.log("new iterator");
    }
    if (!prior) this.prune();
    let next = prior ? this.history.get(prior) : this.start;
    if (!next) {
      // at top, go get the next unresolved value and add it to the top
      next = this.fetch(this.top);
      if (this.top) this.history.set(this.top, next);
      this.top = next;
      if (!this.unresolved) this.unresolved = next;
      if (!this.start) this.start = this.unresolved;
    }
    return next;
  }
  [Symbol.asyncIterator](): AsyncIterableIterator<T> {
    return new RepeaterChannelIterator(this);
  }

  /** if depth exceeds limit, move forward start until it isn't */
  protected prune() {
    while (
      this.start &&
      this.start !== this.unresolved &&
      this.depth > this.limit
    ) {
      this.start = this.history.get(this.start);
      this.depth--;
    }
    if (!this.start && (this.unresolved || this.depth > 0)) {
      this.start = this.unresolved;
      this.depth = 0;
    }
  }

  /** Retrieves the raw value from the upstream channel when needed */
  protected async fetch(
    prior?: AsyncIteratorResult<T>
  ): AsyncIteratorResult<T> {
    try {
      const done = prior ? (await prior).done : false;
      return done ? ASYNC_ITERATOR_DONE_RESULT : await this.iter.next();
    } finally {
      // unresolved should equal us since future results are waiting on this
      this.unresolved = this.history.get(this.unresolved!);
      this.depth++;
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
