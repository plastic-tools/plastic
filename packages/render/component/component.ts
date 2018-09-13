import { cache } from "@plastic/reactor";
import { Responder } from "@plastic/runtime";
import {
  RenderComponent,
  ComponentDataSource,
  RenderInput,
  Props
} from "../types";

export abstract class Component<P = {}> extends Responder
  implements RenderComponent {
  constructor(readonly owner: ComponentDataSource) {
    super();
  }

  get props(): Props<P> {
    return this.owner.props as Props<P>;
  }

  get context() {
    return this.owner.context;
  }

  abstract render(): RenderInput;

  @cache
  get output() {
    return this.render();
  }
}

export default Component;
