import pipe, { remember } from "../pipe";
import { Channel, nothing } from "../types";
import queue from "./queue";

export type Action<T = any> = (prior: T) => T | nothing;

const values = <T>(initialState?: T) =>
  async function*(actions: Channel<Action<T>>): AsyncIterable<T> {
    let prior: any = initialState;
    if (initialState !== undefined) yield prior;
    for await (const action of pipe(actions)) {
      const next = action(prior);
      if (next === nothing) continue;
      prior = next;
      yield next;
    }
  };

export const state = <T>(initialState?: T) =>
  pipe(
    queue<Action<T>>(),
    values(initialState)
  ).remember(1);

export default state;

const counter = state(0);
const increment = (n: number) => n + 1;
const decrement = (n: number) => n - 1;
counter.put(increment);
counter.put(decrement);
