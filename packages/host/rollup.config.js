import base from "../../configs/rollup.config.base";

const pkg = require("./package.json");
export default {
  ...base,
  input: "src/index.ts",
  output: [
    {
      file: pkg.module,
      format: "es",
      sourcemap: true
    }
    // {
    //   file: pkg.main,
    //   format: "cjs"
    // }
  ],
  external: Object.keys(pkg.dependencies || {})
};
