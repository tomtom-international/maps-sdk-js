# TomTom Maps SDK for JavaScript: Examples

[🎮 **Examples**](https://docs.tomtom.com/maps-sdk-js/examples/) |
[📖 **Documentation**](https://docs.tomtom.com/maps-sdk-js/introduction/overview) |
[📋 **API reference**](https://docs.tomtom.com/maps-sdk-js/api-reference/index.html) |
[📦 **npm**](https://www.npmjs.com/package/@tomtom-org/maps-sdk)

![SDK Examples Collage](https://raw.githubusercontent.com/tomtom-international/maps-sdk-js/main/sdk-examples-collage.png)

The runnable examples of the [TomTom Maps SDK for JavaScript](https://docs.tomtom.com/maps-sdk-js/introduction/overview)
(`@tomtom-org/maps-sdk`) and its plugins. That's over 110 browser apps and Node.js scripts, and the best code to copy from.
The SDK itself installs from npm, and its sources aren't published in this repository.

Each example installs the SDK and plugins at the versions they were last synced against, pinned in the `catalog`
of [`pnpm-workspace.yaml`](./pnpm-workspace.yaml).
<br/><br/>

## 🚀 Running an example

**Requirements**: Node.js 24+, pnpm 11+ (`corepack enable`), and a [TomTom API key](https://my.tomtom.com/).

```bash
pnpm install
cp examples/.env.example examples/.env   # then set API_KEY_EXAMPLES

cd examples/default-map
pnpm develop                             # a Vite dev server, on http://localhost:5173
```

A Node.js example reads the key from the environment:

```bash
cd examples/nodejs-geocode
API_KEY_EXAMPLES=<your key> pnpm develop
```

A few examples need more than the one key; [`examples/.env.example`](./examples/.env.example) lists each extra.

Every example imports only `@tomtom-org/maps-sdk/*` and `@tomtom-org/maps-sdk-plugin-*`, as your own app would.
To reuse one, copy its `src/` into a project that installs those packages.
<br/><br/>

## 🤖 AI coding agent skill

Install the SDK skill in your coding agent, whether that's Claude Code, Cursor, GitHub Copilot, Windsurf or [many more](https://www.npmjs.com/package/skills#available-agents). It gives the agent the SDK's patterns and APIs, so it writes code against the real API:

```bash
npx skills add tomtom-international/maps-sdk-js --skill tomtom-maps-sdk-js tomtom-maps-sdk-js-feedback
```

The optional `tomtom-maps-sdk-js-feedback` skill lets the agent report SDK problems it hits to this repository, with your consent.
[Installing the skill](https://docs.tomtom.com/maps-sdk-js/guides/ai-coding#installing-the-skill) also covers the skill of an
older SDK version: each `v<version>` tag holds that release's skill and docs, and the
[docs site](https://tomtom-international.github.io/maps-sdk-js/) shows the newest ones.
[AI coding with the SDK](https://docs.tomtom.com/maps-sdk-js/guides/ai-coding) lists the topics it covers, how to invoke them and
[what a report holds](https://docs.tomtom.com/maps-sdk-js/guides/ai-coding#reporting-sdk-problems).
<br/><br/>

## 📋 Changelogs

- [`CHANGELOG.md`](./CHANGELOG.md) for the SDK (`@tomtom-org/maps-sdk`)
- `plugins/<name>/CHANGELOG.md` for each plugin, next to its `README.md`

The [release notes](https://docs.tomtom.com/maps-sdk-js/introduction/release-notes) cover what's new and the breaking changes.
<br/><br/>

## 💬 Feedback

This repository is a read-only mirror of an internal one, so it doesn't accept pull requests.
[Open an issue](https://github.com/tomtom-international/maps-sdk-js/issues) to report a bug, or
[start a discussion](https://github.com/tomtom-international/maps-sdk-js/discussions) for questions and feature requests.
<br/><br/>

## 📄 License

- **Examples**: all code in `examples/` is open source under the Apache 2.0 license, in 📜 [examples/LICENSE](./examples/LICENSE).
  Copy, modify and use it freely in your projects.
- **SDK packages and plugins**: `@tomtom-org/maps-sdk` and `@tomtom-org/maps-sdk-plugin-*`, which the examples install,
  are distributed under a proprietary license, in 📜 [LICENSE.txt](./LICENSE.txt). Each plugin carries a copy as
  `plugins/<name>/LICENSE.txt`. They require a TomTom API key and
  agreement to our terms of service. Their third-party notices are in [THIRD_PARTY.txt](./THIRD_PARTY.txt).
