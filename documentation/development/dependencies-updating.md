---
title: Updating dependencies
---

<a style="display: block; margin: 0; padding: 0;" name="_dependencies_updating"></a>

## 

It is important to keep a code base up to date. It brings security, performance, quality and feature changes. There are 2 ways of doing that in the project - manual and automated via Dependabot.

## Manual

For manual update of all dependencies at once use next commands:

```shell
# all workspaces
npm run update-dependencies -ws
# specific workspaces
npm run update-dependencies -w core
npm run update-dependencies -w map
npm run update-dependencies -w services
```

## Dependabot

Dependabot creates GitHub PRs with dependency updates per package. Remaining job for developers is to merge successful ones to the main branch.
