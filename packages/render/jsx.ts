import {
  RenderCommand,
  ComponentFactory,
  Props,
  DOMProps,
  RenderChildren,
  Key
} from "./types";

const NO_CHILDREN: RenderChildren = [];
const stack: (RenderCommand | RenderChildren)[] = [];

interface PSXAttrs {
  key?: Key;
  children?: RenderCommand | (RenderCommand | RenderChildren)[];
}

type DOMAttrs = DOMProps & { class?: string };

/**
 * A JSX-compatible transform function that will return platic-compatible
 * RenderCommands. This will also scope the JSX namespace to avoid conflicts
 * if you mix and match with React.
 *
 * @param type a string for a DOM, or a component class or SFC.
 * @param attrs attributes to pass to the element.
 * @param children any child components, may be nested
 */
export function jsx<P>(
  type: ComponentFactory<P>,
  attrs?: Props<P> & PSXAttrs,
  ...children: (RenderCommand | RenderChildren)[]
): RenderCommand;

export function jsx(
  type: string,
  attrs?: DOMAttrs & PSXAttrs,
  ...children: (RenderCommand | RenderChildren)[]
): RenderCommand;

export function jsx<P>(
  type: ComponentFactory<P> | string,
  attrs: (Props<P> | DOMAttrs) & PSXAttrs,
  ...rest: (RenderCommand | RenderChildren)[]
): RenderCommand {
  // flatten children and merge simple strings when possible
  const maybeSimple = "function" !== typeof type;

  for (let idx = rest.length; idx--; idx >= 0) stack.push(rest[idx]);
  if (attrs && attrs.children) {
    if (stack.length === 0) stack.push(attrs.children);
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

  const key: Key = attrs.key;

  // cleanup extra attributes
  const attributes = { ...(attrs as any) };
  if (attributes.class) {
    attributes.className = attributes.className || attributes.class;
    delete attributes.class;
  }
  delete attributes.children;

  return { type, attributes, children, key } as RenderCommand;
}

export default jsx;
