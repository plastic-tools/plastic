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

  describe("update", () => {
    it("should resolve once action is applied", async () => {
      const ch = state(0);
      let applied = false;

      // start a reader on the state, otherwise the updater will never get
      // called
      (async () => {
        for await (const next of ch) {
          if (applied) break;
        }
      })();

      const result = await ch.update(n => {
        applied = true;
        return n + 10;
      });
      expect(applied).toBe(true);
      expect(result).toBe(10);
    });
  });
});
