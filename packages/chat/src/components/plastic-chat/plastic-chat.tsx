import { Component, Prop } from "@stencil/core";

/** Interactive Chat Session with a ChatProvider */
@Component({
  tag: "plastic-chat",
  styleUrl: "plastic-chat.css",
  shadow: true
})
export class PlasticChat {
  @Prop()
  name: string;
  render() {
    return <div>Hello {this.name || "World"}!</div>;
  }
}
