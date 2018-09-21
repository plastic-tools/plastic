import { Component, Prop } from "@stencil/core";
import { isDesktop, isIOS } from "../../helpers";

@Component({
  tag: "site-root"
})
export class Root {
  @Prop({ context: "window" })
  win!: Window;

  render() {
    return (
      <ion-app swipe-gesture={this.win && isIOS(this.win)}>
        <ion-router use-hash="false">
          <ion-route url="/settings" component="settings-page">
            <ion-route url="/profile" component="settings-profile" />
            <ion-route url="/security" component="settings-security" />
          </ion-route>
          <ion-route url="/" component="home-page" />
        </ion-router>
        <ion-nav animated={!isDesktop(this.win)} />
      </ion-app>
    );
  }
}
