import { TrackedValue, Revision, PropertyValue } from "./types";
import Reactor from "./reactor";

/**
 * Tracks a single value. You usually won't need to use this class directly.
 * Instead, use the `@tracked` decorator. You may want to use this when
 * implementing collections. See `TrackedMap` for an example.
 */
export default class Atom<T> implements TrackedValue, PropertyValue<T> {
  constructor(private _value: T = undefined) {}

  get(): T {
    Reactor.currentReactor.recordAccess(this);
    return this._value;
  }

  set(v: T) {
    if (v === this._value) return;
    this._value = v;
    this._changed = Reactor.currentReactor.recordChange(this);
  }

  clone() {
    return new Atom(this._value);
  }

  validate(_: Set<TrackedValue>, rev = Reactor.currentReactor.current) {
    return rev >= this._changed;
  }
  private _changed = Revision.NEVER;
}
