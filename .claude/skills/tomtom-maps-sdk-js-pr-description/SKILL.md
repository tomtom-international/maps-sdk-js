---
name: tomtom-maps-sdk-js-pr-description
description: CONTRIBUTOR skill (editing this monorepo, not building an app with the SDK). Write, rewrite or compact a pull request title and description for the Maps SDK monorepo. Use when opening a PR, when the user asks to update, compact, improve or "add a diagram to" a PR body, when a PR sits in a stack and reviewers need to know what to read, or when a rename left a body's links or claims stale. Covers the required section order (Problem Statement, then Solution Overview, then the diff in sections, then one compact Caveats section and an optional Next steps), a body of bullets rather than paragraphs — nested bullets the moment a bullet needs a second sentence, per-section size ceilings, bold on the keyword a bullet turns on, a closing cut pass — dense linking with the Jira keys on the top line, a wiki page on first mention of a topic and every named file to its own PR diff rather than a blob, caveats scoped to this diff's own solution, a Tests section that names the reviewer's hot spots instead of restating what CI reports, the conventional-commit title rules commisery validates, where a mermaid diagram belongs and how to keep it renderable, embedding example and e2e captures, and publishing with gh pr edit.
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

The description is the **review artifact**. Most of these PRs sit in a stack, so a reviewer lands on
one of seven and has to reach the solution without reading the other six: state the problem, then
the shape of the answer, then walk the diff with links. Write for that reader, not as a changelog of
what you did.

[`tomtom-maps-sdk-js-preflight`](../tomtom-maps-sdk-js-preflight/SKILL.md) runs first and proposes
the title in its report; this skill writes the body.

## Compact and technical

**Prose is the failure mode.** Keep every load-bearing fact — a measurement or probe table, a
bundle delta, a breaking-change row, an open item, a judgement we own — and cut the sentences
around it. Tables, bullets and code carry facts at a fraction of the words; a paragraph restating a
table is noise. No sentence that only announces the next one, no scene-setting, no recap of the
section above.

**The body is bullets.** Not "bullets by default" — a section opens on its list, its table, its
fence or its diagram, and a paragraph is the exception that has to earn itself:

- **One idea per bullet, one line long.** The moment a bullet needs a second sentence it **nests**:
  the claim stays on the parent, the number, the qualification, the alternative go under it.
  - Two levels, never three. A third level is a section of its own, or a table.
- **A framing line, at most one per section**, and only where no bullet can carry it — a trade-off
  with connectives, a causal chain. Never two of them together, never three lines long.
- **A list of one bullet is a line**; a list of ten is two lists, or a table.

**Bold carries the scan.** A reviewer reads the bolded words first and the rest only where those
land, so bold the word the bullet turns on — the mechanism, the file's role, the verdict:

- **One to three words per bullet**, never a whole sentence, never two bolds competing in one line.
- The **term being introduced**, on first use, with its one-line definition after it.
- Not in a table cell that repeats its column, and not on a heading — it already stands out.

**Budgets, as ceilings rather than targets.** State the fact and stop; an under-budget section is a
good section, not an unfinished one.

| Part | Ceiling |
|---|---|
| Top line (stack, ticket) | one line |
| Problem Statement | ~5 bullets, plus the evidence table or diagram |
| Solution Overview | ~5 bullets, or a diagram |
| A diff section | as long as its mechanism needs — the one place detail is welcome |
| Screenshots, Breaking changes | the table or the image, one line of context at most |
| Tests | ~3 bullets on the hot areas, or no section at all |
| Caveats | 3–5 bullets, one line each |
| Open items, Next steps | bullets only, no preamble sentence |

**Verbosity rises through the body.** Problem Statement and Solution Overview are the tightest
sections in it — the problem and its evidence, then the shape of the answer. The diff sections carry
the detail, the deepest ones most of it. An Overview longer than the sections under it means the
body is upside down.

**Current state only** — the body describes the diff at the head SHA. No "first we tried", no
superseded-approach table, no phase narrative, no account of how the branch changed under review.

In a stack, the boilerplate every PR repeats (what a "knob" is, where a module boundary sits, that
the breaking changes are sanctioned) is one line with a link, not a blockquote per PR. Define jargon
on first use, in one line.

**Then cut.** Read the finished draft once for deletions only, and expect to lose a fifth of it:

- a paragraph that survived the bullet pass without earning it;
- a sentence that restates its own heading, or the table under it;
- an adjective, an intensifier or a "simply" doing no work;
- the second example where the first already lands;
- a clause hedging a claim the Caveats already carry;
- a bullet a CI check already reports.

## The title

`commisery-action` validates the **title only** — the repo squash-merges, so the title becomes the
commit message on `main` and the feature-branch commits are discarded
([`.github/workflows/commisery.yml`](../../../.github/workflows/commisery.yml)).

- Conventional commit: `type(scope): subject`, scope = the workspace (`map`, `core`, `services`,
  `examples`, `docs`, or the plugin name).
- **80 characters, subject line included** (commisery's default rule C014; this repo adds no
  `.commisery.yml` override). It's the one CI failure with nothing to do with the code, so count it
  before pushing.
- `!` before the colon for a breaking public change — `feat(map)!: …`. The PR's
  changeset carries the bump: `minor` pre-1.0.
- Fix a title with `gh pr edit <n> --title '…'`.

## Section order

Fixed for the first three; the rest appear only when they have something to say.

1. **Top line**, when there is a stack or a ticket — one line above everything: `Sits on #2090`
   plus what the diff against that parent contains, because that's all the reviewer is looking at,
   and the **Jira key**, linked. The *only* place either is discussed.
2. **`## Problem Statement`** — always, always first. What is wrong today, who it hurts, and the
   evidence that it's real, in that order and in as few bullets as each takes. Open in the shape
   "The problem to solve:", never with a verdict. First ideal place for a diagram: the broken
   lifecycle, the two writers fighting, the request that dies at an early return.
3. **`## Solution Overview`** — the shape of the answer before any file is named, and **the
   tightest section in the body**: a handful of bullets, or a diagram. Name the mechanism and what
   it replaces; the reviewer gets the how from the diff sections. Include it whenever the change
   has an architecture — a new mechanism, a lifecycle change, a stack phase. A one-file fix goes
   straight to the diff. Second ideal place for a diagram, and usually the better one.
4. **The diff, in sections** — one per mechanism or area, and **where the detail belongs**: as long
   as the mechanism needs, still bullets. Order them the way a reviewer has to read them, the
   mechanism the rest depends on first. A section that has become a wall of prose is two sections,
   or a table.
5. **Screenshots** — a new or updated example, or an e2e capture, whenever the change is visual.
6. **Breaking changes**, as a table (`Was` / `Is now` / `Why`), whenever the title carries `!`.
   Before 1.0 we rename in place and update every consumer, so there's no migration note to write.
7. **Tests** — the reviewer's hot areas only, and often no section at all.
8. **Open items**, if any are still open.
9. **`## Caveats`** — one section, here, whenever there is a doubt to own.
10. **`## Next steps`** — only when there is a plan beyond this PR; last before the footer.
11. The attribution footer.

## Tests

**CI already reports what ran.** The suites, their counts and their verdicts sit on the checks tab
of the same page the body is on, and preflight's "Not run" list is a working note, not a section.

So this section is only what CI cannot say — the **hot areas**, where a reviewer should look
hardest:

- what to **exercise by hand** to believe it — the example to open, the interaction to repeat;
- where a regression would **hide** — a surface the change reaches indirectly, a path only one
  browser or one style takes;
- a test that is **thin on purpose**, and what it therefore doesn't cover.

Omit the section when the diff has none of these. Never a suite list, a pass count, a "not run
locally, CI covers it" line, or a narration of the run. Something CI cannot cover **at all** is a
caveat, not a test note.

## Caveats

**One `## Caveats` section, near the end** — after Open items, immediately before Next steps or the
footer. Nowhere else: no list closing the Solution Overview, no caveat line at the head of a diff
section. The reviewer has the model by then, and every doubt is in one place they can scan.

**Three to five bullets, one line each.** One nested child where a bullet needs the alternative
spelled out; a caveat that needs a paragraph is an Open item, or it isn't a caveat. A long caveat
reads as an excuse.

**Every caveat is about the solution in this diff.** What counts:

- a **judgement call**, with the alternative named;
- a claim we **can't verify here**, and what would verify it;
- a **side effect** a reviewer wouldn't look for — a public identifier spent, a name that becomes
  API, a behaviour other tools inherit, a count that starts drifting on merge;
- a mechanism that is only **probably** enough.

What doesn't:

- **Another PR** — what a parent or sibling still owes, what a later phase fixes, what the merge
  order implies. The top line carries that; a caveat about someone else's diff is not a caveat.
- **The history of this PR** — an approach dropped after feedback, a commit that fixed an earlier
  commit, a count that has changed since the first push. The body describes the head SHA.
- A gap this PR still means to close (**Open items**), work that follows (**Next steps**), or a risk
  invented for balance.

A caveat carries the same evidential standard as the rest of the body. Keep ownership in the hedge —
"we chose … because", "we can't prove this until".

## Diagrams

**Zero to N mermaid diagrams, anywhere in the body** — but they pay for themselves in the Problem
Statement and the Solution Overview, where the reader is still building the model. Deeper in the
diff walk, a diagram usually restates the section above it.

GitHub renders ```` ```mermaid ```` fences natively, so hosting one costs nothing — which is why an
unearned one is worth refusing. It earns its place for:

- an awaited lifecycle or an ordering contract (`sequenceDiagram`);
- a before/after where two writers collapse onto one implementation;
- a pipeline with a guard that branches;
- one source fanning out to N generated consumers;
- a table-driven factory split (*these* go through the table, *those* are bespoke, *these* are
  deliberately undrawn);
- a decision walk — what the code asks at each node, in order.

It does **not** earn its place next to an evidence table that already says it: a three-row ownership
rule, a per-branch measurement, a support matrix. A diagram restating a table is a second thing to
keep in sync.

Label rules, or the block silently fails to render: quote every label (`A["…"]`), no `#` (mermaid
reads it as an entity escape), `&lt;`/`&gt;` for angle brackets, `<br/>` for a line break. You
**cannot** render mermaid locally — GitHub does it client-side — so check the fences by eye and say
in your report that the diagrams are unproven until the user opens the PR.

## Links

**Link rather than explain.** A linked term costs the reviewer one click and the body four words;
the explained one costs a paragraph and goes stale. Three kinds carry most of a body:

| Kind | Where | Form |
|---|---|---|
| **Jira** | the top line only | `[LSI-1118](https://tomtom.atlassian.net/browse/LSI-1118)` |
| **Wiki** (Confluence) | first mention of the topic | `[Routing GA](https://tomtom.atlassian.net/wiki/spaces/LSI/pages/2407891825)` |
| **A file this PR changes** | every mention of it | its own diff anchor on the **Files changed** tab |

**Jira, if any.** The key comes from the branch (`lsi-162/…`), a commit message or the user — never
invented, and never repeated further down the body. Several keys are still one line.

**Wiki for the topics, not the diff.** The plan page behind a phase, the glossary entry for the
jargon a stack repeats, the design page where a deferred decision lives: one line defining the term
plus the link, rather than a blockquote per PR. Link a page once.

**Every file the body names, linked** — if the PR touches it, its mention is a diff link, in the
prose as well as in a "Start here" line. Two commands below dump the anchors for the whole PR.

**"Start here" is the reading order, and stays short.** A file earns that line when it carries the
core logic, when the rest of the diff depends on it, or when it is where the design decision lives.
Never more than three, per section, not one flat list at the top.

**Link the diff, not the file.** The reviewer is reading a pull request, so a link to a file this PR
changes goes to that file on the **Files changed** tab, where the change is highlighted and they can
comment on a line. A blob link drops them into the finished file with the change invisible — the
wrong artifact, however well it's pinned:

```markdown
Start here: [`StylingModule.ts`](https://github.com/tomtom-international/maps-sdk-js/pull/2092/files#diff-2c4796d4…) · [`knobCatalogue.ts`](https://github.com/tomtom-international/maps-sdk-js/pull/2092/files#diff-a66a0a83…)
```

The anchor is `diff-` plus the **SHA-256 of the repo-relative path**, which is the id GitHub gives
each file on that tab — computed, never copied out of a browser:

```bash
# every path in the PR with its anchor — link-paste from this, and it doubles as the "is the path
# still in the PR?" check. Never name the loop variable `path`: zsh ties it to $PATH and the
# rest of the pipeline loses its commands
gh pr view <n> --json files --jq '.files[].path' | while read -r filePath; do
    printf '%s\tdiff-%s\n' "$filePath" "$(printf '%s' "$filePath" | shasum -a 256 | cut -d' ' -f1)"
done
gh pr view <n> --json files --jq '.files[] | "\(.additions + .deletions)\t\(.path)"' | sort -rn
```

A diff link carries no SHA, so it never rots on a push. What it does need is that the path is still
**in** the PR — the second command is that check. A path the PR doesn't touch has no anchor on the
tab, and a link to it lands silently at the top of the file list instead of erroring.

**A blob permalink is the exception**, for what a diff can't carry: a file this PR does *not* change
that the reviewer still has to read, a line range (`#L192`), or an image (`?raw=true`, see
*Screenshots*). Pin those at the head SHA, never at a branch name — a branch link rots on the next
push and then serves code the body doesn't describe — and re-verify each before republishing.

```bash
gh pr view <n> --json headRefOid --jq .headRefOid    # the sha a blob link or an image pins to
# quote the URL — zsh treats the unquoted `?` as a glob and refuses with "no matches found"
gh api "repos/tomtom-international/maps-sdk-js/contents/<path>?ref=<sha>" --jq .content \
  | base64 -d | sed -n '190,195p'
```

A section whose files are mechanical — a rename threaded through call sites, a fixture, a snapshot, a
generated file — gets **no "Start here" line at all**; say it's mechanical instead. That line is the
reviewer's reading order, and everything mechanical is off it — the file names it does mention are
still links.

**Most critical first**: the file the rest hangs off, then what adopts it; a generator before what it
generates. Churn picks candidates, never the order — the largest diff is often the rename, and the
file that decides the change can be twenty lines. When one file decides it, say so in a line.

## Screenshots

Embed a committed PNG through the head SHA with `?raw=true`:

```markdown
![keep-state-when-changing-style](https://github.com/tomtom-international/maps-sdk-js/blob/<sha>/examples/keep-state-when-changing-style/content/thumbnail.png?raw=true)
```

| Capture | Path | When it helps |
|---|---|---|
| Gallery thumbnail | `examples/<name>/content/thumbnail.png` | any PR that adds or restyles an example — always include it |
| Example e2e baseline | `examples/<name>/e2e-tests/snapshots/upon-load.png` (`upon-load-sandpack.png` for the Sandpack half) | a rendering change: the new baseline *is* the evidence |
| Before/after | both PNGs in a two-column table, `Before` / `After` | a visual regression fix, or a restyle |

`map-integration-tests/test-results/**` is gitignored, so a Playwright failure shot has no blob URL —
take the PNG from the CI run's artifact and let the user attach it, or describe it and skip the
image. Never link a path that isn't committed at that SHA: it renders as a broken image.

## Next steps

**Optional — only the author's own plan**, and then last before the footer: the phase that unblocks
on merge, the follow-up PR carrying what was left out, the plan page to update, a decision the
review has to settle.

- **Omit the section** when there is none. "Review and merge" is not a next step, and neither is a
  CI job finishing — ask the user for their plan rather than inventing one to fill the heading.
- **A forecast, not a recap**: it never restates the diff, and it doesn't absorb its neighbours —
  **Open items** is a gap inside this change, **Caveats** a doubt about it, **Tests** where to poke.

## Voice

The user's own, and it is not the default PR register. First person plural that owns decisions ("we
wanted to", "we'd need to do it ourselves"); problems labelled as problems; explicit `pro:` /
`con:` bullets when there was a real choice; contractions; honest hedges ("in theory", "so far", "as
of this writing"); connectives that carry an argument (Therefore, Hence, However, In other words);
one idea per bullet; bold the term being introduced, then define it. Prefer `-ise` / `-isation`
spelling, but don't police it.

Avoid: verdict-first aphorisms and verbless fragments, em-dash-stacked clauses as the default
sentence shape, bolding whole sentences, impersonal passive where a "we" exists, consultant
register.

**Voice is not a licence for words.** It shows in the sentences the body already needs — it never
buys an extra one, and a bullet list carries it perfectly well.

**On a rewrite, a voice pass changes no claim.** Never touch a number, a `file:line`, a PR number, a
date, a link, a table row or a heading (headings carry anchors people have linked to). Everything in
the body comes from the diff, from a command you ran, or from the body you are rewriting — a
plausible-sounding number is the one failure a reviewer cannot catch.

## Publishing

Author to a file and publish from it — never pass a body inline:

```bash
gh pr edit <n> --body-file "$TMPDIR/pr-<n>.md"
gh pr view <n> --json body --jq .body > "$TMPDIR/check-<n>.md"   # read back and diff
```

Expect a single trailing-newline difference; anything else means the body didn't land. Write the
file with a **quoted** heredoc (`<<'EOF'`) so backticks and `$` survive, and if the head SHA has to
be interpolated, use a placeholder plus `sed -i ''` rather than an unquoted heredoc.

`gh` cannot read `~/.config/gh/hosts.yml` inside the Bash sandbox, so every `gh` call here needs the
sandbox off.

Every body ends with:

```markdown
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## Finishing

Report per PR: the title (with its character count when it's near 80), whether a Solution Overview
was warranted, where each diagram went and which sections deliberately got none, which caveats you
raised, whether Tests and Next steps survived and on what grounds, the Jira key and wiki pages you
linked (or that you found none), and the read-back result, plus the body's line count and what the
cut pass removed. If you rewrote several PRs, say which bodies got smaller and which grew —
diagrams, links and images are additive, so a denser body can still be a bigger one.
