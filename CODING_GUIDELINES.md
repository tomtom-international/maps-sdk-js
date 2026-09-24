# Coding Guidelines

Normative for every change in this repository. Architecture, workspace layout and dev commands are in
[`AGENTS.md`](./AGENTS.md); each workspace's own `AGENTS.md` adds what is specific to it. Verify a finished change
with the `tomtom-maps-sdk-js-preflight` skill.

`biome.json` already decides what a linter can decide — formatting, import order, unused imports, `any`, function
length, type aliases over interfaces, the `map`/`services` split — and `pnpm lint:fix` applies it. Nothing below
restates those. Everything here is a judgement Biome and `tsc` cannot make for you.

## 1. Reuse before adding

- **Search before writing.** `git grep` the concept first. Generic geometry, bbox, distance, formatting and unit
  work already lives in `core/src/util/`; higher layers reuse `services/` helpers the same way.
- **One concept, one definition.** A second type with the same shape, a second constant with the same value, a
  second helper with the same job — extend or parameterise the existing one instead.
- **Extend, don't fork.** A variant of existing behaviour is an argument or a narrowed type on the existing
  function, never a copy with two lines changed.
- **Data duplicates too** — map-style layer IDs (`map/src/shared/layers/layerIDs.ts`), style keys, unit factors,
  category tables. Add a named entry to the single source rather than a second literal.
- **Where a new shared helper belongs**: used by two packages → `core/src/util/`; by two modules of one package →
  that package's `shared/`; by one file → local to it and unexported.
- **Delete what you replaced.** A superseded helper, type or constant leaves in the same change as its successor —
  including the import that reached it. `noUnusedImports` is error-level and `pnpm lint:fix` will not remove it for
  you, so a refactor that drops the last use of an import has to drop the import too.

## 2. Types: make illegal states unrepresentable

- **Discriminated unions over co-optional properties.** Properties that cannot coexist, or that must appear
  together, belong in a union behind a literal discriminant — not in separate `?:` fields guarded at runtime.

    ```typescript
    // The compiler cannot reject `{ mode: 'byRadius', boundingBox }`
    type BadQuery = { radiusMeters?: number; boundingBox?: BBox };

    type Query = { kind: 'radius'; radiusMeters: number } | { kind: 'boundingBox'; boundingBox: BBox };
    ```

- **`?` means "absent is a valid state"** — not "required in some other mode". If a field is mandatory in one
  mode, model the modes.
- **Derive, never restate.** `Pick`, `Omit`, `Extract`, `keyof`, indexed access and `z.infer` keep one source of
  truth; a hand-written twin of a schema or of another type drifts silently. The one sanctioned pair is a
  TSDoc'd public parameter type in `services/` alongside its request schema — the type is what the API reference
  publishes, the schema is what validates at runtime. An internal type next to a schema is not that pair: infer it.
- **A wire type is not a public type.** When the API's shape differs from the one consumers should see, declare the
  API shape in `types/apiRequestTypes.ts` / `apiResponseTypes.ts`, derive it from the public type where it overlaps,
  and translate in the request builder or response parser.
- **Literal unions over `string` and `number`** whenever the value set is known. Use an `as const` object plus
  `(typeof values)[keyof typeof values]` when the values are needed at runtime too.
- **No cast a narrow would do.** `as` discards the case the compiler found — add the type guard or fix the type.
  (`as const` is not a cast in this sense.)
- **Return precisely.** Return what the function produces, not a union covering every caller; split into
  overloads or add a type parameter instead.
- **Public types in `types/`**, one file per grouping. Internal types stay in the file that uses them.

## 3. Comments and docs: compact

- **Comment only what the code cannot state** — a unit, an invariant, an ordering constraint, a workaround and
  its cause.
- **Never narrate the next line.** A comment restating the statement below it doubles what a reader has to keep
  correct and says nothing the code did not.
- **Explain a concept once, where it belongs** — at the type, base class or module guide that owns it, and point
  at that from everywhere else. The same paragraph restated at every call site becomes that many contradictions
  the first time the behaviour changes.
- **Document the end state, not the change.** No "was renamed", "no longer throws", "used to be ignored" — the
  diff and the changelog carry history. When a removal leaves a fact worth knowing, state the fact on its own.
- **TSDoc on public API**: one-line summary, then `@param` / `@returns` only where the name does not already
  carry it, and `@example` only for a non-obvious call shape. A tag that repeats the signature is noise.
- **Keep prose short**: at most three lines per paragraph and two paragraphs per block. Beyond that, switch to a
  bullet list or a table.
- **No filler** — "this is useful for…", "simply", "note that", "as you can see", emoji.

## 4. Structure and imports

- **A directory's `index.ts` barrel is its public surface**, and the package entry re-exports barrels wholesale,
  so add a symbol only when consumers need it. Internal cross-directory imports go to the source file directly.
- **No re-exports.** Never forward a symbol that originates elsewhere; import from the canonical source.
- **Shortest import path.** Use the barrel when it exports the symbol (`from '../../shared'`); reach for the
  deep file only when it does not, or when you are inside that barrel's own subtree — importing your own barrel
  makes a cycle. Drop a trailing `/index`: `from '../..'`.
- **Export nothing that need not be public** — unused exports defeat tree-shaking.

## 5. Naming

- **Never abbreviate.** `response` not `res`, `request` not `req`, `error` not `err`, `parameters` not `params`,
  `index` not `idx`, `element` not `el`, `reference` not `ref`, `argument` not `arg`, `destination` not `dest`,
  `source` not `src`, `message` not `msg`, `previous` not `prev`, `current` not `curr`.
- **Two exceptions: loop counters, and `config`.** The public types already carry it —
  `RoutingModuleConfig`, `SectionDisplayConfig`, `MapModuleCommonConfig` — so spelling it out in new code alone
  puts two words for one concept in the same file.
- **Specific over generic** in a public signature: `routeIndex`, `placeQuery`, `styleId` — not `index`, `query`,
  `style`.

## 6. Syntax Biome leaves to you

- **Arrow functions** over `function` declarations. A one-expression arrow omits the braces and the `return`:
  `const double = (value: number) => value * 2`.
- **Blank line after a single-line `if`** — one with no `else` whose body is a single statement or early exit —
  when more code follows, so it reads as distinct from what comes next.

## 7. Domain rules

- **Coordinates are always `[longitude, latitude]`** (GeoJSON order); a bbox is
  `[minLongitude, minLatitude, maxLongitude, maxLatitude]`.
- **Map modules are built by their factory, never `new`**: `await SomeDataModule.create(map)` for data-owned
  modules, `await SomeStyleModule.get(map)` for style-owned ones. See the module table in
  [`AGENTS.md`](./AGENTS.md).
- **A plugin tool's `execute` catches its own failures** and returns `{ error: string }` — or a discriminated
  status when the model must branch. Throwing escapes the AI SDK boundary.

## 8. Tests

- **A `tests/` subdirectory beside the source it covers** — `src/<area>/tests/<Name>.test.ts`, or `src/tests/`
  for files sitting directly in `src/`. Never a sibling `<Name>.test.ts`.
- **`*Integration.test.ts` calls the live API** and nothing excludes it, so `pnpm test:sdk` spends quota. Name a
  test that way only when it genuinely needs the network.
- **Assert, don't log.** A test whose body prints a response instead of expecting something is not a test.

## 9. Dependencies and shared configuration

- **A version used by two workspaces belongs in `catalog:`** (`pnpm-workspace.yaml`). Add dependencies with
  `pnpm -F <workspace> add <package>`, and commit the matching `pnpm-lock.yaml` — CI's `--frozen-lockfile` fails
  every job without it.
- **Build, TypeScript and Vitest configuration is shared** from `shared-configs/`; change it there rather than
  per package.
- **Renaming or removing a public symbol is a repo-wide change.** Start from `git grep -l '<oldName>'` — the
  preflight skill walks the surfaces that go stale without a compile error.
