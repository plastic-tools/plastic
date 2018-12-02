import {
  AnyChannel,
  Channel,
  ChannelTransform,
  ChannelType,
  isChannel,
  nothing
} from "../core";

export type ReduceFn<I = any, O = any, P = O> = (
  prior: P,
  value: I
) => O | nothing;

/**
 * Returns a channel or factory that computes its output value using the
 * passed reducer function. This works much like `Array.reduce()`.
 *
 * Unless you pass a `seed` value, your reducer function will receive
 * `undefined` for the initial value.
 *
 * Closes when the input channel closes. Throws if the input channel throws
 * or the reducer function throws.
 */
export function reduce<C extends AnyChannel, O, I = ChannelType<C>>(
  input: C,
  fn: ReduceFn<I, O, I | undefined>
): Channel<O>;
export function reduce<C extends AnyChannel, O, I = ChannelType<C>>(
  input: C,
  fn: ReduceFn<I, O>,
  seed: O
): Channel<O>;
export function reduce<I, O>(
  fn: ReduceFn<I, O, I | undefined>
): (ch: Channel<I>) => Channel<O>;
export function reduce<I, O>(
  fn: ReduceFn<I, O>,
  seed: O
): (ch: Channel<I>) => Channel<O>;
export function reduce(
  chOrFn: Channel | ReduceFn,
  fnOrSeed?: ReduceFn | any,
  seed?: any
): Channel | ChannelTransform {
  const ch = isChannel(chOrFn) ? chOrFn : undefined;
  const fn: ReduceFn = !ch && "function" === typeof chOrFn ? chOrFn : fnOrSeed;
  if (fn === chOrFn) seed = fnOrSeed;

  async function* reducer(input: Channel) {
    let prior = seed;
    for await (const value of input) {
      const next = fn!(prior, value);
      if (next === nothing) continue;
      prior = next;
      yield next;
    }
  }
  return ch ? reducer(ch) : reducer;
}

export default reduce;
