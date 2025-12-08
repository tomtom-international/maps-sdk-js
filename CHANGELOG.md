# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
