import { Ref, DangerouslySetInnerHTML } from "@plastic/render/types";
import { EventHandler } from "@plastic/render/dom/types";
import { applyRef } from "../ref";
import { isNil } from "@plastic/runtime";

export const updateAttributes = (node: Node, next: {}, svg: boolean) => {
  const prior = getPriorAttributes(node);
  function pvalue(name: string, node: Node, prior: {}) {
    return name === "value" || name === "checked" ? node[name] : prior[name];
  }

  // remove attributes no longer present
  for (const name in prior) {
    if (isNil(next[name]) && !isNil(prior[name])) {
      this.setAttribute(node, name, null, prior[name]);
      delete prior[name];
    }
  }

  // add new and updates
  for (const name in next) {
    if (name === "children" || name === "innerHTML") continue;
    if (name in prior && next[name] === pvalue(name, node, prior)) continue;
    setAttribute(node, name, next[name], prior[name], svg);
    prior[name] = next[name];
  }
};

export const setAttribute = (
  node: Node,
  name: string,
  next: any,
  prior: any,
  svg: boolean
) => {
  const el = node instanceof HTMLElement && node;
  if (SPECIAL_CASES[name]) return SPECIAL_CASES[name](el, name, next, prior);
  if (IS_EVENT.test(name)) return setEvent(node, name, next, prior);

  if (name !== "list" && name !== "type" && !svg && name in el) {
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

// ......................
// HELPERS
//

const XLINK_URI = "http://www.w3.org/1999/xlink";

/** DOM properties that should NOT have "px" added when numeric */
const IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|ows|mnc|ntw|ine[ch]|zoo|^ord/i;
const IS_EVENT = /^on/;
const CAPTURE_REGEX = /Capture$/;
const XLINK_REGEX = /^xlink:?/;

const $PriorAttributes = Symbol();
const getPriorAttributes = (node: Node) => {
  let ret = node[$PriorAttributes];
  if (!ret) {
    ret = node[$PriorAttributes] = {};
    const attributes = (node as Element).attributes || [];
    for (const attr of attributes) ret[attr.name] = attr.value;
  }
  return ret;
};

const shouldUnset = (name: string | number, value: any) =>
  (null === value || undefined === value || false === value) &&
  name !== "spellcheck";

// Special cases
const SPECIAL_CASES: {
  [name: string]: (
    el: HTMLElement,
    name: string,
    next: any,
    prior: any
  ) => void;
} = {
  key() {},
  ref(node: Node, _: string, next: Ref<Node>, prior: Ref<Node>) {
    applyRef(prior, null);
    applyRef(next, node);
  },
  className(el: HTMLElement, _: string, next: string) {
    if (el) el.className = next || "";
  },
  style(
    el: HTMLElement,
    _: string,
    next: string | object,
    prior: string | object
  ) {
    if (!el) return;
    if (!next || "string" === typeof next || "string" === typeof prior) {
      el.style.cssText = "string" === typeof next ? next : "";
    }
    if (next && "object" === typeof next) {
      if (prior && "object" === typeof prior)
        for (const key in prior) {
          if (!prior.hasOwnProperty(key)) continue;
          if (!(key in next)) el.style[key as string] = "";
        }
      for (const key in next) {
        if (!next.hasOwnProperty(key)) continue;
        const value = next[key];
        el.style[key as string] =
          "number" === typeof value
            ? IS_NON_DIMENSIONAL.test(key)
              ? value
              : `${value}px`
            : value;
      }
    }
  },
  dangerouslySetInnerHTML(
    el: HTMLElement,
    _: string,
    next: DangerouslySetInnerHTML
  ) {
    if (next && "object" == typeof next) el.innerHTML = next.__html || "";
  }
};
SPECIAL_CASES["class"] = SPECIAL_CASES.className;

// @todo use responder / add event delegation
const setEvent = (
  node: Node,
  name: string,
  next: EventHandler<any>,
  prior: EventHandler<any>
) => {
  const useCapture = name !== (name = name.replace(CAPTURE_REGEX, ""));
  name = name.toLowerCase().substring(2);
  if (next) {
    if (!prior) node.addEventListener(name, eventProxy, useCapture);
  } else {
    node.removeEventListener(name, eventProxy, useCapture);
  }
  ((node as any)._listeners || ((node as any)._listeners = {}))[name] = next;
};

function eventProxy(e: Event) {
  return this._listeners[e.type](e);
}

export default setAttribute;
