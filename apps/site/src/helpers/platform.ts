import { isPlatform } from "@ionic/core";

export const isDesktop = (win: Window) =>
  isPlatform(win, "desktop") && !isIOS(win);

export const isIOS = (win: Window) => isPlatform(win, "ios");
