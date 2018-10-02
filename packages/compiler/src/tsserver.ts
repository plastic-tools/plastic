// tslint:disable
import patch from "./__internal__/patch";
module.exports = patch(require("typescript/lib/tsserver"));

// tslint:disable-next-line no-implicit-dependencies no-submodule-imports
// import * as ts from "typescript/lib/tsserver";
// import load from "./__internal__/load";
// export = load<typeof ts>("tsserver");
// import patch from "./__internal__/patch";
// export = patch(ts);
