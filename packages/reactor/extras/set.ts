import { TrackedValue, Revision, reactor } from "@plastic/reactor";

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
    reactor.recordAccess(this);
    return super.size;
  }

  has(v: any) {
    reactor.recordAccess(this);
    return super.has(v);
  }

  entries() {
    reactor.recordAccess(this);
    return super.entries();
  }

  values() {
    reactor.recordAccess(this);
    return super.values();
  }

  forEach(fn: (value: T, value2: T, set: Set<T>) => void, thisArg?: any) {
    reactor.recordAccess(this);
    return super.forEach(fn, thisArg);
  }

  clear() {
    const ret = super.clear();
    this.recordChange();
    return ret;
  }

  validateTrackedValue(flushed: Revision) {
    return this._changed <= flushed;
  }

  protected recordChange() {
    this._changed = reactor.recordChange(this);
  }

  private _changed = Revision.NEVER;
}
