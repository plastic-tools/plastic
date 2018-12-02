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

interface State<S = unknown> extends Channel<S> {
  /**
   * Works like `put()` but returns a promise that will resolve once the
   * action has run to the returned value. Returns the new value of the state
   * after the action executed
   */
  update(action: Action<S>): Promise<S>;
  put(action: Action<S>): void;
  close(action?: Action<S>): void;
  error(reason?: any): void;
}

function update<S>(this: State<S>, action: Action<S>): Promise<S> {
  let result: S | Promise<S> | nothing = nothing;
  let resolve: undefined | ((value: S | Promise<S>) => void);
  this.put(prior => {
    let ret: S | Promise<S> | nothing = nothing;
    try {
      ret = action(prior);
      return ret;
    } catch (reason) {
      ret = Promise.reject(reason);
      throw reason;
    } finally {
      if (ret === nothing) ret = prior;
      if (resolve) resolve(ret);
      else result = ret;
    }
  });
  return new Promise(fn => {
    if (result !== nothing) fn(result);
    else resolve = fn;
  });
}

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
export const state = <S>(initialValue?: S): State<S> => {
  const ret = (pipe(
    queue<Action<S>>(),
    values(initialValue),
    repeat(1)
  ) as unknown) as State<S>;
  ret.update = update;
  return ret;
};

export default state;
