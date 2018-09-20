Experimental work on something new.

## Development Environment Notes

`packages` are for shared libraries (that could be published to npm).
`apps` are for end apps that consume packages.

In general, everything is setup to run through yarn, which generally invokes
scripts defined in the top-level package.json:

| Script             | Usage                                             |
| ------------------ | ------------------------------------------------- |
| `test`             | Runs all tests, currently just `test.jest`        |
| `clean`            | Runs `clean` script in all packages where defined |
| `dev [PKG-NAME]`   | Runs `dev.app` in deps and `dev` in named package |
| `test.jest`        | Runs jest in each project                         |
| `build [PKG-NAME]` | Builds package, including dependencies (first)    |

vscode jest test runner is configured to invoke `test.jest` command, which is
in turn configured to look for jest configs in each package or app and run
them indpendendantly.
