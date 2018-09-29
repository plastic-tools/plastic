import { readFileSync } from "fs";
import { dirname } from "path";
import * as resolve from "resolve";
import patch from "./patch";

export const load = <T = any>(moduleName: string) => {
  const opts = { basedir: __dirname };
  const modulePath = resolve.sync(`typescript/lib/${moduleName}`, opts);
  const code = readFileSync(modulePath, "utf8");
  const module = { exports: {} as T };
  __filename = modulePath;
  __dirname = dirname(__filename);
  // tslint:disable-next-line no-eval
  eval(code);
  const ts = patch(module.exports);
  return ts;
};

export default load;
