import { pop, push, ro, shift, unshift } from "../ro";

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

describe("ro.push", () => {
  it("should return a new array with item added", () => {
    const x = [1, 2, 3];
    const ret = push(x, 4);
    expect(ret).not.toBe(x);
    expect(ret).toEqual([1, 2, 3, 4]);
  });

  it("should add multiple items", () => {
    const x = [1, 2, 3];
    const ret = push(x, 4, 5, 6);
    expect(ret).not.toBe(x);
    expect(ret).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("should return same array if no items", () => {
    const x = [1, 2, 3];
    expect(push(x)).toBe(x);
  });
});

describe("ro.pop", () => {
  it("should return tuple with last item and remainders", () => {
    const x = [1, 2, 3];
    const [item, remaining] = pop(x);
    expect(remaining).not.toBe(x);
    expect(item).toBe(3);
    expect(remaining).toEqual([1, 2]);
  });

  it("should return undefined and same ary if empty", () => {
    const x = [];
    const [item, remaining] = pop(x);
    expect(remaining).toBe(x);
    expect(remaining).toEqual([]);
    expect(item).toBe(undefined);
  });
});

describe("ro.unshift", () => {
  it("should return new array with value prepended", () => {
    const x = [1, 2, 3];
    const ret = unshift(x, 4);
    expect(ret).not.toBe(x);
    expect(ret).toEqual([4, 1, 2, 3]);
  });

  it("should prepend all values passed", () => {
    const x = [1, 2, 3];
    const ret = unshift(x, 4, 5, 6);
    expect(ret).not.toBe(x);
    expect(ret).toEqual([4, 5, 6, 1, 2, 3]);
  });

  it("should return same array if no values passed", () => {
    const x = [1, 2, 3];
    expect(unshift(x)).toBe(x);
  });
});

describe("ro.shift", () => {
  it("should return tuple with first item and new array of remaining", () => {
    const x = [1, 2, 3];
    const [item, remaining] = shift(x);
    expect(remaining).not.toBe(x);
    expect(item).toBe(1);
    expect(remaining).toEqual([2, 3]);
  });

  it("should return undefined and input array if empty", () => {
    const x = [];
    const [item, remaining] = shift(x);
    expect(remaining).toBe(x);
    expect(item).toBe(undefined);
  });
});

/** @todo add tests for ro.splice */
/** @todo add tests for ro.sort */
/** @todo add tests for ro.flat */
/** @todo add tests for ro.concat */
