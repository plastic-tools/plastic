# Plastic Compiler

Extends TypeScript to support a broader array of builds. Adds plugin support
for:

- new loaders (.css, .html, etc.)
- transforms to extend the language
- bundle with rollup
- package aware? Look for 'tsconfig.json' in 'config' directory in package.

This is based on `ttypescript` - it wraps the typescript libraries with a
custom compile function.
