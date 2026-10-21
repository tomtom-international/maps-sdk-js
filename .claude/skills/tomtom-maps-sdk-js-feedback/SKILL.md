---
name: tomtom-maps-sdk-js-feedback
description: OPT-IN skill. Send developer-experience feedback about the TomTom Maps SDK for JavaScript (@tomtom-org/maps-sdk) to its public GitHub repository, tomtom-international/maps-sdk-js, as an issue or a discussion. Use at the START of any work with the SDK to ask the developer once for permission (the tomtom-maps-sdk-js skill hands over here for that), and after that whenever the SDK gets in the way while building — the docs, types or AI skill did not say what was needed; the API cannot express what the developer asked for; the code that actually works differs from what the docs or examples showcase; or something is plainly broken. Also use when the developer says "report this", "send feedback", "file an issue", "tell TomTom", "stop sending feedback", or asks what feedback has been collected so far. Drafts a redacted report and posts it only after the developer approves that draft.
allowed-tools: Read, Write, Bash, AskUserQuestion
---

Purpose: turn friction you hit while building with the SDK into a report the SDK team can act on.
You are the only one who saw the goal, every attempt, and which source misled you — record them as
they happen.

Repository: `tomtom-international/maps-sdk-js`, the SDK's public repository. What qualifies:
`${CLAUDE_SKILL_DIR}/docs/rubrics.md`.
Redaction, templates and commands: `${CLAUDE_SKILL_DIR}/docs/posting.md`.

## Step 0: Consent

A report carries the developer's GitHub identity and material from their project, so GDPR applies:
consent is informed, specific, revocable and never assumed. Whatever the mode, nothing is sent
without an explicit yes to that exact draft (Step 5). Consent in doubt is no consent.

Ask once per session, in plain text, the first time the task involves the SDK. The
`tomtom-maps-sdk-js` skill hands over here before its first answer, so this is usually the first
thing the developer reads:

> Before we start: when the TomTom Maps SDK gets in my way — unclear docs, an API that can't do
> what you asked, or something broken — I can report it so TomTom's SDK team can fix it. A report
> is posted under your GitHub account to TomTom's public repository
> `tomtom-international/maps-sdk-js`, where anyone can read it, so it holds only what the team
> needs: your goal in my words, a minimal code sample, SDK and
> environment versions and, where it helps, a cropped screenshot. I strip keys, personal data,
> real locations and business code first. TomTom uses reports only to improve the SDK
> (https://www.tomtom.com/privacy/). I show you every draft and send nothing you haven't approved.
> Want that on? You can also say "ask each time", or turn it off at any point.

| Reply | Mode |
|---|---|
| yes | Collect findings. At a pause (Step 3), draft each and post after approval. |
| ask each time | Collect findings. At a pause, ask whether to draft each one before drafting it. |
| no | Collect nothing, draft nothing, do not ask again this session. |
| unclear, or none — the developer moved on | Collect nothing; ask once more at the first finding, and let that reply decide. |

- **Explicit request** ("report this", "file an issue"): consent for that one report, whatever the
  mode.
- **Standing consent**: an instruction in the developer's prompt or the project's `CLAUDE.md` /
  `AGENTS.md` counts as "yes" — skip the question, but show the notice above with the first draft,
  since they have not read it. You may offer to add such a line; add it only if they agree.
- **Earlier sessions**: a "yes" visible from one is not consent for this one.
- **Withdrawal**: when the developer turns it off ("stop sending feedback"), switch to `no` and
  discard the findings collected so far.
- **Removal**: the developer can edit a posted report under their account at once, but GitHub keeps
  the edit history readable. Deleting the report, history included, is up to the repository's
  maintainers, so offer to post a removal request on it, or point them to the privacy notice to ask
  TomTom for erasure.

## Step 1: Collect while you build

A finding is friction the SDK or its documentation caused — not the developer's code, not you —
that fits one rubric (`unclear`, `cannot-express`, `showcase-mismatch`, `broken`), clears the
threshold, and gets a severity (`blocking`, `high`, `low`). `rubrics.md` defines all of them; read
it before classifying your first finding.

Record at the moment it happens — a trail reconstructed later is unreliable — leaving out keys and
personal data from the start:

- the goal, in your words;
- what you tried first, and which doc, type or example pointed you there;
- each attempt and its verbatim failure;
- the code that finally worked, and what made the difference;
- SDK version, entry point (`/map`, `/services`, `/core`, or the plugin), platform, framework;
- if the problem is visible in the running app, the screen and state that show it (*Screenshots*).

Keep findings in the conversation; never create tracking files in the developer's project. Asked
what you have collected: one line per finding — rubric, severity, attempt count, known report.

## Step 2: Check known reports

Do this as soon as a finding clears the threshold, not at the pause: it only reads, and a known
workaround may unblock the task now.

1. Search open reports only, once per term, since `gh search` ANDs combined terms and misses: the
   API symbol, the verbatim error text, the concept in plain words. Redact the terms as for a report
   (`posting.md` §1). Do not search closed issues or discussions, and do not page.

   ```bash
   gh search issues --repo tomtom-international/maps-sdk-js --state open --limit 10 '<term>'
   gh api graphql -f query='{ search(type: DISCUSSION, first: 10, query: "repo:tomtom-international/maps-sdk-js is:open <term>") { nodes { ... on Discussion { id number title url } } } }'
   ```

   Without a signed-in `gh`, give the developer
   `https://github.com/tomtom-international/maps-sdk-js/issues?q=is%3Aopen+<term>` and
   `…/discussions?discussions_q=is%3Aopen+<term>` to check, and take their answer as the match.
2. Read a candidate only when its title shares the root cause, and stop once one covers the finding.
   A maintainer's answer, such as a workaround, the release with the fix or a reason to decline,
   counts as much as the post.

   ```bash
   gh issue view <n> --repo tomtom-international/maps-sdk-js --json state,stateReason,body,comments
   gh api graphql -F n=<n> -f query='query($n: Int!) { repository(owner: "tomtom-international", name: "maps-sdk-js") { discussion(number: $n) { body comments(first: 50) { nodes { body } } } } }'
   ```

3. Tell the developer in one or two sentences: the link, how much of the finding it covers, and any
   workaround it holds. Apply that workaround if it unblocks the task, then carry on.
4. Decide what to post, and keep that decision with the finding. A report you posted earlier this
   session counts as an open match.

| Best match | Post |
|---|---|
| Same root cause, holds everything you found | Nothing. The developer can upvote it in the browser. |
| Same root cause, lacks part of what you found: a trigger, an API, a version or environment, a reproduction, a sub-problem | A comment with only that difference. |
| Same root cause, but your evidence contradicts its analysis, or its suggested direction would not reach your goal | A comment stating the contrast and its evidence. |
| Related, but a different root cause | A new report, linking it as related. |
| None | A new report. |

## Step 3: When to post

- Run Steps 4–5 when the feature works or the developer wraps up — not mid-task. Exception: an
  explicit request ("report this") runs them now.
- One root cause per report. Unrelated findings get separate reports; never combine them into one
  post.

## Step 4: Route a new report

The repository has one issue form (`bug_report.yml`) and disables blank issues, so everything that
is not a reproducible bug is a discussion:

| Finding | Destination | Labels |
|---|---|---|
| `broken`, with a minimal reproduction | Issue (`bug_report.yml`) | `bug` |
| `showcase-mismatch`: a documented snippet fails when run as written | Issue (`bug_report.yml`) | `bug`, `documentation` |
| `broken`, still failing after you strip the app code, but you could not reduce it to a minimal reproduction | Discussion, category `q-a`; state what you could not isolate | none |
| `unclear`, `cannot-express`, or `showcase-mismatch` where the documented code runs but is not what the goal needed | Discussion, category `ideas` | none |
| Unsure whether the SDK supports the goal at all | Discussion, category `q-a`; ask, do not assert a gap | none |

If two rows match, choose the discussion.

**A security vulnerability is never posted**, as an issue, a discussion or a comment, whatever the
table says. Tell the developer to report it privately, as the repository's
[`SECURITY.md`](https://github.com/tomtom-international/maps-sdk-js/blob/main/SECURITY.md) describes,
and leave it out of every draft.

## Step 5: Draft, show, post

1. Write the draft from the `posting.md` template for what Step 2 decided (a new report's
   destination, or a comment), following *Report style*. Give each draft a directory of its own
   with `mktemp -d "${TMPDIR:-/tmp}/tomtom-feedback.XXXXXX"`; `<dir>` below and in `posting.md` is
   the path it prints for that draft, written out in full in every command, since no other draft,
   in this session or another, may share it. Save the body to `<dir>/draft.md` — the
   `posting.md` commands read it from there; never inline a body on the command line.
2. If the problem or its workaround is visible in the app, propose a screenshot (*Screenshots*).
3. Redact with the `posting.md` §1 checklist.
4. Show the developer the full title and body, every screenshot, the destination (issue,
   discussion plus category, or the report you comment on), and the method (`gh` under their
   account, or a prefilled URL they submit).
5. Post only after an explicit yes to this draft. If they want changes, edit, redact again, and
   show it again. Just before posting, read `<dir>/draft.md` back and check it is the body they
   approved.
6. Give them the URL and keep it for the rest of the session (Step 2 uses it). Delete `<dir>`
   (`rm -r "<dir>"`) once the report is dropped, or posted with every screenshot the developer
   drops in by hand uploaded; never a glob over the temp directory.

Around the draft, say one or two sentences at most: no preamble, no summary of SDK shortcomings,
no restating the finding. Then resume the developer's task.

## Screenshots

Propose one whenever the problem or its workaround is visible in the running app: wrong or missing
rendering, a misplaced marker or label, a style that differs from the showcase, a broken
interaction. Skip it for problems with nothing to see (type errors, service responses).

- Use a browser or Playwright tool if the session has one; otherwise ask the developer to take it
  and give you the file path.
- Prefer the minimal reproduction (redacted, at a public landmark) over the real app.
- Crop to the area that shows the problem, usually the map canvas — no address bar, devtools, tabs,
  app navigation or OS chrome. Never blur or paint over parts instead: crop, recapture, or leave
  it out.
- Save to `<dir>/<n>.png`, never inside the developer's project.

| The screenshot | Action |
|---|---|
| Shows only SDK output over the minimal reproduction or public data | Include it; the developer approves it with the draft. |
| Might show anything `posting.md` §1 removes — the real app, branding, unreleased UI, personal data, a real location, keys | Ask first, naming what you are unsure about; include it only on an explicit yes. |
| Shows it, and cropping cannot remove it | Leave it out; offer the minimal reproduction instead. |

## Report style

Applies to every issue, discussion and comment you post; check the draft against it before showing
it. Fill the `posting.md` templates without changing their shape — a one-line bold-labelled bullet
stays one line.

- Write whole sentences, one idea each, in the present tense and active voice: "`show()` throws on
  an empty collection", not "show() throwing when empty". Don't drop verbs, and don't chain clauses
  with semicolons.
- Keep the tone factual. No hedging, no narrative of the debugging session, no pleasantries.
- Use bullets, one line each. Write a paragraph only where a bullet cannot hold the point.
- Bold only what the reader must not miss. The templates' bold labels are part of their shape, so
  keep those and add few others. Use italics for a contrast or negation the reader must not miss.
- Use inline code for every symbol, option, file, path, package, version and error string.
- Explain why only when the team would otherwise get it wrong, in one sentence.
- Make every line carry evidence. Cut any line that would not change what the team does, and cut
  repetition to pay for a plainer sentence.
- Limits: under 400 words of prose (code blocks and template headings excluded); each code snippet
  under 30 lines, SDK calls only; the attempt table at most 5 rows; at most 3 screenshots, each with
  one-line alt text saying what it shows.
