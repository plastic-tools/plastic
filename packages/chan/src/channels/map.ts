import { Channel, ChannelTransform, nothing } from "../core";

type MapReturnType<T = unknown> = (nothing | T) | Promise<nothing | T>;
type MapFn<I = any, O = unknown> = (input: I) => MapReturnType<O>;

// prettier-ignore
// returns the map transform function based on the input map function
type MapTransformOf<F> =
  F extends <T>(input: T) => MapReturnType<T>
  ? <T>(input: Channel<T>) => Channel<T>
  : F extends (input: infer U) => MapReturnType<infer V>
  ? (input: Channel<U>) => Channel<V>
  : never;

/**
 * Returns a channel or factory that will map the values of the input channel
 * to new values using the passed map function. If the map function returns
 * the special value `nothing`, the value will be skipped.
 *
 * Closes when the input channel closes. Throws when the input channel throws.
 *
 * @param fn the mapper function
 * @param input (Optional) input to make a channel immediately
 */
export function map<F extends MapFn>(fn: F): MapTransformOf<F>;
export function map<T, R>(fn: MapFn<T, R>, ch: Channel<T>): Channel<R>;
export function map(fn: MapFn, ch?: Channel): Channel | ChannelTransform {
  const mapped = async function*(input: Channel) {
    for await (const next of input) {
      const output = fn(next);
      if (output !== nothing) yield output;
    }
  };

  return ch ? mapped(ch) : mapped;
}

export default map;
