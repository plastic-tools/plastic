import {
  AnyIterable,
  AnyIterator,
  isAsyncIterable,
  isIterable,
  isIterator,
  isObjectLike
} from "@plastic/utils";

// ...............................
// TYPES
//

export const $channel = Symbol("$channel");
export type $channel = typeof $channel;

/** A Channel is any kind of iterator, iterable, or a generator */
export type Channel<T = unknown> =
  | AnyIterator<T>
  | AnyIterable<T>
  | Promise<T>
  | ChannelProxy<T>;

/**
 * A channel that may emit any type. Primarily for use with `extends` in
 * conditional types and inferred functional types. Usually you should prefer
 * the `Channel` type.
 */
export type AnyChannel<T = any> = Channel<T>;

/**
 * A writable channel provides an interface to write values to the channel.
 * In addition to this interface, the channel should implement one of the
 * other channel interfaces as well to support reading.
 */
export interface WritableChannel<T = any> {
  readonly writable: boolean;
  put(value: T): void;
  close(): void;
  error(reason?: any): void;
}

/** Allows any object to be treated as a channel. */
export interface ChannelProxy<T = unknown> {
  [$channel](): Channel<T>;
}

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

// ..................................
// GUARDS
//

/** true and type casts if `x` can be used as a channel */
export const isChannel = <T = unknown>(x: any): x is Channel<T> =>
  isIterable(x) || isAsyncIterable(x) || isIterator(x);

export const isWritableChannel = <T = any>(x: any): x is WritableChannel<T> =>
  isObjectLike(x) &&
  "function" === typeof x[Symbol.asyncIterator] &&
  "function" === typeof x.put &&
  "function" === typeof x.close &&
  "function" === typeof x.error &&
  "boolean" === typeof x.writable;

/** true and type casts if `x` is a channel generator */
export const isChannelProxy = <T = unknown>(x: any): x is ChannelProxy<T> =>
  isObjectLike(x) && "function" === typeof x[$channel];

// ..................................
// CONSTANTS
//

/** Used by various transforms to indicate no value should be emitted */
export const nothing = Symbol("nothing");
export type nothing = typeof nothing;
