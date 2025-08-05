---
title: Quality control
---

<a style="display: block; margin: 0; padding: 0;" name="_quality_control"></a>

## Approach

We use 2 tools to measure and control our code quality and "Pull request" practice. Tools eliminate trivial issues like "unused vars" or even infinite discussions like "spaces vs tabs", "formatting", "lines per function", "loop nesting levels" in PRs. Those escalate pretty quickly, so lets just automate that thing and forget it :) Nobody forbids Judgment Days from time to time for our coding standards, so no worries.

## Linting

We leverage Biome for formatting and linting. Command line interface is also available. Just run the next command to see it in action:

```shell
# all workspaces
pnpm -ws lint
# with attempt to fix in all workspaces
pnpm -ws lint:fix
```

## SonarQube

SonarQube scan workflow executes the static quality control analysis and publishes results to the SonarCube service of
TomTom. See [this SonarQube project](https://sonar.tomtomgroup.com/dashboard?id=tomtom-international_maps-sdk-js_AYHTCTXCqdbqIGrKswTc).

SonarQube integration supports PR comments, so when the SonarQube workflow executes it notifies about the new issues immediately.
