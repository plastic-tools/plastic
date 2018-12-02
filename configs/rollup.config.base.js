import commonjs from "rollup-plugin-commonjs";
import json from "rollup-plugin-json";
import globals from "rollup-plugin-node-globals";
import resolve from "rollup-plugin-node-resolve";
import sourcemaps from "rollup-plugin-sourcemaps";
import typescript from "rollup-plugin-typescript2";
import builtins from "rollup-plugin-node-builtins";

export default {
  input: "src/index.ts",
  plugins: [
    resolve({
      extensions: [".mjs", ".js", ".jsx", ".json", ".ts", ".tsx"]
    }),
    commonjs(),
    json(),
    typescript({
      useTsconfigDeclarationDir: true
    }),
    builtins(),
    globals(),
    sourcemaps()
  ]
};
