// tslint:disable no-implicit-dependencies
import * as TS from "typescript";

export default (ts: typeof TS) => {
  // patch emit. currently a noop
  const priorCreateProgram = ts.createProgram;
  ts.createProgram = function createProgram(...args: any[]): ts.Program {
    console.error("~~~~createProgram");
    const program = priorCreateProgram.apply(this, args);
    const priorEmit = program.emit;
    program.emit = function emit(
      targetSourceFile?: ts.SourceFile,
      writeFile?: ts.WriteFileCallback,
      cancelllationToken?: ts.CancellationToken,
      emitOnlyDtsFiles?: boolean,
      customTransformers?: ts.CustomTransformers
    ): ts.EmitResult {
      return priorEmit(
        targetSourceFile,
        writeFile,
        cancelllationToken,
        emitOnlyDtsFiles,
        customTransformers
      );
    };
    return program;
  };
};
