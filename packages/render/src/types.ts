export type Key = string | number;
export type Context<P = {}> = Readonly<P>;
export type Ref<T> = (instance: T) => void;

/** Any type acceptable as input to a Renderer */
export type RenderFunction = () => RenderCommand;
export type StaticRenderCommand = Readonly<VNode> | string | number | null;
export type RenderCommand = StaticRenderCommand | RenderFunction;
export type Children = RenderCommand[];

export interface Attributes {
  [attr: string]: any;
  key?: string | number | any;
  jsx?: boolean;
}

export interface ClassAttributes<T> extends Attributes {
  ref?: Ref<T>;
}

export interface PlasticDOMAttributes {
  children?: Children | RenderCommand;
  dangerouslySetInnerHTML?: {
    __html: string;
  };
}

export type ComponentFactory<P = {}> =
  | ComponentConstructor<P>
  | FunctionalComponent<P>;
export const isComponentFactory = (x: any): x is ComponentFactory =>
  !!x && (isComponentConstructor(x) || isFunctionalComponent(x));

const $IsVNode = Symbol();
export interface VNode<P = {}> {
  /** Must be either a component factor or a string for a DOM element */
  type: ComponentFactory<P> | string;

  /** Any attributes to be applied during rendering */
  attributes: P;

  /** Any children to render */
  children: Children;

  /** If supplied will be used to locate and reuse renderers */
  key?: Key | null;
}

/**
 * True if the passed render command is a VNode.
 * Note that this does not do a deep detection; it will only work with
 * RenderCommands
 */
export const isVNode = (x: RenderCommand): x is VNode =>
  !!x && "object" === typeof x;

export type RenderableProps<P, RefType = any> = Readonly<
  P &
    Attributes & {
      children?: RenderCommand[];
      ref?: Ref<RefType>;
    }
>;

interface FunctionalComponent<P = {}> {
  (props: RenderableProps<P>, context?: Context): RenderCommand | null;
  displayName?: string;
  defaultProps?: Partial<P>;
}

// incomplete, but best we can do.
export const isFunctionalComponent = (x: any): x is FunctionalComponent =>
  "function" === typeof x;

export interface ComponentConstructor<P = {}> {
  new (props: RenderableProps<P>, context?: Context): RenderableComponent<P>;
  displayName?: string;
  defaultProps?: Partial<P>;
}
export const isComponentConstructor = (x: any): x is ComponentConstructor =>
  !!x &&
  "function" === typeof x &&
  (x.prototype === Component.prototype ||
    x.prototype instanceof Component ||
    testRenderableComponent(x.prototype));

export type AnyComponent<P = {}> =
  | RenderableComponent<P>
  | FunctionalComponent<P>;

export interface RenderableComponent<P = {}> {
  /**
   * The render command computed by this component. Make sure this property
   * is tracked if it is not constant.
   */
  readonly output?: RenderCommand;

  /**
   * Any context values you want to supply to children. Will be merged with
   * the parent context by the renderer.
   */
  readonly childContext?: Context;

  updateProps(props: Readonly<RenderableProps<P>>, context: Readonly<Context>);

  // Optional callback interface. Matches React

  /** Called just before the DOM representing this component is mounted. */
  componentWillMount?(): void;

  /** Called just cafter the component DOM mounted, refs will be set */
  componentDidMount?(): void;

  /** Called just before a component is about to be removed. */
  componentWillUnmount?(): void;
}

const testRenderableComponent = (x: any): x is RenderableComponent =>
  !!x && "object" === typeof x && "function" === typeof x.updateProps;

export const isRenderableComponent = (x: any): x is RenderableComponent =>
  x instanceof Component ||
  (!!x && "object" === typeof x && isComponentConstructor(x.constructor));

import Component from "./component";
