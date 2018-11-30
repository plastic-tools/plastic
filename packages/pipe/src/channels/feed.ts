import pipe from "../pipe";
import { Channel } from "../types";

/**
 * An event describing a change in channel state. Useful when you want to
 * track the state of a channel instead of just the values coming out of it.
 * All events include `type` and `source` channel properties. Additional
 * properties are present depending on the type.
 *
 * | Type       | Meaning              | Properties         |
 * | ---------- | -------------------- | ------------------ |
 * | `"value"`  | emitted a new value  | `source`, `value`  |
 * | `"closed"` | closed without error | `source`           |
 * | `"error"`  | closed with error    | `source`, `reason` |
 *
 */
export type ChannelEvent<T = unknown> =
  | {
      type: "value";
      channel: Channel<T>;
      value: T;
      reason?: never;
    }
  | {
      type: "close";
      channel: Channel<T>;
      value?: never;
      reason?: never;
    }
  | {
      type: "error";
      channel: Channel<T>;
      value?: never;
      reason: any;
    };

/**
 * Returns a channel that will emit events when the input channel emits a new
 * value, closes, or errors. The events are also tagged with the source channel,
 * making it easy to identify the source even if you join multiple feeds. Useful
 * when you want to track the output of one or more inputs, especially without
 * necessarily closing or throwing when the input does.
 *
 * Closes when all input channels close (after emitting close events for all
 * of them). Does not throw, emitting an `"error"`-type event instead.
 *
 * @param channel input channel
 */
export async function* feed<T>(channel: Channel<T>): Channel<ChannelEvent<T>> {
  try {
    for await (const value of pipe(channel)) {
      yield { type: "value", channel, value };
    }
    return { type: "closed", channel };
  } catch (reason) {
    yield { type: "error", channel, reason };
  }
}

export default feed;
