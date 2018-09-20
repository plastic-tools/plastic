import { Config } from "@stencil/core";
import { name } from "./package.json";

// use package name for namespace.
// removes illegal characters and converts / to -
const namespace = name
  .replace(/@/g, "")
  .replace(/\/+/g, "-")
  .toLowerCase();

export const config: Config = {
  namespace,
  outputTargets: [
    {
      type: "dist"
    }
  ]
};
