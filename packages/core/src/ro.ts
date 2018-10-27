import reuse from "./reuse";

/**
 * @module ro
 *
 * immutable library, relies on TypeScript static typing where possible to
 * eliminate runtime costs.
 */

/**
 * Returns a readonly-only typed version of the same value
 * @param x any value
 * @returns readonly-typed version of value
 */
export function ro<T>(x: T[]): ReadonlyArray<T>;
export function ro<T extends object>(x: T): Readonly<T>;
export function ro<T>(x: T): T;
export function ro(x) {
  return x;
}

/**
 * Returns a new array with value added to end
 * @param ary input array
 * @param vals one more more values to add
 */
export const push = <T>(ary: T[], ...vals: T[]): ReadonlyArray<T> =>
  vals.length === 0 ? ary : [...ary, ...vals];

/**
 * Returns tuple with last item and new array with remaining items
 * @param ary input array
 */
export const pop = <T>(ary: T[]): [T | undefined, ReadonlyArray<T>] => {
  return ary.length === 0
    ? [undefined, ary]
    : [ary[ary.length - 1], ary.slice(0, -1)];
};

/**
 * Returns a new array with value added to the start
 * @param ary input array
 * @param vals values to add
 */
export const unshift = <T>(ary: T[], ...vals: T[]): ReadonlyArray<T> =>
  vals.length === 0 ? ary : [...vals, ...ary];

/**
 * Returns tuple with first item in array and new array with remaining items
 * @param ary input array
 */
export const shift = <T>(ary: T[]): [T | undefined, ReadonlyArray<T>] => {
  return ary.length === 0 ? [undefined, ary] : [ary[0], ary.slice(1)];
};

/**
 * Returns a new array with items spliced into the array.
 * @param ary input array
 * @param start starting index for splice
 * @param deleteCount number of items to remove
 * @param items (Optional) items to insert
 */
export const splice = <T>(
  ary: T[],
  start: number,
  deleteCount: number,
  ...items: T[]
): ReadonlyArray<T> =>
  deleteCount === 0 && items.length === 0
    ? ary
    : ary.slice().splice(start, deleteCount, ...items);

/**
 * Returns a new instance of the array, sorted. Returns same array instance if
 * sort did not change array.
 *
 * @param ary input array
 * @param fn (Optional) comparison function
 */
export const sort = <T>(
  ary: T[],
  fn?: (a: T, b: T) => number
): ReadonlyArray<T> => reuse(ary, ary.slice().sort(fn));

const flatMut = <T>(input: T[], ary: T[], depth: number) => {
  for (const item of ary) {
    if (item === null || item === undefined) continue;
    if (depth > 1 && Array.isArray(item)) flatMut(input, item, depth - 1);
    else input.push(item);
  }
  return input;
};

/**
 * Returns a new array with any nested array (up to `depth`) flattened any
 * any null or undefined slots removed.  Defaults to a depth of 1, which is
 * non-recursive, essentially acting only to remove empty values.
 *
 * @param ary input array
 * @param depth (Optional) maximum depth or true for unlimited
 */
export const flat = <T>(
  ary: T[],
  depth: number | boolean = 1
): ReadonlyArray<T> =>
  flatMut(
    [],
    ary,
    "number" === typeof depth ? depth : depth ? Number.MAX_SAFE_INTEGER : 1
  );

/**
 * Returns a new array that merges the contents of all the input arrays.
 * @param ary input array
 * @param extra additional arrays to merge
 */
export const concat = <T>(ary: T[], ...extra: T[][]): ReadonlyArray<T> =>
  ary.concat(...extra);

/**
 * Exports all utilities as a single function. Reimplemented so that it can
 * be removed if you never import this way.
 */
export function ro_api<T>(x: T[]): ReadonlyArray<T>;
export function ro_api<T extends object>(x: T): Readonly<T>;
export function ro_api<T>(x: T): T;
export function ro_api(x) {
  return x;
}
ro_api.push = push;
ro_api.pop = pop;
ro_api.unshift = unshift;
ro_api.shift = shift;
ro_api.splice = splice;
ro_api.sort = sort;
ro_api.flat = flat;
ro_api.concat = concat;

export default ro_api;
