const $value = Symbol();
const $weak = Symbol();

// these are what we can store in a weak map
const isObjectLike = (x: any) =>
  !!x && ("object" === typeof x || "function" === typeof x);

type MapNode = Map<any, any>;

class MultilevelWeakMap {
  readonly root: MapNode = new Map();

  /** Walks a graph of maps to return the map for the key path */
  walk(
    keys: any[],
    createIfNeeded: boolean,
    idx = 0,
    node = this.root
  ): MapNode | undefined {
    if (idx > keys.length) return node;
    const key = keys[idx];
    if (isObjectLike(key)) {
      node = node.get($weak) || node.set($weak, new WeakMap()).get($weak);
    }
    if (!node.has(key)) {
      if (createIfNeeded) node.set(key, new Map());
      else return undefined;
    }
    return this.walk(keys, createIfNeeded, idx + 1, node.get(key));
  }

  get(...keys: any[]): any | undefined {
    const node = this.walk(keys, false);
    return (node && node.get($value)) || undefined;
  }

  set(value: any, ...keys: any[]) {
    const node = this.walk(keys, true);
    if (node) node.set($value, value);
  }

  /** True if a value is stored for the key path */
  has(...keys: any[]) {
    const node = this.walk(keys, false);
    return !!node && node.has($value);
  }

  /** True if ANY values are stored under the key path */
  contains(...keys: any[]) {
    const node = this.walk(keys, false);
    if (!node) return false;
    if (node.size === 1 && node.has($weak)) return node.get($weak).size > 0;
    return node.size > 0;
  }

  /** Deletes the value for this key path only */
  delete(...keys: any[]): boolean {
    const node = this.walk(keys, false);
    return !!node && node.delete($value);
  }

  /** Deletes all values under the key path */
  clear(...keys: any[]): boolean {
    const node = this.walk(keys, false);
    const deleted = !!node && node.size > 0;
    if (node) node.clear();
    return deleted;
  }

  /** Gets the current value. If not set, calls function to set it */
  getset<T, A extends any[]>(
    fn: (...args: A) => T,
    args: A,
    thisArg: object | null,
    ...keys: any[]
  ): T {
    const node = this.walk(keys, true)!;
    if (!node.has($value)) node.set($value, fn.apply(thisArg, keys));
    return node.get($value);
  }
}

const cache = new MultilevelWeakMap();

type ReturnType<F> = F extends (...args: any[]) => infer R ? R : never;

/**
 * Computes and then caches the results of the passed function and associated
 * arugments. Note that for this to work, you must pass the same function
 * instance. Alternatively you can use `memo.of()` which will allow you to
 * provide a domain key.
 *
 * @param fn function to memoize
 * @param args arguments for function
 */
export const memo = <F extends (...args: A) => any, A extends any[]>(
  fn: F,
  ...args: A
) => memo.of(fn, fn, ...args);

/**
 * Returns a memoized result of computing the passed function, but stores the
 * result under the passed cache key instead of the function instance.
 * Useful when your function instance might change but you know the
 * implementatin will be the same.
 *
 * Calling with the same value for `key` and `fn` is the same as calling
 * `memo()`.
 *
 * @param key any value to used to store memoized values
 * @param fn function to memoize
 * @param args arguments for function
 * @returns memoized result
 */
memo.of = <F extends (...args: A) => any, A extends any[]>(
  key: any,
  fn: F,
  ...args: A
): ReturnType<F> => cache.getset(fn, args, null, key, ...args);

/**
 * Returns a memoizing version of the passed function, caching any returned
 * values automatically so that the function is only called once.
 *
 * The returned function instance is used as the cache key, so you can pass
 * it to other memo function to clear the cache, etc.
 *
 * @param fn function to wrap
 * @returns auto-memoizing version of the function
 */
memo.make = <F extends (...args: any[]) => any>(fn: F): F => {
  const ret = (...args: any[]) => memo.of(ret, fn, ...args);
  return ret as F;
};

/**
 * Clears any cached values for the passed function or key, for any different
 * arguments passed. If you call this with no function, all cached values will
 * be cleared.
 *
 * @param fn (Optional) function or key to clear
 * @return true if values were cleared
 */
memo.clear = (fn?: any) => cache.clear(fn);

/**
 * Deletes any cached value for the passed function or key for just the
 * arguments passed.
 *
 * @param fn function or key to clear
 * @param args additional arguments to check
 * @return true if values were cleared
 */
memo.delete = (fn: any, ...args: any[]) => cache.delete(fn, ...args);

/**
 * Returns true if there is a result stored for the passed function or key
 * and any arguments.
 *
 * @param fn function or key to check
 * @param args additional arguments to check
 */
memo.has = (fn: any, ...args: any[]) => cache.has(fn, ...args);

/**
 * Returns true if there are results cached for any arguments under the passed
 * function or key.
 *
 * @param fn function or key to check
 */
memo.contains = (fn: any) => cache.contains(fn);

export default memo;
