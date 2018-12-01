import { isAsyncIterable, ITERATOR_DONE_RESULT } from "@plastic/utils";
import { chan } from "../../chan";

describe(chan, () => {
  describe("iterators", () => {
    // make a simple one-time iterator
    const iterator = <A>(...items: A[]): Iterator<A> => {
      let idx = 0;
      return {
        next() {
          return idx >= items.length
            ? ITERATOR_DONE_RESULT
            : { done: false, value: items[idx++] };
        }
      };
    };

    it("should return same channel for repeated calls", () => {
      const iter = iterator(1, 2, 3);
      expect(isAsyncIterable(chan(iter))).toBe(true);
      expect(chan(iter)).toBe(chan(iter));
    });

    it("should iterate once over results", async () => {
      const iter = iterator(1, 2, 3);
      let idx = 1;
      for await (const next of chan(iter)) {
        expect(next).toBe(idx);
        idx++;
      }
      expect(idx).toBe(4);
      for await (const next of chan(iter)) {
        throw new Error("channel should not iterate again");
      }
      expect(idx).toBe(4);
    });
  });
});
