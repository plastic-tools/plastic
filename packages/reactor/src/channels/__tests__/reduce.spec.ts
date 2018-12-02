import { chan, pipe } from "../../core";
import reduce from "../reduce";

describe(reduce, () => {
  it("should call reducer with each new value, accumulating result", async () => {
    const input = chan([2, 2, 2]);
    const ch = reduce(input, (p = 0, n) => p + n);
    const received: any[] = [];
    for await (const next of ch) received.push(next);
    expect(received).toEqual([2, 4, 6]);
  });

  it("should provide seed to reducer if provided", async () => {
    const input = chan([2, 2, 2]);
    const ch = reduce(input, (p, n) => p + n, 10);
    const received: any[] = [];
    for await (const next of ch) received.push(next);
    expect(received).toEqual([12, 14, 16]);
  });

  it("should return a transform factory if no channel provided", async () => {
    const sum = reduce((p, n: number) => p + n, 0);

    const received1: any[] = [];
    for await (const next of pipe(
      chan([2, 1, 0]),
      sum
    )) {
      received1.push(next);
    }
    expect(received1).toEqual([2, 3, 3]);

    const received2: any[] = [];
    for await (const next of pipe(
      chan([0, 1, 2]),
      sum
    )) {
      received2.push(next);
    }
    expect(received2).toEqual([0, 1, 3]);
  });
});
