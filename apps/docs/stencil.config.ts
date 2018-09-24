import { Config } from "@stencil/core";

export const config: Config = {
  outputTargets: [
    {
      type: "www"
    }
  ],
  excludeSrc: ["/test/", "/__tests__/", "**/.spec."],
  globalStyle: "src/globals/app.css",
  globalScript: "src/globals/app.ts"
};
