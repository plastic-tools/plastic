// tslint:disable-next-line no-implicit-dependencies
import * as ts from "typescript";

const isOptions = (x: any): x is ts.CreateProgramOptions =>
  !x && "object" === typeof x && !Array.isArray(x);

/** Patches createProgram function to include hooks for compiler */
export const patch = <T>(exp: T, moduleName = "(unknown)"): T => {
  const tsm: typeof ts = { ...(exp as any) };
  const coreCreateProgram = tsm.createProgram;
  if ("function" !== typeof coreCreateProgram) {
    throw new TypeError(`${moduleName} does not export createProgram`);
  }
  function createProgram(opts: ts.CreateProgramOptions): ts.Program;
  function createProgram(
    rootNames: ReadonlyArray<string>,
    options: ts.CompilerOptions,
    host?: ts.CompilerHost,
    oldProgram?: ts.Program,
    configFileParsingDiagnostics?: ReadonlyArray<ts.Diagnostic>
  ): ts.Program;
  function createProgram(
    rootNamesOrOptions: ReadonlyArray<string> | ts.CreateProgramOptions,
    options?: ts.CompilerOptions,
    host?: ts.CompilerHost,
    oldProgram?: ts.Program,
    configFileParsingDiagnostics?: ReadonlyArray<ts.Diagnostic>
  ): ts.Program {
    const opts = isOptions(rootNamesOrOptions) ? rootNamesOrOptions : null;
    const rootNames = opts ? opts.rootNames : (rootNamesOrOptions as string[]);
    const program = opts
      ? coreCreateProgram(opts)
      : coreCreateProgram(
          rootNames,
          options!,
          host,
          oldProgram,
          configFileParsingDiagnostics
        );

    const coreEmit = program.emit;
    program.emit = function emit(
      targetSourceFile?: ts.SourceFile,
      writeFile?: ts.WriteFileCallback,
      cancelllationToken?: ts.CancellationToken,
      emitOnlyDtsFiles?: boolean,
      customTransformers?: ts.CustomTransformers
    ): ts.EmitResult {
      console.log("~~~program.emit", ...((arguments as any) as any[]));
      return coreEmit(
        targetSourceFile,
        writeFile,
        cancelllationToken,
        emitOnlyDtsFiles,
        customTransformers
      );
    };
    return program;
  }
  tsm.createProgram = createProgram;
  return (tsm as any) as T;
};

export default patch;
