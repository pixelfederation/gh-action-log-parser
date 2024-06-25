# gh-action-log-parser


## update patterns file

To update patterns you need npm and nodejs installed. Check `.tool-versions` for version.


* Edit files in `patterns` directory.
* Update Changelog.md.
* Create package `npm run package`.
* Commit all changed files.
* Create 2 tags.
    * Major, minor, patch  e.g. 0.1.0.
    * Major, minor e.g. 0.1.
* Push everything.

We use 2 tags to avoid updating workflows for every change. For patches and small tweaks we bump patch version.