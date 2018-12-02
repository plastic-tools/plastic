import { reuse } from "@plastic/utils";
import { Channel, nothing } from "../core";

/**
 * Returns a new channel that will skip duplicated values from the input.
 * Each new value is compared with the previously emitted value using `reuse()`
 * so values that are superficially different but otherwise identical will be
 * skipped as well.
 *
 * Closes when the input channel closes. Throws when the input channel throws.
 *
 * @param input channel to dedup
 */
export async function* dedup<T>(input: Channel<T>): Channel<T> {
  let prior: T | nothing = nothing;
  for await (let next of input) {
    if (prior !== nothing) next = reuse(next, prior);
    if (next !== prior) {
      prior = next;
      yield next;
    }
  }
}

export default dedup;
