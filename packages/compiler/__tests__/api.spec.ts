import { existsSync } from "fs";
import { resolve } from "path";

describe("api", () => {
  for (const moduleName of [
    "typescript",
    "tsserverlibrary",
    "typescriptServices"
  ]) {
    it(`should export patched '${moduleName}'`, () => {
      const unpatched = require(`typescript/lib/${moduleName}`);
      const patched = require(`../src/${moduleName}`);
      expect(Object.keys(patched).sort()).toEqual(
        Object.keys(unpatched).sort()
      );
      expect(typeof unpatched.createProgram).toBe("function");
      expect(typeof patched.createProgram).toBe("function");
      expect(patched.createProgram).not.toBe(unpatched.createProgram);
    });
  }

  // These modules can't be tested directly because requiring them will execute
  // a tool. At least verify that they exist.
  for (const moduleName of ["tsc", "tsserver", "typingsInstaller"]) {
    it(`should have module ${moduleName}`, () => {
      const modulePath = resolve(__dirname, "..", "src", `${moduleName}.ts`);
      expect(existsSync(modulePath)).toBeTruthy();
    });
  }
});
