// tslint:disable-next-line no-implicit-dependencies no-submodule-imports
import * as ts from "typescript/lib/tsserver";
import patch from "./__internal__/patch";
export = patch(ts);
