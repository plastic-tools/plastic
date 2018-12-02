import { sleep } from "@plastic/utils";
import latest from "../latest";

describe(latest, () => {
  async function* numbers() {
    yield 1;
    await sleep(1);
    yield 2;
    await sleep(100);
    yield 3;
    await sleep(50);
    yield 4;
  }

  async function* strings() {
    yield "foo";
    await sleep(50);
    yield "bar";
    await sleep(300);
    yield "baz";
  }

  it("should output a tuple of inputs", async () => {
    const ch = latest(numbers(), strings());
    const received: Array<[number, string]> = [];
    for await (const next of ch) received.push(next);
    expect(received).toEqual([
      [1, "foo"],
      [2, "foo"],
      [2, "bar"],
      [3, "bar"],
      [4, "bar"],
      [4, "baz"]
    ]);
  });

  it("should output property map of inputs", async () => {
    const ch = latest({ num: numbers(), str: strings() });
    const received: Array<{ num: number; str: string }> = [];
    for await (const next of ch) received.push(next);
    const expected = [
      { num: 1, str: "foo" },
      { num: 2, str: "foo" },
      { num: 2, str: "bar" },
      { num: 3, str: "bar" },
      { num: 4, str: "bar" },
      { num: 4, str: "baz" }
    ];
    expect(received.length).toBe(expected.length);
    for (let idx = 0, lim = expected.length; idx < lim; idx++) {
      expect(received[idx]).toEqual(expected[idx]);
    }
  });
});
