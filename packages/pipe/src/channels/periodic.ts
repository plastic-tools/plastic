import { Channel } from "../types";

/** Returns a promise that resolve after the specified time has elapsed */
const timer = (period: number) =>
  new Promise<void>(resolve => setTimeout(resolve, period));

/**
 * Returns a channel that will emit a new value every `period` milliseconds.
 * The channel will not start emitting until the first time a reader tries to
 * iterate on it. It will then emit forever until you close it.
 *
 * Note that if no one is reading from this channel, it will pause execution
 * until someone tries to read from it again, and then will emit catchup
 * events repeatedly until it catches up the current time. This means the
 * channel is very cheap to keep around as long as no one is reading from it.
 *
 * Does not close or throw on its own. (Although you can control it through
 * `pipe()` functions).
 *
 * @param period how frequently to emit the event
 */
export async function* periodic(period = 1000): Channel<number> {
  yield 0; // wait for someone to start reading..
  let prior = Date.now();
  let count = 1;
  while (true) {
    // emit until we've caught up to the current time
    while (Date.now() - prior > period) {
      prior = prior + period;
      yield count++;
    }
    // caught up, wait until the next period has passed
    await timer(prior + period - Date.now());
  }
}

export default periodic;
