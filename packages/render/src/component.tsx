import { tracked } from "@plastic/reactor";
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
export default abstract class Component<P extends {} = {}>
  implements RenderComponent {
  @tracked
  get props() {
    return this.renderer.props;
  }

  @tracked
  get context() {
    return this.renderer.context;
  }

  constructor(readonly renderer: ComponentDataSource<P>) {}

  abstract render(props?: Props<P>, context?: Context): RenderCommand;

  @tracked
  get output() {
    const { props, context } = this;
    return this.render(props, context);
  }
}
