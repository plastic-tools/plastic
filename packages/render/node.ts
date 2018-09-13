import { defer, pool } from "@plastic/runtime";
import { track, cache, $Reuse, reuse, reactor } from "@plastic/reactor";
import {
  RenderInput,
  Renderer,
  RenderCommand,
  isPlatformCommand,
  isComponentCommand,
  Context,
  Key
} from "./types";
import { ComponentRenderer } from "./component";

type RendererClass<N = any> = new () => Renderer<N>;

export class RenderNode<N = any> {
  constructor(
    input: RenderInput,
    readonly parent: RenderNode,
    /** Default render class. */
    readonly PlatformRenderer: RendererClass<N> = parent &&
      parent.PlatformRenderer,
    /** Optional root node that will be used updated or replaced on render */
    readonly root: N = null
  ) {
    if (input) this.input = input;
  }

  /**
   * Raw input, supplied by the parent renderer. Changing this value will
   * update the output node.
   */
  @track
  input: RenderInput;

  @cache
  get command(): RenderCommand {
    let input = this.input;
    while (input && "function" === typeof input) input = input();
    return input as RenderCommand;
  }

  get key(): Key {
    const command = this.command;
    return "object" === typeof command && command.key;
  }

  /** Accelerate reuse.value */
  [$Reuse](prior: RenderNode) {
    const { parent, input } = this;
    return prior.parent === parent && reuse(prior.input, input) === input;
  }

  @cache
  get renderer(): Renderer<N> {
    const { command, PlatformRenderer } = this;
    const prior = cache.prior;
    const Renderer = isComponentCommand(command)
      ? ComponentRenderer
      : isPlatformCommand(command)
        ? PlatformRenderer
        : null;
    const ret = prior instanceof Renderer ? prior : pool.get(Renderer);
    if (ret !== prior) {
      if (prior) pool.release(prior);
      if (ret) ret.owner = this;
    }
    return ret;
  }

  /** Context passed down to components */
  get context(): Context {
    const { parent } = this;
    return (
      (parent &&
        ((parent.renderer && parent.renderer.childContext) ||
          parent.context)) ||
      {}
    );
  }

  /** Platform node generated by the renderer. */
  get node(): N {
    const { renderer } = this;
    return renderer && renderer.node;
  }

  private refresh = () => this.node;

  register() {
    reactor.register(this.refresh);
  }

  unregister() {
    reactor.unregister(this.refresh);
  }

  /**
   * Called on the renderer by a parent when it's output node is about to
   * be inserted into a document.  Notifies renderer immediately, which will
   * notify children as needed.
   *
   * @param mounter the renderer mounting the this renderer.
   */
  willMount() {
    const { renderer } = this;
    if (renderer) renderer.willMount();
  }

  /**
   * Called just after the renderer's DOM is inserted into a document for
   * the first time. These calls are queued and only executed once per
   * microtask.
   */
  didMount() {
    scheduleDidMount(this);
  }

  notifyDidMount() {
    const { renderer } = this;
    if (renderer) renderer.didMount();
  }

  /**
   * Called just before the renderer's DOM element is about to be removed
   * from the document. Only called
   */
  willUnmount() {
    const { renderer } = this;
    unscheduleDidMount(this);
    if (renderer) renderer.willUnmount();
  }
}

// ............................
// HELPERS
//

let pendingDidMounts = new Set<RenderNode>();
const flushDidMounts = () => {
  while (pendingDidMounts.size > 0) {
    const pending = pendingDidMounts;
    pendingDidMounts = new Set();
    for (const renderNode of pending) renderNode.notifyDidMount();
  }
};

const scheduleDidMount = (renderNode: RenderNode) => {
  pendingDidMounts.add(renderNode);
  defer(flushDidMounts);
};

const unscheduleDidMount = (renderNode: RenderNode) => {
  pendingDidMounts.delete(renderNode);
};

export default RenderNode;
