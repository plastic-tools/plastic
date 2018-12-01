import state from "../state";

describe(state, () => {
  it("should emit initial state", async () => {
    const ch = state(10);
    ch.close();
    const received: number[] = [];
    for await (const next of ch) received.push(next);
    expect(received).toEqual([10]);
  });

  it("should run actions in order", async () => {
    const ch = state(0);
    ch.put(n => n + 1);
    ch.put(n => n - 1);
    ch.close();
    const received: number[] = [];
    for await (const next of ch) received.push(next);
    expect(received).toEqual([0, 1, 0]);
  });
});
