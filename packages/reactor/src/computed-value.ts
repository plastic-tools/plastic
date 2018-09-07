import { Revision, TrackedValue, PropertyValue } from "./types";
import Reactor from "./reactor";

export type GetterFn<T = any> = () => T;
export type SetterFn<T = any> = (v: T) => void;

/**
 * Computes a value can caches it. During computation, any tracked variables
 * that are accessed will be captured and monitored for changes, causing the
 * cache to be automatically invalidated when changed.
 */
export default class ComputedValue<T = any>
  implements TrackedValue, PropertyValue<T> {
  constructor(readonly getter: GetterFn<T>, readonly setter?: SetterFn<T>) {}

  get(thisArg: Object = null): T {
    const reactor = Reactor.currentReactor;
    reactor.recordAccess(this);
    const rev = reactor.changed;
    if (!this.validate(null, rev)) this.recompute(thisArg, rev);
    return this._value;
  }

  /**
   * Invokes a setter, if it was passed. Otherwise throws an exception.
   * Note that a setter is expected to modify tracked values, which will
   * cause the computed value to change. Otherwise the setter may have no
   * impact on the getter.
   */
  set(v: T, target: Object = null) {
    this.setter.call(target, v);
  }

  clone() {
    const { getter, setter } = this;
    return new ComputedValue(getter, setter);
  }

  /**
   * Recomputes the value, capturing any dependencies and caching results.
   * @param rev (Optional) revision of record for change. defaults to changed
   */
  recompute(thisArg: Object = null, rev = Reactor.currentReactor.changed) {
    const getter = this.getter;
    const [value, deps] = Reactor.currentReactor.capture(getter, thisArg);
    this._value = value;
    this._dependencies = deps;
    this._validated = deps.size > 0 ? rev : Revision.CONSTANT;
  }

  /**
   * Invalidates the computed value, causing it to recompute the next time it
   * is called.
   */
  invalidate() {
    this._value = this._dependencies = undefined;
    this._validated = Revision.NEVER;
    Reactor.currentReactor.recordChange(this);
  }

  validate(changes?: Set<TrackedValue>, rev = Reactor.currentReactor.changed) {
    const { _dependencies, _validated } = this;

    // never valid if not yet computed
    if (!_dependencies) return false;

    // always valid if reactor state has not changed since computation
    if (_validated >= rev) return true;

    // else revalidate
    let valid = true;
    if (changes)
      for (const c of changes) {
        valid = !_dependencies.has(c);
        if (!valid) break;
      }

    if (valid)
      for (const v of _dependencies) {
        valid = v.validate(changes, rev);
        if (!valid) break;
      }

    if (valid) this._validated = rev;
    return valid;
  }

  private _value: T;
  private _dependencies: Set<TrackedValue>;
  private _validated = Revision.NEVER;
}
