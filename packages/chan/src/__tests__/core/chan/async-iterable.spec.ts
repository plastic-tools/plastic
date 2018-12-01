import { chan } from "../../../core";

/** Returns a noop channel */
async function* noop(): AsyncIterableIterator<any> {
  return;
}

describe(chan, () => {
  describe("async iterable / channel", () => {
    it("should return same instance of async iterable", () => {
      const ch = noop();
      expect(chan(ch)).toBe(ch);
    });
  });
});
