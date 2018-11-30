import memo from "../memo";

describe("memo", () => {
  it("should compute a passed function once", () => {
    const fn = jest.fn(() => "foo");
    expect(memo(fn)).toBe("foo");
    expect(memo(fn)).toBe("foo");
    expect(fn).toBeCalledTimes(1);
  });

  it("should compute passed function separately for params", () => {
    const fn = jest.fn(x => x);
    expect(memo(fn, "foo")).toBe("foo");
    expect(memo(fn, "bar")).toBe("bar");
    expect(memo(fn, "foo")).toBe("foo");
    expect(fn).toBeCalledTimes(2);
  });

  class Foo {}
  const ARGS = [{}, Symbol(), 23, false, null, undefined, NaN, [23], new Foo()];

  for (const arg of ARGS) {
    it(`should handle arg of ${String(arg)}`, () => {
      let counter = 1;
      const fn = jest.fn(() => counter++);
      expect(memo(fn, arg)).toBe(1);
      expect(memo(fn, arg)).toBe(1);
      expect(fn).toBeCalledTimes(1);
    });
  }

  it("should chain different types", () => {
    let counter = 1;
    const fn = jest.fn(() => counter++);
    expect(memo(fn, ...ARGS)).toBe(1);
    expect(memo(fn, ...ARGS)).toBe(1);
    expect(fn).toBeCalledTimes(1);
  });
});

describe("memo.clear", () => {
  it("should clear all memoized results", () => {
    const fn = jest.fn(x => x);
    memo(fn, "foo");
    memo(fn, "bar");
    memo.clear(fn);
    expect(memo(fn, "foo")).toBe("foo");
    expect(fn).toBeCalledTimes(3);
  });

  it("should do nothing if function is not memoized", () => {
    const fn = x => x;
    expect(() => memo.clear(fn)).not.toThrow();
  });
});

describe("memo.has", () => {
  it("should return true when params are memoized", () => {
    const fn = x => x;
    memo(fn, "foo");
    expect(memo.has(fn)).toBe(false);
    expect(memo.has(fn, "foo")).toBe(true);
    expect(memo.has(fn, "bar")).toBe(false);
  });
});
