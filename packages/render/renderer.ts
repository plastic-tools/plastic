import { track, $Reuse, reuse, reactor } from "@plastic/reactor";
import {
  RenderCommand,
  StaticRenderCommand,
  isRenderNode,
  Context,
  Props,
  isRenderComponentNode,
  RenderComponent,
  isComponentConstructor,
  isFunctionalComponent,
  isRenderDOMNode,
  Key,
  isRenderText,
  RenderDOMNode,
  RenderText
} from "./types";
import {
  nodeNamesAreEqual,
  nodeIsNamed,
  createNode,
  isText,
  createText,
  setAttribute
} from "./dom";

const globalDocument = document;

/**
 * Renders a RenderCommand into a dom node that can be inserted into a tree.
 * @todo more docs
 */
export class Renderer {
  constructor(
    input: RenderCommand,
    readonly parent: Renderer = null,
    readonly document = parent ? parent.document : globalDocument
  ) {
    if (input) this.input = input;
  }

  /**
   * Input to the renderer. Changing this property will eventually update
   * the dom.
   */
  @track
  input: RenderCommand;

  /** input render command with functions processed away */
  @track
  get staticInput(): StaticRenderCommand {
    let { input } = this;
    while ("function" === typeof input) input = input();
    return input;
  }

  /** Renderer key, if supplied in command */
  @track
  get key() {
    const { staticInput } = this;
    return isRenderNode(staticInput) ? staticInput.key : null;
  }

  /** Accelerate reuse() */
  [$Reuse](prior: Renderer) {
    const { parent, input } = this;
    return prior.parent === parent && reuse(prior.input, input) === input;
  }

  // ..........................
  // COMPONENT PROPERTIES
  //

  /** Context that will be supplied to any component */
  @track
  get context(): Context {
    const parent = this.parent;
    return (parent && parent.childContext) || {};
  }

  /** Context that will be supplied to any chilldren that are components */
  @track
  get childContext(): Context {
    const component = this.component;
    return component
      ? { ...this.context, ...component.childContext }
      : this.context;
  }

  /** Props that will be supplied to any component */
  @track
  get props(): Props<any> {
    const { staticInput } = this;
    if (!isRenderComponentNode(staticInput)) return null;
    const { attributes, children, key } = staticInput;
    return { ...attributes, children, key };
  }

  /** A component instance, if input specifies it */
  @track
  get component(): RenderComponent {
    const { staticInput } = this;
    const Factory = isRenderComponentNode(staticInput)
      ? staticInput.type
      : null;
    if (!Factory || !isComponentConstructor(Factory)) return null;
    const prior = track.prior as RenderComponent;
    return prior instanceof Factory && prior.constructor === Factory
      ? prior
      : new Factory(this);
  }

  /** Returns output of any component */
  @track
  get componentOutput(): RenderCommand {
    const { component, staticInput, props, context } = this;
    if (component) return component.output;
    const fn = isRenderComponentNode(staticInput) && staticInput.type;
    if (!isFunctionalComponent(fn)) return null;
    return fn(props, context);
  }

  /** Returns a renderer for the output of the component, if there is one. */
  get componentRenderer() {
    const { staticInput } = this;
    return isRenderComponentNode(staticInput)
      ? track.prior
      : new Renderer(() => this.componentOutput, this);
  }

  /**
   * Returns an array of renderer for any child nodes if any are defined.
   * Note that renderers with an input identifying a component will always
   * have an empty array.
   */
  @track
  protected get children(): Renderer[] {
    const { staticInput } = this;
    if (!isRenderDOMNode(staticInput)) return NO_CHILDREN;

    const children = staticInput.children;
    if (!children || children.length === 0) return NO_CHILDREN;
    let ret = NO_CHILDREN;
    const prior = (track.prior as Renderer[]) || NO_CHILDREN;
    const plim = prior.length;
    let keyed: Map<Key, Renderer> = null;
    let pidx = 0;
    for (const cinput of children) {
      if (!cinput) continue; // skip empty nodes
      let crenderer = null;

      // first try to reuse keyered renders
      const key = isRenderNode(cinput) && cinput.key;
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
      if (!crenderer) crenderer = new Renderer(cinput, this);
      else crenderer.input = reuse(cinput, crenderer.input);

      if (crenderer) {
        if (ret === NO_CHILDREN) ret = [];
        ret.push(crenderer);
      }
    }
    return ret;
  }

  /** Returns true if the receiver should render in SVG mode */
  @track
  get isSVG(): boolean {
    const { parent, staticInput } = this;
    const type = isRenderDOMNode(staticInput) && staticInput.type;
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
  @track
  get dom(): Node {
    const { componentRenderer, staticInput, _root } = this;
    if (componentRenderer) return componentRenderer.dom;
    const prior = track.prior || _root;
    const ret = isRenderDOMNode(staticInput)
      ? this.renderDOMNode(staticInput, prior)
      : this.renderText(isRenderText(staticInput) ? staticInput : "", prior);

    // Release old node and swap in document if changing value
    if (ret !== prior) {
      ret[$Renderer] = this;
      if (prior) delete prior[$Renderer];
      if (prior && prior.parentNode) prior.parentNode.replaceChild(ret, prior);
    }

    return ret;
  }

  private refresh = () => {
    this.dom;
  };

  register(root: Node = null) {
    this._root = root;
    reactor.register(this.refresh);
  }

  unregister() {
    this._root = null;
    reactor.unregister(this.refresh);
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

  private renderDOMNode(input: RenderDOMNode, prior: Node) {
    // first make sure node types match
    const nodeName = input.type;
    const { isSVG, children, document } = this;
    const ret =
      prior && nodeIsNamed(prior, nodeName)
        ? prior
        : createNode(nodeName, isSVG, document);

    // make sure the children are placed in the DOM as needed. It's expected
    // that the children will take care of removing their own DOMs as needed
    updateChildren(ret, children);

    // update attributes
    updateAttributes(ret, input.attributes || {}, isSVG);

    return ret;
  }

  private renderText(value: RenderText, prior: Node) {
    const { document } = this;
    const nvalue = "number" === typeof value ? String(value) : value || "";
    if (isText(prior)) {
      if (prior.nodeValue !== nvalue) prior.nodeValue = nvalue;
      return prior;
    } else return createText(nvalue, document);
  }

  private _root: Node;
}

// ..........................
// HELPERS
//

const $Renderer = Symbol();

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

export default Renderer;
