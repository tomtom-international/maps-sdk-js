# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.42.3](https://github.com/tomtom-international/maps-sdk-js/compare/v0.42.2...v0.42.3) (2026-02-16)


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
