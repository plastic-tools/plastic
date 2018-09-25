import { TrackedValue, Revision, reactor, $Validated } from "../reactor/index";

/**
 * A tracked map. Modifying this map will cause any dependent tracked values
 * and reactions to change. Note that if you get/set a value, the value itself
 * will be tracked, but if you try to access the map as a whole, the map will
 * change.
 *
 * @todo add support for iteratable methods: entries, keys, values
 */
export default class TrackedMap<K, V> extends Map<K, V>
  implements TrackedValue {
  set(key: K, v: V) {
    super.set(key, v);
    this.recordChange();
    return this;
  }

  get(key: K) {
    reactor.accessed(this);
    return super.get(key);
  }

  delete(key: K) {
    const deleted = super.delete(key);
    if (deleted) this.recordChange();
    return deleted;
  }

  clear() {
    super.clear();
    this.recordChange();
  }

  [Symbol.iterator]() {
    reactor.accessed(this);
    return super[Symbol.iterator]();
  }

  entries() {
    reactor.accessed(this);
    return super.entries();
  }

  values() {
    reactor.accessed(this);
    return super.values();
  }

  keys() {
    reactor.accessed(this);
    return super.keys();
  }

  forEach(fn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any) {
    reactor.accessed(this);
    return super.forEach(fn, thisArg);
  }

  has(key: K) {
    reactor.accessed(this);
    return super.has(key);
  }

  get size() {
    reactor.accessed(this);
    return super.size;
  }

  [$Validated]() {
    return this._changed;
  }

  protected recordChange() {
    this._changed = reactor.changed(this);
  }

  private _changed = Revision.NEVER;
}
