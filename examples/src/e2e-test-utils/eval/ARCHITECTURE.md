# Eval Framework Architecture

This folder contains a reusable Playwright-based eval framework for SDK examples.

## Goal

Provide deterministic, multi-run evaluation for agent examples by asserting:
- tool calls,
- map state,
- optional screenshots,
- token/step/timing telemetry.

## High-Level Flow

1. Example app enables eval mode with `VITE_EVAL_MODE=true`.
2. Example entrypoint wires test hooks via `setupEvalWindowHooks(...)`.
3. `ChatController` pushes lifecycle events into `EvalTelemetryRuntime`.
4. `EvalTelemetryRuntime` syncs state to `window.__evalTelemetry`.
5. Playwright runner (`runEvalSuite`) sends prompts and reads telemetry from `window`.
6. Custom reporter aggregates runs and writes `eval-report.json`.

## Main Modules

- `types.ts`
  - Core contracts (`EvalTelemetry`, `EvalWindow`, token usage types).
- `eval-window-hooks.ts`
  - Exposes `__evalSendMessage`, `__evalReset`, and `__maplibreMap` on `window`.
- `eval-telemetry-runtime.ts`
  - Accumulates telemetry (`onClassify`, `onStepFinish`, `onFinish`, `onSuccess`, `onError`).
- `map-queries.ts`
  - Map assertions helpers based on `window.__maplibreMap` + `page.evaluate`.
- `run-eval-suite.ts`
  - Generates Playwright tests from `EvalCase[]`.
- `eval-reporter.ts`
  - Aggregates pass rates and metrics across runs, emits report.
- `build-eval-config.ts`
  - Shared Playwright defaults for eval execution.

## Why Window Hooks

Tests run in Node, app code runs in browser. `window.__eval*` is the runtime bridge:
- trigger app actions (`__evalSendMessage`, `__evalReset`),
- read structured telemetry (`__evalTelemetry`),
- query map internals (`__maplibreMap`).

These hooks are intended for eval mode only.

## Reuse Pattern for New Examples

1. Implement window hooks in the example entrypoint (`setupEvalWindowHooks`).
2. Feed runtime events from the example's chat/agent controller (`EvalTelemetryRuntime`).
3. Add `e2e-tests/eval/eval-cases.ts`.
4. Add `e2e-tests/eval/agent-eval.test.ts` calling `runEvalSuite(...)`.
5. Add `playwright.eval.config.ts` via `buildEvalPlaywrightConfig(...)`.

## Non-Goals

- Not a generic production telemetry system.
- Not a replacement for map-integration-tests.
- Not intended to validate natural-language quality with LLM-as-judge.
