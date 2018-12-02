import chan from "../chan";
import { Channel } from "../types";

describe(chan, () => {
  // allows you to use this to ensure the channel is a valid source for
  // iteration.
  it("should return empty for invalid source", () => {
    const read = async (ch: Channel) => {
      for await (const _ of ch) {
        throw new Error(`channel should be empty`);
      }
      return true;
    };

    // Cast to any because chan will type guard against knowningly bad types
    expect(read(chan(1 as any))).resolves.toBe(true);
    expect(read(chan(true as any))).resolves.toBe(true);
    expect(read(chan({ foo: "foo" } as any))).resolves.toBe(true);
    expect(read(chan((() => []) as any))).resolves.toBe(true);
  });
});
