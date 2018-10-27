import memo from "../memo";
import Manager from "./manager";
import { ComputeFn, Reactable, Tag, TrackedValue, UpdateFn } from "./types";

export type UnsubscribeFn = () => void;

interface ReactorFn {
  <T, O extends object>(
    input: ComputeFn<T, [O]>,
    update?: UpdateFn<T, O>,
    target?: O
  ): Reaction;

  /**
   * Reactor manager used by this method. You shouldn't need to access this
   * except for testing.
   */
  manager: Manager;

  /** Current tag representing top of state */
  readonly top: Tag;

  /** Retrieves a value for a tracked property key */
  get<T>(key: PropertyKey, target?: object, initialValue?: T): T;

  /** Sets a value for a tracked property key */
  set<T>(key: PropertyKey, v: T, target?: object): void;

  /**
   * Returns the value of the computed function, recalculating only if
   * necessary.
   */
  compute<T, A extends any[]>(fn: ComputeFn<T, A>, ...args: A): T;

  /**
   * When implementing you own tagged value, call this method when the value is
   * accessed. When called while capturing, this will create a dependency on
   * your value.
   *
   * @param value the tagged value that was accessed
   */
  accessed(value: TrackedValue): void;

  /**
   * When implementing your own tagged value, call this method just after you
   * modify the state of the value. The returned Tag can be stored as the new
   * return value for your `$Tag` function. This will automatically schedule a
   * sync of all reactors at the end of the current tast.
   *
   * @param value tagged value that changed
   * @returns new tag value
   */
  changed(value: TrackedValue): Tag;

  /** Registers a reactable so that it will refresh automatically */
  register(reactable: Reactable): void;

  /** Unregisters a reactable */
  unregister(reactable: Reactable): void;

  /** Returns true if the tagged value appears to be up to date */
  validate(val: TrackedValue, changes?: Set<TrackedValue>): boolean;

  /** Used by computed functions to capture dependencies */
  capture<T, A extends any[]>(
    fn: ComputeFn<T, A>,
    prior?: T,
    args?: A
  ): [T, Set<TrackedValue>];

  /** Used by computed functions to record dependencies */
  setDependencies(val: TrackedValue, deps: Set<TrackedValue>): void;

  /** Used by computed functions to retrieve dependencies */
  getDependencies(val: TrackedValue, expand?: boolean): Set<TrackedValue>;
}

const makeReaction_ = (i, u, t) => new Reaction(i, u, t);
const makeValue_ = (k, t) => new Value();

export const reactor = ((input, update?, target?) => {
  const reaction = memo(makeReaction_, input, update, target);
  reactor.manager.register(reaction);
  return reaction;
}) as ReactorFn;

reactor.manager = new Manager();

reactor.accessed = (value: TrackedValue) => reactor.manager.accessed(value);
reactor.changed = (value: TrackedValue) => reactor.manager.changed(value);
reactor.register = reactable => reactor.manager.register(reactable);
reactor.unregister = reactable => reactor.manager.unregister(reactable);
reactor.validate = (val, changes?) => reactor.manager.validate(val, changes);
reactor.capture = (fn, prior?, args?) =>
  reactor.manager.capture(fn, prior, args);
reactor.setDependencies = (val, deps) =>
  reactor.manager.setDependencies(val, deps);
reactor.getDependencies = (val, expand = false) =>
  reactor.manager.getDependencies(val, expand);

reactor.compute = (fn, ...args) => ComputedValue.get(fn, ...args).get();

reactor.get = (key, target?, initialValue?) =>
  memo(makeValue_, key, target).get(initialValue);
reactor.set = (key, v, target?) => memo(makeValue_, key, target).set(v);

Object.defineProperty(reactor, "top", {
  get() {
    return this.manager.top;
  }
});

export default reactor;

import ComputedValue from "./computed-value";
import Reaction from "./reaction";
import Value from "./value";
