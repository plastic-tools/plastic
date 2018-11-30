import { isIteratorResult } from "../iteration";

describe(isIteratorResult, () => {
  it("should match basic iterator", () => {
    expect(isIteratorResult({ done: false, value: "foo" })).toBeTruthy();
  });
});
