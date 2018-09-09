import {
  tracked,
  reuse,
  Reactable,
  TrackedValue,
  Reactor
} from "@plastic/reactor";
import {
  Key,
  RenderCommand,
  isVNode,
  isComponentConstructor,
  RenderableProps,
  RenderableComponent,
  Context,
  isFunctionalComponent,
  VNode,
  StaticRenderCommand
} from "./types";
import {
  nodeNamesAreEqual,
  createNode,
  isText,
  createText,
  nodeIsNamed,
  setAttribute
} from "./dom";
import { Zone } from "@plastic/runtime";

const $Renderer = Symbol();

/**
 * A Reaction that accepts a VNode and root element as input and renders
 * a DOM to it, creating associated components as needed. As long as the
 * renderer is registered, the DOM will update automatically when any of
 * the UI content changes.
 */
export default class Renderer implements Reactable {
  constructor(
    input: RenderCommand,
    readonly parent: Renderer = null,
    readonly document = Zone.currentZone.ui.document
  ) {
    this.input = input;
  }

  @tracked
  input: RenderCommand;

  /** The input with any render command functions processed away */
  protected get staticInput(): StaticRenderCommand {
    let { input } = this;
    while ("function" === typeof input) input = input();
    return input;
  }

  /** Key associated with this render if supplied in command */
  @tracked
  get key() {
    const cmd = this.staticInput;
    return isVNode(cmd) && cmd.key;
  }

  /** Context that will be supplied to any component */
  @tracked
  get context(): Context {
    const parent = this.parent;
    return (parent && parent.childContext) || {};
  }

  /** Context that will be supplied to any chilldren that are components */
  @tracked
  get childContext(): Context {
    const component = this.component;
    return component
      ? { ...this.context, ...component.childContext }
      : this.context;
  }

  /** Props that will be supplied to any component */
  @tracked
  get props(): RenderableProps<any> {
    const input = this.staticInput;
    if (!isVNode(input)) return null;
    const { attributes, children, key } = input;
    return { ...attributes, children, key };
  }

  /** A component instance, if defined by command. */
  @tracked
  get component(): RenderableComponent {
    const { staticInput } = this;
    const Factory = (isVNode(staticInput) && staticInput.type) || null;
    if (!isComponentConstructor(Factory)) return null;
    let ret = tracked.prior as RenderableComponent;
    const { props, context } = this;
    if (ret instanceof Factory && ret.constructor === Factory) {
      ret.updateProps(props, context);
    } else ret = new Factory(props, context);
    return ret;
  }

  /**
   * Returns a renderer for the output of the command in the component, if
   * there is one.
   */
  get componentRenderer() {
    const { component, staticInput, document } = this;
    const output = component
      ? component.output
      : isVNode(staticInput) &&
        isFunctionalComponent(staticInput.type) &&
        staticInput.type(this.props, this.context);
    if (!output) return null;
    let ret = tracked.prior as Renderer;
    if (ret) {
      ret.input = reuse(output, ret.input);
    } else ret = new Renderer(output, this, document);
    return ret;
  }

  /** Makes this componant comparable for reuse purposes */
  isEqual(x: any) {
    if (x === this) return true;
    if (!x || !(x instanceof Renderer)) return false;
    const { parent, input } = this;
    return x.parent == parent && reuse(x.input, input) === input;
  }

  /**
   * Returns an array of renderer for any child nodes if any are defined.
   * Note that renderers with an input identifying a component will always
   * have an empty array.
   */
  @tracked
  protected get children(): Renderer[] {
    const { componentRenderer, document, staticInput } = this;
    if (componentRenderer) return [];

    const children = isVNode(staticInput) && staticInput.children;
    if (!children || children.length === 0) return NO_CHILDREN;
    let ret = NO_CHILDREN;
    const prior = (tracked.prior as Renderer[]) || NO_CHILDREN;
    const plim = prior.length;
    let keyed: Map<Key, Renderer> = null;
    let pidx = 0;
    for (const cinput of children) {
      if (!cinput) continue; // skip empty nodes
      let crenderer = null;

      // first try to reuse keyered renders
      const key = isVNode(cinput) && cinput.key;
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
      if (!crenderer) crenderer = new Renderer(cinput, this, document);
      else crenderer.input = reuse(cinput, crenderer.input);

      if (crenderer) {
        if (ret === NO_CHILDREN) ret = [];
        ret.push(crenderer);
      }
    }
    return ret;
  }

  /** Returns true if the receiver should render in SVG mode */
  @tracked
  get isSVG(): boolean {
    const { parent, staticInput } = this;
    const type = isVNode(staticInput) && staticInput.type;
    if ("string" !== typeof type) return parent && parent.isSVG;
    return nodeNamesAreEqual(type, "svg")
      ? true
      : nodeNamesAreEqual(type, "foreignObject")
        ? false
        : parent && parent.isSVG;
  }

  /**
   * Returns the DOM node generated by this renderer. Attempts to reuse the
   * node whenever possible. If the returned node value changes or becomes
   * null and the previous node was in the DOM, it will be swapped/replaced.
   * However, it is the responsibility of the parent to insert the node into
   * the document in the first place.
   */
  @tracked
  get dom(): Node {
    const { componentRenderer } = this;
    if (componentRenderer) return componentRenderer.dom;
    const { staticInput, _root } = this;
    const prior = tracked.prior || _root;
    const ret = isVNode(staticInput)
      ? this._renderVNode(staticInput, prior)
      : this._renderText(staticInput, prior);

    // Release old node and swap in document if changing value
    if (ret !== prior) {
      ret[$Renderer] = this;
      if (prior) delete prior[$Renderer];
      if (prior && prior.parentNode) prior.parentNode.replaceChild(ret, prior);
    }

    return ret;
  }

  private _root: Node;

  revalidateReaction(changes?: Set<TrackedValue>) {
    return this.dom === this._root;
  }

  invokeReaction() {
    const { dom, _root } = this;
    if (dom === _root) return;
    if (_root.parentNode) _root.parentNode.replaceChild(dom, _root);
    this._root = dom;
  }

  register(root: Node = null, reactor = Reactor.currentReactor) {
    this._root = root;
    reactor.register(this);
  }

  unregister(reactor = Reactor.currentReactor) {
    this._root = null;
    reactor.unregister(this);
  }

  /**
   * Called on the renderer by a parent when it's output node is about to
   * be inserted into a document.  Notifies any children and child component
   * as needed.
   *
   * @param mounter the renderer mounting the this renderer.
   */
  willMount() {
    const { component, componentRenderer, children } = this;
    if (component && component.componentWillMount)
      component.componentWillMount();
    if (componentRenderer) componentRenderer.willMount();
    for (const child of children) child.willMount();
  }

  /**
   * Called just after the renderer's DOM is inserted into a document for
   * the first time.
   */
  didMount() {
    const { component, componentRenderer, children } = this;
    if (component && component.componentDidMount) component.componentDidMount();
    if (componentRenderer) componentRenderer.didMount();
    for (const child of children) child.didMount();
  }

  /**
   * Called just before the renderer's DOM element is about to be removed
   * from the document.
   */
  willUnmount() {
    const { component, componentRenderer, children } = this;
    if (component && component.componentWillUnmount)
      component.componentWillUnmount();
    if (componentRenderer) componentRenderer.willUnmount();
    for (const child of children) child.willUnmount();
  }

  private _renderVNode(vnode: Readonly<VNode>, prior: Node) {
    if ("string" !== typeof vnode.type)
      throw `vnode.type must be string (was: ${typeof vnode.type}`;

    // first make sure node types match
    const nodeName = vnode.type;
    const { isSVG, children, document } = this;
    const ret =
      prior && nodeIsNamed(prior, nodeName)
        ? prior
        : createNode(nodeName, isSVG, document);

    // make sure the children are placed in the DOM as needed. It's expected
    // that the children will take care of removing their own DOMs as needed
    updateChildren(ret, children);

    // update attributes
    updateAttributes(ret, vnode.attributes || {}, isSVG);

    return ret;
  }

  private _renderText(value: string | number, prior: Node) {
    const { document } = this;
    const nvalue = "number" === typeof value ? String(value) : value || "";
    if (isText(prior)) {
      if (prior.nodeValue !== nvalue) prior.nodeValue = nvalue;
      return prior;
    } else return createText(nvalue, document);
  }
}

const NO_CHILDREN: Renderer[] = [];
const getKeyedRenderers = (prior: Renderer[]) => {
  const ret = new Map<Key, Renderer>();
  for (const renderer of prior) {
    const key = renderer.key;
    if (key) ret.set(key, renderer);
  }
  return ret;
};

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

const updateAttributes = (node: Node, next = {}, svg = false) => {
  const prior = getCachedAttributes(node);
  function pvalue(name: string, node: Node, prior: {}) {
    return name === "value" || name === "checked" ? node[name] : prior[name];
  }

  // remove attributes no longer present
  for (const name in prior) {
    if (isNil(next[name]) && !isNil(prior[name])) {
      setAttribute(node, name, null, prior[name], svg);
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

const updateChildren = (node: Node, children: Renderer[]) => {
  let priorNode: Node = null;
  for (const child of children) {
    const cnode = child.dom;
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
};
