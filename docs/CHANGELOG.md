# Changelog

All notable changes to `@chemx/o-command-palette` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `useTimeoutFn`: Self-cleaning timer composable adhering to Chemical X timer discipline with automatic lifecycle disposal via `onScopeDispose`.
- Domain composables extracted from `useCommandPaletteController`: `usePaletteSearch`, `usePaletteModal`, `useCommandPresentation`, `useCommandActions`.

### Changed
- `useCommandPaletteController`: Remediated hook saturation by coordinating exactly 5 domain composables and modularizing domain capsules to under 100 lines each.
- `useCommandSearch`: Replaced raw `setTimeout` debounce with self-cleaning `useTimeoutFn`.
- `useCommandSearch`: Enforced 3-5 property return limit by removing redundant `hasResults` computed property.
- `useCommandPaletteController`: Decomposed monolithic 22-property hook return into coordinated domain composables returning 5 properties (`modal`, `search`, `keyboard`, `presentation`, `actions`).
- `o-command-palette.vue`: Refactored script setup to consume domain composables while preserving all template bindings and `defineExpose` contracts.
- `types.d.ts`: Replaced lazy `any` casts for icon types with `string | Component | Record<string, unknown>`.

### Fixed
- `useCommandRegistry`: Eliminated AI slop redundant single-use passthrough assignment `shouldClose` before return.
- `useCommandSearch`: Replaced shallow empty error catch block in provider search with typed `catch (_error: unknown)`.
