# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.47.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.47.1...v0.47.2) (2026-05-11)


### Bug Fixes

* example thumbnail reference ([68144d2](https://github.com/tomtom-international/maps-sdk-js/commit/68144d29034fea86fe2040308b69f150a1628a6c))

## [0.47.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.47.0...v0.47.1) (2026-05-11)


### Features

* **agent-toolkit:** live traffic agent ([f16863c](https://github.com/tomtom-international/maps-sdk-js/commit/f16863c85f99dbebe167c7afe8adc6c8d81fbdb4))
* **map:** TrafficIncidentOverlayModule ([b5c8099](https://github.com/tomtom-international/maps-sdk-js/commit/b5c80991f0f0c92f3df19422b941fd2d374f3456))


### Bug Fixes

* **traffic-incident-details:** drop non-filterable iconCategory codes ([61d2eb3](https://github.com/tomtom-international/maps-sdk-js/commit/61d2eb3abadc6d7190a7a69fb55be09761d1f427))

## [0.47.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.13...v0.47.0) (2026-05-01)


### ⚠ BREAKING CHANGES

* improvements in places module themes

### Features

* add managePlaces tool and centralize places display state ([0cc5005](https://github.com/tomtom-international/maps-sdk-js/commit/0cc50050469f5ae8fa3450afc572c9491346f2e1))
* add model name to header ([a7c518b](https://github.com/tomtom-international/maps-sdk-js/commit/a7c518bfd785f0994212e037a7971914fa032956))
* expand deployment workflow to support multiple SDK demos ([25aa8c2](https://github.com/tomtom-international/maps-sdk-js/commit/25aa8c2361a233f8f85d803d43c41febe7f0866d))
* improve api reference types, adjust syntax for agent toolkit plugin, and improve agents.md ([9428902](https://github.com/tomtom-international/maps-sdk-js/commit/9428902605299302fdbb206f22a514e6761d0716))
* improvements in places module themes ([c287856](https://github.com/tomtom-international/maps-sdk-js/commit/c2878560f453e71a66f039cfe22f9e4b7322a577))


### Bug Fixes

* dynamic import ApplicationInsights to avoid adblocker crash ([#1709](https://github.com/tomtom-international/maps-sdk-js/issues/1709)) ([98cc8bc](https://github.com/tomtom-international/maps-sdk-js/commit/98cc8bc0ccf4221134a61d8ef2719c9f381bc6df))
* escape $web variable reference in upload step echo ([92ec7f1](https://github.com/tomtom-international/maps-sdk-js/commit/92ec7f13366e02d0eef9bdd758ffd3f4e104888b))
* LSI-259 Fix tests that were failing because API changed response from 403 to 401 ([#1729](https://github.com/tomtom-international/maps-sdk-js/issues/1729)) ([6c5c3ec](https://github.com/tomtom-international/maps-sdk-js/commit/6c5c3ecd3e6c7212266f5d9c63da3d0b0d52b8c3))
* LSI-265 Fix branch name sanitation in 'Publish Examples' step ([#1732](https://github.com/tomtom-international/maps-sdk-js/issues/1732)) ([d9cfddd](https://github.com/tomtom-international/maps-sdk-js/commit/d9cfddd49e38537da3197fc4d341e39c5927d39d))

## [0.46.13](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.12...v0.46.13) (2026-04-14)


### Features

* upgrade maplibre dependency ([6a419c6](https://github.com/tomtom-international/maps-sdk-js/commit/6a419c6b70bff10588b11c4b3ea0fbefd5e20e18))


### Bug Fixes

* exporting map agent from plugins so it's included in API reference ([90a7bf9](https://github.com/tomtom-international/maps-sdk-js/commit/90a7bf971a62190f36a35df6b2198e19c3dcba3e))
* rename map-agent plugin to agent-toolkit ([535b0f5](https://github.com/tomtom-international/maps-sdk-js/commit/535b0f57c1b3ec2fedae70a351b52463594ebebe))
* update agent toolkit link in readme ([8659362](https://github.com/tomtom-international/maps-sdk-js/commit/86593623e7e790fdc7c2a89b70d7292076b53aa5))
* update mobile breakpoint for chat agent demos ([#1697](https://github.com/tomtom-international/maps-sdk-js/issues/1697)) ([7514420](https://github.com/tomtom-international/maps-sdk-js/commit/751442031e9b1e3a2b7a25f8192c1db5c9b5e763))

## [0.46.12](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.11...v0.46.12) (2026-04-10)


### Bug Fixes

* missing example images ([ddf05a5](https://github.com/tomtom-international/maps-sdk-js/commit/ddf05a5d174f81228133db1a4e7aa79fff80e36a))

## [0.46.11](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.10...v0.46.11) (2026-04-10)


### Bug Fixes

* examples type exports ([7878115](https://github.com/tomtom-international/maps-sdk-js/commit/7878115d49806b1bffbedc7bc0eb63d278f32cc4))

## [0.46.10](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.9...v0.46.10) (2026-04-10)


### Features

* add traffic area analytics tools to map agent ([f9a6fd0](https://github.com/tomtom-international/maps-sdk-js/commit/f9a6fd0fe7fcaa68ab000eb073ee08367324214d))
* enable ai-agent plugin for release ([00a69c8](https://github.com/tomtom-international/maps-sdk-js/commit/00a69c84f4393b1a3736344d2784e761f54335c3))
* enhance traffic area analytics with improved filter handling and validation ([b8c9780](https://github.com/tomtom-international/maps-sdk-js/commit/b8c97801b5fec43e32d302369dfb8ba68573afd1))
* expand TrafficAreaAnalyticsModule API with tiles mode, filtering, custom styling, and tooltip ([85fac97](https://github.com/tomtom-international/maps-sdk-js/commit/85fac97a3bbd734b15db0a3bec3380e04e8dd563))
* improve mobile view for chat ([e8ea74b](https://github.com/tomtom-international/maps-sdk-js/commit/e8ea74b6764f0b014ccb5664c2c69283697d7519))
* new module events to react to config changes and shown features ([28e295e](https://github.com/tomtom-international/maps-sdk-js/commit/28e295ea1a36cf85361469a1210434684e6d7689))
* parameterize tool registry with unified ToolMetadata and MapAgentTool types ([5d599a8](https://github.com/tomtom-international/maps-sdk-js/commit/5d599a83aa819b44ea7f586af56fff9ce67b1a96))
* remove canvas area analytics chart from main sdk, ported to example using html elements instead of canvas ([2fd5513](https://github.com/tomtom-international/maps-sdk-js/commit/2fd55130856bb5a505a1bd04618b23c94deb0df8))
* traffic area analytics configuration improvements ([80cef2f](https://github.com/tomtom-international/maps-sdk-js/commit/80cef2f7c69896c4299bf528d85e08402d028f23))
* traffic area analytics configuration improvements ([50f6d44](https://github.com/tomtom-international/maps-sdk-js/commit/50f6d4427b51a461d88bebb99e83cedd6aa664dd))


### Bug Fixes

* ai plugin docs diagrams ([bbbf011](https://github.com/tomtom-international/maps-sdk-js/commit/bbbf011fd39ec0b82e455891fe6b3f601f8a0a72))
* disambiguate traffic tools, add analytics to clearMap, fix restoration race ([ca528b7](https://github.com/tomtom-international/maps-sdk-js/commit/ca528b73671c3a0cdffb8aa32c982f4a2fe53b9a))
* mobile speech input continuous ([d1da271](https://github.com/tomtom-international/maps-sdk-js/commit/d1da2710c558bd0187a7088d1c26816dca6d79da))
* serialize dates as ISO strings for safe LLM parsing. Example transport cleanup ([dab7d79](https://github.com/tomtom-international/maps-sdk-js/commit/dab7d7912892f76e256d677c9ed416c1f1bc447c))

## [0.46.9](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.8...v0.46.9) (2026-03-30)


### Features

* add internal optional metadata header ([cc1d522](https://github.com/tomtom-international/maps-sdk-js/commit/cc1d522448cd3dcaabd810f8732bbf414744c71e))

## [0.46.8](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.7...v0.46.8) (2026-03-27)


### Features

* add traffic area analytics example with configuration and visualization options ([#1632](https://github.com/tomtom-international/maps-sdk-js/issues/1632)) ([61e50f9](https://github.com/tomtom-international/maps-sdk-js/commit/61e50f9898f7c75c2a9c97aef81e4ffdd4ed4741))
* **ai-eval, map-chat-agent:** extend eval harness and update eval cases ([f06cf91](https://github.com/tomtom-international/maps-sdk-js/commit/f06cf91cae4daf8aad9394cdc2dcc632bc0eb297))
* ensure area analytics dates start at least 2 days before the current day ([99b98b0](https://github.com/tomtom-international/maps-sdk-js/commit/99b98b0ba12f17e0958493fd486e1c3a43b7e11b))
* improve circle theme visuals with dynamic POI sizing and unified centered-icon offset logic ([ae3700b](https://github.com/tomtom-international/maps-sdk-js/commit/ae3700bf2fc51b40dc273d8787dcec7bc476f75d))
* **map-agent:** add extension tools and map-data-agent example ([b6bbb24](https://github.com/tomtom-international/maps-sdk-js/commit/b6bbb241d004ab50a554c3c9d98299957de03ffc))
* **map-agent:** redesign core tool layer ([9b341cc](https://github.com/tomtom-international/maps-sdk-js/commit/9b341cc4137b5b4124f3f070c45f11f3363b3c44))
* **map-agent:** switch focusOnPlace from geocode to search, add biasPosition ([218f964](https://github.com/tomtom-international/maps-sdk-js/commit/218f9643e3c103389511565f7add9f0094a6b3dd))
* show area analytics hexagons below place labels ([005c568](https://github.com/tomtom-international/maps-sdk-js/commit/005c568b2508f8ff42f7ab4698056601751fba7b))


### Bug Fixes

* **map-agent:** fix P0/P1/P2 tool bugs and design weaknesses ([51274db](https://github.com/tomtom-international/maps-sdk-js/commit/51274db17207911b30eb2445a63b1f6bc733c87e))
* maplibre version reliability in SDK built examples ([15752e4](https://github.com/tomtom-international/maps-sdk-js/commit/15752e4e38e8ccebffd9f51e5e8768cc642907cb))
* poi category codes and mappings, and formatting ([a052455](https://github.com/tomtom-international/maps-sdk-js/commit/a05245559bec8c698441288a15c02bec95c45d57))
* traffic area analytics layer id inits ([c5909cc](https://github.com/tomtom-international/maps-sdk-js/commit/c5909ccec7d4dd0408c65ba72eb8c0531b1a767d))

## [0.46.7](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.6...v0.46.7) (2026-03-20)


### Features

* add area analytics module with visualization layers and utilities ([3d3c4f4](https://github.com/tomtom-international/maps-sdk-js/commit/3d3c4f49431dff0591978c59786a5eed50203979))
* add color scheme selector and update legend functionality in TrafficAreaAnalyticsModule ([1b6aa8c](https://github.com/tomtom-international/maps-sdk-js/commit/1b6aa8ce5b89b5da2ccbf9220a7b7255b86f903c))
* add color scheme support for TrafficAreaAnalyticsModule and related components ([12d9d84](https://github.com/tomtom-international/maps-sdk-js/commit/12d9d8484d342c554bbe3c56c7000140a8e0c3ee))
* add integration tests and data for TrafficAreaAnalyticsModule following pr comments ([624957b](https://github.com/tomtom-international/maps-sdk-js/commit/624957ba6b36239ffeb28196f36cf4bb0e6d8ae7))
* add layer ID properties for explicit access in TrafficAreaAnalyticsModule ([9710674](https://github.com/tomtom-international/maps-sdk-js/commit/97106747e380c2e07a586a2d82ed351cb4c8af64))
* add theme propertie to RoutingModule and set-route-theme tool ([6c4833b](https://github.com/tomtom-international/maps-sdk-js/commit/6c4833b20f96397d5febb4da1dbe4e678625f8ab))
* add traffic area analytics example with city search and hex grid ([cb034ab](https://github.com/tomtom-international/maps-sdk-js/commit/cb034abf36c11596820dd70c549deebd58c7ca55))
* add TrafficAreaAnalyticsModule with hexgrid and heatmap layers ([cabe919](https://github.com/tomtom-international/maps-sdk-js/commit/cabe919a35d724ee1d0eae728600596dc5127f9e))
* add TrafficAreaAnalyticsModule with visualization layers ([e8a1386](https://github.com/tomtom-international/maps-sdk-js/commit/e8a1386086e715cda686ea316f85d388e9e3f03d))
* derive outline color from mainColor, update waypoint icons at runtime ([4a8e593](https://github.com/tomtom-international/maps-sdk-js/commit/4a8e593ac6d1ecf5dbeb27c819145e2b89db1589))
* remove hexTransform module and simplify analytics display logic ([f25f224](https://github.com/tomtom-international/maps-sdk-js/commit/f25f224058b8f635a4ba2918c7cbe1a9f9247f81))


### Bug Fixes

* add type annotation for madridCenter in TrafficAreaAnalyticsModule tests ([4ae92c5](https://github.com/tomtom-international/maps-sdk-js/commit/4ae92c51e11033ac9ba15291be9001eaf13f322e))
* migrate reachable range service from V3 to V2 API and update docs link ([6543c10](https://github.com/tomtom-international/maps-sdk-js/commit/6543c1036936876c39606c7774f0624d91b36310))
* omit tomtom-user-agent header for area analytics requests (CORS) ([e545b59](https://github.com/tomtom-international/maps-sdk-js/commit/e545b597813d1596eb9cf6e6a50db0a24a95b758))
* resolve lint errors and remove non-null assertions ([5dd3424](https://github.com/tomtom-international/maps-sdk-js/commit/5dd3424631a06498ba2a4b74a858b5d16a18e3d6))
* restore .npmrc before creating pull request ([143da4c](https://github.com/tomtom-international/maps-sdk-js/commit/143da4c4de981d50e6a9e6440e9de5591b9571c9))
* wait ForMapIdle race condition ([dd84fdc](https://github.com/tomtom-international/maps-sdk-js/commit/dd84fdcc26d7edcca8373a03a84d23efad2b2ea1))

## [0.46.6](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.5...v0.46.6) (2026-03-17)


### Bug Fixes

* dep and sandpack upgrades ([0c893f1](https://github.com/tomtom-international/maps-sdk-js/commit/0c893f1c3953c731bd5eff575d8e857066b73ea4))

## [0.46.5](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.4...v0.46.5) (2026-03-17)


### Bug Fixes

* add thumbnails for nodejs examples ([de8c4ed](https://github.com/tomtom-international/maps-sdk-js/commit/de8c4ed17163f1e982b11805401455629e5b8211))

## [0.46.4](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.3...v0.46.4) (2026-03-17)


### Bug Fixes

* sandpack examples relying on Set logic ([ada3d81](https://github.com/tomtom-international/maps-sdk-js/commit/ada3d811407200c1e2220e5a81f4a6dfa3e00242))

## [0.46.3](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.2...v0.46.3) (2026-03-17)


### Features

* along route search service with examples, docs and minor refactorings ([bca128f](https://github.com/tomtom-international/maps-sdk-js/commit/bca128fe3e122be4dbc6a19701bacfdb8e94080b))
* along route search service with examples, docs and minor refactorings ([fcef902](https://github.com/tomtom-international/maps-sdk-js/commit/fcef902167d51c61d26dfd104e8e929b7fe854d9))


### Bug Fixes

* ensure geometry search and along route search cannot accept position params ([b065378](https://github.com/tomtom-international/maps-sdk-js/commit/b065378f2f08a5bbbbac2e3d362e116c06263d1d))

## [0.46.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.1...v0.46.2) (2026-03-16)


### Features

* add context7 json to help manage ai assisted coding ([7ce7c17](https://github.com/tomtom-international/maps-sdk-js/commit/7ce7c179394471c8778828622ae8c8cec8d8ed6c))

## [0.46.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.0...v0.46.1) (2026-03-13)


### Features

* add skills for agents to develop with the SDK ([cc30803](https://github.com/tomtom-international/maps-sdk-js/commit/cc30803e1c7e626bae2ecd6239296427687f9d58))
* enhance documentation for map agent and setup with new examples and boilerplate ([d75af32](https://github.com/tomtom-international/maps-sdk-js/commit/d75af3225ba6331142976cc980d323881ea40240))
* make tool-activation opt-out ([1a3f980](https://github.com/tomtom-international/maps-sdk-js/commit/1a3f9808aa252b3b9a44139712f313e5cf8a68d1))


### Bug Fixes

* ensure traffic area analytics report name ([2bb9a5b](https://github.com/tomtom-international/maps-sdk-js/commit/2bb9a5b21d1719df23ece7fcb387ca702178cb73))
* poi category codes agent tool reliability with languages ([5bac87d](https://github.com/tomtom-international/maps-sdk-js/commit/5bac87d6e53c8089aab2bd4ee56042ab4a3023b9))

## [0.46.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.12...v0.46.0) (2026-03-12)


### ⚠ BREAKING CHANGES

* improve poi categories relationship with search

### Features

* improve poi categories relationship with search ([52f5a26](https://github.com/tomtom-international/maps-sdk-js/commit/52f5a265dbe0ae4cbb3386de3740cb887ed1a11c))
* traffic area analytics lite service ([e3208bb](https://github.com/tomtom-international/maps-sdk-js/commit/e3208bb3210fdb5c13a163a69ac3f397fca6d165))

## [0.45.12](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.11...v0.45.12) (2026-03-04)


### Bug Fixes

* missing example thumbnail ([376d2ae](https://github.com/tomtom-international/maps-sdk-js/commit/376d2aeb98fc1a875e9dfe59af04dc1e64862441))

## [0.45.11](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.10...v0.45.11) (2026-03-03)


### Features

* add avoid areas parameter for route calculations ([301c108](https://github.com/tomtom-international/maps-sdk-js/commit/301c1084c74bd9f7c8132524cb3806589300f264))
* add avoid areas parameter for route calculations ([92d622a](https://github.com/tomtom-international/maps-sdk-js/commit/92d622a5ae0c954039ece72bc5554539d53e3892))
* add intent-based classification and selective tooling with tool groups and step scope ([b49f2b4](https://github.com/tomtom-international/maps-sdk-js/commit/b49f2b48c1261990e5d25c4ff0aa267e57d971d8))
* improve pois and traffic map feature mappings ([3cc9648](https://github.com/tomtom-international/maps-sdk-js/commit/3cc96486b2f591308436e2e8e3a4cd892e3b98c1))
* improve pois and traffic map feature mappings ([3ea4c79](https://github.com/tomtom-international/maps-sdk-js/commit/3ea4c794597fb047bec5632a3c773e6609d15a39))
* multiple agent tool improvements ([2bc0945](https://github.com/tomtom-international/maps-sdk-js/commit/2bc09455bfaa4c50098daab246774ea2bf091e25))


### Bug Fixes

* clear geometry labels property ([5fba21b](https://github.com/tomtom-international/maps-sdk-js/commit/5fba21b833a33b341955cab3b7a80d29bb3dfa9e))
* geometries label size ([f01c4d6](https://github.com/tomtom-international/maps-sdk-js/commit/f01c4d626506847357ade61e1a4c6b2f1e111941))
* remove unused section props ([fd49b6e](https://github.com/tomtom-international/maps-sdk-js/commit/fd49b6e47fcb12d91a83a1c335c9824c42224e36))
* routing module incident events type ([fe0be16](https://github.com/tomtom-international/maps-sdk-js/commit/fe0be16344c6c4e52eb00b6ef07492d8dc4ab259))
* switch from geojsonobject to geojson types for correctness ([119816b](https://github.com/tomtom-international/maps-sdk-js/commit/119816b40ead3cf6081f319d8a6c006980c3ecf3))

## [0.45.10](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.9...v0.45.10) (2026-02-26)


### Features

* improve traffic details service parameters and documentation ([ca8e026](https://github.com/tomtom-international/maps-sdk-js/commit/ca8e0267dd11b6a899f5c4b254015913d50a60d0))

## [0.45.9](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.8...v0.45.9) (2026-02-26)


### Features

* improve inverted theme support for reachable ranges, migrate examples to use theme: 'inverted' ([5bd9c93](https://github.com/tomtom-international/maps-sdk-js/commit/5bd9c93ccc8cfce5b143da3f12a09d165af2eb6b))
* incident details service improvements and added agent tools ([9f3058d](https://github.com/tomtom-international/maps-sdk-js/commit/9f3058dd55fde278ea8d8b58ddb223c354dd9ada))
* traffic incident details service ([202d513](https://github.com/tomtom-international/maps-sdk-js/commit/202d51337cc0a45b2dd03474f8c155a3dc3e7eb9))

## [0.45.8](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.7...v0.45.8) (2026-02-24)


### Bug Fixes

* ensure reachable ranges is visible on docs portal ([f10675a](https://github.com/tomtom-international/maps-sdk-js/commit/f10675a170d6e7cfe8b73b29a921e210a3f0bae3))

## [0.45.7](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.6...v0.45.7) (2026-02-24)


### Features

* add themed geometry config and make reachable-ranges zero-plumbing geometry display ([75b0b2d](https://github.com/tomtom-international/maps-sdk-js/commit/75b0b2da243c0e7b51635c841301ec709e8bc4a6))
* reinstate displayReachableRanges and reachable-ranges example, allowing custom multi-budget-type, palette, and theme support ([ff5ef71](https://github.com/tomtom-international/maps-sdk-js/commit/ff5ef716cad6a423c6df955a634b4c781fb2519e))
* typed features for map traffic incidents and flow, with extra properties ([4c5f25d](https://github.com/tomtom-international/maps-sdk-js/commit/4c5f25d822b80df97b81ea6027c8b6e241e2c2e6))


### Bug Fixes

* remove roadShieldReferences guidance param — road shields are requested via sectionTypes, and are included by default ([dca539b](https://github.com/tomtom-international/maps-sdk-js/commit/dca539b5c04b91a79cfa47273c413edee342b6ce))

## [0.45.6](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.5...v0.45.6) (2026-02-23)


### Features

* opt-out visibility for route summary bubbles ([429c214](https://github.com/tomtom-international/maps-sdk-js/commit/429c214fa9d2416b3dc205df89d1d72b2ad781bc))


### Bug Fixes

* pois module feature mappings and type fixes ([7e59a24](https://github.com/tomtom-international/maps-sdk-js/commit/7e59a24fbdbd525e1d94c87036d05924bb28ff03))

## [0.45.5](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.4...v0.45.5) (2026-02-20)


### Features

* add new get section progress tool, and improve existing tools ([046264c](https://github.com/tomtom-international/maps-sdk-js/commit/046264cadb463ef5f1b2e856997f6d3ef5c5ad13))
* core utilities related to routes and tool description improvements ([a207053](https://github.com/tomtom-international/maps-sdk-js/commit/a207053638dbc34ffe8d440118b418b1d638a489))
* new hover-move event type which keeps firing as you move the pointer over the relevant features ([1ffc433](https://github.com/tomtom-international/maps-sdk-js/commit/1ffc433612b34397af242351ab1d226323ca5682))
* new utility to find route progress matching a nearby arbitrary location ([a0e3e0d](https://github.com/tomtom-international/maps-sdk-js/commit/a0e3e0d4e8ad69d874bc2d1099da65f585386772))
* refactor core utility guides and add new example for add stops to route ([137e4d9](https://github.com/tomtom-international/maps-sdk-js/commit/137e4d9515668acaaaf996a74029c0d8c86cb099))


## [0.45.4](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.3...v0.45.4) (2026-02-17)

## [0.45.3](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.2...v0.45.3) (2026-02-17)

## [0.45.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.1...v0.45.2) (2026-02-17)

### Features

* add shared CSS design system and reusable HTML templates for examples ([5d5e77b](https://github.com/tomtom-international/maps-sdk-js/commit/5d5e77bb95ba2d47ef87533edaf894780a9c8860))
* add template CSS inlining and local SDK dependency resolution to Sandpack ([d16d9b6](https://github.com/tomtom-international/maps-sdk-js/commit/d16d9b6f863d12b69033be350fac84ecbf5b1e2d))
* migrate all examples to use the shared CSS design system ([76f42f9](https://github.com/tomtom-international/maps-sdk-js/commit/76f42f90304e4db4b7061f91120d1632b6c4f0f5))
* zod and lodash are now peer dependencies, not bundled in sdk anymore ([e7dbce5](https://github.com/tomtom-international/maps-sdk-js/commit/e7dbce52d73372087fc6a38cd5a1eae499223e11))


### Bug Fixes

* update Playwright config for Chrome for Testing WebGL support and refresh snapshots ([05d644f](https://github.com/tomtom-international/maps-sdk-js/commit/05d644f82857ce6f828394a6f5bebb569d895ad4))

## [0.42.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.42.1...v0.42.2) (2026-02-06)


### Bug Fixes

* ensure map theme switching is smooth ([f5ce208](https://github.com/tomtom-international/maps-sdk-js/commit/f5ce208d1dfbc725e68ce2b57d4f20adafac1c06))

## [0.42.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.42.0...v0.42.1) (2026-02-03)


### Features

* add traffic incident playground example ([f5dc3ea](https://github.com/tomtom-international/maps-sdk-js/commit/f5dc3eacffc13549b098838fffedc1bd8d460f5f))


### Bug Fixes

* enable documentation indexing ([0af5d75](https://github.com/tomtom-international/maps-sdk-js/commit/0af5d75c356ed4ad5cbca07454d0c182a7621954))
* filter by incidents by magnitude_of_delay ([7e99da9](https://github.com/tomtom-international/maps-sdk-js/commit/7e99da917e1ce9caeef37f4d85b2a91d8051db9b))
* omit bounding box and position from search options in viewport places plugin since they should be automatically set ([a2ffd50](https://github.com/tomtom-international/maps-sdk-js/commit/a2ffd503c58cbf0c17c678b54cf6f83d8074936f))

## [0.42.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.41.8...v0.42.0) (2026-01-30)


### Features

* **viewport-places:** improve types ([817678e](https://github.com/tomtom-international/maps-sdk-js/commit/817678e6d280560307bfb445bf183136aca69a41))


### Bug Fixes

* viewport places plugin example ([836abdd](https://github.com/tomtom-international/maps-sdk-js/commit/836abdd73e6fc4bb4829c7bb725521e149bf1db3))


## [0.41.8](https://github.com/tomtom-international/maps-sdk-js/compare/v0.41.7...v0.41.8) (2026-01-30)


### Bug Fixes

* viewport places plugin example ([836abdd](https://github.com/tomtom-international/maps-sdk-js/commit/836abdd73e6fc4bb4829c7bb725521e149bf1db3))

## [0.41.7](https://github.com/tomtom-international/maps-sdk-js/compare/v0.41.6...v0.41.7) (2026-01-30)


### Bug Fixes

* improve release workflow and update documentation ([905a7ed](https://github.com/tomtom-international/maps-sdk-js/commit/905a7ed0f3770ce51ac2937a948ef4ad6b8bfcaa))

## [0.41.6](https://github.com/tomtom-international/maps-sdk-js/compare/v0.41.5...v0.41.6) (2026-01-30)


### Features

* **viewport-places:** improve types ([817678e](https://github.com/tomtom-international/maps-sdk-js/commit/817678e6d280560307bfb445bf183136aca69a41))

## [0.41.5](https://github.com/tomtom-international/maps-sdk-js/compare/v0.41.4...v0.41.5) (2026-01-30)


### Features

* **viewport-places:** improve TSDocs ([01ced36](https://github.com/tomtom-international/maps-sdk-js/commit/01ced36e895f679e0f92f2241d9442c9415e0eb2))

## [0.41.4](https://github.com/tomtom-international/maps-sdk-js/compare/v0.41.3...v0.41.4) (2026-01-30)


### Bug Fixes

* missing [@ignore](https://github.com/ignore) for internal routing variable ([3d0651d](https://github.com/tomtom-international/maps-sdk-js/commit/3d0651d38cbba4768dbf93c76858950f10b9a51b))
* missing tsdoc group for type ([c979606](https://github.com/tomtom-international/maps-sdk-js/commit/c9796067f7fb1dabda579ca4d086369da3f198c3))

## [0.41.3](https://github.com/tomtom-international/maps-sdk-js/compare/v0.41.2...v0.41.3) (2026-01-29)


### Features

* simplify viewport places method name, and improve api reference docs ([46c7de1](https://github.com/tomtom-international/maps-sdk-js/commit/46c7de1f504839a796d8052567069b5d87ccdb0b))
* upgrade deps ([a290b02](https://github.com/tomtom-international/maps-sdk-js/commit/a290b02770dfa80b54fe32ed0c2758c7b42d2ec3))

## [0.41.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.41.1...v0.41.2) (2026-01-29)


### Features

* add availability-aware custom EV icons to example ([99a7c22](https://github.com/tomtom-international/maps-sdk-js/commit/99a7c229e1dd79fb05f0e23a62121a70649c20ae))
* add EV availability icon selection with custom icon support ([64340fe](https://github.com/tomtom-international/maps-sdk-js/commit/64340fed1dcb4660c71a3ee780b807601408ff42))
* add EVAvailabilityConfig type with opt-in configuration ([6a7d8b5](https://github.com/tomtom-international/maps-sdk-js/commit/6a7d8b578d6d02c355462ec6575087587aa06d05))
* add plugins workspace with first plugin to easily display search-powered layers of places on the map ([eac82a2](https://github.com/tomtom-international/maps-sdk-js/commit/eac82a2ebe731e87463564eb5e1331089ca1cc70))
* add theme awareness and availability-level icon image handling to PlacesModule ([62f0859](https://github.com/tomtom-international/maps-sdk-js/commit/62f0859671242f58b5ade2efc6b710944afdc720))
* enhance EV custom display example with theme switching and improved controls ([5da5f20](https://github.com/tomtom-international/maps-sdk-js/commit/5da5f20af6634cb6ba3f16fb59c4ff0af3fd7a34))
* implement EV availability display in layer specs ([2f737a2](https://github.com/tomtom-international/maps-sdk-js/commit/2f737a2a9cded78e1d52d8a06d0e62f4efb5d438))
* rename ev playground to search ([5b19771](https://github.com/tomtom-international/maps-sdk-js/commit/5b19771765584305ff900c7d0c70e30d364e9ab5))


### Bug Fixes

* make StyleChangeHandler callbacks optional ([35339ca](https://github.com/tomtom-international/maps-sdk-js/commit/35339ca0927474314bd2222c5dcc30d832552da7))
* try to fail gracefully when some layers cannot be added in map modules, likely due to misconfiguration ([afa586e](https://github.com/tomtom-international/maps-sdk-js/commit/afa586e03e1a4d7c72f4b72fb1fab46bfeaa018a))

## [0.41.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.41.0...v0.41.1) (2026-01-16)


### Bug Fixes

* **examples:** import in ev-charging-stations-playground ([2d66e62](https://github.com/tomtom-international/maps-sdk-js/commit/2d66e62f948658abd652042ffaca5431c93d9966))

## [0.41.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.40.1...v0.41.0) (2026-01-16)


### ⚠ BREAKING CHANGES

* merge mapParams and mapLibreOptions
* **ev-search:** merge connectors and connectorCounts
* **ev-search:** getPlacesWithEvAvailability return type

### Bug Fixes

* css responsiveness ([37b0c8b](https://github.com/tomtom-international/maps-sdk-js/commit/37b0c8b7e01e36893f3acde03fbfbdb09d30ac0e))
* **ev-search:** getPlacesWithEvAvailability return type ([1a8134c](https://github.com/tomtom-international/maps-sdk-js/commit/1a8134cc16fb7a3701b09ef13a6897dd158ad861))


### Code Refactoring

* **ev-search:** merge connectors and connectorCounts ([352c404](https://github.com/tomtom-international/maps-sdk-js/commit/352c404abea41e407e2060ac74fe6b3a1fa64794))
* merge mapParams and mapLibreOptions ([3756aaf](https://github.com/tomtom-international/maps-sdk-js/commit/3756aafdf1b23f9af8a07a72b8ee388aade789e6))

## [0.40.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.40.0...v0.40.1) (2026-01-08)


### Bug Fixes

* calculate padded bboxes correctly if any of the surrounding elements goes beyond the visible screen ([6083ceb](https://github.com/tomtom-international/maps-sdk-js/commit/6083ceb25aab9a404c111802a68503e3b8b26225))
* ensure map style parts which were excluded are loaded more robustly ([33e74ff](https://github.com/tomtom-international/maps-sdk-js/commit/33e74ff8804c3acd63b71d6b8c7c335b0a0f2891))

## [0.40.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.39.0...v0.40.0) (2026-01-07)


### Features

* new padded bbox calculation utilities for map bundle ([7b686e0](https://github.com/tomtom-international/maps-sdk-js/commit/7b686e022a0035988db773e123bed0582b851823))
* new polygonFromBBox core utility ([ada872d](https://github.com/tomtom-international/maps-sdk-js/commit/ada872d9f76ea0a4f9dc4fd7b3132b568213e59d))
* sdk upgrade ([42ab185](https://github.com/tomtom-international/maps-sdk-js/commit/42ab185898820c60cb003b914a15d244324cb75b))

## [0.39.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.38.1...v0.39.0) (2026-01-06)


### Features

* add live coding for few guides ([05b3876](https://github.com/tomtom-international/maps-sdk-js/commit/05b3876cb6791e65fff5c6a990191b88f89fe6fc))
* new map style switcher example ([efdbbdd](https://github.com/tomtom-international/maps-sdk-js/commit/efdbbdd3006508114f9dd178fcc48d8bb62858ca))


### Bug Fixes

* simplify how sandpack examples are exposed ([3f75204](https://github.com/tomtom-international/maps-sdk-js/commit/3f752040d2f7f39f15e894fb6174645ef725b25a))

## [0.38.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.38.0...v0.38.1) (2025-12-17)


### Bug Fixes

* quickstart guide link text ([0c10c13](https://github.com/tomtom-international/maps-sdk-js/commit/0c10c13b00054ccc895db63ea64337d8675d502a))

## [0.38.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.37.0...v0.38.0) (2025-12-17)


### Features

* improve bbox types for places, routes and geometries ([602fa50](https://github.com/tomtom-international/maps-sdk-js/commit/602fa50025c71d4351a96beb5ed8fb742af27df1))

## [0.37.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.36.9...v0.37.0) (2025-12-16)


### Features

* improve bbox types for places and routes so they reflect 4-dimensional types ([bc80e1d](https://github.com/tomtom-international/maps-sdk-js/commit/bc80e1d0cfd4ca0c8d73dc232938f1e2b05adc15))
* optional events configuration for each map module ([ca823b3](https://github.com/tomtom-international/maps-sdk-js/commit/ca823b367ea2fa123ec0baf3dee3b8d2ce386de4))


### Bug Fixes

* add sandpack wrapper for each example ([bbe3a7c](https://github.com/tomtom-international/maps-sdk-js/commit/bbe3a7cc1b1ce2cf34d243811ab5898bbf143e2d))
* move sandpack local preview inside sandpack folder ([8fe88dc](https://github.com/tomtom-international/maps-sdk-js/commit/8fe88dcd4a555d0ff85f6b908c2aaf559d3542bf))
* use release please version in tests ([28ebc9b](https://github.com/tomtom-international/maps-sdk-js/commit/28ebc9bc99e4f544ae42fc078a8f864caf50a7ff))
* use vite to resolve dependencies and examples map ([ce5356e](https://github.com/tomtom-international/maps-sdk-js/commit/ce5356e03316c234d3f2d6beb3f911b09b415cd7))

## [0.36.9](https://github.com/tomtom-international/maps-sdk-js/compare/v0.36.8...v0.36.9) (2025-12-11)


### Bug Fixes

* upgrade deps ([dc382f9](https://github.com/tomtom-international/maps-sdk-js/commit/dc382f972a1c140a6849de3314ac11d2379d4231))

## [0.36.8](https://github.com/tomtom-international/maps-sdk-js/compare/v0.36.7...v0.36.8) (2025-12-11)


### Bug Fixes

* upgrade deps ([ee9437f](https://github.com/tomtom-international/maps-sdk-js/commit/ee9437fa3189b0a26201b32c49dab07294a1a884))

## [0.36.7](https://github.com/tomtom-international/maps-sdk-js/compare/v0.36.6...v0.36.7) (2025-12-11)


### Bug Fixes

* consistency with naming map module instance variables ([639ecdd](https://github.com/tomtom-international/maps-sdk-js/commit/639ecdd6eef1fc5ba4c365d678bd24ff986c0f36))

## [0.36.6](https://github.com/tomtom-international/maps-sdk-js/compare/v0.36.5...v0.36.6) (2025-12-10)


### Bug Fixes

* remove leftover console logs ([c225d2e](https://github.com/tomtom-international/maps-sdk-js/commit/c225d2eff60cac35a0a3e104246cad9486bcacac))

## [0.36.5](https://github.com/tomtom-international/maps-sdk-js/compare/v0.36.4...v0.36.5) (2025-12-09)


### Bug Fixes

* type exports ([60fe138](https://github.com/tomtom-international/maps-sdk-js/commit/60fe138823f5a3bb4110a1ecc0eca95427978319))

## [0.36.4](https://github.com/tomtom-international/maps-sdk-js/compare/v0.36.3...v0.36.4) (2025-12-08)


### Bug Fixes

* regression fix for additional layers vs multiple routing modules support ([8ef6ded](https://github.com/tomtom-international/maps-sdk-js/commit/8ef6ded477c406555665f1f466169c29aa23778b))
* regression fix regarding unnecessarily suffixing custom images in routing module instances ([2389813](https://github.com/tomtom-international/maps-sdk-js/commit/238981348d3381ac14527739d91eb9c71dc42623))

## [0.36.3](https://github.com/tomtom-international/maps-sdk-js/compare/v0.36.2...v0.36.3) (2025-12-08)


### Bug Fixes

* prevent querying features without passing any layers ([455c2c3](https://github.com/tomtom-international/maps-sdk-js/commit/455c2c3342f0dd2702949234b3434e2e88fb8662))

## [0.36.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.36.1...v0.36.2) (2025-12-08)


### Bug Fixes

* example content hotfix ([b8f1b83](https://github.com/tomtom-international/maps-sdk-js/commit/b8f1b834dc026f813df80dee3cfcebc13e47b069))
* simplify and improve category mappings for places ([3cb8095](https://github.com/tomtom-international/maps-sdk-js/commit/3cb809513ca859165acac712c14e5ba8aa477c9f))

## [0.36.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.36.0...v0.36.1) (2025-12-08)


### Bug Fixes

* simplify and improve category mappings for places ([62cb0dc](https://github.com/tomtom-international/maps-sdk-js/commit/62cb0dcdad8c3ec1f6ea4d088cc3abcfeea6c4ef))

## [0.36.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.35.5...v0.36.0) (2025-12-05)


### Features

* multiple routing module instances possible, including two new examples ([ba0ff53](https://github.com/tomtom-international/maps-sdk-js/commit/ba0ff53e67b7e29faa2dcf2a6581917cbd069691))


### Bug Fixes

* ensure feature ids and feature properties ids are always set ([8aeae8d](https://github.com/tomtom-international/maps-sdk-js/commit/8aeae8d4eb4943cb3413e8a0e5f6163180add13d))

## [0.35.5](https://github.com/tomtom-international/maps-sdk-js/compare/v0.35.4...v0.35.5) (2025-12-04)


### Bug Fixes

* skip validating styles when changing them for performance ([24a9490](https://github.com/tomtom-international/maps-sdk-js/commit/24a9490699da6383871f97f853a6cc1b5824f40e))
* upgrade maplibre dependency and ensure place properties always have id ([cf3d8ae](https://github.com/tomtom-international/maps-sdk-js/commit/cf3d8ae912bb677ced8acc28a55d8dd4f518a165))

## [0.35.4](https://github.com/tomtom-international/maps-sdk-js/compare/v0.35.3...v0.35.4) (2025-12-03)


### Bug Fixes

* use right icon for toll roads along routes ([9cb2144](https://github.com/tomtom-international/maps-sdk-js/commit/9cb21444a09d46eb367235d393fde095a0111c40))

## [0.35.3](https://github.com/tomtom-international/maps-sdk-js/compare/v0.35.2...v0.35.3) (2025-12-03)


### Bug Fixes

* custom image loading reliability across different browsers ([cd985d5](https://github.com/tomtom-international/maps-sdk-js/commit/cd985d58b2a5712f21dd1166c94154a10939b4a0))

## [0.35.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.35.1...v0.35.2) (2025-12-03)


### Bug Fixes

* rev geo playground init ([1e4356d](https://github.com/tomtom-international/maps-sdk-js/commit/1e4356d64f53d584771f93ba6c57b8a79c4cda71))

## [0.35.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.35.0...v0.35.1) (2025-12-03)


### Bug Fixes

* mitigation to try to be more reliable on detecting that maplibre css was already loaded ([755d7a0](https://github.com/tomtom-international/maps-sdk-js/commit/755d7a05fe6c08ab6f731e61b34178257d6548d5))
* remove noisy console warnings when deserializing potential JSON from features ([729405d](https://github.com/tomtom-international/maps-sdk-js/commit/729405dd03bc0509e455131249a862f38f868697))

## [0.35.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.34.1...v0.35.0) (2025-12-02)


### Features

* new searchOne convenience function for fast single result searches ([a5447bc](https://github.com/tomtom-international/maps-sdk-js/commit/a5447bcf718b49eca6775ab3c7dd1eb193219508))
* showRoutes in RoutingModule also accepts a single Route now ([e813e6d](https://github.com/tomtom-international/maps-sdk-js/commit/e813e6d7be63da7b0667a67de8995a4722bb866c))
* switching to a simplified BBox type in SDK with only 4 coordinates since we don't use the other 2 and this way we are more compatible with Maplibre ([d613460](https://github.com/tomtom-international/maps-sdk-js/commit/d613460f0e725e470c76fbe43553a44b90500047))


### Bug Fixes

* base map module undefined config consistency ([6163566](https://github.com/tomtom-international/maps-sdk-js/commit/6163566c060e51c34c4f7d5ba8aafe76df14ee34))

## [0.34.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.34.0...v0.34.1) (2025-12-01)


### Bug Fixes

* add config file to maintain example api key ([b3843c6](https://github.com/tomtom-international/maps-sdk-js/commit/b3843c6c58d582a403529bae0a398af2178590e7))
* move all files for examples under its src folder ([08848c8](https://github.com/tomtom-international/maps-sdk-js/commit/08848c802ebb4a5573942f958be92979c62426c6))
* nodejs examples based on es modules ([b180ba0](https://github.com/tomtom-international/maps-sdk-js/commit/b180ba08bbc729be336cf7adcf80d4ec334a473d))
* use sandpack to preview map in guides ([32be371](https://github.com/tomtom-international/maps-sdk-js/commit/32be371540c52dba85c99c3aed4fabb32a95fc43))

## [0.34.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.33.0...v0.34.0) (2025-11-26)


### Features

* hide fuzzySearch call to avoid overlap with search ([515e753](https://github.com/tomtom-international/maps-sdk-js/commit/515e753f6e1825d1ef90056e352c335c378bd539))
* improve visibility state management in traffic and hillshade modules, fix e2e tests, misc improvements ([908995e](https://github.com/tomtom-international/maps-sdk-js/commit/908995ec15b66d876132b6cd043783c827a5e8b3))
* improvements in PlacesModule and added examples ([9a1f1d8](https://github.com/tomtom-international/maps-sdk-js/commit/9a1f1d8f4adab6e856b826eae2da027178ded31d))
* upgrade sdk dependency ([11de0c7](https://github.com/tomtom-international/maps-sdk-js/commit/11de0c7c40e29a221738d713f1f6794a643093a4))


### Bug Fixes

* types and test data migrated to ts ([1269550](https://github.com/tomtom-international/maps-sdk-js/commit/12695509f73dc8e21e5bba75a64d7b2c1a3d5ad1))

## [0.33.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.32.3...v0.33.0) (2025-11-20)


### Bug Fixes

* update diagram how-the-sdk-works ([82f70ac](https://github.com/tomtom-international/maps-sdk-js/commit/82f70acf091d7998104738bd3b216a2aa53d5f4d))

## [0.32.3](https://github.com/tomtom-international/maps-sdk-js/compare/v0.32.2...v0.32.3) (2025-11-20)


### Bug Fixes

* route instruction arrows to be above incidents ([e72e3b8](https://github.com/tomtom-international/maps-sdk-js/commit/e72e3b82871e78d1a0b4d60c00cb3d624bdaf8a3))
* update license ([7ec1428](https://github.com/tomtom-international/maps-sdk-js/commit/7ec1428879424df602c34665fcd9806878c930c4))

## [0.32.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.32.1...v0.32.2) (2025-11-18)


### Bug Fixes

* es exports to prevent having to mention dist in imports ([00cedf3](https://github.com/tomtom-international/maps-sdk-js/commit/00cedf39f6977e8f2f2c766dc2a78e42eb0707c7))

## [0.32.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.31.1...v0.32.0) (2025-11-13)


### Features

* export sdk as es modules only ([1e7d0d9](https://github.com/tomtom-international/maps-sdk-js/commit/1e7d0d99d96320f910529d912b455ce36251560d))
* simplify map style initialization ([6dde7c9](https://github.com/tomtom-international/maps-sdk-js/commit/6dde7c9cea644e5046df19294d94da04a18cd49e))

## [0.31.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.30.2...v0.31.0) (2025-11-11)


### Features

* improve places module configuration and examples ([674ee83](https://github.com/tomtom-international/maps-sdk-js/commit/674ee83599ce59751e3183b9b3e00569e52cbfd3))
* sdk automatically loads MapLibre CSS if not done by the caller ([626a597](https://github.com/tomtom-international/maps-sdk-js/commit/626a59751c468c6d5deb02ce34779c348ec868f2))
* upgrade to new map style with new traffic incident icons ([1b228b5](https://github.com/tomtom-international/maps-sdk-js/commit/1b228b586a59232765d4c33c05b8b334d5246416))


### Bug Fixes

* search exports and using typeahead true for fuzzy search examples ([8601314](https://github.com/tomtom-international/maps-sdk-js/commit/8601314a4c1f40a364d713bda8e2e7806cf69baa))

## [0.30.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.30.1...v0.30.2) (2025-11-06)


### Bug Fixes

* example having incorrect references ([695d654](https://github.com/tomtom-international/maps-sdk-js/commit/695d654ac8309ba735db67d190726c6e79db6158))

## [0.30.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.30.0...v0.30.1) (2025-11-05)


### Bug Fixes

* pin category mapping ([a6aecb8](https://github.com/tomtom-international/maps-sdk-js/commit/a6aecb8569e3865d32ca814684f1c8c8d1f3b3e0))

## [0.30.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.29.2...v0.30.0) (2025-11-05)


### Features

* enable tomtom user agent headers by default ([30bcc22](https://github.com/tomtom-international/maps-sdk-js/commit/30bcc2264e5cd335c19b8f01699bc20de1141947))


### Bug Fixes

* route example content ([4b56065](https://github.com/tomtom-international/maps-sdk-js/commit/4b56065916e512a7d3ea2d2af00e02fbc17b1c77))

## [0.29.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.29.1...v0.29.2) (2025-11-04)


### Features

* First Public Preview Release :rocket:
