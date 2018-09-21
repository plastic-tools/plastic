import { isIOS, isDesktop } from "../helpers";

export interface Props {
  win?: Window;
  name?: string;
  current?: string;
}

const SECTION_STYLES = {
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  flex: "1"
};

const TOOLBAR_STYLES = {
  flex: "0"
};

const MAIN_STYLES = {
  flex: "1",
  display: "flex",
  position: "relative"
};

export const SitePage = ({ name, current, win }: Props = {}, children: any[]) =>
  win && isDesktop(win) ? (
    <section style={SECTION_STYLES}>
      <ion-toolbar style={TOOLBAR_STYLES}>
        <ion-buttons slot="start" hidden={current === "home-page"}>
          <ion-nav-push component="home-page">
            <ion-button>
              <ion-icon slot="icon-only" name="home" />
            </ion-button>
          </ion-nav-push>
        </ion-buttons>
        {name ? <ion-title>{name}</ion-title> : null}
        <ion-buttons slot="end">
          <ion-nav-push component="settings-page">
            <ion-button
              color="primary"
              fill={current === "settings-page" ? "solid" : "default"}
              disabled={current === "settings-page"}
            >
              <ion-icon slot="icon-only" name="cog" />
            </ion-button>
          </ion-nav-push>
        </ion-buttons>
      </ion-toolbar>
      <main style={MAIN_STYLES}>{children}</main>
    </section>
  ) : (
    [
      <ion-header no-border={!(win && isIOS(win))}>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button defaultHref="/" hidden={current === "home-page"} />
          </ion-buttons>
          {name ? <ion-title>{name}</ion-title> : null}
          <ion-buttons slot="end">
            <ion-nav-push
              component="settings-page"
              hidden={current === "settings-page"}
            >
              <ion-button>
                <ion-icon slot="icon-only" name="contact" />
              </ion-button>
            </ion-nav-push>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>,
      <ion-content>{children}</ion-content>
    ]
  );
