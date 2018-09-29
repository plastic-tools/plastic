import * as fs from "fs";
import { dirname } from "path";
import * as resolve from "resolve";
// tslint:disable-next-line no-implicit-dependencies no-submodule-imports
import * as tslib from "typescript/lib/typescript";
import patch from "./__internal__/patch";
const ts = patch(tslib);

// tsc contains the entire tslib + the commandline code. strip out the lib and
// eval the contents of tsc using our patched lib.
const tscPath = resolve.sync("typescript/lib/tsc", { basedir: process.cwd() });
const code = fs
  .readFileSync(tscPath, "utf-8")
  .replace(/^[\s\S]+(\(function \(ts\) \{\s+function countLines[\s\S]+)$/, "$1")
  .replace("ts.executeCommandLine(ts.sys.args);", "");

__filename = tscPath;
__dirname = dirname(__filename);

// tslint:disable-next-line no-eval
eval(code);
(ts as any).executeCommandLine(ts.sys.args);
