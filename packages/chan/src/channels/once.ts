import { Channel } from "../types";

/**
 * Returns a channel that will iterate through the input once and then exits.
 * This is the opposite of `repeat()`.
 *
 * Closes when input channel closes. Throws when input channel throws.
 */
export async function* once<T>(input: Channel<T>): Channel<T> {
  for await (const next of input) yield next;
}

export default once;
