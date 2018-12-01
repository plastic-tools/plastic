import { repeat } from "../../channels";
import { Channel } from "../../core";

// Expose some internal methods for testing
interface RepeaterChannel<T = unknown> extends Channel<T> {
  readonly limit: number;
}

describe(repeat, () => {
  const NUMBERS_ERROR = new Error("died");
  async function* numbers(die = false) {
    yield 0;
    yield 1;
    yield 2;
    if (die) throw NUMBERS_ERROR;
    yield 3;
  }

  // runs `max` readers over the same channel, each of which waits to receive
  // `delay` value before spinning up the next reader. Each reader adds to the
  // `counts` array, which you can check after all the readers exit to make
  // sure they received all the historical items you expect.
  async function reader(
    ch: Channel<number>, // channel to iterate
    counts: number[], // counts to fill out
    max: number, // max number of readers
    delay = 1 // how long to wait before spinning up next reader
  ) {
    let countdown = delay;
    let waiting: undefined | Promise<any>;
    for await (const next of ch) {
      counts[next] = (counts[next] || 0) + 1;
      if (!waiting && max > 1 && --countdown <= 0) {
        waiting = reader(ch, counts, max - 1, delay);
      }
    }
    if (waiting) await waiting;
  }

  it("should replay all outputs to each listener by default", async () => {
    const ch = repeat(numbers());
    expect((ch as RepeaterChannel).limit).toBe(Number.MAX_SAFE_INTEGER);
    const counts = [0, 0, 0, 0];

    // two readers running in parallel
    await reader(ch, counts, 2);

    // another reader starting later after the channel has closed
    await reader(ch, counts, 1);

    expect(counts).toEqual([3, 3, 3, 3]);
  });

  it("should support multiple concurrent readers with no history", async () => {
    const ch = repeat(numbers(), 0);
    const counts = [0, 0, 0, 0];
    await reader(ch, counts, 3);
    expect(counts).toEqual([1, 2, 3, 3]);
  });

  it("should replay 1 history item and track remainder", async () => {
    const ch = repeat(1)(numbers());
    const counts = [0, 0, 0, 0];
    await reader(ch, counts, 2, 2); // should replay previous item anyway
    expect(counts).toEqual([1, 2, 2, 2]);
  });

  it("should receive error when it occurs", async () => {
    const ch = repeat(numbers(true));
    const counts = [0, 0, 0, 0];

    let err: any = null;
    try {
      await reader(ch, counts, 2);
    } catch (error) {
      err = error;
    }
    expect(err).toBe(NUMBERS_ERROR);
    expect(counts).toEqual([2, 2, 2, 0]); // throws before yielding 3
  });
});
