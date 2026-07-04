# THUInfo Lib Agent Guide

## Purpose

`packages/thu-info-lib` is the protocol and parsing layer for Tsinghua web portals. This package is maintained by reverse engineering upstream web flows and turning them into stable, typed interfaces for consumers.

Treat this directory as reverse-engineering and compatibility work, not generic API client work.

## Architecture

- `src/lib/*.ts` contains domain-specific request and parsing logic such as `library.ts`, `card.ts`, `network.ts`, and `core.ts`.
- `src/models/*` defines typed outputs. Prefer exposing typed models instead of raw upstream payloads.
- `src/utils/network.ts` and related helpers manage shared cookie/session behavior.
- Login, WebVPN, redirects, and multi-step auth flows are central infrastructure. Changes here can affect many features at once.
- `helper.login()` is a staged flow, not a single-site login. It first establishes WebVPN / identity state, then roams into the information portal via `roam(helper, "id", ...)` to build portal-side session state.
- `roam()` is the cross-system session bootstrap primitive. It converts an existing top-level login state into a target-system session by following the system-specific SSO / redirect path for that destination.
- `RoamingPolicy` is not cosmetic. Different policies represent different bootstrap mechanisms:
  - `default`: call the information-portal roaming endpoint, get a target URL, then enter the target system through WebVPN
  - `id`, `card`, `id_website`, `cr`: perform direct identity-site login against a target entry page, then follow the returned redirect chain
  - `cab`, `gitlab`: special-case target systems with their own login bootstrap details

## Workflow

Start by classifying the task:

- Upstream HTML or response shape changed
- Login, redirect, WebVPN, captcha, or 2FA flow changed
- Existing parsing or model mapping is wrong
- A new API must be added by tracing its source page or network requests

When maintaining or adding an API:

1. Identify the real entry page and request flow.
2. Capture the request method, parameters, important headers, redirect chain, and cookie dependencies.
3. Record the response structure and notable failure branches.
4. Decide whether the endpoint fits existing helpers such as `uFetch`, roaming wrappers, and current cookie management.
5. Add or update typed models before exposing new data to callers.

When deciding whether an API needs roaming:

- Ask which system actually owns the target page or API.
- Check whether the operation expects an already-established target-system session rather than only WebVPN login.
- Prefer reusing an existing `RoamingPolicy` and payload if the endpoint belongs to a system that is already supported.
- Treat missing or incorrect roaming as a likely cause when login appears successful but the target API returns login HTML, permission errors, or empty bootstrap responses.

Reverse-engineering expectations:

- Prefer browser DevTools Network, HAR, and response inspection over guesswork.
- When WebVPN, OAuth, or form redirects are involved, inspect both visible page jumps and underlying requests.
- Before merging a new API, confirm whether it requires login, depends on prior requests, or mutates shared cookie state.
- When Node.js and React Native behave differently, compare cookie jars, redirect chains, and fetch implementations before assuming the upstream portal changed.
- Remember that WebVPN can take over cookie management for proxied campus sites. Browser-like environments may succeed because the underlying cookie store honors WebVPN behavior that a manual Node.js cookie header does not reproduce automatically.
- When debugging portal login, separate the WebVPN phase from the information-portal phase. A successful WebVPN login does not prove the portal roam step succeeded.
- When debugging any target system behind `roam()`, separate "identity proved" from "target session established". The latter often depends on intermediate redirects and cookies that are easy to lose in Node.js.

Implementation rules:

- Place new logic in the closest existing domain file unless there is a strong reason to create a new module.
- Reuse or extend `src/models/*` instead of returning raw HTML fragments or ad hoc objects.
- Prefer stable attributes, structure, and field names over brittle UI text when parsing.
- Treat shared login/session code as high-risk surface area and minimize incidental changes.
- In Node.js, treat manual cookie handling and redirect-following as part of the feature contract, especially around WebVPN and ID login flows.
- Do not assume a flat `Cookie` header is equivalent to browser behavior once WebVPN is proxying the target site.
- If Node.js behavior diverges only after `helper.login()` returns, inspect the redirect/cookie behavior inside the portal-roaming stage before changing higher-level API code.
- Do not add a new ad hoc login sequence if the problem is really "this API belongs behind an existing roam step". Extend or reuse `roam()` / `roamingWrapper*()` instead.

## Validation

- Add mock-based or static parsing tests when feasible.
- For real-environment verification, document prerequisites and manual steps clearly.
- Any change involving login, cookies, redirects, captcha, or 2FA must call out regression risks explicitly.
- If retries were needed due to flaky upstream behavior, distinguish flakiness from code correctness before concluding.
- For Node.js login debugging, validate both `login()` and at least one follow-up request that depends on carried cookies, such as `getCsrfToken()`.
- When Node.js debugging requires 2FA, prefer a stable `fingerprint` and trusted-device flow to reduce repeated manual verification during iterative testing.
- When browser comparison is needed, prefer a real browser session over React Native for WebVPN investigations. The browser is easier to inspect and usually closer to the relevant cookie behavior.
- When validating login fixes, test both a portal-dependent primitive such as `getCsrfToken()` and a few representative business APIs from different systems, because some failures only appear after the shared login path is exercised by real features.

## Pitfalls

- Do not assume upstream portals are stable or well-versioned.
- Do not change selectors or field mappings based only on one happy-path sample.
- Do not forget shared-cookie side effects when adding new request flows.
- Do not hide reverse-engineering assumptions; write them down in code comments or verification notes when they matter.
- Do not treat "login succeeded" as proof that Node.js session state is correct; missing WebVPN cookies may only surface on the next request.
- Do not treat `helper.login()` returning as proof that the information-portal roam step is healthy. Problems in the second stage can surface only on portal-backed APIs.
- Do not compare only request bodies between Node.js and React Native. Cookie presence, redirect handling, and platform fetch behavior can be the real difference.
- Do not assume the legacy csrf bootstrap endpoint is the only thing broken. If it returns empty, verify whether the real regression is earlier in the roam/cookie chain before rewriting callers around that symptom.
- Do not read `roam()` as "just redirect to a page". In practice it is often the step that creates the target system's usable session.
