# Eval Framework Architecture

This folder contains the reusable Playwright-based eval framework shared across SDK examples.

## Goal

Provide deterministic, multi-run evaluation for agent examples by asserting:
- tool calls,
- final map state,
- optional screenshot baselines,
- token/step/timing telemetry.

## High-Level Flow

1. Example app enables eval mode with `VITE_EVAL_MODE=true`.
2. Example entrypoint wires browser hooks via `setupEvalWindowHooks(...)`.
3. Example runtime pushes lifecycle events into `EvalTelemetryRuntime`.
4. `EvalTelemetryRuntime` syncs state to `window.__evalTelemetry`.
5. Playwright runner (`runEvalSuite`) sends one or more user messages and reads telemetry from `window`.
6. Custom reporter aggregates runs and writes `eval-report.json`.

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
  - Aggregates pass rates and metrics across runs, emits `eval-report.json`.
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

## Non-Goals

- Not a generic production telemetry system.
- Not a replacement for `map-integration-tests`.
- Not intended to validate natural-language quality with LLM-as-judge.
