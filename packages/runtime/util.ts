interface DeferFn {
  (fn: () => void): Promise<void>;
  /**
   * Removes the function from the deferral queue, if present
   *
   * @returns true if function was present and removed from queue
   */
  cancel(fn: () => void): boolean;

  /** true if the function is scheduled for execution */
  scheduled(fn: () => void): boolean;
}
/**
 * Call a function at the end of the current microtask.
 *
 * @param fn function to be invoked at end of current task
 * @returns Promise that resolves at end of next flush
 *
 * @todo add fallbacks if promise not available
 */
export const defer = ((fn: () => void) => {
  deferred.add(fn);
  return (
    flushDeferredPr || (flushDeferredPr = Promise.resolve().then(flushDeferred))
  );
}) as DeferFn;

defer.cancel = (fn: () => void) => deferred.delete(fn);
defer.scheduled = (fn: () => void) => deferred.has(fn);

let deferred = new Set<() => void>();
let flushDeferredPr: Promise<void> = null;
const flushDeferred = () => {
  flushDeferredPr = null;
  while (deferred.size > 0) {
    const next = deferred;
    deferred = new Set();
    for (const fn of next) fn();
  }
};

/** Returns true if value is null or undefined */
export const isNil = (x: any) => x === null || x === undefined;
