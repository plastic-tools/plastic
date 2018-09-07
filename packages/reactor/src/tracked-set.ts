import { TrackedValue, Revision } from "./types";
import Reactor from "./reactor";

/**
 * An tracked set. Changes to this set will cause dependent tracked variables
 * and reactions to automatically update.
 */
export default class TrackedSet<T> extends Set<T> implements TrackedValue {
  add(v: T) {
    super.add(v);
    this.recordChange();
    return this;
  }

  delete(v: T) {
    const deleted = super.delete(v);
    if (deleted) this.recordChange();
    return deleted;
  }

  get size() {
    Reactor.currentReactor.recordAccess(this);
    return super.size;
  }

  has(v: any) {
    Reactor.currentReactor.recordAccess(this);
    return super.has(v);
  }

  entries() {
    Reactor.currentReactor.recordAccess(this);
    return super.entries();
  }

  values() {
    Reactor.currentReactor.recordAccess(this);
    return super.values();
  }

  forEach(fn: (value: T, value2: T, set: Set<T>) => void, thisArg?: any) {
    Reactor.currentReactor.recordAccess(this);
    return super.forEach(fn, thisArg);
  }

  clear() {
    const ret = super.clear();
    this.recordChange();
    return ret;
  }

  validate(_, rev = Reactor.currentReactor.changed) {
    return rev >= this._changed;
  }

  protected recordChange() {
    this._changed = Reactor.currentReactor.recordChange(this);
  }

  private _changed = Revision.NEVER;
}
