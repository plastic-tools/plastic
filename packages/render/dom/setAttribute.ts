import { Ref } from "@plastic/render/types";

/**
 * @module dom
 *
 * Utilities for accessing DOM.
 */

const XLINK_URI = "http://www.w3.org/1999/xlink";
/** DOM properties that should NOT have "px" added when numeric */
const IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|ows|mnc|ntw|ine[ch]|zoo|^ord/i;
const IS_EVENT = /^on/;
const CAPTURE_REGEX = /Capture$/;
const XLINK_REGEX = /^xlink:?/;

export const applyRef = (ref: Ref<any>, node: Node) => {};

const shouldUnset = (name: string, value: any) =>
  (null === value || undefined === value || false === value) &&
  name !== "spellcheck";

export const setAttribute = (
  node: Node,
  name: string,
  next: any,
  prior: any,
  svg: boolean
) => {
  const el = node instanceof HTMLElement && node;
  if (name === "className") name = "class";
  if (name === "key") {
    // ignore
  } else if ("ref" === name) {
    applyRef(prior, null);
    applyRef(next, node);
  } else if ("class" === name && !svg) {
    if (el) el.className = next || "";
  } else if ("style" === name) {
    if (!next || "string" === typeof next || "string" === typeof prior) {
      el.style.cssText = next || "";
    }
    if (next && "object" === typeof next) {
      if ("string" !== typeof prior) {
        for (let key in prior) if (!(key in next)) el.style[key] = "";
      }
      for (let key in next) {
        const value = next[key];
        el.style[key] =
          "number" === typeof value && IS_NON_DIMENSIONAL.test(key) === false
            ? `${value}px`
            : value;
      }
    }
  } else if (name === "dangerouslySetInnerHTML") {
    if (next && "object" === typeof next) el.innerHTML = next.__html || "";
  } else if (IS_EVENT.test(name)) {
    const useCapture = name !== (name = name.replace(CAPTURE_REGEX, ""));
    name = name.toLowerCase().substring(2);
    if (next) {
      if (!prior) node.addEventListener(name, eventProxy, useCapture);
    } else {
      node.removeEventListener(name, eventProxy, useCapture);
    }
    ((node as any)._listeners || ((node as any)._listeners = {}))[name] = next;
  } else if (name !== "list" && name !== "type" && !svg && name in node) {
    // Attempt to set a DOM property to the given value.
    // IE && FF throw for certain property-value combinations.
    try {
      el[name] = null === next ? "" : next;
    } catch (e) {}
    if (shouldUnset(name, next)) el.removeAttribute(name);
  } else {
    let ns = svg && name !== (name = name.replace(XLINK_REGEX, ""));
    // spellcheck is treat differently than all other boolean values and
    // should not be removed when the value is `false`.
    if (shouldUnset(name, next)) {
      if (ns) el.removeAttributeNS(XLINK_URI, name.toLowerCase());
      else el.removeAttribute(name);
    } else if ("function" !== typeof next) {
      if (ns) el.setAttributeNS(XLINK_URI, name.toLowerCase(), next);
      else el.setAttribute(name, next);
    }
  }
};

function eventProxy(e: Event) {
  return this._listeners[e.type](e);
}

export default setAttribute;
