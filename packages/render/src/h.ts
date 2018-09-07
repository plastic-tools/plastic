import {
  VNode,
  Attributes,
  ComponentFactory,
  ComponentChild,
  ComponentChildren,
  isVNode
} from "./types";

type ComponentParams<P> = Attributes & P;
type SimpleParams = JSX.HTMLAttributes &
  JSX.SVGAttributes &
  Record<string, any>;

interface h {
  <P>(
    node: ComponentFactory<P>,
    params?: ComponentParams<P> | null,
    ...children: (ComponentChild | ComponentChildren)[]
  ): VNode;
  (
    node: string,
    params?: SimpleParams | null,
    ...children: (ComponentChild | ComponentChildren)[]
  ): VNode;

  /**
   * Attempts to reuse any of the structures from a prior VNode instance
   * so that you can easily diff using strict compare.
   */
  reuse(next: ComponentChild, prior: ComponentChild): ComponentChild;
}

const NO_CHILDREN: ComponentChild[] = [];
const stack: (ComponentChild | ComponentChildren)[] = [];

/**
 * A metal-friendly JSX/hyperscript reviver.
 *
 * This will keep a cache of previously returned VNodes, and attempt to return
 * the same instance
 */
const h = (<P>(
  nodeName: ComponentFactory<P> | string,
  params: ComponentParams<P> | SimpleParams | null,
  ...rest: (ComponentChild | ComponentChildren)[]
) => {
  // flatten children and merge simple strings when possible
  const maybeSimple = "function" !== typeof nodeName;

  for (let idx = rest.length; idx--; idx >= 0) stack.push(rest[idx]);
  if (params && params.children) {
    if (stack.length === 0) stack.push(params.children);
    delete params.children;
  }

  let children = NO_CHILDREN;
  let lastSimple = false;
  while (stack.length > 0) {
    let child = stack.pop();
    let simple = maybeSimple;

    if (null === child || undefined === child || "boolean" === typeof child)
      continue;
    if (Array.isArray(child)) {
      for (let idx = child.length; idx--; idx >= 0) stack.push(child[idx]);
      continue;
    }

    if (simple) {
      if ("number" === typeof child) child = String(child);
      else if ("string" !== typeof child) simple = false;
    }

    if (simple && lastSimple)
      (children[children.length - 1] as string) += child;
    else if (children === NO_CHILDREN) children = [child as any];
    else children.push(child as any);
    lastSimple = simple;
  }

  const node: VNode = {
    nodeName,
    attributes: params,
    children,
    key: params.key
  };
}) as h;

const reuseAttributes = (next: Object, prior: Object) => {
  if (next === prior || !next || !prior) return next;
  const priorKeys = new Set(Object.keys(prior));
  for (const key in next) {
    if (!next.hasOwnProperty(key)) continue;
    if (!priorKeys.has(key)) return next;
    if (next[key] !== prior[key]) return next;
    priorKeys.delete(key);
  }
  return priorKeys.size === 0 ? prior : next;
};

const matchesPriorNode = (
  newNode: VNode,
  priorNode: VNode,
  children: ComponentChildren,
  attributes: Object
) =>
  newNode.nodeName === priorNode.nodeName &&
  newNode.key === priorNode.key &&
  children === priorNode.children &&
  attributes === priorNode.attributes;

const matchesNewNode = (
  newNode: VNode,
  children: ComponentChildren,
  attributes: Object
) => children === newNode.children && attributes === newNode.attributes;

const reuseNode = (next: ComponentChild, prior: ComponentChild) => {
  if (next === prior || !next || !prior || !isVNode(next) || !isVNode(prior))
    return next;
  const children = reuseChildren(next.children, prior.children);
  const attributes = reuseAttributes(next.attributes, prior.attributes);
  return matchesPriorNode(next, prior, children, attributes)
    ? prior
    : matchesNewNode(next, children, attributes)
      ? next
      : {
          nodeName: next.nodeName,
          attributes,
          children,
          key: next.key
        };
};

const reuseChildren = (next: ComponentChildren, prior: ComponentChildren) => {
  let ret: ComponentChildren = null;
  if (next === prior || !next || !prior || next.length !== prior.length)
    return next;
  let reused = 0;
  for (let idx = next.length; idx--; idx >= 0) {
    const nchild = next[idx];
    const pchild = prior[idx];
    const child =
      "object" === typeof nchild && "object" === typeof pchild
        ? reuseNode(nchild, pchild)
        : nchild;
    if (child === pchild) {
      reused++;
      if (child !== nchild) {
        if (!ret) ret = next.slice();
        ret[idx] = child;
      }
    }
  }
  if (reused === prior.length) ret = prior;
  else if (!ret) ret = next;
  return ret;
};

h.reuse = reuseNode;

export default h;
