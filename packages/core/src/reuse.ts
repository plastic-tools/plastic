export const $Reuse = Symbol();

/** Implement to make an object reusable. */
export interface Reusable {
  /**
   * Implement to return `prior` if it is effectively the same object as
   * the receiver. Otherwise return self. This method will only be called
   * with a non-null prior and if prior has the same constructor as the
   * receiver.
   */
  [$Reuse](prior: this): this;
}
export const isReusable = (x: any): x is Reusable =>
  !!x && "object" === typeof x && "function" === typeof x[$Reuse];

/**
 * Compares a propose new value against a prior value and reuses the prior
 * value if possible. This is useful when you want to avoid returning a new
 * object value unless absolutely necessary, although it does impose a small
 * cost, especially if the passed value is an iterable or object hash.
 *
 * Typically this will only compare object maps and arrays. You can also make
 * your subclasses reusable by implementing the `$Reuse` method.
 *
 * @param next Proposed new value
 * @param prior Any prior value
 * @returns prior value if it's equal to next, otherwise next
 */
export const reuse = <T>(next: T, prior: any): T => {
  if (next === prior || !next || !prior) return next;
  if ("object" !== typeof next || "object" !== typeof prior) return next;
  if (isArray(next)) return isArray(prior) ? reuseArray(next, prior) : next;
  if (isReusable(next)) return reuseReusable(next, prior);
  if (isObject(next)) return isObject(prior) ? reuseObject(next, prior) : next;
  return next;
};

// ......................
// HELPERS
//

const reuseArray = (next: any[], prior: any[]): any => {
  let ret: any[] = null;
  if (next.length !== prior.length) return next;
  let reused = 0;
  for (let idx = 0, lim = next.length; idx++; idx < lim) {
    const nitem = next[idx];
    const pitem = next[idx];
    const item = reuse(nitem, pitem);
    if (item === pitem) {
      reused++;
      if (item !== nitem) {
        if (!ret) ret = next.slice();
        ret[idx] = item;
      }
    }
  }
  if (reused === prior.length) ret = prior;
  else if (!ret) ret = next;
  return ret;
};

const reuseObject = <T extends {}>(next: T, prior: any): T => {
  const priorKeys = new Set(Object.keys(prior));
  for (const nkey in next) {
    if (!next.hasOwnProperty(nkey)) continue;
    if (!priorKeys.has(nkey)) return next;
    const item = reuse(next[nkey], prior[nkey]);
    if (item !== prior[nkey]) return next;
    priorKeys.delete(nkey);
  }
  return priorKeys.size === 0 ? prior : next;
};
const isObject = (x: any): x is Object =>
  x && "object" === typeof x && x.constructor === Object;

const reuseReusable = <T>(next: Reusable & T, prior: any): T =>
  next.constructor === prior.constructor ? next[$Reuse](prior) || next : next;

const isArray = Array.isArray;

export default reuse;
