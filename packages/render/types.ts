export type Key = string | number;
export type Context<P = {}> = Readonly<P>;
export type Ref<T> = (instance: T) => void;

export interface DangerouslySetInnerHTML {
  __html: string;
}

export interface Poolable {
  /** Resets the state of the object */
  poolReset?();
}

/** Core renderer, swapped in based on node type */
export interface Engine<N = any> extends Poolable {
  owner: Renderer;
  readonly node: N;
  readonly childContext?: Context;
  willMount();
  didMount();
  willUnmount();
}

// ................................
// RenderCommand
//

export type RendererInput = RenderCommand | RenderFunction;
export type RenderFunction = () => RendererInput;
export type RenderCommand = PlatformCommand | ComponentCommand | null;
export type RenderChildren = RendererInput[];

export interface NodeCommand {
  type: string;
  attributes: {};
  children: RenderChildren;
  key?: Key;
}
export const isNodeCommand = (x: RenderCommand): x is NodeCommand =>
  !!x && "object" === typeof x && "string" === typeof x.type;

export type TextCommand = string | number;
export const isTextCommand = (x: RenderCommand): x is TextCommand =>
  "string" === typeof x || "number" === typeof x;

export type PlatformCommand = NodeCommand | TextCommand;
export const isPlatformCommand = (x: RenderCommand): x is PlatformCommand =>
  isNodeCommand(x) || isTextCommand(x);

export interface ComponentCommand<P = {}> {
  type: ComponentFactory<P>;
  attributes: P;
  children: RenderChildren;
  key?: Key;
}
export const isComponentCommand = (x: RenderCommand): x is ComponentCommand =>
  !!x && "object" === typeof x && "function" === typeof x;

// ................................
// Components
//

export interface PropAttributes<RefType = any> {
  children?: RenderChildren[];
  key?: Key;
  ref?: Ref<RefType>;
}
export type Props<P, R = any> = Readonly<P & PropAttributes<R>>;

export interface ComponentDataSource<P = {}> {
  readonly props: Props<P>;
  readonly context: Context;
}
export interface RenderComponent<P = {}> {
  /**
   * The render command computed by this component. Make sure this property
   * is tracked if it is not constant.
   */
  readonly output: RendererInput;

  /**
   * Any context values you want to supply to children. Will be merged with
   * the parent context by the renderer.
   */
  readonly childContext?: Context;

  /**
   * Called just before the DOM representing this component is mounted.
   * Refs will not yet be active.
   */
  componentWillMount?(): void;

  /** Called just cafter the component DOM mounted, refs will be set */
  componentDidMount?(): void;

  /** Called just before a component is about to be removed. */
  componentWillUnmount?(): void;
}

export const isRenderComponent = (x: any): x is RenderComponent =>
  !!x &&
  "object" === typeof x &&
  (x instanceof Component || x === Component.prototype || "output" in x);

export interface ComponentConstructor<P = {}> {
  new (dataSource: ComponentDataSource<P>): RenderComponent;
  displayName?: string;
  defaultProps?: Partial<P>;
}
export const isComponentConstructor = (x: any): x is ComponentConstructor =>
  "function" === typeof x && isRenderComponent(x.prototype);

export interface FunctionalComponent<P = {}> {
  (props: Props<P>, context?: Context): RendererInput;
  displayName?: string;
  defaultProps?: Partial<P>;
}
export const isFunctionalComponent = (x: any): x is FunctionalComponent =>
  "function" === typeof x && !isRenderComponent(x.prototype);

export type ComponentFactory<P = {}> =
  | ComponentConstructor<P>
  | FunctionalComponent<P>;

// ................................
// Responder
//

export interface ResponderLike {
  /**
   * Attempts to perform the named action by invoking a similarly named
   * method on the receiver. The default implementation
   */
  performAction(actionName: string, sender: Object, ...args: any[]): boolean;

  /**
   * If implemented, should be called by performAction() if it cannot find a
   * local method to call. Should look for any follow on responder to call
   * instead.
   *
   * @param actionName
   * @param sender
   * @param args
   */
  forwardAction?(actionName: string, sender: Object, ...args: any[]): boolean;

  /**
   * If implemented, should point to the next responder to forward events
   * to.
   */
  nextResponder?: ResponderLike;
}
export const isResponderLike = (x: any) =>
  !!x && "object" === typeof x && "function" === typeof x.performAction;

import Component from "@plastic/render/component.engine";
import Renderer from "./renderer";
