import { track } from "../reactor";

export type StreamState = "pending" | "active" | "done" | "error";

type StreamFn<T> = (
  next: (v: T) => void,
  done: (v?: T) => void,
  error: (reason: any) => void
) => void | Iterator<T>;

const isStreamFn = (x: any): x is StreamFn<any> =>
  "function" === typeof x && x.length > 0;

type StreamIterator<T> = Iterator<T | Promise<T>>;
type StreamGenerator<T> = StreamIterator<T> | (() => StreamIterator<T>);
const isIterator = <T = any>(x: any): x is StreamIterator<T> =>
  !!x && "object" === typeof x && "function" === typeof x.next;

/**
 * A Stream works much like a Promise except that it can take multiple
 * values over time. You should pass in a function that will invoke the passed
 * callbacks as the stream state updates
 */
export default class TrackedStream<T = any> {
  @track
  state: StreamState = "pending";

  @track
  value: T;

  @track
  reason: any;

  /** Starts the stream */
  async start(fnOrGenerator: StreamFn<T> | StreamGenerator<T>) {
    const { next_, done_, error_ } = this;
    if (isStreamFn(fnOrGenerator)) {
      (fnOrGenerator as StreamFn<T>)(next_, done_, error_);
    } else {
      const iter =
        "function" === typeof fnOrGenerator
          ? (fnOrGenerator as any)()
          : fnOrGenerator;
      if (!isIterator<T>(iter)) throw new TypeError("Must return a generator");
      do {
        const { done, value } = iter.next();
        next_(await value);
        if (done) break;
      } while (true);
    }
  }

  private next_ = (v: T) => {
    switch (this.state) {
      case "pending":
        this.state = "active";
        this.value = v;
        break;
      case "active":
        this.value = v;
        break;
      case "done":
      case "error":
        break;
    }
  };

  private done_ = (v?: T) => {
    switch (this.state) {
      case "pending":
      case "active":
        this.state = "done";
        if (v !== undefined) this.value = v;
        break;
      case "done":
      case "error":
        break;
    }
  };

  private error_ = (reason: any) => {
    this.reason = reason;
    this.value = undefined;
    this.state = "error";
  };
}
