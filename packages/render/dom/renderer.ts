import { cache, reuse, track } from "@plastic/reactor";
import {
  Renderer,
  PlatformCommand,
  isNodeCommand,
  Key,
  TextCommand,
  NodeCommand,
  isTextCommand
} from "@plastic/render/types";
import RenderNode from "../node";
import setAttribute, { updateAttributes } from "@plastic/render/dom/attributes";
import { replaceNode, isText, isNamed, createNode, createText } from "./node";

/**
 * Properties and methods active when rendering a platform node
 */
export class DOMRenderer implements Renderer<Node> {
  @track
  owner: RenderNode;

  get command() {
    return this.owner.command as PlatformCommand;
  }

  get parentSVG(): boolean {
    let parent = this.owner.parent;
    while (parent) {
      if ("svg" in parent.renderer) return (parent.renderer as DOMRenderer).svg;
      parent = parent.parent;
    }
    return false;
  }

  get svg(): boolean {
    const { command, owner } = this;
    return isNodeCommand(command)
      ? command.type === "svg"
        ? true
        : command.type === "foreignObject"
          ? false
          : this.parentSVG
      : this.parentSVG;
  }

  /**
   * Returns an array of renderers for any child nodes if any are defined.
   * Note that renderers with an input identifying a component will always
   * have an empty array.
   */
  @cache
  get children(): RenderNode[] {
    const { command, owner } = this;
    if (!isNodeCommand(command)) return NO_CHILDREN;

    const children = command.children;
    if (!children || children.length === 0) return NO_CHILDREN;
    let ret = NO_CHILDREN;
    const prior = (cache.prior as RenderNode[]) || NO_CHILDREN;
    const plim = prior.length;
    let keyed: Map<Key, RenderNode> = null;
    let pidx = 0;
    for (const cinput of children) {
      if (!cinput) continue; // skip empty nodes
      let crenderer = null;

      // first try to reuse keyered renders
      const key = cinput && "object" === typeof cinput && cinput.key;
      if (key) {
        if (!keyed) keyed = toKeyedRenderers(prior);
        crenderer = keyed.get(key);
        if (crenderer) keyed.delete(key);
      }

      // next, try to reuse existing non-keyed renderers
      while (!crenderer && pidx < plim) {
        crenderer = prior[pidx] && !prior[pidx].key ? prior[pidx] : null;
      }

      // create if needed and update input
      if (!crenderer) crenderer = new RenderNode(cinput, owner);
      else crenderer.input = reuse(cinput, crenderer.input);

      if (crenderer) {
        if (ret === NO_CHILDREN) ret = [];
        ret.push(crenderer);
      }
    }
    return ret;
  }

  /**
   * Output node for the platform commmand
   */
  @cache
  get node() {
    const { command, owner } = this;
    const prior = cache.prior || owner.root;
    const ret = isNodeCommand(command)
      ? this.renderNode(command, prior, this.svg)
      : isTextCommand(command)
        ? this.renderText(command, prior)
        : null;
    // Release old node and swap in document if changing value
    if (prior && ret !== prior) this.replaceNode(ret, prior);
    return ret;
  }

  willMount() {
    const { children } = this;
    for (const child of children) child.willMount();
  }

  didMount() {
    const { children } = this;
    for (const child of children) child.didMount();
  }

  willUnmount() {
    const { children } = this;
    for (const child of children) child.willUnmount();
  }

  poolReset() {
    this.owner = null;
  }

  // ..............................
  // DOM Rendering

  /** Called to render a platform node. */
  renderNode(node: NodeCommand, prior: Node, svg: boolean) {
    const { type, attributes } = node;
    const { children } = this;
    const ret =
      !isText(prior) && isNamed(prior, type) ? prior : createNode(type, svg);
    ret[$RenderNode] = this;
    updateChildren(ret, children);
    updateAttributes(ret, attributes, svg);
    return prior;
  }

  /** Called to render a text node */
  renderText(text: TextCommand, prior: Text) {
    const nvalue = "number" === typeof text ? String(text) : text || "";
    if (isText(prior)) {
      if (prior.nodeValue !== nvalue) prior.nodeValue = nvalue;
      return prior;
    } else return createText(nvalue);
  }

  /** Called when a node has changed and should replace a prior node */
  replaceNode(next: Node, prior: Node) {
    delete prior[$RenderNode];
    replaceNode(next, prior);
  }
}

// ............................
// HELPERS
//

const $RenderNode = Symbol();
const NO_CHILDREN: RenderNode[] = [];

const toKeyedRenderers = (prior: RenderNode[]) => {
  const ret = new Map<Key, RenderNode>();
  for (const node of prior) {
    const key = node.key;
    if (key) ret.set(key, node);
  }
  return ret;
};

/**
 * Updates the children of the node to match the output of the passed
 * set of render nodes. Invoking callbacks as appropriate on related
 * nodes.
 */
const updateChildren = (node: Node, children: RenderNode[]) => {
  let priorNode: Node = null;
  for (const child of children) {
    const cnode = child.node;
    if (!cnode) continue;
    const parentChanged = cnode.parentNode !== node;
    const moved = priorNode
      ? cnode !== priorNode.nextSibling
      : cnode !== node.firstChild;
    if (parentChanged || moved) {
      const changingDocument =
        cnode.ownerDocument && cnode.ownerDocument !== node.ownerDocument;
      const mounting = changingDocument || !cnode.ownerDocument;
      if (changingDocument) child.willUnmount();
      if (mounting) child.willMount();
      node.insertBefore(
        cnode,
        priorNode ? priorNode.nextSibling : node.firstChild
      );
      child.didMount();
    }
    priorNode = cnode;
  }

  // remove any extra nodes
  while (priorNode.parentNode === node && priorNode.nextSibling) {
    const renderNode = node[$RenderNode] as RenderNode;
    if (renderNode) renderNode.willUnmount();
    node.removeChild(priorNode.nextSibling);
  }
};

export default DOMRenderer;
