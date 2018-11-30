import { DeepReadonly } from "utility-types";
export { DeepReadonly };

/** Returns the same instance but marked as deep-readonly */
export const ro = <T>(x: T) => x as DeepReadonly<T>;

export default ro;
