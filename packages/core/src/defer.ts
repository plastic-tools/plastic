let deferred: Array<() => void> = [];
let flushDeferredPr: Promise<void> = null;

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
  if (deferred.indexOf(fn) < 0) deferred.push(fn);
  return (
    flushDeferredPr || (flushDeferredPr = Promise.resolve().then(flushDeferred))
  );
}) as DeferFn;

defer.cancel = (fn: () => void) => {
  const plen = deferred.length;
  deferred = deferred.filter(x => x !== fn);
  return deferred.length !== plen;
};

defer.scheduled = (fn: () => void) => deferred.indexOf(fn) >= 0;

const flushDeferred = () => {
  flushDeferredPr = null;
  while (deferred.length > 0) {
    const fns = deferred;
    deferred = [];
    for (const fn of fns) fn();
  }
};

export default defer;
