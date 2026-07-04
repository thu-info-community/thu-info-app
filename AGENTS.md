# THUInfo Agent Guide

## Purpose

This repository is a monorepo with two primary work areas:

- `packages/thu-info-lib`: protocol, login, parsing, and model logic for Tsinghua web portals
- `apps/thu-info-app`: the React Native client for Android, iOS, and HarmonyOS

Use the nearest `AGENTS.md` as the source of truth for local workflow. Start here for cross-repo rules, then switch to the subdirectory guide before making changes.

## Architecture

- `packages/thu-info-lib` owns campus portal interaction, cookie/session flow, parsing, and typed data models.
- `apps/thu-info-app` owns UI, navigation, Redux state, and platform integration.
- The app should continue to consume portal-facing data through `@thu-info/lib` unless the work is purely client-side or explicitly targets existing `app.cs.tsinghua.edu.cn` services.

## Workflow

Before changing code, classify the task:

- If it touches portal endpoints, cookies, redirects, login, parsing, or typed response models, work under `packages/thu-info-lib`.
- If it touches screens, navigation, Redux, platform behavior, or client integrations, work under `apps/thu-info-app`.
- If the change crosses both layers, make the library boundary explicit and validate each layer separately.

Follow the closest subdirectory guide for implementation details. Do not treat root guidance as a substitute for local workflow.

## Validation

Every change should include the most relevant validation for its layer:

- `packages/thu-info-lib`: parsing behavior, login/session impact, model compatibility, and any regression risk around cookies or redirects
- `apps/thu-info-app`: screen behavior, navigation, Redux state flow, loading/error/empty states, and platform-specific verification when relevant

If a layer cannot be fully verified, state exactly what was and was not checked.

## Pitfalls

- Do not change `thu-info-lib` constants, login flow, cookie handling, or redirect logic unless you understand the upstream portal behavior.
- Do not bypass `@thu-info/lib` in the app to reimplement portal requests directly.
- Do not commit real credentials, cookies, captchas, raw capture artifacts, or `secrets.json`.
- Do not assume a client bug is a UI bug before checking whether the data contract or login/session behavior changed underneath.
