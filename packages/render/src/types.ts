type Key = string | number;
type Ref<T> = (instance: T) => void;
export type ComponentChild = VNode<any> | string | number | null;
export type ComponentChildren = ComponentChild[];

export interface Attributes {
  [attr: string]: any;
  key?: string | number | any;
  jsx?: boolean;
}

export interface ClassAttributes<T> extends Attributes {
  ref?: Ref<T>;
}

export interface MultiDOMAttributes {
  children?: ComponentChildren;
  dangerouslySetInnerHTML?: {
    __html: string;
  };
}

export type ComponentFactory<P = {}> =
  | ComponentConstructor<P>
  | FunctionalComponent<P>;

export interface VNode<P = {}> {
  // have to include Function to keep typings happy. :/
  readonly nodeName: ComponentFactory<P> | string;
  readonly attributes: P;
  readonly children: ComponentChildren;
  readonly key?: Key | null;
}

const $VNode = Symbol();
const _testVNode = (x: any): x is VNode =>
  ("function" === typeof x.nodeName || "string" === typeof x.nodeName) &&
  "object" === typeof x.attributes &&
  Array.isArray(x.children);

export const isVNode = (x: any): x is VNode => {
  if ("object" !== typeof x) return false;
  if (x[$VNode]) return true;
  return (x[$VNode] = _testVNode(x));
};

export type RenderableProps<P, RefType = any> = Readonly<
  P &
    Attributes & {
      children?: ComponentChildren;
      ref?: Ref<RefType>;
    }
>;

interface FunctionalComponent<P = {}> {
  (props: RenderableProps<P>, context?: {}): VNode<any> | null;
  displayName?: string;
  defaultProps?: Partial<P>;
}

interface ComponentConstructor<P = {}, S = {}> {
  new (props: RenderableProps<P>, context?: any): TrackedComponent<P, S>;
  displayName?: string;
  defaultProps?: Partial<P>;
}

type AnyComponent<P = {}, S = {}> =
  | FunctionalComponent<P>
  | TrackedComponent<P, S>;

export interface TrackedComponent<P = {}, S extends {} = {}> {
  props: Readonly<P>;
  state: Readonly<S>;
  readonly vnode: ComponentChild;
}
