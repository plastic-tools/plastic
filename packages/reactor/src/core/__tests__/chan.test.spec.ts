import { ITERATOR_DONE_RESULT } from "@plastic/utils";
import chan from "../chan";

describe("chan.test", () => {
  it("should be true for any channel source", () => {
    async function* count() {
      yield 1;
    }
    expect(chan.test(count())).toBe(true);
    expect(chan.test([1, 2, 3])).toBe(true);
    expect(
      chan.test({
        next() {
          return ITERATOR_DONE_RESULT;
        }
      })
    ).toBe(true);
    expect(chan.test(Promise.resolve(1))).toBe(true);
  });

  it("should be false for non-sources", () => {
    expect(chan.test(1)).toBe(false);
    expect(chan.test("foo")).toBe(false);
    expect(chan.test({ foo: "foo" })).toBe(false);
    expect(chan.test(() => [])).toBe(false);
  });
});
