import { Component } from "@stencil/core";

@Component({
  tag: "app-root"
})
export class AppRoot {
  render() {
    return <plastic-chat name="Charles" />;
  }
}
