import { Component, Prop } from "@stencil/core";
import { SitePage } from "../../../components/site-page";
import { isPlatform } from "@ionic/core";
import { isDesktop } from "../../../helpers";

@Component({
  tag: "settings-page",
  styleUrl: "settings-page.css"
})
export class SettingsPage {
  @Prop({ context: "window" })
  win!: Window;

  render() {
    const placement = isDesktop(this.win) ? "top" : "bottom";
    return (
      <SitePage name="Settings" current="settings-page" win={this.win}>
        <ion-tabs tabbarPlacement={placement}>
          <ion-tab label="Profile" name="settings-profile" icon="person">
            <table>
              <tr>
                <th>isDesktop</th>
                <td>{isDesktop(this.win) ? "yes" : "no"}</td>
              </tr>
              <tr>
                <th>ios</th>
                <td>{isPlatform(this.win, "ios") ? "yes" : "no"}</td>
              </tr>
            </table>
          </ion-tab>
          <ion-tab label="Security" name="settings-security" icon="lock">
            Security
          </ion-tab>
        </ion-tabs>
      </SitePage>
    );
  }
}
