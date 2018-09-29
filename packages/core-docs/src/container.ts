import { TrackedValue } from "@plastic/core";

import * as styles from "./hello-world.css";

const buttonStyle = styles.button;
console.log(buttonStyle);

// import { keys } from "ts-transformer-keys";

// interface Props {
//   id: string;
//   name: string;
//   age: number;
// }
// const keysOfProps = keys<Props>();

// console.log(keysOfProps); // ['id', 'name', 'age']

/**
 * A Container holds/computes a set of tracked values. a value can live
 * inside of a container and therefore will have access to the values
 * within it.
 */
export interface Container {
  /** host visible to other objects that owns this container */
  readonly host: ContainerHost;

  /** Set a tracked value on the container. */
  set(name: string, value: TrackedValue);

  /** Gets a tracked value on the container */
  get(name: string): TrackedValue;

  /**
   * Exports the named value. If you pass null, unexports. If you pass
   * another name, exports that name. otherwise assumes the name you pass.
   */
  export(name: string, from?: string | null): void;
}

const $Container = Symbol();

/**
 * A ContainerHost wraps a container. You can't access the container directly,
 * only its exposed values.
 */
export interface ContainerHost {
  // Internal; points to the container itself
  [$Container]: Container;

  /** Returns the tracked value */
  import(name: string): TrackedValue;
}
