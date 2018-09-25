import defer from "../defer";

describe("defer()", () => {
  it("should defer until end of current task", done => {
    const fn = jest.fn();
    defer(fn);
    expect(fn.mock.calls.length).toBe(0);
    setTimeout(() => {
      expect(fn.mock.calls.length).toBe(1);
      done();
    }, 1);
  });

  it("should only run once when scheduled", done => {
    const fn = jest.fn();
    defer(fn);
    defer(fn);
    setTimeout(() => {
      expect(fn.mock.calls.length).toBe(1);
      done();
    }, 1);
  });

  it("should run again when rescheduled", done => {
    const fn = jest.fn();
    defer(fn);
    setTimeout(() => {
      expect(fn.mock.calls.length).toBe(1);
      defer(fn);
      setTimeout(() => {
        expect(fn.mock.calls.length).toBe(2);
        done();
      }, 1);
    }, 1);
  });
});

describe("defer.cancel", () => {
  it("should cancel a scheduled function", done => {
    const fn = jest.fn();
    defer(fn);
    expect(fn.mock.calls.length).toBe(0);
    defer.cancel(fn);
    setTimeout(() => {
      expect(fn.mock.calls.length).toBe(0);
      done();
    }, 1);
  });

  it("should do nothing of fn not scheduled", () => {
    const fn = jest.fn();
    expect(() => {
      defer.cancel(fn);
    }).not.toThrow();
  });
});

describe("defer.scheduled", () => {
  it("should return true if scheduled", () => {
    const fn = jest.fn();
    expect(defer.scheduled(fn)).toBeFalsy();
    defer(fn);
    expect(defer.scheduled(fn)).toBeTruthy();
  });
});
