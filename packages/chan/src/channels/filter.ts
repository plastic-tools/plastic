import { Channel, ChannelFilter } from "../core";

type FilterFn<T = any> = (input: T) => boolean;

/**
 * Returns a channel or factory that will filter values from the input channel.
 * The passed filter function will be called once for each value. If it returns
 * falsy, the value will be skipped.
 *
 * Closes when the input channel closes. Throws when the input channel throws.
 *
 * @param fn filter function
 * @param channels (Optional) one or more channels to filter
 */
export function filter(fn: FilterFn): ChannelFilter;
export function filter<T>(fn: FilterFn<T>, ch: Channel<T>): Channel<T>;
export function filter(fn: FilterFn, ch?: Channel): Channel | ChannelFilter {
  const filtered = async function*<T>(input: Channel<T>): Channel<T> {
    for await (const next of input) if (fn(next)) yield next;
  };
  return ch ? filtered(ch) : filtered;
}

export default filter;
