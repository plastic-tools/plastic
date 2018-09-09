import { TrackedValue, Reactable, Revision } from "./types";

/**
 * A Reactor is the core class that manages tracking changes to properties
 * and capturing accesses. You typically do not need to interact directly
 * with the reactor unless you are implementing new types of observables.
 *
 * If you are using the reactor, you can access `Reactor.currentReactor`,
 * which will return the currently active instance. You can also change
 * the currentReactor, but be sure to set it back before your function
 * exits.
 */
export default class Reactor {
  /**
   * Reflects the latest revision when the reactor was notified of a
   * changed variable.
   */
  changed = Revision.NEVER;

  /** Current revision. Updated whenever changes are processed. */
  current = Revision.INITIAL;

  /** Current set of registered reactions */
  readonly reactions = new TrackedSet<Reactable>();

  /**
   * Call this method anytime a variable's value is accessed. the access will
   * be stored if capturing is currently active. It is not necessary to call
   * this method if the variable's value is entirely derived from other
   * variables (such as ComputedVariables).
   *
   * @param variable the variable that was accessed.
   */
  recordAccess(variable: TrackedValue) {
    const _accesses = this._accessed;
    if (_accesses) _accesses.add(variable);
  }

  /**
   * Invokes the passed function, capturing any accesses that occur during
   * execution. Returns the return value of the function along with the set
   * of any captured values.
   */
  capture<T>(
    fn: (priorValue?: T) => T,
    thisArg?: Object,
    priorValue?: T
  ): [T, Set<TrackedValue>] {
    const prior = this._accessed;
    const accessed = (this._accessed = new Set());
    let ret: T = null;
    try {
      ret = fn.call(thisArg, priorValue);
    } finally {
      this._accessed = prior;
    }
    if (prior) for (const v of accessed) prior.add(v);
    return [ret, accessed];
  }

  private _accessed: Set<TrackedValue>;

  /**
   * Call this method anytime a variable's value has changed. This will cause
   * any registered reactions to be re-validated and possibly update.
   *
   * It is not necessary to call this method if your variable value is entirely
   * derived from other variables.
   *
   * @param value the value that changed
   * @param rev (Optional) revision it changed as of. Defaults to current
   * @returns revision recorded for change (useful for chaining)
   */
  recordChange(value: TrackedValue, rev = this.current) {
    if (rev > this.changed) this.changed = rev;
    this._changes.add(value);
    this.scheduleProcessChanges();
    return rev;
  }

  /**
   * Registers a reaction, causing it to be notified when the state changes
   * Note that the reactor maintains a strong reference to registered reactions
   * so they will not be garbage collected unless you unregister them.
   */
  register(reaction: Reactable) {
    this.reactions.add(reaction);
  }

  /** Unregisters a reaction so that it will no longer update */
  unregister(reaction: Reactable) {
    this.reactions.delete(reaction);
  }

  /** Schedules a function to run at the end of the current task. Debounces */
  schedule(fn: () => any, force = false) {
    const { _scheduled, _cleanup } = this;
    if (_scheduled.has(fn) && !force) return;
    let cleanup = _cleanup.get(fn);
    if (!cleanup) {
      cleanup = () => {
        const stillScheduled = _scheduled.has(fn);
        _scheduled.delete(fn);
        if (stillScheduled) fn();
      };
      _cleanup.set(fn, cleanup);
    }
    _scheduled.set(fn, Promise.resolve().then(cleanup));
  }
  private _cleanup = new WeakMap<(() => any), (() => void)>();
  private _scheduled = new WeakMap<(() => any), Promise<void>>();

  /** Schedules any pending changes to update, notifying reactions */
  scheduleProcessChanges() {
    this.schedule(this.processChanges);
  }

  /** Immediately updates any pending changes */
  processChanges = () => {
    const { _changes, reactions } = this;
    this._changes = new Set();
    this.current++;
    const toInvoke = new Set<Reactable>();
    for (const reaction of reactions) {
      if (reaction.revalidateReaction(_changes)) toInvoke.add(reaction);
    }
    for (const reaction of toInvoke) reaction.invokeReaction();
  };

  private _changes = new Set<TrackedValue>();

  static currentReactor = new Reactor();
}

import TrackedSet from "./tracked-set";
