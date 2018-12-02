import { latest } from "../channels";
import { Channel } from "../core";

type Channels<A> = { [K in keyof A]: Channel<A[K]> };

/**
 * Track accepts a function and one or more channels, which will be monitored
 * and then passed to the function anytime the values change. This is how you
 * can apply sideeffects. You can pass either multiple arguments or a named
 * array of inputs.
 */
export const track = async <A extends any[]>(
  fn: (...args: A) => void,
  ...inputs: Channels<A>
) => {
  for await (const next of latest(...inputs)) fn(...next);
};

export default track;
