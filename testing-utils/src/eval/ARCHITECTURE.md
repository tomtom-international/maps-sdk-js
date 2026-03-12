# Eval Framework Architecture

This folder contains the reusable Playwright-based eval framework shared across SDK examples.

## Goal

Provide deterministic, multi-run evaluation for agent examples by asserting:
- exact ordered tool-call sequences,
- final map state,
- optional screenshot baselines,
- token/step/timing telemetry.

## High-Level Flow

1. Example app enables eval mode with `VITE_EVAL_MODE=true`.
2. Example entrypoint wires browser hooks via `setupEvalWindowHooks(...)`.
3. Example runtime pushes lifecycle events into `EvalTelemetryRuntime`.
4. `EvalTelemetryRuntime` syncs state to `window.__evalTelemetry`.
5. Playwright runner (`runEvalSuite`) sends one or more user messages and reads telemetry from `window`.
6. Custom reporter aggregates runs and writes `eval-report-<timestamp>.json`.

## Main Modules

- `types.ts`
  - Core contracts (`EvalTelemetry`, `EvalWindow`, token usage types).
- `window-hooks.ts`
  - Exposes `__evalSendMessage`, `__evalReset`, and `mapLibreMap` on `window` in eval mode.
- `telemetry-runtime.ts`
  - Accumulates telemetry (`onUserMessage`, `onClassify`, `onStepFinish`, `onFinish`, `onSuccess`, `onError`).
 `run-suite.ts`
  - Generates Playwright tests from `EvalCase[]`.
- `reporter.ts`
  - Aggregates pass rates and metrics across runs, emits `eval-report-<timestamp>.json` with per-tool invocation counts and per-run coverage ratios.
- `report.ts`
  - Shared aggregated report contract and parsing helpers for `eval-report-<timestamp>.json` payloads.
- `compare.ts`
  - Baseline-oriented comparison helpers for multi-report analysis.
- `config.ts`
  - Shared Playwright defaults for eval execution.
- `runtime.ts`
  - Runtime-safe export surface for example app code.

## Why Window Hooks

Tests run in Node, app code runs in the browser. `window.__eval*` is the runtime bridge:
- trigger app actions (`__evalSendMessage`, `__evalReset`),
- read structured telemetry (`__evalTelemetry`),
- query map internals through `globalThis.mapLibreMap`.

These hooks are intended for eval mode only.

## Reuse Pattern for New Examples

1. Implement eval hooks in the example entrypoint (`setupEvalWindowHooks`).
2. Feed runtime events from the example controller/runtime (`EvalTelemetryRuntime`).
3. Add `e2e-tests/eval/eval-cases.ts`.
4. Add `e2e-tests/eval/agent-eval.test.ts` calling `runEvalSuite(...)`.
5. Add `playwright.eval.config.ts` via `buildEvalPlaywrightConfig(...)`.

## Public Package Surface

- `testing-utils`
  - generic map/query helpers only.
- `testing-utils/eval`
  - eval authoring helpers (`EvalCase`, `runEvalSuite`, `buildEvalPlaywrightConfig`).
- `testing-utils/eval/runtime`
  - browser/runtime-safe eval helpers (`EvalTelemetryRuntime`, `setupEvalWindowHooks`).
- `testing-utils/eval/reporter`
  - Playwright reporter entrypoint.

## Eval Explorer

The package now includes a small internal report explorer app at `testing-utils/eval-explorer/`.

It is intended for comparing multiple aggregated `eval-report-<timestamp>.json` files from any example that uses the eval framework. The explorer supports:
- drag-and-drop or file-picker upload for arbitrary local reports,
- a path-based launch flow through `testing-utils/eval-explorer/scripts/run-explorer.mjs`,
- baseline selection,
- per-case regression/improvement deltas for pass rate, token cost, step count, and wall-clock time,
- missing-case and below-threshold filtering.

### Launching the explorer

From `testing-utils/`:

```bash
pnpm eval:explorer
```

This starts the app with no launch-time reports so reports can be uploaded manually.

To start with reports from example output paths:

```bash
pnpm eval:explorer map-chat-agent
```

You can pass example names, example directories, or explicit report paths. Example names resolve to `examples/<name>` and load every `eval-report-*.json` file in that directory. The launcher resolves workspace-relative or absolute inputs, writes `eval-explorer/public/launch-reports.json`, and then starts the app.

To prepare the launch reports file without starting a dev server:

```bash
pnpm eval:explorer:prepare map-chat-agent
```

To produce a static build of the explorer:

```bash
pnpm eval:explorer:build map-chat-agent
```

### Why the launcher exists

The launcher bridges that gap by reading report files in Node and materializing a local JSON file the browser app can fetch.

### Intended report input

The explorer consumes the aggregated `eval-report-<timestamp>.json` artifacts emitted by `testing-utils/eval/reporter`. It does not currently drill into per-run telemetry or Playwright attachments.

## Non-Goals

- Not a generic production telemetry system.
- Not a replacement for `map-integration-tests`.
- Not intended to validate natural-language quality with LLM-as-judge.
