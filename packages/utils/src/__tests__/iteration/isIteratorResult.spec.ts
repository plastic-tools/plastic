import { isIteratorResult } from "../../iteration";

describe(isIteratorResult, () => {
  it("should match iterator results", () => {
    expect(isIteratorResult({ done: false, value: "foo" })).toBe(true);
    expect(isIteratorResult({ done: true, value: "foo" })).toBe(true);
  });

  it("should match functions that look like results", () => {
    const fn = () => "foo";
    fn.done = false;
    fn.value = "foo";
    expect(isIteratorResult(fn)).toBe(true);
  });

  it("should require value unless done is true", () => {
    expect(isIteratorResult({ done: true })).toBe(true);
    expect(isIteratorResult({ done: false })).toBe(false);
  });

  it("should not match objects without done", () => {
    expect(isIteratorResult({ foo: "foo" })).toBe(false);
    expect(isIteratorResult({ value: "foo" })).toBe(false);
  });

  it("should not match non-objects", () => {
    expect(isIteratorResult("foo")).toBe(false);
    expect(isIteratorResult(23)).toBe(false);
  });
});
