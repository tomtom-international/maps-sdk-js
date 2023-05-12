---
title: Quality control
---

<a style="display: block; margin: 0; padding: 0;" name="_quality_control"></a>

## Approach

We use 2 tools to measure and control our code quality and "Pull request" practice. Tools eliminate trivial issues like "unused vars" or even infinite discussions like "spaces vs tabs", "formatting", "lines per function", "loop nesting levels" in PRs. Those escalate pretty quickly, so lets just automate that thing and forget it :) Nobody forbids Judgment Days from time to time for our coding standards, so no worries.

## Prettier and ESLint

These tools are working together and integrate with the most popular IDE's like Intellij IDEA. Command line interface is also available. Just run the next command to see it in action:

```shell
# all workspaces
npm run -ws lint
# with attempt to fix in all workspaces
npm run -ws lint:fix
```

## SonarQube

SonarQube scan workflow executes the static quality control analysis and publishes results to the SonarCube service of
TomTom. See [this SonarQube project](https://sonar.tomtomgroup.com/dashboard?id=tomtom-international_maps-sdk-js_AYHTCTXCqdbqIGrKswTc).

SonarQube integration supports PR comments, so when the SonarQube workflow executes it notifies about the new issues immediately.


## Pre-commit hooks

We use [Husky](https://github.com/typicode/husky) together with [lint-staged](https://github.com/okonet/lint-staged)
to set pre-commit hooks for staged files. This helps us catch linting, formatting and spelling errors before they're pushed
on the repo, making our PR reviews easier and keeping small mistakes out of the codebase.

