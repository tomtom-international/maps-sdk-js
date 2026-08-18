# Agent Toolkit — Classifier & system prompt

Tuning the intent classifier and shaping the system prompt.
See [base reference](../agent-toolkit.md) for setup, [data-tools.md](./data-tools.md) for how scoping feeds off the classifier.

---

## Classifier

Default classifier is LLM-based and reuses your main `model`. To use a cheaper classifier model:

```ts
createMapAgent(map, {
    model: openai('gpt-4o'),
    classifier: createDefaultClassifier({ model: openai('gpt-4o-mini') }),
});
```

Disable entirely (all tools always exposed; scopable tools fall back to terse unscoped surface):

```ts
createMapAgent(map, { model, classifier: false });
```

A classifier is just a function: `(ctx: ClassifierContext) => Promise<ClassificationResult | null>`.
Return `null` to fail-open.
Custom classifiers receive every tool's `ToolMetadata` (name + `classificationPrompt` + `scopePrompt` + tags + dependsOn) —
useful for rule-based selection.

`ClassificationResult` carries:

```ts
type ClassificationResult = {
    activeToolNames: string[];
    toolScopes?: Record<string, unknown>;    // per-tool scope, validated in prepareStep
    timeMs: number;
    usage: { inputTokens; outputTokens; totalTokens };
};
```

Tune a custom tool's classification by editing its `classificationPrompt`:

```ts
// Too broad — fires on any location query
classificationPrompt: 'Get fleet vehicle data.'

// Precise — fires only when an explicit ID is mentioned
classificationPrompt: 'Locate a fleet vehicle by its ID (e.g. "TT-001"); not for general location queries.'
```

For a scopable custom tool, set `scopePrompt` describing the scope shape;
the default classifier appends a "SCOPE:" hint per tool in its system prompt
and requires the scope to be emitted whenever the tool is picked.

---

## System prompt

The base prompt is split into named, individually-overridable sections (`SystemPromptSection`):
`identity`, `capabilities`, `rejectionRules`, `responseFormatting`, `dataConfidence`, `toolExecution`, `sessionState`.
Their default bodies are exported as `SYSTEM_PROMPT_SECTIONS`; `BASE_SYSTEM_PROMPT` is the assembled default.
(Per-tool mechanics — coordinate order, "near me" vs "in this area" — live in the tool descriptions and classifier,
not the base prompt.)

Four ways to shape it, least to most invasive —
prefix, suffix, and section overrides all compose together; a full string replaces everything:

```ts
// 1 + 2. Prepend a preamble, append instructions (base prompt stays live)
createMapAgent(map, {
    model,
    systemPromptPrefix: 'You work for Acme Logistics.',           // heading-less preamble at the top
    systemPromptSuffix: 'Always use metric units. Respond in Dutch.', // under "ADDITIONAL INSTRUCTIONS:"
});

// 3. Override named sections — omitted sections keep their defaults; heading is added for you
createMapAgent(map, {
    model,
    systemPrompt: {
        identity: 'You are a delivery fleet dispatcher built on the TomTom map.',
        responseFormatting: 'Reply in Dutch, metric units, one short paragraph.',
    } satisfies SystemPromptSectionOverrides,
});

// Extend a section instead of replacing it: read its default and derive a new value
createMapAgent(map, {
    model,
    systemPrompt: {
        rejectionRules: `${SYSTEM_PROMPT_SECTIONS.rejectionRules}\n- Decline weather questions.`,
    },
});

// 4. Full replacement (ignores prefix/suffix) — extend BASE_SYSTEM_PROMPT rather than starting blank
createMapAgent(map, {
    model,
    systemPrompt: BASE_SYSTEM_PROMPT + `

ADDITIONAL INSTRUCTIONS:
- This is a logistics application. Prioritize route efficiency over scenery.
- When a vehicle ID is mentioned, call getFleetVehicle before anything else.
`,
});
```

`composeSystemPrompt(overrides)` does the same composition as passing the object to `systemPrompt`,
returning the assembled string if you need it elsewhere (logging, diffing, token-budget checks).
`systemPromptPrefix` / `systemPromptSuffix` are ignored only when `systemPrompt` is a full string.
