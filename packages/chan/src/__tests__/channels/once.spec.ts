import { once } from "../../channels";
import { chan } from "../../core";

describe(once, () => {
  it("should iterate only one time", async () => {
    const repeating = chan([1, 2, 3]);
    const ch = once(repeating);

    // ensure that source channel repeats
    let cnt = 0;
    for await (const next of repeating) cnt++;
    for await (const next of repeating) cnt++;
    expect(cnt).toBe(6);

    // ensure that `once` does not repeat
    cnt = 0;
    for await (const next of ch) cnt++;
    for await (const next of ch) cnt++;
    expect(cnt).toBe(3);
  });

  it("should forward errors", () => {
    const bad = chan(Promise.reject("foo"));
    const ch = once(bad);
    expect(
      (async () => {
        for await (const next of ch) continue;
      })()
    ).rejects.toBe("foo");
  });
});
