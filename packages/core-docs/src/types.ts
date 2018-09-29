import { TrackedValue, Revision, AnyJSON } from "@plastic/core";

/**
 * This should be the returned value when the value has not yet loaded
 * from the server. It will generally cascade, causing other not-ready
 * properties not to compute.
 */
export const NOT_READY = Symbol();
export type NOT_READY = typeof NOT_READY;

export type UUID = string;

/**
 * Any value in the system. `get()` will return the value. Subclasses
 * can extend `get()` to require a parameter such as a key or index.
 *
 * Example, a computed function would return its value from get.
 *
 * A value that defines a function would actually return the function so
 * that you can plug in new values.
 *
 * Importantly, computing a value should never have any side-effects.
 *
 */
export interface Value<T = any> extends TrackedValue, ContainerNode {
  /** Unique identifier for this value */
  id: UUID;

  get(): T | NOT_READY;
}

/**
 * An action that can mutate the state of the document. The implementation
 * of this is imperative. For example, it could be a command that sets
 * another value or something.
 *
 * this is a tracked value only to reflect if the underyling action changes.
 * you generally can't access the contents directly. (or you shouldn't).
 */
export interface Action extends TrackedValue, ContainerNode {
  /** Unique identifier for this action */
  id: UUID;

  /**
   * Invokes the action. The returned promise resolves when the action has
   * completed executing.
   */
  invoke(): Promise<void>;
}

export interface Container extends ContainerNode {
  /**
   * Gets a named node in the container. Goes up the container hierarchy
   * looking for the name if not found locally unless you set `localOnly` to
   * true.
   */
  get(name: string, localOnly?: boolean): ContainerNode;

  /**
   * Sets the named node in the container. This will now be available to other
   * nodes directly or indirectly in this container.
   *
   * Note that you can set the same node in multiple containers as long as
   * they all belong to the same root container.
   *
   * @param name
   * @param node
   */
  set(name: string, node: ContainerNode); // sets a node in the container
}

/** A top-level container that holds some shared context. */
export interface RootContainer extends Container {
  /**
   * obtains a container node from a remote container. The node must be
   * exported
   */
  import(remoteContainerId, name: string): ContainerNode;

  /**
   * Makes the passed container node available to other containers under
   * the specified name.
   */
  export(name: string, node: ContainerNode): Promise<void>;
}

export interface ContainerNode extends TrackedValue {
  /**
   * The root container that holds this value. You must import a value
   * from another container.
   */
  readonly root: RootContainer;

  /** Unique ID for this instance. This may be created on demand if needed */
  readonly id: UUID;

  /** Returns the JSON data that can be saved for this node */
  toJSON(): AnyJSON;

  /** Returns a type that will be used to restore the node */
  readonly type: string;
}
