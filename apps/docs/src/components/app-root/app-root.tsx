import { Component } from "@stencil/core";

@Component({
  tag: "app-root"
})
export class AppRoot {
  hostData() {
    return {
      class: "u-text"
    };
  }
  render() {
    return [<h1>Hello World</h1>, <blaze-button>Try Me</blaze-button>];
  }
}
