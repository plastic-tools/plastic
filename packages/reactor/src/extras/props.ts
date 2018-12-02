import { isPromiseLike } from "@plastic/utils";
import { latest } from "../channels";
import { chan, Channel, isChannel } from "../core";

type CurrentPropType<T> = T extends Channel<infer U>
  ? U
  : T extends Promise<infer V>
  ? V
  : T;

type ResolvedProps<T> = { [K in keyof T]: CurrentPropType<T[K]> };

interface InputProps {}

/**
 * Returns a channel that will accept a set of props, some of which may be
 * channels or promises, and then returns a channel that will yield the
 * props each time their value changes.
 *
 * @param input
 */
export async function* props<P extends InputProps>(
  input: P
): Channel<ResolvedProps<P>> {
  const base: any = {};
  const channels: any = {};
  for (const key of Object.keys(input) as Array<keyof P>) {
    const value = input[key];
    if (isChannel(value) || isPromiseLike(value)) channels[key] = chan(value);
    else base[key] = value; // constant
  }

  if (Object.keys(channels).length === 0) {
    yield input as any; // nothing to iterate
    return;
  }

  for await (const next of latest(channels)) {
    yield { ...base, ...next };
  }
}
