// tslint:disable no-implicit-dependencies
import * as TS from "typescript";

export default (ts: typeof TS) => {
  const prior = ts.findConfigFile;
  ts.findConfigFile = function findConfigFile(
    searchPath: string,
    fileExists: (fileName: string) => boolean,
    configName?: string
  ): string | undefined {
    const ret = prior.call(this, searchPath, fileExists, configName);
    console.log("findConfigFile", searchPath, configName, ret);
    return ret;
  };
};
