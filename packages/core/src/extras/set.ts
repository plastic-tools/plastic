import { TrackedValue, Revision, reactor, $Validated } from "../reactor/index";

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
    reactor.accessed(this);
    return super.size;
  }

  has(v: any) {
    reactor.accessed(this);
    return super.has(v);
  }

  entries() {
    reactor.accessed(this);
    return super.entries();
  }

  values() {
    reactor.accessed(this);
    return super.values();
  }

  forEach(fn: (value: T, value2: T, set: Set<T>) => void, thisArg?: any) {
    reactor.accessed(this);
    return super.forEach(fn, thisArg);
  }

  clear() {
    const ret = super.clear();
    this.recordChange();
    return ret;
  }

  [$Validated]() {
    return this._changed;
  }

  protected recordChange() {
    this._changed = reactor.changed(this);
  }

  private _changed = Revision.NEVER;
}
