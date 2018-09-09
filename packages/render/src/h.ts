import {
  VNode,
  Attributes,
  ComponentFactory,
  RenderCommand,
  Children
} from "./types";

type ComponentParams<P> = Attributes & P;
type SimpleParams = JSX.HTMLAttributes &
  JSX.SVGAttributes &
  Record<string, any>;

const NO_CHILDREN: RenderCommand[] = [];
const stack: (RenderCommand | Children)[] = [];

/**
 * A metal-friendly JSX/hyperscript reviver.
 *
 * This will keep a cache of previously returned VNodes, and attempt to return
 * the same instance
 */
function h<P>(
  node: ComponentFactory<P>,
  params?: ComponentParams<P> | null,
  ...children: (RenderCommand | Children)[]
): VNode;
function h(
  node: string,
  params?: SimpleParams | null,
  ...children: (RenderCommand | Children)[]
): VNode;
function h<P>(
  type: ComponentFactory<P> | string,
  params: ComponentParams<P> | SimpleParams | null,
  ...rest: (RenderCommand | Children)[]
): VNode {
  // flatten children and merge simple strings when possible
  const maybeSimple = "function" !== typeof type;

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
    type,
    attributes: params,
    children,
    key: params.key
  };

  return node;
}

export default h;
