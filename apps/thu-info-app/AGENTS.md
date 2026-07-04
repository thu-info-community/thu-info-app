# THUInfo App Agent Guide

## Purpose

`apps/thu-info-app` is the React Native client for Android, iOS, and HarmonyOS. This directory owns product behavior, UI, navigation, Redux state, and platform integration on top of `@thu-info/lib`.

Treat this directory as a multi-platform client application, not a web app and not a replacement for the portal-facing library layer.

## Architecture

- `src/ui/*` contains screens and user-facing flows.
- `src/components/*` contains shared UI composition and navigation wiring, including `components/Root.tsx`.
- `src/redux/*` owns client state, persistence, and side effects.
- Native platform projects live under `android/`, `ios/`, and `harmony/`.
- `@thu-info/lib` remains the default boundary for campus portal data access.

## Workflow

Classify the task first:

- Pure UI presentation
- Redux state or client data flow
- Navigation or screen lifecycle
- Native capability or bridge integration
- Platform-specific behavior on Android, iOS, or HarmonyOS

Default debugging and implementation order:

1. Decide whether the issue is actually in `@thu-info/lib` data, login state, or parsing.
2. If not, minimize the problem to React Native JS behavior: component logic, selector usage, navigation, and screen state.
3. Only drop to platform-specific investigation when the issue depends on native modules, permissions, file handling, WebView, or platform divergence.

Implementation rules:

- Keep portal-facing requests flowing through `@thu-info/lib`.
- Treat `app.cs.tsinghua.edu.cn` integrations as separate from campus portal behavior.
- Follow existing organization patterns in `src/ui/`, `src/redux/slices/`, and navigation wiring in `src/components/Root.tsx`.
- When touching login, cookies, WebView, permissions, or native modules, note whether behavior could differ across Android, iOS, and HarmonyOS.
- For Harmony-related work, check whether `codegen-harmony` or `bundle-harmony` is part of the expected workflow.

## Validation

- For UI-only work, run the closest available tests or document the manual navigation path used to verify behavior.
- For state-flow changes, verify loading, failure, empty, logged-out, and logged-in cases as applicable.
- For native or platform work, state which platform was tested and which platforms were not.
- When a bug appears app-side but may be data-driven, verify the contract with `@thu-info/lib` before concluding it is a UI regression.

## Pitfalls

- Do not bypass `@thu-info/lib` to patch over portal issues inside the app.
- Do not treat React Native issues as browser problems; the main complexity here is multi-platform integration, not DOM behavior.
- Do not assume Android, iOS, and Harmony behave identically around permissions, cookies, WebView, or native bridges.
- Do not report an app fix as complete if only one platform path was checked for a platform-sensitive change.
