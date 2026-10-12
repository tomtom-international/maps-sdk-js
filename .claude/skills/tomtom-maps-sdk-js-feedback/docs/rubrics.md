# What qualifies as feedback

Every rubric answers one question: did the SDK, or its documentation, cost the developer something
it should not have?

- Not "was this hard" — geospatial work is hard.
- The test: would a correct, well-documented SDK have let you write the code right the first time?
- A finding needs a rubric, a severity and evidence. Without evidence it is an opinion, and the team
  cannot act on it.

---

## `unclear` — the SDK did not tell you what you needed

The information existed somewhere, but not where you looked, so your first attempt was wrong.

Signals:

- You read SDK source, `.d.ts` files or the changelog to answer a usage question.
- You guessed a parameter name, enum value, unit or coordinate order.
- The types accepted your code and it failed at runtime.
- The AI skill doc, the online guide and the API reference disagreed.
- You needed a second attempt after reading the relevant page end to end.

Evidence: the source you consulted, what it led you to write, and the sentence that would have
saved the attempt.

## `cannot-express` — the API cannot do what was asked

The request is reasonable and within the SDK's stated scope, but the public API has no way to
express it, or the only way is disproportionate.

Signals:

- You reached into `mapLibreMap` to adjust something an SDK module already draws.
- You reimplemented SDK behaviour — re-filtering results, recomputing geometry, re-styling an
  SDK-owned layer — because no option exposed it.
- A configuration is all-or-nothing where the goal needs it per item.
- You subscribed to an event only to undo what the SDK just did.
- The only path was a private field, a cast, or an export documented as internal.

Evidence: the goal in one sentence, every SDK call of the workaround (it is the specification of
the missing API), and the shape of the option or method that would replace it.

Not this rubric: using MapLibre directly for a genuinely custom layer. That is a supported escape
hatch.

## `showcase-mismatch` — the working code is not the showcased code

What the docs, examples, AI skill or README present as the way to do something is not what had to
be written.

Signals:

- A documented snippet did not run.
- An example omits a step that is mandatory in practice (a required `await`, a config call, CSS).
- A guide shows an option, method or type that does not exist in the installed version.
- The skill's stated convention contradicts what the SDK does.

Evidence: the exact source — file, page URL or skill doc name — quoted next to the code that
worked. Name the difference precisely; "the docs are wrong" cannot be triaged.

## `broken` — correct usage fails

You used the API as documented, and it errored, crashed, hung, returned a wrong result, or failed
to type-check.

Signals:

- An unhandled exception or rejection from inside the SDK.
- A result that contradicts the documented return type or contract.
- A type error on code that matches the documented signature.
- Different behaviour between runs on identical input.
- A leaked handler or memory across style changes or module teardown.

Evidence: a minimal reproduction, the verbatim error and stack, the SDK version, and the documented
contract it violates. Strip the reproduction until only SDK calls remain; if the bug disappears,
it was in the app code.

---

## Threshold

Report only when at least one holds:

- it took more than one attempt to get right;
- you only got it right by reading something a developer using the public documentation could not
  be expected to read.

Anything else is the SDK working as intended.

## Do not report

- Your own mistakes: a typo, a forgotten `await`, a wrong import fixed on reading the error.
- Documented caveats and known limitations. Check the guide and the changelog first. The SDK is a
  `0.x` public preview, so documented breaking changes between minor versions are expected.
- Upstream behaviour — MapLibre GL, the browser, the bundler, the network — unless the SDK could
  reasonably have shielded the developer; if so, say that explicitly in the report.
- Taste: naming or API style you would have chosen differently. If it caused a wrong first attempt,
  it is `unclear`, with evidence.
- Service and data questions — map data, POI coverage, routing quality, quota, billing, API-key
  provisioning. Point the developer to TomTom support instead.
- Anything the developer declined to report.

## Severity

Judge by what it cost, not by how annoying it felt.

| Severity | Meaning |
|---|---|
| `blocking` | The goal cannot be reached through the public API. |
| `high` | Reachable only through a workaround, or after a wrong turn that a doc fix would have prevented. |
| `low` | Cost one extra attempt; the documented path exists and works once found. |
