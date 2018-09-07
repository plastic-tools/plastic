import { tracked } from "@plastic/reactor";

import {
  VNode,
  TrackedComponent,
  RenderableProps,
  ComponentChild
} from "@plastic/render/src/types";
import h from "@plastic/render/src/h";

/**
 * A Component works similar to a React component. It has a computed property
 * that will output the DOM-structure to be rendered.
 */
export default class Component<P extends {} = {}, S = {}> {
  @tracked
  props: RenderableProps<P>;

  @tracked
  state: S;

  constructor(props: RenderableProps<P> = {} as any, context: any = {}) {
    this.props = props;
  }

  render(
    props?: RenderableProps<P>,
    state?: Readonly<S>,
    context?: any
  ): ComponentChild {
    return <h1>Hello World</h1>;
  }

  /**
   * Returns the current rendered vnode for the component. The component will
   * automatically reuse any returned components whenever possible.
   */
  @tracked
  get vnode() {
    return (this._priorChild = h.reuse(this.render(), this._priorChild));
  }
  private _priorChild: ComponentChild;

  static displayName?: string;
  static defaultProps?: any;

  // Interface below is implemented for compatibility with JSX
  // context: any;

  // setState<K extends keyof S>(state: Pick<S, K>, callback?: () => void): void;
  // setState<K extends keyof S>(
  //   fn: (prevState: S, props: P) => Pick<S, K>,
  //   callback?: () => void
  // ): void;
  // setState<K extends keyof S>(
  //   stateOrFn: ((prevState: S, props: P) => Pick<S, K>) | Pick<S, K>,
  //   callback?: () => void
  // ) {}

  // forceUpdate(callback?: () => void): void {}
}

const jsx = <Component attr="foo" />;
