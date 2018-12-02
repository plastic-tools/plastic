import { sleep } from "@plastic/utils";
import debounce from "../debounce";

describe(debounce, () => {
  it("should emit each value once per turn", async () => {
    async function* numbers() {
      yield 0;
      yield 1;
      yield 0;
      yield 2;
      await sleep(1);
      yield 0;
      yield 2;
      yield 3;
    }
    const ch = debounce(numbers());
    const received: number[] = [];
    for await (const next of ch) received.push(next);
    expect(received).toEqual([0, 1, 2, 0, 2, 3]);
  });
});
