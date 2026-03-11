# Eval Report Explorer

Small internal webapp for comparing multiple aggregated eval reports produced by `testing-utils/eval/reporter`.

## Start

From `testing-utils/`:

```bash
pnpm eval:explorer
```

Then upload one or more `eval-report-<timestamp>.json` files.

## Start With Preloaded Reports

```bash
pnpm eval:explorer map-chat-agent
```

You can pass one or more example names, example directories, or explicit report files. Example names resolve to `examples/<name>` and preload every `eval-report-*.json` file in that directory. The launcher writes a local preload manifest and starts the explorer.

## Build

```bash
pnpm eval:explorer:build map-chat-agent
```

## Current Scope

- Compare multiple reports against a selected baseline
- Summary cards for each visible report
- Case-level regression and improvement surfacing
- Filters for below-threshold, regressions, improvements, missing cases, and search by case id
- Side-by-side case detail cards with screenshot counts and tool frequency

## Current Limits

- Consumes only the aggregated `eval-report-<timestamp>.json` artifacts
- No per-run telemetry drill-down
- No screenshot artifact browser