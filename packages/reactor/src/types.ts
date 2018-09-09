/**
 * A Variable is a value whose state can be tracked. You should create a
 * unique instance for any value that you want to have tracked as a dependdency
 * for other values.
 */
export interface TrackedValue {
  /**
   * Returns true if the variable is valid for a variable computed at `rev`
   *
   * @param changes Optional set of known changed values
   * @param rev the revision to validate against
   */
  validate(changes?: Set<TrackedValue>, rev?: Revision): boolean;
}

/**
 * A Reaction can be registered with a Reactor and will be called whenever
 * the state changes in a way that might invalidate it.
 */
export interface Reactable {
  /**
   * Called by the reactor anytime state changes. The method shoudl verify
   * that the state of the reaction is still valid and, if not, invalidate
   * itself, so that it will be recomputed later. Return true if you want
   * the reaction to be invoked immediately after invalidations are
   * completed.
   *
   * @param changes set of changed variables, if they are known. otherwise null
   * @returns false if the reaction becaome invalid and need to be invoked.
   */
  revalidateReaction(changes?: Set<TrackedValue>): boolean;

  /**
   * Called by the reactor if `invalidateIfNeeded()` returns true. This should
   * invoke the reaction, typically recomputing it's state..
   */
  invokeReaction?(): void;
}

/** Common interface for an installable property. */
export interface PropertyValue<T = any> {
  /** Returns the property value */
  get(thisArg?: Object): T;

  /** Sets the property value. If the property is read only, throws exception */
  set(v: T, thisArg?: Object): void;

  /** Clone the property, optionally with a new target */
  clone(): PropertyValue<T>;

  /**
   * If implemented, then the value can be invalidated to force a recompute.
   * Calling this method should also register a change with the reactor.
   */
  invalidate?(): void;

  /**
   * If implemented, revalidates the value. Returns true if valid
   */
  validate?(changes?: Set<TrackedValue>, rev?: Revision): boolean;
}

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

/** An object that knows how to compare itself. Used for `reuse()` */
export interface Comparable {
  isEqual(x: any): boolean;
}
export const isComparable = (x: any): x is Comparable =>
  "object" === typeof x && !!x && "function" === typeof x.isEqual;
