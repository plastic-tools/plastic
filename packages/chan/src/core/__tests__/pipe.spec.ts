import chan from "../chan";
import pipe from "../pipe";
import { Channel } from "../types";

describe(pipe, () => {
  it("should return channel if passed by itself", () => {
    const ch = chan([1, 2, 3]);
    expect(pipe(ch)).toBe(ch);
  });

  it("should convert channel source to channel", async () => {
    const ch = pipe([1, 2, 3]);
    let expected = 1;
    for await (const next of ch) {
      expect(next).toBe(expected);
      expected++;
    }
    expect(expected).toBe(4);
  });

  it("should chain passed transforms", async () => {
    async function* toArray<T>(input: Channel<T>) {
      for await (const next of input) yield [next];
    }

    const push = (item: string) =>
      async function*(input: Channel<any[]>) {
        for await (const next of input) yield [...next, item];
      };

    const ch = pipe(
      [1, 2, 3],
      toArray,
      push("a"),
      push("b"),
      push("c")
    );

    const expected = [
      [1, "a", "b", "c"],
      [2, "a", "b", "c"],
      [3, "a", "b", "c"]
    ];
    let idx = 0;
    for await (const next of ch) {
      expect(next).toEqual(expected[idx]);
      idx++;
    }
    expect(idx).toBe(3);
  });

  describe("pipe.input", () => {
    const methods = {
      put() {
        return;
      },
      close() {
        return;
      },
      error() {
        return;
      }
    };

    class InputPipe implements Channel<number> {
      readonly numbers = chan([1, 2, 3]);
      [Symbol.asyncIterator]() {
        return this.numbers[Symbol.asyncIterator]();
      }
      [pipe.input]() {
        return {
          ...methods,
          source: this
        };
      }
    }
    const ch = new InputPipe();

    async function* noop(input: Channel) {
      for await (const next of input) yield next;
    }

    it("should ignore inputs with no transforms", () => {
      expect(pipe(ch)).toBe(ch);
    });

    it("should add inputs with transforms", () => {
      const p = pipe(
        ch,
        noop
      );
      expect(p).not.toBe(ch);
      // should not throw type error either.
      expect(p.put).toBe(methods.put);
      expect(p.close).toBe(methods.close);
      expect(p.error).toBe(methods.error);
      expect(p.source).toBe(ch);
    });
  });
});
