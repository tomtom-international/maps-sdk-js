# Drafting, redacting and posting

`REPO=tomtom-international/maps-sdk-js`

Always pass `--repo "$REPO"` to `gh`. You run inside the developer's project, so a bare
`gh issue create` files into their repository — exposing their goal and code there — and the SDK
team never sees it.

## 1. Redact

The repository is public: anyone can read and search what a report holds, and copies of it outlive
an edit. Keep only what the SDK team needs to act on the report; when unsure whether something is
personal or confidential, leave it out or ask the developer. Run this checklist over the draft
before showing it, and again over anything the developer adds.

- [ ] Keys and tokens — TomTom keys, `.env` values, bearer tokens, session ids → `YOUR_API_KEY`.
      Search for the key even if you never wrote it: it appears in error messages, request URLs
      (query strings on `api.tomtom.com`) and stack frames.
- [ ] Personal data — the developer's and their users': names, emails, phone numbers, user and
      device ids, IP addresses, in code, fixtures, logs and service responses.
- [ ] Machine identity — home-directory paths (`/Users/<name>/`, `C:\Users\<name>\`) in stack
      traces and logs → `<project>/…`; hostnames, OS user names, git author names and emails.
- [ ] Coordinates and addresses — real ones can identify a depot, a customer or a home. Move the
      reproduction to a public landmark, unless the location itself is the bug.
- [ ] Internal identifiers — VPN-only endpoints, ticket ids, code names, customer names,
      unreleased product names, internal repo paths.
- [ ] Proprietary code — reduce to the minimum SDK calls that show the problem; rename domain
      symbols to generic ones. Business logic is never needed as evidence.
- [ ] Prompt text — describe the goal in your own words; never paste the developer's prompts.
- [ ] Screenshots — every item above applies to what is visible, map labels included.

If any item cannot be redacted, do not post. Tell the developer, and offer to describe the problem
abstractly instead.

## 2. Issue body

The headings mirror `bug_report.yml`, so a `gh`-posted issue reads like a form submission. Keep
every heading. Drop `Code Sample` or `Error Messages` only when there is nothing to put in them.

Title: `[Bug]: <symptom on a named API>`, 80 characters max, e.g.
`[Bug]: PlacesModule.show() throws on a FeatureCollection with no features`.

````md
### Which package is affected?

@tomtom-org/maps-sdk/map (Web maps)

### SDK Version

0.52.0

### Platform

Web Browser

### Bug Description

- **Defect**: `<API symbol>` <what breaks, one line>
- **Trigger**: <the input or call sequence>

_Reported by an AI coding agent. Rubric: `broken`. Severity: `high`. Attempts: 3._

### Expected Behavior

- <the documented contract> — per `<doc, type or example>`

### Actual Behavior

- <what happened> — verbatim error under *Error Messages*

### Steps to Reproduce

1. Call `<API symbol>` with …
2. …

### Code Sample

```typescript
// minimal, redacted, SDK calls only
```

### Environment Details

- OS: macOS 15.1
- Browser: Chrome 131
- Framework: React 19.0
- Build tool: Vite 6.0

### Error Messages / Console Output

```shell
<verbatim error and stack>
```

### Additional Context

**Goal**
- <what the developer asked for, one line>
- **Related**: #<n> — <how this differs, one line>

**How the agent got there**
| # | Tried | Why | Failed with |
|---|---|---|---|
| 1 | `…` | `map-setup.md` says … | `TypeError: …` |
| 2 | `…` | guessed from the `.d.ts` | rendered nothing |
| 3 | `…` | read `map/src/…` | worked |

**What would have prevented this**
- **<Doc | Type | API>**: <the concrete line, type change or option>
````

## 3. Discussion body

Title: name the missing capability or the source that misled you, not the symptom. No prefix — the
category already says what kind of post it is.

- Good: `Cannot set a per-result anchor on PlacesModule markers`
- Bad: `Question about markers`

````md
## Goal

- <what the developer asked for, one line, in your words>
- **Related**: #<n> — <how this differs, one line>

## What I expected the SDK to offer

- **Reached for**: `<API symbol or option>`
- **Because**: `<doc, type or example>` — "<quote>"

## What I had to write instead

```typescript
// the workaround, redacted
```

- **Cost**: <what the workaround duplicates, bypasses or breaks, one line>

## How the agent got there

| # | Tried | Why | Failed with |
|---|---|---|---|
| 1 | `…` | … | … |

## Suggested direction

- **<Option | Method | Doc>**: `<shape>` — <the gap it closes>

---
Rubric: `unclear` · Severity: `high` · Attempts: 2 · SDK 0.52.0 · `@tomtom-org/maps-sdk/map` · Web
Reported by an AI coding agent.
````

Keep the trailing metadata line with these exact field names: the team counts rubrics across
reports by parsing it. Drop the **Related** line, in either template, when Step 2 in `SKILL.md`
matched nothing.

## 4. Post with `gh`

Run `gh auth status` first. If it fails, use §5. `<dir>` is the draft's own directory from
Step 5 in `SKILL.md`.

Screenshots: only `gh issue create` and `gh issue comment` upload images, with
`--attach "<dir>/<n>.png#<alt text>"` per image, and only on a recent `gh` (check with
`gh issue create --help | grep -q -- --attach`). Everywhere else — discussions, an older `gh`, a
§5 URL — post without them, then give the developer the file paths to drop into the post in the
browser.

### Issue

Adding labels needs push access, so the command retries without them:

```bash
gh issue create --repo "$REPO" \
  --title "[Bug]: <title>" \
  --body-file "<dir>/draft.md" \
  --label bug \
  || gh issue create --repo "$REPO" \
       --title "[Bug]: <title>" \
       --body-file "<dir>/draft.md"
```

- For a `showcase-mismatch`, add `--label documentation` to the first command. No other labels.
- Never pass `needs-triage`. `bug_report.yml` declares it, but the label does not exist in the
  repository, and `gh` then fails the whole command without creating anything.

### Discussion

There is no `gh` command for discussions; use GraphQL with these node ids:

| Target | Node id |
|---|---|
| repository `tomtom-international/maps-sdk-js` | `R_kgDORJUglQ` |
| category `ideas` | `DIC_kwDORJUglc4C165X` |
| category `q-a` | `DIC_kwDORJUglc4C165W` |

```bash
gh api graphql \
  -f query='mutation($repo: ID!, $cat: ID!, $title: String!, $body: String!) {
    createDiscussion(input: {repositoryId: $repo, categoryId: $cat, title: $title, body: $body}) {
      discussion { url }
    }
  }' \
  -f repo="R_kgDORJUglQ" -f cat="<category node id from the table>" -f title="<title>" \
  -F body=@"<dir>/draft.md"
```

- `-F body=@file` sends the file contents; `-f body=@file` would send the literal path.
- The token needs `public_repo` scope, which full `repo` includes. On `insufficient scopes` or
  `Resource not accessible`, use §5 — do not ask the developer to change their token.
- The ids belong to this repository. If the target repository ever changes, re-resolve them first;
  a stale id posts to the wrong repository instead of failing:

```bash
gh api graphql -f query='
{ repository(owner: "tomtom-international", name: "maps-sdk-js") {
    id
    discussionCategories(first: 25) { nodes { id name slug } }
} }'
```

### Comment on an existing report

The body holds only the difference Step 2 in `SKILL.md` found, in the same style. Keep the line that
applies, then only the evidence the report lacks:

````md
- **Adds**: <the trigger, API, version, environment or sub-problem the report does not cover>
- **Differs**: <the analysis or suggested direction your evidence contradicts, and what it shows instead>

<the reproduction, error or attempt table, only the parts the report lacks>

---
Rubric: `broken` · Severity: `high` · Attempts: 2 · SDK 0.52.0 · `@tomtom-org/maps-sdk/map` · Web
Reported by an AI coding agent.
````

```bash
gh issue comment <issue number> --repo "$REPO" --body-file "<dir>/draft.md"
```

For a discussion, pass its node `id` (returned by the Step 2 search in `SKILL.md`), not its number:

```bash
gh api graphql \
  -f query='mutation($d: ID!, $body: String!) {
    addDiscussionComment(input: {discussionId: $d, body: $body}) { comment { url } }
  }' \
  -f d="<discussion node id>" -F body=@"<dir>/draft.md"
```

## 5. Fallback: a prefilled URL

Give the developer a URL to open and submit in their browser, with the screenshot paths to drop
into the body (for an issue, into *Additional Context*) before submitting. A comment has no
prefilled URL: give the report's URL and the draft as a fenced block to paste.

Percent-encode each query value separately; for a value saved in a file:

```bash
node -e 'process.stdout.write(encodeURIComponent(require("fs").readFileSync(process.argv[1],"utf8")))' "<file>"
```

### Issue

Each form field is its own query parameter, holding the text of the matching §2 heading:

```
https://github.com/tomtom-international/maps-sdk-js/issues/new?template=bug_report.yml
  &title=&package=&version=&platform=&description=&expected=&actual=
  &reproduction=&code-sample=&environment=&errors=&additional=
```

| Parameter | Value |
|---|---|
| `package` | Dropdown: the exact option label, e.g. `@tomtom-org/maps-sdk/map (Web maps)`. |
| `platform` | Dropdown: `Web Browser`, `Node.js`, `React Native` or `Other`. |
| `code-sample` | Spelled with a hyphen. |
| `additional` | The *Additional Context* section: goal, attempt trail, prevention. |

A dropdown value that matches no option is silently dropped, leaving the field empty. Check values
against the repository's `.github/ISSUE_TEMPLATE/bug_report.yml`.

### Discussion

`category` is `ideas` or `q-a`; `body` is the whole draft file.

```
https://github.com/tomtom-international/maps-sdk-js/discussions/new?category=ideas&title=&body=
```

### URL length

Prefilled URLs fail beyond about 8,000 characters. If yours is longer:

1. Keep the short fields in the URL and leave the long ones out.
2. Give the developer the omitted sections as a fenced block to paste, naming each one.
