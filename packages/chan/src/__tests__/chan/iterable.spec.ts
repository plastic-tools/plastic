import { ITERATOR_DONE_RESULT } from "@plastic/utils";
import { chan } from "../../chan";

describe(chan, () => {
  describe("iterable", () => {
    const testIterable = (i: Iterable<any>) => async () => {
      const ch = chan(i);
      const items = Array.from(i);
      let idx = 0;
      for await (const next of ch) {
        expect(next).toEqual(items[idx]);
        idx++;
      }
      expect(idx).toBe(items.length);
    };

    it("should iterate over arrays", testIterable(["foo", "bar", 23]));
    it("should iterate over sets", testIterable(new Set(["foo", "bar", 23])));
    it("should iterate over maps", testIterable(new Map().set("foo", "bar")));

    it("should cache returned instances", () => {
      const ary = [1, 2, 3];
      expect(chan(ary)).toBe(chan(ary));
    });

    it("should iterate repeatedly if iterable does so", async () => {
      const items = [1, 2, 3];
      let cnt = 0;
      for await (const i of chan(items)) cnt++;
      expect(cnt).toBe(3);

      cnt = 0; // try again
      for await (const i of chan(items)) cnt++;
      expect(cnt).toBe(3);
    });

    it("should iterate once if iterable does so", async () => {
      let value = 3;
      const iterable: IterableIterator<number> = {
        [Symbol.iterator]() {
          return this;
        },
        next(): IteratorResult<number> {
          return value > 0
            ? { done: false, value: value-- }
            : ITERATOR_DONE_RESULT;
        }
      };

      let cnt = 0;
      for await (const i of chan(iterable)) cnt++;
      expect(cnt).toBe(3);

      cnt = 0; // try again
      for await (const i of chan(iterable)) {
        throw new Error(`should not iterate again`);
      }
      expect(cnt).toBe(0);
    });
  });
});
