import { Channel } from "../core";

/**
 * Returns a channel that will yield each value at most one per microtask.
 *
 * @param input channel to debounce
 */
export async function* debounce<T>(input: Channel<T>): Channel<T> {
  let seen: undefined | Set<any>;
  const reset = () => (seen = undefined);
  for await (const next of input) {
    if (!seen) {
      seen = new Set();
      setTimeout(reset, 0);
    }
    const repeating = seen.has(next);
    seen.add(next);
    if (!repeating) yield next;
  }
}

export default debounce;
