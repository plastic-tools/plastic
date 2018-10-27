import reactor, { $Tag, Tag, TrackedValue } from "../reactor";

const handler: ProxyHandler<any[]> = {
  get(target: any[], key: string, receiver: TrackedArray<any>) {
    if (key === "length" || !(key in Array.prototype)) {
      reactor.accessed(receiver);
    }
    return Reflect.get(target, key, receiver);
  },

  set(target: any[], key: string, value: any, receiver: TrackedArray<any>) {
    if (key === "length" || !isNaN(Number(key))) {
      receiver.recordChange();
    }
    return Reflect.set(target, key, value, receiver);
  }
};

/**
 * Acts like an array, but will notify when you modify values of the array.
 * You can pass in a source array that will be used as the internal value. You
 * can use this anywhere you would normally use an array. Note that currently
 * methods that return a new array do not return tracked arrays themselves.
 */
export default class TrackedArray<T> extends Proxy<T[]>
  implements TrackedValue {
  private _changed = Tag.NEVER;
  constructor(array: T[] = []) {
    super(array, handler);
  }

  [$Tag]() {
    return this._changed;
  }

  recordChange() {
    this._changed = reactor.changed(this);
  }
}
