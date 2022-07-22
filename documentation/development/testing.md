---
title: Testing your changes
---

<a style="display: block; margin: 0; padding: 0;" name="_testing"></a>

## Unit testing

*Please note*, that some modules depend on others, so those should be built first with type definitions generation.

```shell
# all workspaces
npm test -ws
# specific workspaces
npm test -w core
npm test -w map
npm test -w services
```

Generation of test coverage reports

```shell
# all workspaces
npm run test:coverage -ws
# specific workspaces
npm run test:coverage -w core
npm run test:coverage -w map
npm run test:coverage -w services
```

Reports appear in workspace directories:

- ./core/coverage
- ./map/coverage
- ./services/coverage

Generated formats:

- HTML
- LCOV
- JSON
- CLOVER
