import { tuple } from "@plastic/utils";
import { AnyChannel, Channel, MergedChannelTypes } from "../core";

const next = async <T>(iter: AsyncIterator<T>) => {
  const { done, value } = await iter.next();
  return { done, value, iter };
};

/**
 * Returns a new channel that will join all the values emitted from the input
 * channels into a single output stream.
 *
 * Closes when the input channels close. Throws when any input channel throws.
 *
 * @param inputs channels to join
 */
export async function* join<C extends AnyChannel[], T = MergedChannelTypes<C>>(
  ...inputs: C
): Channel<T> {
  const queue = new Map(
    inputs.map(input => {
      const iter = input[Symbol.asyncIterator]();
      return tuple(iter, next(iter));
    })
  );
  while (queue.size > 0) {
    const { value, done, iter } = await Promise.race(queue.values());
    if (done) queue.delete(iter);
    else queue.set(iter, next(iter));
    if (value !== undefined) yield value;
  }
}
export default join;
