import pipe from "../pipe";
import { Channel, ChannelTransform, nothing } from "../types";

// prettier-ignore
export type ReducerFn =
  <U>(prior: U | undefined, next: any) => (U | nothing);

// prettier-ignore
type ReducerSeedType<F extends ReducerFn> =
  F extends (prior: infer U | undefined, next: any) => any ? U: never;

// prettier-ignore
type ReducerTransform<F extends ReducerFn> = <T>(input: Channel<T>) =>
  F extends (prior: any, next: T) =>
    (infer U | nothing) | Promise<infer U | nothing>
  ? Channel<U>
  : never;

/**
 * Returns a channel transform that emits a reduced value of the source channel.
 * Works like Array's `reduce()`.
 *
 * @param reducer reducer function to apply to channel
 * @param seed (Optional) initial seed value for reducer
 * @param ch source channel
 */
export function reduce<T, S>(
  reducer: (prior: S | undefined, next: T) => S | nothing,
  seed?: S
): (input: Channel<T>) => Channel<S>;
export function reduce<T, S>(
  reducer: (prior: S | undefined, next: T) => S | nothing,
  seed: S | undefined,
  ch: Channel<T>
): Channel<S>;
export function reduce(
  reducer: (prior: any | undefined, next: any) => any | nothing,
  seed?: any,
  ch?: Channel
): Channel | ChannelTransform {
  async function* reduced(input: Channel) {
    let state = seed === null ? undefined : seed;
    for await (const next of pipe(input)) {
      const nstate = await reducer(state, next);
      if (nstate === nothing) continue;
      state = nstate;
      yield nstate;
    }
  }
  return ch ? reduced(ch) : reduced;
}

export default reduce;
