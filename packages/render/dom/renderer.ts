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
import setAttribute from "./setAttribute";

const $Renderer = Symbol();
const NO_CHILDREN: RenderNode[] = [];

/**
 * Properties and methods active when rendering a platform node
 */
export class DOMRenderer implements Renderer<Node> {
  @track
  owner: RenderNode;

  get command() {
    return this.owner.command as PlatformCommand;
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
        if (!keyed) keyed = getKeyedRenderers(prior);
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
    const prior = cache.prior || this.owner.root;
    const ret = this.renderCommand(prior);
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

  renderCommand(prior: any) {
    const { command } = this;
    return isNodeCommand(command)
      ? this.renderNode(command, prior)
      : isTextCommand(command)
        ? this.renderText(command, prior)
        : null;
  }

  /** Called to render a platform node. */
  renderNode(node: NodeCommand, prior: Node) {
    const { type, attributes } = node;
    const { owner, children } = this;
    const ret =
      !isText(prior) && nodeIsNamed(prior, type)
        ? prior
        : this.createNode(type);
    ret[$Renderer] = owner;
    this.updateChildren(ret, children);
    this.updateAttributes(ret, attributes);
    return prior;
  }

  /** Called to render a text node */
  renderText(text: TextCommand, prior: Text) {
    const nvalue = "number" === typeof text ? String(text) : text || "";
    if (isText(prior)) {
      if (prior.nodeValue !== nvalue) prior.nodeValue = nvalue;
      return prior;
    } else return this.createText(nvalue);
  }

  /** Called when a node has changed and should replace a prior node */
  replaceNode(next: Node, prior: Node) {
    delete prior[$Renderer];
    if (prior.parentNode) prior.parentNode.replaceChild(next, prior);
  }

  // .............................
  // UTILITIES
  //

  // TODO: override for SVG
  createNode(nodeName: string): Node {
    return document.createElement(nodeName);
  }

  createText(text: string) {
    return document.createTextNode(text);
  }

  updateChildren(node: Node, children: RenderNode[]) {
    let priorNode: Node = null;
    for (const child of children) {
      const cnode = child.node;
      if (!cnode) continue;
      const parentChanged = cnode.parentNode !== node;
      const moved = priorNode
        ? cnode !== priorNode.nextSibling
        : cnode !== node.firstChild;
      if (parentChanged || moved) {
        const unmounting =
          cnode.ownerDocument && cnode.ownerDocument !== node.ownerDocument;
        const mounting = unmounting || !cnode.ownerDocument;
        if (unmounting) child.willUnmount();
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
      if (node[$Renderer]) node[$Renderer].willUnmount();
      node.removeChild(priorNode.nextSibling);
    }
  }

  setAttribute(node: Node, name: string, next: any, prior: any, svg = false) {
    setAttribute(node, name, null, prior[name], svg);
  }

  updateAttributes(node: Node, next: any) {
    const prior = getCachedAttributes(node);
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
      this.setAttribute(node, name, next[name], prior[name]);
      prior[name] = next[name];
    }
  }
}

// ............................
// HELPERS
//

const getKeyedRenderers = (prior: RenderNode[]) => {
  const ret = new Map<Key, RenderNode>();
  for (const node of prior) {
    const key = node.key;
    if (key) ret.set(key, node);
  }
  return ret;
};

const nodeIsNamed = (node: Node, name2: string) => {
  const name1 = node && node.nodeName;
  return (
    name1 === name2 ||
    ("string" === typeof name1 &&
      "string" === typeof name2 &&
      name1.toLowerCase() === name2.toLowerCase())
  );
};

const isText = (x: any): x is Text =>
  !!x &&
  "object" === typeof x &&
  "function" === typeof x.splitText &&
  "parentNode" in x;

const isNil = (x: any) => x === null || x === undefined;

const $CachedAttributes = Symbol();
const getCachedAttributes = (node: Node) => {
  let ret = node[$CachedAttributes];
  if (!ret) {
    ret = node[$CachedAttributes] = {};
    const attributes = (node as Element).attributes || [];
    for (const attr of attributes) ret[attr.name] = attr.value;
  }
  return ret;
};

export default DOMRenderer;
