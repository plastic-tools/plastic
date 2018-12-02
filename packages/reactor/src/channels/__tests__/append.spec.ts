import { chan } from "../../core";
import { append } from "../append";

describe(append, () => {
  it("should collect values from input channel", async () => {
    const ch = append(chan([1, 2, 3]));
    const received = [];
    for await (const next of ch) received.push(next);
    expect(received).toEqual([[1], [1, 2], [1, 2, 3]]);
  });
});
