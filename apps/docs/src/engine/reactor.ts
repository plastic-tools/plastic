export type Revision = number;
export const Revision = {
  NEVER: Number.MAX_SAFE_INTEGER - 1,
  CONSTANT: 0,
  UNKNOWN: Number.MAX_SAFE_INTEGER,
  INITIAL: 1
};

export interface TrackedValue {
  /**
   * Returns the revision when the value was last known valid. The method
   * can optionally decide to revalidate itself and return the `current`
   * revision.
   */
  validated(current: Revision): Revision;
}

export interface Reactor {
  /**
   * Must be called by a tracked value whenever its value has changed for
   * any reason other than dependents becoming invalid. Will potentially
   * schedule reactions to run later.
   *
   * @returns current revision should be returned for `validated()` calls.
   */
  changed(value: TrackedValue): Revision;

  /**
   * Must be called by a tracked value anytime it is accessed. If the values
   * are being captured, it will record the tracked value.
   */
  accessed(value: TrackedValue): void;

  /**
   * Can be called
   */
}
