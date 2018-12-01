import { filter } from "../../channels";

describe(filter, () => {
  it("should remove filtered values", async () => {
    async function* numbers() {
      let cnt = 10;
      while (--cnt >= 0) yield cnt;
    }
    const ch = filter(n => n % 2 === 0, numbers());
    const received: number[] = [];
    for await (const next of ch) received.push(next);
    expect(received).toEqual([8, 6, 4, 2, 0]);
  });
});
