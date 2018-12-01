import { sleep } from "../sleep";

describe(sleep, () => {
  it("should resolve after a period time", async () => {
    const now = Date.now();
    await sleep(250);
    // allow for some clock skew
    expect(Math.abs(Date.now() - now - 250)).toBeLessThan(10);
  });
});
