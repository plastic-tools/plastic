import reuse from "./reuse";

export type PropertyKey = string | symbol;

export type Revision = number;

/** Represents a run of the reactor loop */
export const Revision = {
  /** Returned for a computed value, causes it never to change */
  CONSTANT: Number.MAX_SAFE_INTEGER,

  /** Return for validated to ensure always needs revalidation */
  NEVER: 0,

  UNKNOWN: -1,
  INITIAL: 1
};

/**
 * A value whose state can be tracked. You should create a
 * unique instance for any value that you want to have tracked as a dependdency
 * for other values.
 */
export interface TrackedValue {
  /**
   * Returns true if the variable is valid for a variable computed at `rev`
   *
   * @param rev the revision to validate against
   * @param changes Optional set of known changed values
   * @param reactor reactor requesting the validation
   */
  validate(
    rev: Revision,
    changes: Set<TrackedValue>,
    reactor: Reactor
  ): boolean;
}

/** A function that can be dynamically computed through a reactor */
export interface ComputeFn<T = any, O = Object> {
  (prior?: T, target?: O): T;
  displayName?: string;
}

/**
 * A reactor manages a network of dependent variables, updating them
 * automatically as needed.
 *
 * You typically work with this interface by storing static values and computed
 * functions, although you can also supply your own `TrackedValue` objects
 * which will be included in the dependent set automatically.
 *
 * @todo add more documentation
 */
export class Reactor {
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
  recordAccess(value: TrackedValue) {
    const { accesses } = this;
    if (accesses) accesses.add(value);
  }

  /**
   * Call just after you modify the state of the value. The returned Revision
   * should be stored for future validation as to when your value last changed.
   * This will automatically schedule a sync to executed at the end of the
   * current task.
   *
   * @param value value that changed
   */
  recordChange(value: TrackedValue): Revision {
    let changes = this.changes;
    const rev = changes ? this.current : ++this.current;
    if (!changes) changes = this.changes = new Set();
    changes.add(value);
    this.reactionDependencies = null;
    this.flush();
    return rev;
  }

  /**
   * Executes the passed compute function, capturing both the resulting
   * value and any dependencies that were access. You generally won't call
   * this directly except for testing because it does not actually update
   * the internal network of dependencies.
   */
  capture<T, O>(
    fn: ComputeFn<T>,
    prior?: T,
    target?: O
  ): [T, Set<TrackedValue>] {
    const saved = this.accesses;
    const deps = (this.accesses = new Set<TrackedValue>());
    let ret: T = undefined;
    try {
      ret = fn(prior, target);
    } finally {
      this.accesses = saved;
    }
    return [ret, deps];
  }

  /**
   * Used internally by computed values to store dependents. You should not
   * call this method directly.
   */
  recordDependents(
    val: ComputedValue,
    deps: Set<TrackedValue>,
    pdeps: Set<TrackedValue>
  ) {
    const { dependents } = this;
    // Remove any prior dependents not in new set
    if (pdeps)
      for (const dep of pdeps)
        if (!deps || !deps.has(dep)) {
          const set = dependents.get(dep);
          if (set) set.delete(val);
        }

    // add any new dependents not in prior set
    if (deps)
      for (const dep of deps)
        if (!pdeps || !pdeps.has(dep)) {
          let set = dependents.get(dep);
          if (!set) {
            set = new Set();
            dependents.set(dep, set);
          }
          set.add(val);
        }
  }

  /** Increments on first change after flush */
  current = Revision.INITIAL;

  /** Set to current after state is flushed */
  flushed = Revision.NEVER;

  // ............................
  // STATIC VALUES
  //

  /** Returns a current static value */
  get<T>(key: PropertyKey, target: Object = null): T {
    const val = this.getStaticValue(key, target, !!this.accesses);
    return val && val.get(this);
  }

  /**
   * Initializes a static value without causing updates. Only call this when
   * you are certain no other code has tried to access the value yet.
   */
  initialize<T>(key: PropertyKey, value: T, target: Object = null) {
    // TODO: verify static value not yet created...
    this.getStaticValue(key, target, true).initialize(value, this);
  }

  /** Updates a static value, invalidating computes as necessary. */
  set<T>(key: PropertyKey, value: T, target: Object = null) {
    this.getStaticValue(key, target, true).set(value, this);
  }

  // ............................
  // COMPUTED VALUES
  //

  /** Computes a value, storing the results and dependencies */
  compute<T>(fn: ComputeFn<T>, target: Object = null): T {
    return this.getComputedValue(fn, target, true).get(this);
  }

  /** True if the passed compute function is currently valid. */
  validate(fn: ComputeFn, target: Object = null): boolean {
    const val = this.getComputedValue(fn, target, false);
    return val && val.validate(this.flushed, null, this);
  }

  /** Forces a compute function to recompute */
  invalidate(fn: ComputeFn, target: Object = null) {
    const val = this.getComputedValue(fn, target, false);
    val && val.invalidate(this);
  }

  // ............................
  // REACTIONS
  //

  /**
   * Registers a reaction. This reaction and any of its dependencies will
   * automatically recompute anytime their dependencies change.
   */
  register(fn: ComputeFn, target: Object = null) {
    // fn might change based on target
    const val = this.getComputedValue(fn, target, true);
    this.reactions.add(val.fn);
    this.reactionDependencies = null;
  }

  /**
   * Unregisters a reaction. The reaction and it's dependencies will will be
   * tracked for validation but will not automatically recompute when they
   * become invalid.
   */
  unregister(fn: ComputeFn, target: Object = null) {
    const val = this.getComputedValue(fn, target, false);
    if (val) {
      this.reactions.delete(val.fn);
      this.reactionDependencies = null;
    }
  }

  // ............................
  // FLUSHING CHANGES
  //

  /**
   * Schedules the reactor to flush any pending changes. This is called
   * automatically anytime a change is recorded, so you don't usually
   * need to call it yourself.
   */
  flush() {
    if (!this.scheduledFlush)
      this.scheduledFlush = Promise.resolve().then(this.flushIfNeeded);
  }

  /**
   * Immediately flushes any changes. Except for testing, you shouldn't call
   * this method yourself.
   */
  flushNow() {
    const { dependents } = this;
    this.scheduledFlush = null;
    let changes: Set<TrackedValue>;
    const active = this.getReactionDependencies();
    while ((changes = this.changes)) {
      this.changes = null;
      for (const change of changes) {
        const deps = dependents.get(change);
        const flushed = this.flushed;
        if (deps)
          for (const dep of deps) {
            if (!active.has(dep)) continue;
            if (!dep.validate(flushed, changes, this)) dep.recompute(this);
          }
      }
    }
    this.flushed = this.current;
  }

  // ....................................
  // INTERNALS
  //

  private flushIfNeeded = () => {
    if (this.scheduledFlush) this.flushNow();
  };

  private scheduledFlush: Promise<void>;

  private getReactionDependencies() {
    let { reactionDependencies, reactions } = this;
    if (reactionDependencies) return reactionDependencies;
    reactionDependencies = this.reactionDependencies = new WeakSet();

    const addAllDependencies = (val: TrackedValue) => {
      if (reactionDependencies.has(val)) return;
      reactionDependencies.add(val);
      if (val instanceof ComputedValue) {
        const deps = val.dependencies;
        if (deps) for (const dep of deps) addAllDependencies(dep);
      }
    };

    for (const reaction of reactions) {
      const val = this.getComputedValue(reaction, null, false);
      if (val) addAllDependencies(val);
    }
    return reactionDependencies;
  }

  private getStaticValue(
    key: PropertyKey,
    target: Object,
    createIfNeeded: boolean
  ) {
    const { statics } = this;
    if (!target) target = DEFAULT_TARGET;
    let keys = statics.get(target);
    if (!keys && createIfNeeded) {
      keys = new Map<PropertyKey, StaticValue>();
      statics.set(target, keys);
    }
    let val = keys && keys.get(key);
    if (!val && createIfNeeded) {
      val = new StaticValue(target, key);
      keys.set(key, val);
    }
    return val;
  }

  private getComputedValue<T, O>(
    fn: ComputeFn<T, O>,
    target: O,
    createIfNeeded: boolean
  ) {
    const { computes, boundComputes } = this;

    if (target) {
      let bound = boundComputes.get(target);
      if (!bound && createIfNeeded) {
        bound = new WeakMap();
        boundComputes.set(target, bound);
      }
      let boundFn = bound && bound.get(fn);
      if (!boundFn && createIfNeeded) {
        boundFn = (prior: T, target: O) => fn(prior, target);
        bound.set(fn, boundFn);
      }
      fn = boundFn;
    }

    let val = fn && computes.get(fn);
    if (!val && createIfNeeded) {
      val = new ComputedValue(fn);
      computes.set(fn, val);
    }
    return val;
  }

  /** Recorded accesses while capturing */
  private accesses: Set<TrackedValue>;

  /** All static values, keyed by target object */
  private statics = new WeakMap<Object, Map<PropertyKey, StaticValue>>();

  /** All computed values, keyed by fn. */
  private computes = new WeakMap<ComputeFn, ComputedValue>();

  /** Map of values dependent upon the key */
  private dependents = new WeakMap<TrackedValue, Set<ComputedValue>>();

  /** Set of queued changes since last flush */
  private changes: Set<TrackedValue>;

  /**
   * Registered reactions. Only direct and indirect dependents of these
   * functions will be proactively recomputed
   */
  private reactions = new Set<ComputeFn>();
  private reactionDependencies: WeakSet<TrackedValue>;

  private boundComputes = new WeakMap<Object, WeakMap<ComputeFn, ComputeFn>>();
}

export const reactor = new Reactor();

// ......................
// HELPERS
//

class StaticValue implements TrackedValue {
  constructor(readonly target: Object, key: PropertyKey) {}

  /** Saved value */
  value: any;

  /** Set to current whenever the value is changed */
  changed = Revision.NEVER;

  get(reactor: Reactor) {
    reactor.recordAccess(this);
    return this.value;
  }

  set(value: any, reactor: Reactor) {
    this.value = value;
    this.changed = reactor.recordChange(this);
  }

  initialize(v: any, reactor: Reactor) {
    this.value = v;
    this.changed = reactor.current;
  }

  validate(flushed: Revision) {
    return this.changed <= flushed;
  }
}

class ComputedValue<T = any> implements TrackedValue {
  constructor(readonly fn: ComputeFn<T>) {}

  /** Last computed value */
  private value: T;

  /** Cached result of a validation check */
  private valid = false;

  /** Revision when the value was last validated */
  private validated = Revision.NEVER;

  /** Revision when the value was last computed */
  private changed = Revision.NEVER;

  /** Captured dependencies when value was last computed */
  dependencies: Set<TrackedValue>;

  get(reactor: Reactor) {
    reactor.recordAccess(this);
    if (!this.validate(reactor.flushed, null, reactor)) this.recompute(reactor);
    return this.value;
  }

  /** Recomputes the value, assuming it is invalid */
  recompute(reactor: Reactor) {
    const prior = this.value;
    let [value, deps] = reactor.capture(this.fn, prior);
    value = reuse(value, prior);
    if (value !== prior) {
      this.changed = reactor.recordChange(this);
      // never recompute
      if (deps && deps.size === 0) this.changed = Revision.CONSTANT;
    }
    this.valid = true;
    this.validated = reactor.current;
    reactor.recordDependents(this, deps, this.dependencies);
    this.dependencies = deps;
  }

  invalidate(reactor: Reactor) {
    this.changed = Revision.NEVER;
    this.valid = false;
    this.validated = reactor.recordChange(this);
  }

  validate(flushed: Revision, changes: Set<TrackedValue>, reactor: Reactor) {
    const { validated, valid, changed, dependencies } = this;
    const current = reactor.current;
    if (validated >= current) return valid;
    let ret = changed === Revision.CONSTANT;
    // potentially still valid if it hasn't changed since the last flush
    // still valid if dependencies are known and all dependencies are valid
    // note that initiate state of changed is NEVER which is always > flushed
    if (!ret && changed <= flushed) {
      const deps = dependencies;
      if (deps) {
        ret = true;
        for (const dep of deps) {
          if (changes && !changes.has(dep)) continue;
          ret = dep.validate(flushed, changes, reactor);
          if (!valid) break;
        }
      }
    }
    this.valid = ret;
    this.validated = current;
    return ret;
  }
}

const DEFAULT_TARGET = {};

export default reactor;
