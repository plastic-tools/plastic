import { isIterable } from "../../iteration";

describe(isIterable, () => {
  it("should match object with iterator method", () => {
    expect(
      isIterable({
        ignoreMe: "foo",
        extraMethod() {
          return;
        },
        [Symbol.iterator]() {
          return [];
        }
      })
    ).toBe(true);

    expect(
      isIterable({
        [Symbol.iterator]: "foo"
      })
    ).toBe(false);

    expect(
      isIterable({
        extraMethod() {
          return "foo";
        },
        [Symbol.asyncIterator]() {
          return [];
        }
      })
    ).toBe(false);
  });

  it("should match function with iterator method", () => {
    const fn = (() => 42) as any;

    expect(isIterable(fn)).toBe(false);

    fn[Symbol.iterator] = "foo";
    expect(isIterable(fn)).toBe(false);

    fn[Symbol.iterator] = () => {
      return [];
    };
    expect(isIterable(fn)).toBe(true);
  });

  it("should not match non-objects", () => {
    expect(isIterable("foo")).toBe(false);
    expect(isIterable(23)).toBe(false);
  });
});
