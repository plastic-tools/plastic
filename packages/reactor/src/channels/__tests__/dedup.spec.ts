import dedup from "../dedup";

describe(dedup, () => {
  it("should remove duplicate similar-like values", async () => {
    async function* feed() {
      yield { foo: 42 };
      yield { foo: 42 };
      yield [1, 2, { foo: "bar" }];
      yield [1, 2, { foo: "bar" }];
      yield { foo: 42 };
    }
    const ch = dedup(feed());
    const received: any[] = [];
    for await (const next of ch) received.push(next);
    expect(received).toEqual([
      { foo: 42 },
      [1, 2, { foo: "bar" }],
      { foo: 42 }
    ]);
  });
});
