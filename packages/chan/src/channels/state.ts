import { Channel, nothing, pipe } from "../core";
import queue from "./queue";
import repeat from "./repeat";

export type Action<S> = (prior: S) => S | nothing;

const values = <S>(initialValue?: S) =>
  async function*(actions: Channel<Action<S>>): Channel<S> {
    let prior = initialValue;
    if (initialValue !== undefined) yield initialValue;
    for await (const action of actions) {
      const next = action(prior as S);
      if (next === nothing) continue;
      prior = next;
      yield next;
    }
  };

/**
 * Returns a channel that maintains a state value. You can update the state
 * value by posting new actions to the state. Each action is a will be invoked
 * in series and it's updated state will be posted to listeners.
 *
 * The state is intended to be iterated over by multiple readers. Each reader
 * will immediately receive the most recent value and then all future changes
 * until the state is closed.
 *
 * Closes when you call `close()`. Throws when you call `error()`.
 *
 * @param initialValue (Optional) initial value to seed state
 */
export const state = <S>(initialValue?: S) =>
  pipe(
    queue<Action<S>>(),
    values(initialValue),
    repeat(1)
  );

export default state;
