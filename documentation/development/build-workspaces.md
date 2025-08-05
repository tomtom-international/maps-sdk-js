---
title: Build workspaces
---

<a style="display: block; margin: 0; padding: 0;" name="_build_workspaces"></a>

## Workspaces

Repository is organised with multiple workspaces that have to be build independently. See the "[Working with workspaces](https://docs.npmjs.com/cli/v8/using-npm/workspaces)" article.

## Build the workspaces

```shell
# all workspaces
pnpm build:full -ws
# specific workspaces
pnpm build:full -w core
pnpm build:full -w map
pnpm build:full -w services
```

Next build directories will appear:

- ./core/.rollup.cache
- ./core/dist
- ./map/.rollup.cache
- ./map/dist
- ./services/.rollup.cache
- ./services/dist

Each ```./dist``` directory content is the same:

- ./services/dist/src - contains type definition of modules
- ./services/dist/index.d.ts - main type definition
- ./services/dist/services.cjs.js - CommonJS package
- ./services/dist/services.cjs.min.js - CommonJS package
- ./services/dist/services.es.js - ES module package
- ./services/dist/services.es.min.js - ES module minified package
- source maps for all bundles
