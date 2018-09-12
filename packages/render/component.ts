import { RenderComponent, ComponentDataSource, RendererInput } from "./types";
import { cache } from "@plastic/reactor";

export abstract class Component<P = {}> implements RenderComponent {
  constructor(readonly owner: ComponentDataSource) {}

  get props() {
    return this.owner.props;
  }

  get context() {
    return this.owner.context;
  }

  abstract render(): RendererInput;

  @cache
  get output() {
    return this.render();
  }
}

export default Component;
