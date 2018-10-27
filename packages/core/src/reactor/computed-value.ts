import memo from "../memo";
import reuse from "../reuse";
import reactor from "./reactor";
import { $Tag, ComputeFn, Tag, TrackedValue } from "./types";

const make_ = <T, A extends any[]>(fn: ComputeFn<T, A>, ...args: A) =>
  new ComputedValue(fn, args) as ComputedValue<T, A>;

export class ComputedValue<T = any, A extends any[] = any[]>
  implements TrackedValue {
  /**
   * Returns a cached instance of the computed value for a given function
   * and argument combination
   */
  static get<T, A extends any[]>(fn: ComputeFn<T, A>, ...args: A) {
    return memo(make_, fn, ...args) as ComputedValue<T, A>;
  }

  /** Last computed value */
  private value_: T;

  /** Tag when the value was last known valid */
  private validated_ = Tag.NEVER;

  /** Tag when the value was last computed */
  private computed_ = Tag.NEVER;

  constructor(readonly fn: ComputeFn<T, A>, readonly args: A) {}

  /** Gets the current value, computing if necessary */
  get(): T {
    reactor.accessed(this);
    if (!reactor.validate(this)) this.recompute();
    return this.value_;
  }

  recompute() {
    const prior = this.value_;
    // tslint:disable-next-line prefer-const
    const [value, deps] = reactor.manager.capture(this.fn, prior, this.args);
    const next = reuse(value, prior);
    if (next !== prior) {
      this.computed_ = reactor.changed(this);
      // never recompute if we don't have any dependencies
      if (deps && deps.size === 0) this.computed_ = Tag.CONSTANT;
      this.validated_ = reactor.top;
      this.value_ = next;
      reactor.setDependencies(this, deps);
    }
  }

  invalidate() {
    this.computed_ = this.validated_ = Tag.NEVER;
  }

  [$Tag](asOf: Tag, changes: Set<TrackedValue>) {
    const { validated_, computed_ } = this;
    const top = reactor.top;
    if (validated_ >= top) return validated_;
    let valid = computed_ === Tag.CONSTANT;

    // potentially still valid if it hasn't changed since the last flush
    // still valid if dependencies are known and all dependencies are valid
    // note that intitiale state of changed is NEVER which is always > flushed
    if (!valid && computed_ <= asOf) {
      const deps = reactor.getDependencies(this);
      if (deps) {
        valid = true;
        for (const dep of deps) {
          if (changes && !changes.has(dep)) continue;
          valid = reactor.validate(dep, changes);
          if (!valid) break;
        }
      }
    }
    return (this.validated_ = valid ? top : Tag.NEVER);
  }
}

export default ComputedValue;
