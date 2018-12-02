import serve from "rollup-plugin-serve";
import base from "../configs/rollup.config.base";
const production = !process.env.ROLLUP_WATCH;

export default {
  ...base,
  input: "src/index.ts",
  output: {
    file: "build/app.js",
    format: "iife",
    sourcemap: true
  },
  plugins: [
    ...base.plugins,
    !production &&
      serve({
        open: false,
        port: 8001,
        contentBase: "."
      })
  ]
};
