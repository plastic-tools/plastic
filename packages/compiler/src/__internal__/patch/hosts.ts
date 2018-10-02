import { dirname } from "path";
import * as resolve from "resolve";
// tslint:disable-next-line no-implicit-dependencies
import * as TS from "typescript";

const loader = {
  resolve(moduleName: string, containingFile: string) {
    return /\.css$/.test(moduleName)
      ? resolve.sync(moduleName, { basedir: dirname(containingFile) })
      : null;
  },

  sourceTextForFile(fileName: string) {
    return /\.css$/.test(fileName)
      ? `
    export default {
      button: "button"
    };
    `
      : null;
  }
};

/** Returns an instance of resolveModuleName to patch onto a host */
const makeResolveModuleNames = (
  ts: typeof TS,
  host: TS.ModuleResolutionHost,
  options: () => TS.CompilerOptions,
  logSource = "(unknown)"
) => (moduleNames: string[], containingFile: string, _?: string[]): any[] => {
  const resolved: Array<
    TS.ResolvedModule | TS.ResolvedModuleFull | undefined
  > = [];
  for (const name of moduleNames) {
    const found = ts.resolveModuleName(name, containingFile, options(), host);
    if (found && found.resolvedModule) {
      resolved.push(found.resolvedModule);
    } else {
      const lfound = loader.resolve(name, containingFile);
      resolved.push(
        lfound
          ? {
              resolvedFileName: lfound,
              isExternalLibraryImport: false,
              extension: TS.Extension.Ts
            }
          : undefined
      );
    }
  }
  // console.error(
  //   "~~~~~resolveModuleNames",
  //   logSource,
  //   moduleNames,
  //   // options(),
  //   resolved.map(r => r && r.resolvedFileName),
  //   new Error().stack
  // );
  return resolved;
};

/**
 * Patch methods on the compiler host to support loaders
 *
 * @param ts
 */
const patchCreateCompilerHost = (ts: typeof TS) => {
  const priorCreateCompilerHost = ts.createCompilerHost;
  ts.createCompilerHost = function createCompilerHost(
    options: TS.CompilerOptions,
    setParentNodes?: boolean
  ) {
    // console.error("~~~~createCompilerHost");
    const host = priorCreateCompilerHost.call(this, options, setParentNodes);

    // resolveModuleNames
    host.resolveModuleNames = makeResolveModuleNames(
      ts,
      host,
      () => options,
      "CompilerHost"
    );

    // getSourceFile
    const priorGetSourceFile = host.getSourceFile;
    host.getSourceFile = function getSourceFile(
      fileName: string,
      languageVersion: ts.ScriptTarget,
      onError?: (message: string) => void,
      shouldCreateNewSourceFile?: boolean
    ) {
      let ret: ts.SourceFile;
      const sourceText = loader.sourceTextForFile(fileName);
      // console.error("~~~~~~~~~~~~getSourceFile", fileName, !!sourceText);
      if (sourceText) {
        ret = ts.createSourceFile(
          fileName,
          sourceText,
          languageVersion,
          false,
          ts.ScriptKind.TS
        );
      } else
        ret = priorGetSourceFile.call(
          this,
          fileName,
          languageVersion,
          onError,
          shouldCreateNewSourceFile
        );
      return ret;
    };

    return host;
  };
};

/**
 * Patch methods on LanguageServiceHost to support loaders
 * @param ts
 */
const patchLanguageService = (ts: typeof TS) => {
  const priorCreateLanguageService = ts.createLanguageService;
  ts.createLanguageService = function createLanguageService(
    host: TS.LanguageServiceHost,
    documentRegistry?: TS.DocumentRegistry,
    syntaxOnly?: boolean
  ): TS.LanguageService {
    // console.error("~~~~createLanguageService", new Error().stack);
    if (!host.fileExists) host.fileExists = ts.sys.fileExists;

    // resolveModuleNames
    host.resolveModuleNames = makeResolveModuleNames(
      ts,
      host as TS.ModuleResolutionHost,
      () => host.getCompilationSettings(),
      "LanguageServiceHost"
    );

    const priorGetScriptKind = host.getScriptKind;
    host.getScriptKind = function getScriptKind(path: string) {
      let ret = priorGetScriptKind ? priorGetScriptKind.call(this, path) : null;
      if (!ret && loader.sourceTextForFile(path)) ret = TS.ScriptKind.TS;
      // if (/\.css$/.test(path)) console.error(`~~~ getScriptKind`, path, ret);
      return ret;
    };

    const priorGetScriptSnapshot = host.getScriptSnapshot;
    host.getScriptSnapshot = function getScriptSnapshot(path: string) {
      const text = loader.sourceTextForFile(path);
      const ret = text
        ? ts.ScriptSnapshot.fromString(text)
        : priorGetScriptSnapshot.call(this, path);
      // if (/\.css$/.test(path))
      //   console.error(`~~~ getScriptSnapshot`, path, ret);
      return ret;
    };

    return priorCreateLanguageService.call(
      this,
      host,
      documentRegistry,
      syntaxOnly
    );
  };
};

/** Patch host creation points */
export default (ts: typeof TS) => {
  patchCreateCompilerHost(ts);

  // patch createWatchCompilerHost()
  const priorCreateWatchCompilerHost = ts.createWatchCompilerHost;
  ts.createWatchCompilerHost = function createWatchCompilerHost<
    T extends TS.BuilderProgram
  >(
    firstArg: string | string[],
    options: TS.CompilerOptions | undefined,
    ...extra: any[]
  ) {
    // console.error("~~~~createWatchCompilerHost");
    const host: TS.WatchCompilerHost<any> = priorCreateWatchCompilerHost.call(
      this,
      firstArg,
      options,
      ...extra
    );
    host.resolveModuleNames = makeResolveModuleNames(
      ts,
      host,
      /** @todo deal with case where no options are passed */
      () => (host as any).options || {},
      "WatchCompilerHost"
    );
    return host as any;
  };

  patchLanguageService(ts);
};
