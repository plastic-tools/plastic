import chan from "../chan";

describe(chan, () => {
  describe("promise", () => {
    it("should return same instance for same promise", () => {
      const pr = Promise.resolve("foo");
      expect(chan(pr)).toBe(chan(pr));
    });

    it("should iterate once over promise value and exit", async () => {
      const pr = Promise.resolve("foo");
      let cnt = 0;
      for await (const next of chan(pr)) {
        expect(next).toBe("foo");
        cnt++;
      }
      expect(cnt).toBe(1);

      for await (const next of chan(pr)) {
        throw new Error(`should not iterate a second time`);
      }
    });

    it("should repeatedly throw exception from promise", async () => {
      const pr = Promise.reject("foo");
      const ch = chan(pr);
      await expect(
        (async () => {
          let cnt = 0;
          for await (const next of ch) cnt++;
          expect(cnt).toBe(0);
        })()
      ).rejects.toBe("foo");
    });

    it("should wait for promise to resolve to iterate", async () => {
      let resolved = false;
      const pr = new Promise<number>(resolve => {
        setTimeout(() => {
          resolved = true;
          resolve(42);
        }, 250);
      });

      for await (const next of chan(pr)) {
        expect(next).toBe(42);
        expect(resolved).toBe(true);
      }
    });
  });
});
