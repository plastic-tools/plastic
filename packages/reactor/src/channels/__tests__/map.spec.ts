import map from "../map";

describe(map, () => {
  async function* numbers(lim = 4) {
    for (let idx = 0; idx <= lim; idx++) yield idx;
  }

  it("should map the input values to the output", async () => {
    const ch = map(numbers(), n => n * 2);
    const received: number[] = [];
    for await (const next of ch) received.push(next);
    expect(received).toEqual([0, 2, 4, 6, 8]);
  });

  it("should return filter", async () => {
    const mapper = map(n => n * 2);

    const ch1 = mapper(numbers(2));
    const received1: number[] = [];
    for await (const next of ch1) received1.push(next);
    expect(received1).toEqual([0, 2, 4]);

    const ch2 = mapper(numbers(3));
    const received2: number[] = [];
    for await (const next of ch2) received2.push(next);
    expect(received2).toEqual([0, 2, 4, 6]);
  });
});
