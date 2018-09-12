import {
  RenderComponent,
  ComponentDataSource,
  RendererInput,
  Props
} from "./types";
import { cache } from "@plastic/reactor";

export abstract class Component<P = {}> implements RenderComponent {
  constructor(readonly owner: ComponentDataSource) {}

  get props(): Props<P> {
    return this.owner.props as Props<P>;
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
