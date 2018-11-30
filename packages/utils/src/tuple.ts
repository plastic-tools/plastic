/**
 * Returns a tuple of the input arguments. Useful when you want to construct
 * a tuple without having to declare a type ahead of time.
 *
 * Normally if you declare a constant in TypeScript like `[12,'']` it will
 *
 * @param values input values of the tuple
 * @returns tuple of values
 */
export const tuple = <T extends any[]>(...values: T): T => values;
export default tuple;
