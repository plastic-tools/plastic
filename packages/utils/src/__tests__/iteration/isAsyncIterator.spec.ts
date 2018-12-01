import { isAsyncIterator, isIterator } from "../../iteration";

describe(isAsyncIterator, () => {
  // add tests here if you decide to make a different iterator
  it("should be same function as iterator", () => {
    expect(isAsyncIterator).toBe(isIterator);
  });
});
