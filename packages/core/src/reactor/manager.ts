import defer from "../defer";
import { $Tag, ComputeFn, Reactable, Tag, TrackedValue } from "./types";

const EMPTY_TAGGED_SET = new Set<TrackedValue>();

export class Manager {
  /** Increments on first change after flush */
  top = Tag.INITIAL;

  /** Set to top after state is flushed */
  flushed = Tag.NEVER;

  /** recorded accesses while capturing */
  accesses: Set<TrackedValue>;

  /** Set of queued changes since last flush */
  changes: Set<TrackedValue>;

  /** Registered dependencies for tagged values */
  readonly dependencies = new WeakMap<TrackedValue, Set<TrackedValue>>();

  /** inverse of dependencies; maps which values are dependents on value */
  readonly dependents = new WeakMap<TrackedValue, Set<TrackedValue>>();

  /**
   * Registered reactions. Only direct and indirect dependents of these
   * functions will be proactively recomputed
   */
  readonly reactions = new Map<Reactable, number>();

  // ................
  // CORE API
  //

  /**
   * When implementing your own tracked value, call this method whenever you
   * detect that your value is being accessed. When called from within a
   * `capture()` this will created depedency on your value.
   *
   * @param value the value that was accessed
   */
  accessed(value: TrackedValue) {
    if (this.accesses) this.accesses.add(value);
  }

  /**
   * Call just after you modify the state of the value. The returned Revision
   * should be stored for future validation as to when your value last changed.
   * This will automatically schedule a sync to executed at the end of the
   * current task.
   *
   * @param value value that changed
   */
  changed(value: TrackedValue): Tag {
    let changes = this.changes;
    const tag = changes ? this.top : ++this.top;
    if (!changes) changes = this.changes = new Set();
    changes.add(value);
    this.needsFlush();
    return tag;
  }

  /**
   * Executes the passed compute function, capturing both the resulting
   * value and any dependencies that were accessed. Used to implement computed
   * values.
   */
  capture<T, A extends any[]>(
    fn: ComputeFn<T, A>,
    prior?: T,
    args = [] as A
  ): [T, Set<TrackedValue>] {
    const saved = this.accesses;
    const deps = (this.accesses = new Set<TrackedValue>());
    let ret: T;
    try {
      ret = fn(prior, ...args);
    } finally {
      this.accesses = saved;
    }
    return [ret, deps];
  }

  /** True if the passed tracked value is currently valid. */
  validate(val: TrackedValue, changes: Set<TrackedValue> = null): boolean {
    const flushed = this.flushed;
    return val && val[$Tag](flushed, changes) <= flushed;
  }

  // ............................
  // DEPENDENCIES
  //

  /**
   * Records dependencies for the tagged value. This will cause the
   * value to be revalidated if any of the dependencies change. You normally
   * won't need to call this directly as long as you are only using static
   * values or computed values.
   *
   * @param val value with dependenices
   * @param deps set of dependencies (or null to delete)
   */
  setDependencies(val: TrackedValue, deps: Set<TrackedValue>) {
    const { dependencies, dependents } = this;
    const prior = dependencies.get(val);

    // remove any prior dependents not in new set
    if (prior)
      for (const pdep of prior) {
        if (!deps || !deps.has(pdep))
          if (dependents.has(pdep)) dependents.get(pdep).delete(val);
      }

    // add new dependents
    if (deps)
      for (const ndep of deps) {
        if (!dependents.has(ndep)) dependents.set(ndep, new Set());
        dependents.get(ndep).add(val);
      }

    if (deps) dependencies.set(val, deps);
    else dependencies.delete(val);
  }

  /**
   * Returns the dependencies for the given value. If expand is true, then
   * includes any indirect dependencies.
   */
  getDependencies(
    val: TrackedValue | Set<TrackedValue>,
    expand = false,
    mergeInto?: Set<TrackedValue>
  ): Set<TrackedValue> {
    return walkDepTree(this.dependencies, val, expand, mergeInto);
  }

  /**
   * Returns all of the values registered as dependents of the value. if expand
   * is true then will include all indirect dependents as well.
   */
  getDependents(
    val: TrackedValue | Set<TrackedValue>,
    expand = false,
    mergeInto?: Set<TrackedValue>
  ): Set<TrackedValue> {
    return walkDepTree(this.dependents, val, expand, mergeInto);
  }

  // ............................
  // REACTIONS
  //

  register(reaction: Reactable) {
    const reactions = this.reactions;
    reactions.set(reaction, reactions.get(reaction) || 0 + 1);
    if (reactions.get(reaction) === 1) this.needsFlush();
  }

  unregister(reaction: Reactable) {
    const reactions = this.reactions;
    const count = reactions.get(reaction) || 0;
    if (count > 1) reactions.set(reaction, count - 1);
    else if (count === 1) reactions.delete(reaction);
  }

  // ............................
  // PROCESSING CHANGES
  //

  /**
   * Schedules the reactor to flush any pending changes. Called automatically
   * anytime a change is recorded.
   */
  needsFlush() {
    defer(this.flush);
  }

  /**
   * Immediately flushes any changes. Except for testing, you shouldn't call
   * this method yourself.
   */
  flush = () => {
    defer.cancel(this.flush); // in case called outside of deferral
    while (this.changes) {
      // expand changes to include any dependents.
      const changes = this.getDependents(
        this.changes,
        true,
        new Set(this.changes)
      );
      this.changes = null;
      for (const reaction of this.reactions.keys()) {
        if (!this.validate(reaction, changes)) reaction.trigger();
      }
    }
    this.flushed = this.top;
  };
}

const walkDepTree = (
  deps: WeakMap<TrackedValue, Set<TrackedValue>>,
  val: TrackedValue | Set<TrackedValue>,
  expand: boolean,
  mergeInto: Set<TrackedValue>
): Set<TrackedValue> => {
  if (val instanceof Set) {
    if (!mergeInto) mergeInto = new Set<TrackedValue>();
    for (const cur of val) walkDepTree(deps, cur, expand, mergeInto);
    return mergeInto;
  }

  if (!mergeInto && (!expand || !deps.has(val)))
    return deps.get(val) || EMPTY_TAGGED_SET;
  const ret = mergeInto || new Set<TrackedValue>();
  const merge = (cur: TrackedValue, top = true) => {
    const seen = cur === val || ret.has(cur);
    if (!seen) ret.add(cur);
    if (!expand || (seen && !top)) return;
    const next = deps.get(cur);
    if (!next) return;
    for (const dep of next) merge(dep, false);
  };
  merge(val);
  return ret;
};

export default Manager;
