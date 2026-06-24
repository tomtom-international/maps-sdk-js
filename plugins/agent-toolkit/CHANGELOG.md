# Changelog

## [0.4.0](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.3.1...maps-sdk-plugin-agent-toolkit-v0.4.0) (2026-06-24)


### ⚠ BREAKING CHANGES

* **agent-toolkit:** consolidate per-kind recall tools into recallState ([#1868](https://github.com/tomtom-international/maps-sdk-js/issues/1868))
* **agent-toolkit:** analysis and incidents clustering improvements ([#1851](https://github.com/tomtom-international/maps-sdk-js/issues/1851))
* **traffic, map-display:** migrate to Orbis v2 GA ([#1829](https://github.com/tomtom-international/maps-sdk-js/issues/1829))

### Features

* **agent-toolkit:** `resolvedAreas` — surface where every query resolved ([#1863](https://github.com/tomtom-international/maps-sdk-js/issues/1863)) ([f89f5cd](https://github.com/tomtom-international/maps-sdk-js/commit/f89f5cdb1e09362d4d3cef0c33e118a3fe29af42))
* **agent-toolkit:** analysis and incidents clustering improvements ([#1851](https://github.com/tomtom-international/maps-sdk-js/issues/1851)) ([c9aa482](https://github.com/tomtom-international/maps-sdk-js/commit/c9aa4829056ae6779cd88415ff20b30be6f5e26a))
* **agent-toolkit:** app-supplied URL-validator hook for addByodSource ([#1855](https://github.com/tomtom-international/maps-sdk-js/issues/1855)) ([b9a38a8](https://github.com/tomtom-international/maps-sdk-js/commit/b9a38a8263f6d54f8094c507ffa9d36f447686d5))
* **agent-toolkit:** fold incident monitoring into getTrafficIncidents ([#1847](https://github.com/tomtom-international/maps-sdk-js/issues/1847)) ([6e63e92](https://github.com/tomtom-international/maps-sdk-js/commit/6e63e92571f4617f0502b18344a5252c6ee9902c))
* **agent-toolkit:** generic trackers on the analyses registry ([#1876](https://github.com/tomtom-international/maps-sdk-js/issues/1876)) ([8d05187](https://github.com/tomtom-international/maps-sdk-js/commit/8d051871979e9f6ce2b281ae63b06286a56e62ea))
* **agent-toolkit:** keep untrusted BYOD free-text out of model context ([#1854](https://github.com/tomtom-international/maps-sdk-js/issues/1854)) ([935c6eb](https://github.com/tomtom-international/maps-sdk-js/commit/935c6eb12899abe25fe5d5c1dfe42fb474ee5fa0))
* **agent-toolkit:** monitor routes — periodic live-traffic recalculation ([#1869](https://github.com/tomtom-international/maps-sdk-js/issues/1869)) ([ca20d3c](https://github.com/tomtom-international/maps-sdk-js/commit/ca20d3cec0e20dcf247109ff0643b7104ba3ac9c))
* **agent-toolkit:** sandbox data-tool execution in a browser iframe-worker ([#1857](https://github.com/tomtom-international/maps-sdk-js/issues/1857)) ([1103cf2](https://github.com/tomtom-international/maps-sdk-js/commit/1103cf2599379e57b19b7400da053fb7a5d96f73))
* **agent-toolkit:** split and compact the base system prompt ([#1884](https://github.com/tomtom-international/maps-sdk-js/issues/1884)) ([bc9ff9e](https://github.com/tomtom-international/maps-sdk-js/commit/bc9ff9e5146dc92c610be8edaf463e1e3ac28bce))
* **agent-toolkit:** unify where-resolution ([#1834](https://github.com/tomtom-international/maps-sdk-js/issues/1834)) ([6720e02](https://github.com/tomtom-international/maps-sdk-js/commit/6720e026b22b25b0cfe180fa7b811b4fa1daa18c))
* **traffic, map-display:** migrate to Orbis v2 GA ([#1829](https://github.com/tomtom-international/maps-sdk-js/issues/1829)) ([6ccd244](https://github.com/tomtom-international/maps-sdk-js/commit/6ccd2445de3ef4e209b30cdd13009e2408328d80))


### Reverts

* feat(traffic, map-display)!: migrate to Orbis v2 GA ([#1829](https://github.com/tomtom-international/maps-sdk-js/issues/1829)) ([#1880](https://github.com/tomtom-international/maps-sdk-js/issues/1880)) ([12ed6b9](https://github.com/tomtom-international/maps-sdk-js/commit/12ed6b9dcc6b7e2c22d3525aa05f85c1ba6b5e89))


### Code Refactoring

* **agent-toolkit:** consolidate per-kind recall tools into recallState ([#1868](https://github.com/tomtom-international/maps-sdk-js/issues/1868)) ([a519e1f](https://github.com/tomtom-international/maps-sdk-js/commit/a519e1f82efc571ef64492e269706482b67b1ef7))

## [0.3.1](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.3.0...maps-sdk-plugin-agent-toolkit-v0.3.1) (2026-06-10)


### Features

* **agent-toolkit:** deterministic DBSCAN clustering tool ([c1d31b4](https://github.com/tomtom-international/maps-sdk-js/commit/c1d31b4ddb1e71bf8bcbae5bdc57b3400d9cedcd))

## [0.3.0](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.12...maps-sdk-plugin-agent-toolkit-v0.3.0) (2026-06-04)


### ⚠ BREAKING CHANGES

* **events:** scope + dedupe allEventFeatures, typed substitution
* **agent-toolkit:** byod improvements ([#1816](https://github.com/tomtom-international/maps-sdk-js/issues/1816))

### Features

* **agent-toolkit:** byod improvements ([#1816](https://github.com/tomtom-international/maps-sdk-js/issues/1816)) ([4aeddca](https://github.com/tomtom-international/maps-sdk-js/commit/4aeddca52a1da30cde36f6dbb18ddad689f47f27))
* **events:** scope + dedupe allEventFeatures, typed substitution ([036c9c4](https://github.com/tomtom-international/maps-sdk-js/commit/036c9c41be660b92ed80b74cae4b998ce595f94d))


### Bug Fixes

* **agent-toolkit:** add missing [@group](https://github.com/group) tags on exported types ([#1803](https://github.com/tomtom-international/maps-sdk-js/issues/1803)) ([67f1cf3](https://github.com/tomtom-international/maps-sdk-js/commit/67f1cf3c383d2e0db544cead55d16a66342ec4c2))
* **agent-toolkit:** public docs cleanup — links, system-prompt guidance, internal refs ([#1804](https://github.com/tomtom-international/maps-sdk-js/issues/1804)) ([283fbc9](https://github.com/tomtom-international/maps-sdk-js/commit/283fbc9f588e261baf1112805f77102b88ce7f5a))

## [0.2.12](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.11...maps-sdk-plugin-agent-toolkit-v0.2.12) (2026-05-22)


### Features

* **agent-toolkit:** expand plugin documentation ([#1793](https://github.com/tomtom-international/maps-sdk-js/issues/1793)) ([3f55084](https://github.com/tomtom-international/maps-sdk-js/commit/3f550843ca92b2f08460759b200794e94178e87d))


### Bug Fixes

* **agent-toolkit:** split scenario tests into sanity / full suites ([#1798](https://github.com/tomtom-international/maps-sdk-js/issues/1798)) ([b9b1fe8](https://github.com/tomtom-international/maps-sdk-js/commit/b9b1fe8a6dcdf8f6e6fb156a2f251351b04851c9))
* **agent-toolkit:** stabilize locate-place scenario prompt ([#1795](https://github.com/tomtom-international/maps-sdk-js/issues/1795)) ([6883269](https://github.com/tomtom-international/maps-sdk-js/commit/6883269ccfd261c66067de6f8290d28a9dd83b91))

## [0.2.11](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.10...maps-sdk-plugin-agent-toolkit-v0.2.11) (2026-05-21)


### Bug Fixes

* **agent-toolkit:** point README docs link at overview page ([b2aba55](https://github.com/tomtom-international/maps-sdk-js/commit/b2aba55dccab4109b12a9358bc5003a066926e9b))

## [0.2.10](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.9...maps-sdk-plugin-agent-toolkit-v0.2.10) (2026-05-21)


### Bug Fixes

* engineering guideline updates for agent toolkit ([dd24926](https://github.com/tomtom-international/maps-sdk-js/commit/dd2492643fc67fc8e7dd3f6247f21569227b5912))

## [0.2.9](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.8...maps-sdk-plugin-agent-toolkit-v0.2.9) (2026-05-21)


### Features

* code generation tools with updated docs ([ef1a7fa](https://github.com/tomtom-international/maps-sdk-js/commit/ef1a7fac2120e093564afeabd8def3ab7e93dc94))

## [0.2.8](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.7...maps-sdk-plugin-agent-toolkit-v0.2.8) (2026-05-21)


### Features

* upgrade SDK agent toolkit and fix release process ([#1782](https://github.com/tomtom-international/maps-sdk-js/issues/1782)) ([6e09446](https://github.com/tomtom-international/maps-sdk-js/commit/6e094469c689dd824a29bfaea9cc67cbe931390d))

## [0.2.7](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.6...maps-sdk-plugin-agent-toolkit-v0.2.7) (2026-05-15)


### Features

* exploration search with area tags ([#1763](https://github.com/tomtom-international/maps-sdk-js/issues/1763)) ([65327e6](https://github.com/tomtom-international/maps-sdk-js/commit/65327e66eca351db365b5453e3801b420cee32e4))


### Bug Fixes

* agent toolkit place prompt fixes and clearing unnecessary modules ([#1773](https://github.com/tomtom-international/maps-sdk-js/issues/1773)) ([1aa1873](https://github.com/tomtom-international/maps-sdk-js/commit/1aa1873811705077d40af1942d38c4c5bf3d9568))

## [0.2.6](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.5...maps-sdk-plugin-agent-toolkit-v0.2.6) (2026-05-12)


### Features

* agent evaluation testing [LSI-285] ([#1747](https://github.com/tomtom-international/maps-sdk-js/issues/1747)) ([dd02bec](https://github.com/tomtom-international/maps-sdk-js/commit/dd02bec020e08b517c2908d2690d8bf0f9ae0aa3))


### Bug Fixes

* upgrade and fix deps ([#1762](https://github.com/tomtom-international/maps-sdk-js/issues/1762)) ([f5f1f8e](https://github.com/tomtom-international/maps-sdk-js/commit/f5f1f8ed8d6168f24fdee900f580587fcc434422))

## [0.2.5](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.4...maps-sdk-plugin-agent-toolkit-v0.2.5) (2026-05-11)


### Features

* **agent-toolkit:** live traffic agent ([f16863c](https://github.com/tomtom-international/maps-sdk-js/commit/f16863c85f99dbebe167c7afe8adc6c8d81fbdb4))


### Bug Fixes

* **traffic-incident-details:** drop non-filterable iconCategory codes ([61d2eb3](https://github.com/tomtom-international/maps-sdk-js/commit/61d2eb3abadc6d7190a7a69fb55be09761d1f427))

## [0.2.4](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.3...maps-sdk-plugin-agent-toolkit-v0.2.4) (2026-04-30)


### Features

* add managePlaces tool and centralize places display state ([0cc5005](https://github.com/tomtom-international/maps-sdk-js/commit/0cc50050469f5ae8fa3450afc572c9491346f2e1))
* improve api reference types, adjust syntax for agent toolkit plugin, and improve agents.md ([9428902](https://github.com/tomtom-international/maps-sdk-js/commit/9428902605299302fdbb206f22a514e6761d0716))


### Bug Fixes

* LSI-259 Fix tests that were failing because API changed response from 403 to 401 ([#1729](https://github.com/tomtom-international/maps-sdk-js/issues/1729)) ([6c5c3ec](https://github.com/tomtom-international/maps-sdk-js/commit/6c5c3ecd3e6c7212266f5d9c63da3d0b0d52b8c3))

## [0.2.3](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.2...maps-sdk-plugin-agent-toolkit-v0.2.3) (2026-04-14)


### Bug Fixes

* update agent toolkit link in readme ([8659362](https://github.com/tomtom-international/maps-sdk-js/commit/86593623e7e790fdc7c2a89b70d7292076b53aa5))

## [0.2.2](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.1...maps-sdk-plugin-agent-toolkit-v0.2.2) (2026-04-14)


### Bug Fixes

* rename map-agent plugin to agent-toolkit ([535b0f5](https://github.com/tomtom-international/maps-sdk-js/commit/535b0f57c1b3ec2fedae70a351b52463594ebebe))

## [0.2.1](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-ai-agent-v0.2.0...maps-sdk-plugin-ai-agent-v0.2.1) (2026-04-10)


### Features

* new module events to react to config changes and shown features ([28e295e](https://github.com/tomtom-international/maps-sdk-js/commit/28e295ea1a36cf85361469a1210434684e6d7689))


### Bug Fixes

* ai plugin docs diagrams ([bbbf011](https://github.com/tomtom-international/maps-sdk-js/commit/bbbf011fd39ec0b82e455891fe6b3f601f8a0a72))
* serialize dates as ISO strings for safe LLM parsing. Example transport cleanup ([dab7d79](https://github.com/tomtom-international/maps-sdk-js/commit/dab7d7912892f76e256d677c9ed416c1f1bc447c))

## [0.2.0](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-ai-agent-v0.1.0...maps-sdk-plugin-ai-agent-v0.2.0) (2026-04-09)


### Features

* Initial release! Explore the README and documentation for further information.
