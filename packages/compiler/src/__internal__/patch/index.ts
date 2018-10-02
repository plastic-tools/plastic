import patchCreateProgram from "./createProgram";
import patchFindConfigFile from "./findConfigFile";
import patchHosts from "./hosts";

/** Patches createProgram function to include hooks for compiler */
export default <T>(exp: T): T => {
  patchFindConfigFile(exp as any);
  patchCreateProgram(exp as any);
  patchHosts(exp as any);
  return exp;
};
