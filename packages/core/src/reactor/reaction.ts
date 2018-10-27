import ComputedValue from "./computed-value";
import { ComputeFn, Reactable, UpdateFn } from "./types";

/**
 * Builds on the basic computed value to also execute a side effect and add
 * support for a proactive response.
 */
export class Reaction<T = any, O extends object = object>
  extends ComputedValue<T, [O]>
  implements Reactable {
  private prior_: T;
  private triggered_ = false;

  constructor(
    input: ComputeFn<T, [O]>,
    readonly update?: UpdateFn<T, O>,
    readonly target?: O
  ) {
    super(input, [target]);
  }

  trigger() {
    const { prior_, triggered_ } = this;
    const value = this.get();
    if (!triggered_ || value !== prior_) {
      this.triggered_ = true;
      this.prior_ = value;
      if (this.update) this.update(value, prior_, this.target);
    }
  }
}

export default Reaction;
