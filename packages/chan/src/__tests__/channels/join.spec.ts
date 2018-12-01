import { join } from "../../channels";

/** Returns a promise that resolve after the specified time has elapsed */
const sleep = (period: number) =>
  new Promise<void>(resolve => setTimeout(resolve, period));

describe(join, () => {
  it("should feed values from input channels", async () => {
    async function* numbers() {
      yield 1;
      yield 2;
      await sleep(50);
      yield 3;
      await sleep(25);
      yield 4;
    }

    async function* strings() {
      yield "foo";
      await sleep(1);
      yield "bar";
      await sleep(100);
      yield "baz";
    }

    const ch = join(numbers(), strings());
    const received: any[] = [];
    for await (const next of ch) received.push(next);
    expect(received).toEqual([1, 2, "foo", "bar", 3, 4, "baz"]);
  });

  it("should end when one input throws an error", async () => {
    const NUMBERS_ERROR = new Error("numbers");
    async function* numbers() {
      yield 1;
      await sleep(100);
      yield 2;
      throw NUMBERS_ERROR;
    }

    async function* strings() {
      yield "foo";
      await sleep(150);
      yield "bar";
    }

    const ch = join(numbers(), strings());
    const received: any[] = [];
    let err: any;
    try {
      for await (const next of ch) received.push(next);
    } catch (reason) {
      err = reason;
    }
    expect(received).toEqual([1, "foo", 2]);
    expect(err).toBe(NUMBERS_ERROR);
  });
});
