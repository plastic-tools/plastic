import { isAsyncIterable } from "@plastic/utils";
import { AnyChannel, Channel, ChannelTypesTuple } from "../core";
import join from "./join";

export interface LatestChannelMap {
  [name: string]: AnyChannel;
}
export type LatestInput = AnyChannel[] | [LatestChannelMap];
export type LatestOutput<T extends LatestInput> = T extends [LatestChannelMap]
  ? T extends [infer U]
    ? { [K in keyof U]: U[K] extends Channel<infer V> ? V : U[K] }
    : never
  : T extends AnyChannel[]
  ? ChannelTypesTuple<T>
  : never;

/** @internal return tuple of value with input */
async function* tagged<T>(input: Channel<T>): Channel<[T, Channel<T>]> {
  for await (const next of input) yield [next, input];
}

const array = (channels: Channel[]) => {
  const data: any[] = [];
  const set = (ch: Channel, v: any) => (data[channels.indexOf(ch)] = v);
  const value = () => [...data] as Channel[];
  return { set, value, channels };
};

const object = (input: { [name: string]: Channel }) => {
  const data: any = {};
  const keys = Object.keys(input);
  const channels = keys.map(k => input[k]);
  const set = (ch: Channel, v: any) => (data[keys[channels.indexOf(ch)]] = v);
  const value = () => ({ ...data } as LatestChannelMap);
  return { set, value, channels };
};

/**
 * Returns a channel that will output a tuple of object map of the most
 * recently output values from the input channels each time any channels
 * emits a new value.
 *
 * To receive a tuple of values, pass multiple channels, each as one argument:
 *
 *    ch = latest(numbers, strings) // [number, string]
 *
 * To receive a map of values, pass object mapping names to channels as a single
 * argument. The object must not be channel-like:
 *
 *    ch = latest({ foo:numbers, bar:strings }) // { foo:number, bar:string }
 *
 * Closes when all input channels have closed. Throws when any input channel
 * throws. No values will be emitted until all input channels have emitted at
 * least one value.
 *
 * @param input tuple or map of channels
 */
export async function* latest<C extends LatestInput>(
  ...input: C
): Channel<LatestOutput<C>> {
  const { set, value, channels } =
    input.length === 1 && !isAsyncIterable(input[0])
      ? object(input[0])
      : array(input as Channel[]);
  const pending = new Set(channels);
  for await (const [next, channel] of join(...channels.map(tagged))) {
    set(channel, next);
    pending.delete(channel);
    if (pending.size === 0) yield value() as LatestOutput<C>;
  }
}

export default latest;
