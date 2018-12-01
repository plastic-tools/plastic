import periodic from "../periodic";

describe(periodic, () => {
  it("should tick per period", async () => {
    const start = Date.now();
    const clock = periodic(50);
    const received: number[] = [];
    for await (const next of clock) {
      received.push(next);
      if (Date.now() - start > 250) break;
    }
    expect(received).toEqual([0, 1, 2, 3, 4, 5]);
  });
});
