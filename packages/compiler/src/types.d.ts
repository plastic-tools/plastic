declare module "typescript/lib/cancellationToken";
declare module "typescript/lib/tsc";
declare module "typescript/lib/tsserver";
declare module "typescript/lib/typescriptServices" {
  // omitted from typescriptServices.d.ts even though it is actually exported
  export = ts;
}
declare module "typescript/lib/typingsInstaller";
