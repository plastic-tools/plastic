import { tracked, reuse } from "@plastic/reactor";
import h from "./h";
import {
  RenderableComponent,
  Context,
  RenderableProps,
  RenderCommand
} from "./types";

/**
 * A Component works similar to a React component. It has a computed property
 * that will output the DOM-structure to be rendered.
 */
export default abstract class Component<P extends {} = {}>
  implements RenderableComponent {
  @tracked
  props: Readonly<RenderableProps<P>>;

  @tracked
  context: Readonly<Context>;

  constructor(props: RenderableProps<P>, context?: Context) {
    this.props = props;
    this.context = context;
  }

  abstract render?(): RenderCommand;

  @tracked
  get output() {
    return this.render();
  }

  updateProps(props: Readonly<RenderableProps<P>>, context: Readonly<Context>) {
    this.props = reuse(props, this.props);
    this.context = reuse(context, this.context);
  }
}
