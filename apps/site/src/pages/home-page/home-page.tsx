import { Component, Prop } from "@stencil/core";
import { SitePage } from "../../components/site-page";

@Component({
  tag: "home-page"
})
export class HomePage {
  @Prop({ context: "window" })
  win!: Window;

  render() {
    return (
      <SitePage name="Home" current="home-page" win={this.win}>
        <h1>Have some Data, FOO</h1>
        <ion-fab horizontal="end" vertical="bottom">
          <ion-fab-button mode="ios">CHAT</ion-fab-button>
        </ion-fab>
      </SitePage>
    );
  }
}
