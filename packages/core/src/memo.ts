const $Memos = Symbol();
const $Weak = Symbol();
const $Value = Symbol();

type MemoMap = Map<any, any>;

const needsWeakMap = (x: any) =>
  !!x && ("object" === typeof x || "function" === typeof x);

const getMemos = (fn: () => void): MemoMap =>
  fn[$Memos] || (fn[$Memos] = new Map());

const walk = (memos: MemoMap, args: any[], createIfNeeded = true, idx = 0) => {
  if (idx >= args.length) return memos;
  const key = args[idx];
  if (needsWeakMap(key)) {
    if (!memos.has($Weak)) memos.set($Weak, new WeakMap());
    memos = memos.get($Weak);
  }
  if (!memos.has(key)) {
    if (!createIfNeeded) return null;
    else memos.set(key, new Map());
  }
  return walk(memos.get(key), args, createIfNeeded, idx + 1);
};

/**
 * Computes and then caches the passed function with the associated arguments.
 * Note that for this to work, you must passed the same function instance.
 *
 * @param fn function to memoize
 * @param args arguments to pass to function
 */
const memo = <T, A extends any[]>(fn: (...args: A) => T, ...args: A): T => {
  const memos = walk(getMemos(fn), args);
  if (!memos.has($Value)) memos.set($Value, fn.apply(null, args));
  return memos.get($Value);
};

/**
 * Clears any memoized values for the passed function.
 *
 * @param fn function passed to `memo()`
 */
memo.clear = (fn: (...args: any[]) => any) => {
  delete fn[$Memos];
};

/**
 * Returns true if a memoized result is stored for the passed function and
 * arguments.
 *
 * @param fn function to test
 * @param args arguments to scope test
 * @returns true if function and arguments are memoized
 *
 */
memo.has = <A extends any[]>(fn: (...A) => any, ...args: A): boolean => {
  const memos = walk(getMemos(fn), args, false);
  return !!memos && memos.has($Value);
};

export default memo;
