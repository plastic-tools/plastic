import { track, cache } from "@plastic/reactor";
import {
  Renderer,
  ComponentDataSource,
  ComponentCommand,
  Context,
  Props,
  RenderComponent,
  isComponentConstructor,
  isFunctionalComponent,
  RenderInput
} from "../types";
import { RenderNode } from "../node";

/** Properties and methods active when rendering a component node */
export class ComponentRenderer implements ComponentDataSource, Renderer {
  @track
  owner: RenderNode;

  get command() {
    return this.owner.command as ComponentCommand;
  }

  /** Context to be provided to children, as emitted by component */
  @cache
  get childContext(): Context {
    const { component, context } = this;
    return component ? { ...context, ...component.childContext } : context;
  }

  /** Props that will be supplied to component */
  @cache
  get props(): Props<any> {
    const { attributes, children, key } = this.command;
    return { ...attributes, children, key };
  }

  /** Context supplied to component. */
  @cache
  get context(): Context {
    const { owner } = this;
    return (owner && owner.context) || {};
  }

  /** A component instance, if input specifies it */
  @cache
  get component(): RenderComponent {
    const { command } = this;
    if (!isComponentConstructor(command.type)) return null;
    const Factory = command.type;
    const prior = cache.prior as RenderComponent;
    return prior instanceof Factory && prior.constructor === Factory
      ? prior
      : new Factory(this);
  }

  /** Returns output of function or class component */
  @cache
  get output(): RenderInput {
    const { command, component, props, context } = this;
    if (component) return component.output;
    if (isFunctionalComponent(command.type))
      return command.type(props, context);
    return null;
  }

  @cache
  get renderer() {
    return cache.prior || new RenderNode(() => this.output, this.owner);
  }

  @cache
  get node() {
    const { output, renderer } = this;
    return output && renderer.node;
  }

  willMount() {
    const { component, renderer } = this;
    if (component && component.componentWillMount)
      component.componentWillMount();
    if (renderer) renderer.willMount();
  }

  didMount() {
    const { component, renderer } = this;
    if (component && component.componentDidMount) component.componentDidMount();
    if (renderer) renderer.didMount();
  }

  willUnmount() {
    const { component, renderer } = this;
    if (component && component.componentWillUnmount)
      component.componentWillUnmount();
    if (renderer) renderer.willUnmount();
  }

  poolReset() {
    this.owner = null;
  }
}

export default ComponentRenderer;
