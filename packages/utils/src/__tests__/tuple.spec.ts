import tuple from "../tuple";

// tuple is primarily intended to properly typecast.
// test typecasting by assigning so IDE can complain
describe(tuple, () => {
  it("should arguments as array", () => {
    const t1: [number] = tuple(42);
    expect(t1).toEqual([42]);

    const t2: [number, string, boolean] = tuple(42, "foo", true);
    expect(t2).toEqual([42, "foo", true]);

    const array = [42, "foo"];
    const t3: [Array<number | string>] = tuple(array);
    expect(t3).toEqual([array]);

    const t4: [[number], [number, string, boolean]] = tuple(t1, t2);
    expect(t4).toEqual([t1, t2]);
  });
});
