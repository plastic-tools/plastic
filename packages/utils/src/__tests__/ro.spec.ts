import ro from "../ro";

describe("ro", () => {
  // Unfortunately, no way to check here that the returned type is
  // readonly
  it("should return the same instance", () => {
    for (const x of [
      "foo",
      42,
      true,
      null,
      undefined,
      NaN,
      { foo: "foo" },
      ["foo"]
    ]) {
      expect(ro(x)).toBe(x);
    }
  });
});
