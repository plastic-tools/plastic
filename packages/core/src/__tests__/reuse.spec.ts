import reuse, { $Reuse } from "../reuse";

describe("reuse()", () => {
  describe("object", () => {
    it("should return same property values are all identical", () => {
      const prior = { foo: 1, bar: "bar" };
      const next = { ...prior };
      expect(prior).not.toBe(next);
      expect(reuse(next, prior)).toBe(prior);
    });

    it("should return if nested values match", () => {
      const prior = { foo: "foo", bar: { baz: "baz" } };
      const next = { foo: "foo", bar: { baz: "baz" } };
      expect(reuse(next, prior)).toBe(prior);
    });

    it("should return next if items differ", () => {
      const prior = { foo: "foo", bar: { baz: "baz" } };
      const next = { ...prior, foo: "not-foot" };
      expect(reuse(next, prior)).toBe(next);
    });
  });

  describe("array", () => {
    it("should return prior if items are same", () => {
      const prior = ["foo", 1, { baz: "baz" }];
      const next = [...prior];
      expect(prior).not.toBe(next);
      expect(reuse(next, prior)).toBe(prior);
    });

    it("should return prior if nested are the same", () => {
      const prior = ["foo", 1, { baz: "baz" }];
      const next = ["foo", 1, { baz: "baz" }];
      expect(prior).not.toBe(next);
      expect(reuse(next, prior)).toBe(prior);
    });

    it("should return next if item is different", () => {
      const prior = ["foo", 1, { baz: "baz" }];
      const next = ["bar", 1, { baz: "baz" }];
      expect(prior).not.toBe(next);
      expect(reuse(next, prior)).toBe(next);
    });

    it("should handle recursion", () => {
      const prior = ["foo", {}];
      (prior[1] as any).foo = prior;
      const next = ["foo", {}];
      (next[1] as any).foo = next;
      expect(reuse(next, prior)).toBe(prior);
    });
  });

  describe("class", () => {
    class ReusableFoo {
      constructor(readonly state: string) {}
      [$Reuse](prior: ReusableFoo) {
        return prior.state === this.state;
      }
    }

    it("should return next if class does not implement reusable", () => {
      // tslint:disable max-classes-per-file
      class Foo {}
      const prior = new Foo();
      const next = new Foo();
      expect(reuse(next, prior)).toBe(next);
    });

    it("should return prior if implements reusable and true", () => {
      const prior = new ReusableFoo("foo");
      const next = new ReusableFoo("foo");
      expect(reuse(next, prior)).toBe(prior);
    });
    it("should return prior if implements reuseable and false", () => {
      const prior = new ReusableFoo("foo");
      const next = new ReusableFoo("bar");
      expect(reuse(next, prior)).toBe(next);
    });
  });

  describe("no prior value", () => {
    class Foo {}
    const values = [{}, [], new Foo(), 0, NaN, "", false, null];
    for (const prior of [null, undefined]) {
      it(`should return new value if prior was ${prior}`, () => {
        for (const x of values) expect(reuse(x, prior)).toBe(x);
      });
    }
  });

  it("should return same primitive value", () => {
    const values = [1, "foo", true, false, "", 0];
    for (const x of values) expect(reuse(x, x)).toBe(x);
  });
});
