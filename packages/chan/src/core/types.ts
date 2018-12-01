export const nothing = Symbol("nothing");
export type nothing = typeof nothing;

export const $PipeInput = Symbol();

/**
 * A channel is just an async iterable.
 *
 * See `pipe()` for more info on `$PipeInput`.
 */
export interface Channel<T = unknown> extends AsyncIterable<T> {
  [$PipeInput]?(): any;
}

export type AnyChannel<T = any> = Channel<T>;

// prettier-ignore
/** Returns a union of all channel types in an array of channel inputs */
export type MergedChannelTypes<C extends AnyChannel[]> =
  C extends Array<Channel<infer U>> ? U : never;

// prettier-ignore
/** Returns a tuple of channels types from an array of channel inputs */
export type ChannelTypesTuple<C extends AnyChannel[]> =
  C extends [Channel<infer U1>]
  ? [U1]
  : C extends [Channel<infer U2>, Channel<infer V2>]
  ? [U2, V2]
  : C extends [Channel<infer U3>, Channel<infer V3>, Channel<infer W3>]
  ? [U3, V3, W3]
  : C extends [Channel<infer U4>, Channel<infer V4>, Channel<infer W4>,
               Channel<infer X4>]
  ? [U4, V4, W4, X4]
  : C extends [Channel<infer U5>, Channel<infer V5>, Channel<infer W5>,
               Channel<infer X5>, Channel<infer Y5>]
  ? [U5, V5, W5, X5, Y5]
  : C extends [Channel<infer U6>, Channel<infer V6>, Channel<infer W6>,
    Channel<infer X6>, Channel<infer Y6>, ...Array<Channel<infer Z6>>]
  ? [U6, V6, W6, X6, Y6, ...Z6[]]
  : MergedChannelTypes<C>;

/**
 * A transform function can be used to transform channel input before it is
 * returned to the channel. Chaining transforms is faster than connecting
 * channels through relays.
 *
 * A transform function accepts an async iterable and returns any kind of
 * channel input. A simple way to implement a transform is to use an async
 * generator function.
 *
 * @param input An async iterable that will yield source input values
 * @returns any kind of channel output that yields output values
 */
export type ChannelTransform<I = any, O = unknown> = (
  input: Channel<I>
) => Channel<O>;

/**
 * A channel filter is a type of transform that always returns an iterable
 * of the same type as the input.
 */
export type ChannelFilter = <T>(input: Channel<T>) => Channel<T>;
