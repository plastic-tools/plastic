import { TrackedValue, Revision } from "./types";
import Reactor from "./reactor";
import Atom from "./atom";

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
    let value = (super.get(key) as any) as Atom<V>;
    if (!value) {
      value = new Atom<V>();
      super.set(key, value as any);
      // only needed when adding a value. otherwise StaticValue will handle.
      this.recordChange();
    }
    value.set(v);
    return this;
  }

  get(key: K) {
    const ret = (super.get(key) as any) as Atom<V>;
    Reactor.currentReactor.recordAccess(this);
    return (ret && ret.get()) || undefined;
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
    Reactor.currentReactor.recordAccess(this);
    return mapIter(
      super[Symbol.iterator](),
      ([key, value]): [K, V] => [key, ((value as any) as Atom<V>).get()]
    );
  }

  entries() {
    return this[Symbol.iterator]();
  }

  values() {
    return mapIter(this[Symbol.iterator](), ([_, value]) => value);
  }

  keys() {
    return mapIter(this[Symbol.iterator](), ([key, _]) => key);
  }

  forEach(fn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any) {
    Reactor.currentReactor.recordAccess(this);
    return super.forEach(
      (staticValue, key, map) =>
        fn(((staticValue as any) as Atom<V>).get(), key, map),
      thisArg
    );
  }

  has(key: K) {
    Reactor.currentReactor.recordAccess(this);
    return super.has(key);
  }

  get size() {
    Reactor.currentReactor.recordAccess(this);
    return super.size;
  }

  validate(_, rev = Reactor.currentReactor.changed) {
    return rev >= this._changed;
  }

  protected recordChange() {
    this._changed = Reactor.currentReactor.recordChange(this);
  }

  private _changed = Revision.NEVER;
}
