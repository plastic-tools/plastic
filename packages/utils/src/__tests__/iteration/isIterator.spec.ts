import { isIterator } from "../../iteration";

describe(isIterator, () => {
  it("should match only object with next function", () => {
    expect(isIterator({ next: () => ({ done: true }) })).toBe(true);
    expect(
      isIterator({
        next: () => ({ done: true }),
        ignoredMe: true,
        randomMethod() {
          return;
        }
      })
    ).toBe(true);
    expect(
      isIterator({
        return() {
          return;
        }
      })
    ).toBe(false);
  });
  it("should match a function with next function", () => {
    const fn = () => 42;
    expect(isIterator(fn)).toBe(false);
    fn.next = () => ({ done: true });
    expect(isIterator(fn)).toBe(true);
  });

  it("should require return to be function if it exists", () => {
    expect(
      isIterator({
        next() {
          return { done: true };
        },
        return() {
          return;
        }
      })
    ).toBe(true);

    expect(
      isIterator({
        next() {
          return { done: true };
        },
        return: "foo"
      })
    ).toBe(false);
  });

  it("should require throws to be function if it exists", () => {
    expect(
      isIterator({
        next() {
          return { done: true };
        },
        throw() {
          return;
        }
      })
    ).toBe(true);

    expect(
      isIterator({
        next() {
          return { done: true };
        },
        throw: "foo"
      })
    ).toBe(false);
  });

  it("should not match non-objects", () => {
    expect(isIterator("foo")).toBe(false);
    expect(isIterator(42)).toBe(false);
  });
});
