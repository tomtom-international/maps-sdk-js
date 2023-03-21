---
title: CI/CD
---

<a style="display: block; margin: 0; padding: 0;" name="_ci_cd"></a>

## Approach

CI/CD of this project follows feature branches approach. It builds sdk versions for all branches and release tags. It also releases those to a NPM repository under npm "tags" (aliases). Alias names correspond branch/tag names.

## Releasing branches

In order to have your branch tested, our ci/cd builds and releases a package with aliases, so it's version looks like this:

```shell
# Incremental builds based on the same 1.2.2 version. (Yes, 1.2.2, not 1.2.3) Those versions below are basically release candidates for 1.2.3:
1.2.3-my-fix.0
1.2.3-my-fix.1
1.2.3-my-fix.2
# After the base version update to 1.3.0 the aliased versions will be re-calculated:
1.3.1-my-fix.0
1.3.1-my-fix.1
1.3.1-my-fix.2
```

After publishing of such package in the NPM repository it could be installed:

```shell
# installation using the alias "my-fix"
npm i --save @anw/maps-sdk-js@my-fix
# installation using the exact version of alias "my-fix"
npm i --save @anw/maps-sdk-js@1.2.3-my-fix.1
```

Basically, all you need to do is just pushing your code to branches. Everything else happens automatically.

## Releasing a new "latest" version

maps-sdk-js uses the "standard-version" tool for calculation of version increment. Calculation happens according to the "conventional commits". See [conventionalcommits.org](https://www.conventionalcommits.org) website for explanation.

CHANGELOG.md file is generated and updated by the standard-version tool automatically.

```shell
# dry run mode to check the version number and release notes
npm run release:dry
# the actual release
npm run release
```

Please note, that releasing script works only in the main git branch. So make sure you've created PR, passed review and build checks before releasing anything. Anyway, it will throw an error, so no worries.

Version numbers for the "latest" npm tag look like this - 1.2.3, 2.3.0 etc. Correspondent git tags are - v1.2.3 and v2.3.0.

## Extra features

Along with the main purpose the CI/CD does code quality checks, commit checks and Slack notifications.

## GitHub Actions

GitHub actions are used to organise Continuous Integration and Delivery via workflows. Find those in the ```.github/workflows``` directory. Currently, we have 4 of those:

- Feature branch build
- Release tag build
- Feature branch delete
- SonarQube scan

First 2 do next actions:
- checkout git repository
- install dependencies
- test
- build
- release
- notify Slack channel

Deletion workflow does:
- checkout git repository
- remove the alias
- notify Slack channel

SonarQube scan workflow executes the static quality control analysis and publishes results to the SonarCube service of TomTom. See  more details in the "Quality control" section.
