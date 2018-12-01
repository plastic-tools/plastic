import pipe from "./pipe";
import { Channel } from "./types";

/**
 * Returns a promise that will resolve to the next value emitted from the
 * channel. Note that if the channel is configured to remember history, this
 * function will always return the *first* value that would iterate from it,
 * which may be the same value.
 *
 * If the channel closes without emitting a value, resolves to undefined.
 *
 * @param input input channel
 */
export const next = async <T>(input: Channel<T>): Promise<T | undefined> => {
  for await (const value of pipe(input)) return value;
  return undefined;
};

export default next;
