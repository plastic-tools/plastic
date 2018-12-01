import { queue } from "../../channels";

describe(queue, () => {
  it("should read items previously put", async () => {
    const ch = queue<number>();
    const counts = [0, 0, 0, 0];

    ch.put(0);
    ch.put(1);
    ch.close();

    for await (const next of ch) {
      counts[next] = (counts[next] || 0) + 1;
    }

    expect(counts).toEqual([1, 1, 0, 0]);
  });

  it("should read item written later", async () => {
    const ch = queue<number>();
    const chiter = ch[Symbol.asyncIterator]();
    // this should get three unput values
    const reads = [chiter.next(), chiter.next(), chiter.next(), chiter.next()];

    // write a few values and close.
    // note: we've read more than we wrote.
    ch.put(0);
    ch.put(1);
    ch.close();

    const results = await Promise.all(reads);

    expect(results).toEqual([
      { done: false, value: 0 },
      { done: false, value: 1 },
      { done: true },
      { done: true }
    ]);
  });

  it("should read and write interleaved items", async () => {
    const ch = queue<number>();
    const counts = [0, 0, 0, 0];
    ch.put(1);
    ch.put(2);
    const remaining = [0, 3];
    for await (const next of ch) {
      counts[next] = (counts[next] || 0) + 1;
      if (remaining.length > 0) ch.put(remaining.pop()!);
      else ch.close();
    }
    expect(counts).toEqual([1, 1, 1, 1]);
  });

  it("should throw error in order pushed", async () => {
    const ch = queue<number>();
    const counts = [0, 0, 0, 0];

    ch.put(0);
    ch.put(1);
    ch.error("died");
    ch.put(2);
    ch.put(3);

    let err: any;
    try {
      for await (const next of ch) counts[next] = (counts[next] || 0) + 1;
    } catch (reason) {
      err = reason;
    }
    expect(err).toBe("died");
    expect(counts).toEqual([1, 1, 0, 0]);
  });
});
