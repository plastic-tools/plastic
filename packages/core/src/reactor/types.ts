/** The state of a value. Used to computed changes. */
export type Tag = number;
export const Tag = {
  /** Indicates the value state will never change  */
  CONSTANT: Number.MAX_SAFE_INTEGER as Tag,
  /** Indicates the state has never been validated */
  NEVER: 0 as Tag,
  UNKNOWN: -1 as Tag,
  INITIAL: 1 as Tag
};

export const $Tag = Symbol();
export interface TrackedValue {
  [$Tag](asOf: Tag, changes: Set<TrackedValue> | null): Tag;
}

export interface Reactable extends TrackedValue {
  // Called when we detect the reaction has become invalid
  trigger(): void;
}

export interface ComputeFn<T = any, A extends any[] = any[]> {
  (prior: T, ...args: A): T;
  displayName?: string;
}

export type UpdateFn<T = any, O extends object = object> = (
  v: T,
  prior: T,
  target: O
) => void;
