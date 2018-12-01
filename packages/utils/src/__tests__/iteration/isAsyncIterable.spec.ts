import { isAsyncIterable } from "../../iteration";

describe(isAsyncIterable, () => {
  it("should match object with asyncIterator method", () => {
    expect(
      isAsyncIterable({
        ignoreMe: "foo",
        extraMethod() {
          return;
        },
        [Symbol.asyncIterator]() {
          return [];
        }
      })
    ).toBe(true);

    expect(
      isAsyncIterable({
        [Symbol.asyncIterator]: "foo"
      })
    ).toBe(false);

    expect(
      isAsyncIterable({
        extraMethod() {
          return "foo";
        },
        [Symbol.iterator]() {
          return [];
        }
      })
    ).toBe(false);
  });

  it("should match function with iterator method", () => {
    const fn = (() => 42) as any;

    expect(isAsyncIterable(fn)).toBe(false);

    fn[Symbol.asyncIterator] = "foo";
    expect(isAsyncIterable(fn)).toBe(false);

    fn[Symbol.asyncIterator] = () => {
      return [];
    };
    expect(isAsyncIterable(fn)).toBe(true);
  });

  it("should not match non-objects", () => {
    expect(isAsyncIterable("foo")).toBe(false);
    expect(isAsyncIterable(23)).toBe(false);
  });
});
