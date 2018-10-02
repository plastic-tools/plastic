// tslint:disable no-submodule-imports no-var-requires
import { IOptions } from "rollup-plugin-typescript2/dist/ioptions";
import typescript from "./typescript";
const plugin = require("rollup-plugin-typescript2");

export default (options: Partial<IOptions> = {}) =>
  plugin({
    ...options,
    /** @todo generate this based on installed loaders */
    include: ["*.(ts|tsx|css)", "**/*.(ts|tsx|css)"],
    typescript,
    tsconfigOverride: {
      compilerOptions: {
        sourceMap: true
      }
    }
  });
