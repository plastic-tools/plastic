import { isComparable } from "@plastic/reactor/src/types";

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

const isArray = Array.isArray;

const reuse = <T>(next: T, prior: any): T => {
  if (next === prior || !next || !prior) return next;
  if ("object" !== typeof next || "object" !== typeof prior) return next;
  if (isArray(next)) return isArray(prior) ? reuseArray(next, prior) : next;
  if (isComparable(next)) return next.isEqual(prior) ? prior : next;
  if (isObject(next)) return isObject(prior) ? reuseObject(next, prior) : next;
  return next;
};

export default reuse;
