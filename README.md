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
| `start [PKG-NAME]` | Runs `start.app` in package and deps              |
| `build [PKG-NAME]` | Builds package, including dependencies (first)    |
| `test.jest`        | Runs jest in each project                         |

vscode jest test runner is configured to invoke `test.jest` command, which is
in turn configured to look for jest configs in each package or app and run
them indpendendantly.
