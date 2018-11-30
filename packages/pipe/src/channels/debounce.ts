import { defer } from "@plastic/utils";
import pipe from "../pipe";
import { Channel, nothing } from "../types";
import queue from "./queue";

/**
 * Returns a channel that will emit at most one value from the source
 * channel per turn of the microtask. Useful when your input channel may
 * receive a number of repeated values and you want to rate limit their
 * forwarding.
 *
 * Closes when the input channel closes. Throws when the input channel throws.
 *
 * @param input channel to debounce
 */
export const debounce = <T>(input: Channel<T>): Channel<T> => {
  const output = queue<T>(0); // no memory needed.
  let latest: T | nothing = nothing;

  const post = () => {
    if (latest !== nothing) output.put(latest);
    latest = nothing;
  };

  const fetch = async () => {
    try {
      for await (const next of pipe(input)) {
        latest = next;
        defer(post);
      }
      post();
      output.close();
    } catch (reason) {
      post();
      output.error(reason);
    }
  };

  fetch();
  return output;
};

export default debounce;
