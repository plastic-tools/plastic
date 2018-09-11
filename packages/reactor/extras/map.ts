import { TrackedValue, Revision, reactor } from "@plastic/reactor";

const mapIter = <I, O>(
  iter: IterableIterator<I>,
  fn: (i: I) => O
): IterableIterator<O> => {
  const inext = iter.next;
  iter.next = function() {
    const ret = inext();
    if ("value" in ret) (ret as any).value = fn(ret.value);
    return ret;
  };
  return (iter as any) as IterableIterator<O>;
};

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
    reactor.recordAccess(this);
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
    reactor.recordAccess(this);
    return super[Symbol.iterator]();
  }

  entries() {
    reactor.recordAccess(this);
    return super.entries();
  }

  values() {
    reactor.recordAccess(this);
    return super.values();
  }

  keys() {
    reactor.recordAccess(this);
    return super.keys();
  }

  forEach(fn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any) {
    reactor.recordAccess(this);
    return super.forEach(fn, thisArg);
  }

  has(key: K) {
    reactor.recordAccess(this);
    return super.has(key);
  }

  get size() {
    reactor.recordAccess(this);
    return super.size;
  }

  validate(flushed: Revision) {
    return this._changed <= flushed;
  }

  protected recordChange() {
    this._changed = reactor.recordChange(this);
  }

  private _changed = Revision.NEVER;
}
