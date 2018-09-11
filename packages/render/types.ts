export type Key = string | number;
export type Context<P = {}> = Readonly<P>;
export type Ref<T> = (instance: T) => void;

// ................................
// RenderCommand
//

/**
 * A single instruction to a renderer on how it should generate UI. In
 * general one renderer instance will be created for each command.
 */
export type RenderCommand = RenderText | RenderNode | RenderFunction | null;
export type StaticRenderCommand = RenderText | RenderNode | null;

export type RenderText = string | number;
export type RenderNode = RenderComponentNode | RenderDOMNode;
export type RenderFunction = () => RenderCommand;
export type RenderChildren = RenderCommand[];

export const isRenderNode = (x: RenderCommand): x is RenderNode =>
  !!x && "object" === x;
export const isRenderFunction = (x: RenderCommand): x is RenderFunction =>
  !!x && "function" === typeof x;
export const isRenderText = (x: RenderCommand): x is RenderText =>
  "string" === typeof x || "number" === typeof x;

/** Common attributes supported by all render command */
interface RenderNodeAttributes<RefType = any> {
  children?: RenderChildren;
  key?: Key;
  ref?: Ref<RefType>;
}

// ................................
// Components
//

/** Renders a component with the specified properties */
export interface RenderComponentNode<P = {}> {
  type: ComponentConstructor<P> | FunctionalComponent<P>;
  attributes: Props<P>;
  children?: RenderCommand[];
  key?: Key;
}
export const isRenderComponentNode = (x: any): x is RenderComponentNode =>
  isRenderNode(x) && "function" === typeof x.type;

export type Props<P, R = any> = Readonly<P & RenderNodeAttributes<R>>;

export interface ComponentDataSource<P = {}> {
  readonly props: Props<P>;
  readonly context: Context;
}
export interface RenderComponent<P = {}> {
  /**
   * The render command computed by this component. Make sure this property
   * is tracked if it is not constant.
   */
  readonly output: RenderCommand;

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
  (props: Props<P>, context?: Context): RenderCommand;
  displayName?: string;
  defaultProps?: Partial<P>;
}
export const isFunctionalComponent = (x: any): x is FunctionalComponent =>
  "function" === typeof x && !isRenderComponent(x.prototype);

export type ComponentFactory<P = {}> =
  | ComponentConstructor<P>
  | FunctionalComponent<P>;

// ................................
// DOM Rendering
//

export interface DangerouslySetInnerHTML {
  __html: string;
}
export type DOMProps = RenderNodeAttributes & AnyDOMAttributes;

export interface RenderDOMNode {
  type: string;
  attributes: DOMProps;
  children?: RenderCommand[];
  key?: Key;
}

export const isRenderDOMNode = (x: any): x is RenderDOMNode =>
  isRenderNode(x) && "string" === typeof x.type;

import { AnyDOMAttributes } from "./src/dom/types";
import Component from "./component";
