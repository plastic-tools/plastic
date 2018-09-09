import { PropertyValue } from "./types";

const $Properties = Symbol();
const $Owner = Symbol();

export interface PropertyValues {
  [key: string]: PropertyValue;
  [$Owner]?: Object;
}
const EMPTY_PROPERTY_VALUES = {};
function getPropertyValues(target: Object, writable = true) {
  const pvals: PropertyValues = target[$Properties];
  return pvals && target === pvals[$Owner]
    ? pvals
    : writable
      ? (target[$Properties] = { [$Owner]: target })
      : EMPTY_PROPERTY_VALUES;
}

export function getPropertyValue(target: Object, key: string): PropertyValue {
  if (!target || target === Object.prototype) return null;
  let pval = getPropertyValues(target, false)[key];
  if (!pval) {
    pval = getPropertyValue(Object.getPrototypeOf(target), key);
    if (pval) pval = setPropertyValue(target, key, pval.clone());
  }
  return pval;
}

export function setPropertyValue(
  target: Object,
  key: string,
  pval: PropertyValue
) {
  getPropertyValues(target, true)[key] = pval;
  return pval;
}
