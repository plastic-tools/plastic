import { join } from "../channels";
import { AnyChannel, Channel, isChannel } from "../core";

interface RecursiveChannel<T> extends Channel<T | RecursiveChannel<T>> {}

export type FlattenedChannelType<C> = C extends Channel<infer U>
  ? U extends Channel<infer V>
    ? V
    : U
  : C extends Channel<infer T>
  ? T
  : any;

/**
 * Returns a channel that will iterate into any subchannels output as a value.
 *
 * @param input input channel to flatten
 * @param limit (Optional) maximum depth to flatten
 */
export async function* flatten<C extends AnyChannel>(
  input: C,
  limit = Number.MAX_SAFE_INTEGER
): Channel<FlattenedChannelType<C>> {
  for await (const next of input) {
    if (limit > 0 && isChannel(next)) yield* flatten(next, limit - 1) as any;
    else yield next;
  }
}
