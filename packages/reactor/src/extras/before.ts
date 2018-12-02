import { chan, Channel, ChannelSource, ChannelTransform } from "../core";

/**
 * Returns a channel that will yield the passed values first before yielding
 * the values from the input channel.
 */
export function before<U>(
  values: ChannelSource<U>
): <V>(input: Channel<V>) => Channel<U | V>;
export function before<U, V>(
  input: Channel<V>,
  values: ChannelSource<U>
): Channel<U | V>;
export function before(
  inputOrValues: Channel | ChannelSource,
  values?: ChannelSource
): Channel | ChannelTransform {
  const [input, preamble] =
    arguments.length <= 1
      ? [undefined, chan(inputOrValues)]
      : [chan(inputOrValues), chan(values!)];
  async function* preambler(ch: Channel) {
    yield* preamble;
    yield* ch;
  }
  return input ? preambler(input) : preambler;
}

export default before;
