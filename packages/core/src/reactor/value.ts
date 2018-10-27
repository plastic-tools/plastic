import reactor from "./reactor";
import { $Tag, Tag, TrackedValue } from "./types";

/**
 * A Value is a simple static value that can be updated with a 'set', causing
 * any dependent objects to recompute based upon it.
 */
export class Value<T = any> implements TrackedValue {
  protected changed = Tag.NEVER;

  constructor(protected value?: T) {}

  get(initialValue?: T) {
    reactor.accessed(this);
    const ret = this.value;
    return ret === undefined && this.changed === Tag.NEVER ? initialValue : ret;
  }

  set(value: T) {
    this.value = value;
    this.changed = reactor.changed(this);
  }

  [$Tag]() {
    return this.changed;
  }
}

export default Value;
