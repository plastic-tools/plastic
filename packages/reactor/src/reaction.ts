import { Reactable, TrackedValue, Revision } from "./types";
import Reactor from "./reactor";

type ReactionFn<T = any> = () => T;
type ActionFn<I = any> = (v: I, prior?: I) => any;

// Default result will only invoke reaction when it is invalidated manually.
const DEFAULT_COMPUTE_RESULT = [undefined as any, new Set<TrackedValue>()];

/**
 * Proactively invalidates and then recomputes a function whenever any of its
 * dependent tracked values change. An optional "action" can also be
 * passed, which will be run whenever the return value of the core function
 * changes.
 *
 * To use this class call `Reaction.from()` to get the reaction and then
 * `reaction.register()` to activate it.
 */
export default class Reaction<T = any> implements Reactable {
  constructor(
    private computeFn: ReactionFn<T> = null,
    private runFn: ActionFn<T> = null
  ) {
    if (computeFn) this.compute = computeFn;
    if (runFn) this.run = runFn;
  }

  compute?(priorValue?: T): T;

  /**
   * Executed whenever the reaction state is recomputed and it's value has
   * changed.
   *
   * @param newValue
   * @param priorValue
   */
  run?(newValue?: T, priorValue?: T): any;

  register(reactor = Reactor.currentReactor) {
    reactor.register(this);
    return this;
  }

  unregister(reactor = Reactor.currentReactor) {
    reactor.unregister(this);
    return this;
  }

  revalidateReaction(changes: Set<TrackedValue>) {
    const valid = this.validate(changes);
    if (!valid) this.invalidate();
    return valid; // invoke next if was invalidated.
  }

  invokeReaction() {
    const { _value, _validated } = this;
    const reactor = Reactor.currentReactor;
    const [value, deps] =
      reactor.capture(this.compute, this, _value) || DEFAULT_COMPUTE_RESULT;
    if (this.run && (_validated === Revision.NEVER || _value !== value)) {
      reactor.schedule(this._run);
    }

    this._value = value;
    this._dependencies = deps;
    this._validated = deps.size > 0 ? reactor.changed : Revision.CONSTANT;
  }

  private _run = () => {
    const { _prior, _value } = this;
    this._prior = _value;
    this.run(_value, _prior);
  };
  private _prior: T;
  private _value: T;

  validate(changes?: Set<TrackedValue>, rev = Reactor.currentReactor.changed) {
    const { _dependencies, _validated, _value } = this;

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

  invalidate() {
    this._dependencies = undefined;
    this._validated = Revision.NEVER;
  }

  private _validated = Revision.NEVER;
  private _dependencies: Set<TrackedValue>;

  private static _reactions = new WeakMap<
    ReactionFn,
    WeakMap<ActionFn, Reaction>
  >();

  static from<T>(fn?: ReactionFn<T>, action?: ActionFn<T>): Reaction<T> {
    let r1 = this._reactions.get(fn);
    if (!r1) {
      r1 = new WeakMap<ActionFn, Reaction>();
      this._reactions.set(fn, r1);
    }
    let ret = r1.get(action);
    if (!ret) {
      ret = new Reaction(fn, action);
      r1.set(action, ret);
    }
    return ret;
  }
}
