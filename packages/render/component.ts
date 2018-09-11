import { track } from "@plastic/reactor";
import {
  ComponentDataSource,
  Context,
  Props,
  RenderCommand,
  RenderComponent
} from "./types";

/**
 * A Component works similar to a React component. It has a computed property
 * that will output the DOM-structure to be rendered.
 */
export abstract class Component<P extends {} = {}> implements RenderComponent {
  @track
  get props() {
    return this.renderer.props;
  }

  @track
  get context() {
    return this.renderer.context;
  }

  constructor(readonly renderer: ComponentDataSource<P>) {}

  abstract render(props?: Props<P>, context?: Context): RenderCommand;

  @track
  get output() {
    const { props, context } = this;
    return this.render(props, context);
  }
}

export default Component;
