import { Channel, queue, repeat } from "@plastic/reactor";

export type ActivityFn<T = any> = (
  update: (value: T) => void,
  self: Channel<T>
) => Promise<T | void>;

/**
 * Runs the associated activity function and returns a channel that can update
 * with state as the activity progresses. At a minimum, the channel will close
 * with the return value from the activity when it complete. The activity can
 * also choose to post updates to the channel as it progresses with the
 * passed `update` function.
 *
 * If you pass `ctl` object, the properties will be copied onto the returned
 * channel so you can have a way to control the activity.
 *
 * @param fn activity function to run
 */

export function activity<T>(
  fn: (update: (value: T) => void, self: Channel<T>) => Promise<T | void>
): Channel<T> {
  const input = queue<T>();
  const output = repeat(input, 1);
  const update = (value: T) => input.put(value);
  fn(update, output).then(
    value => input.close(value as T),
    reason => input.error(reason)
  );
  return output;
}

export default activity;
