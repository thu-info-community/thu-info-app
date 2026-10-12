# DeepSeek agent framework

## Enable and rollout

Enable **Settings → DeepSeek → Agent mode (preview)**. It is off by default until the campus gateway and real devices pass the checklist below. The implementation uses **AI SDK Core 7 `ToolLoopAgent`**, running on the device, with a custom model provider that calls only the existing campus **`/v1/chat/completions`** endpoint. It does not use Responses, Codex CLI, a shell, a new backend, or an upstream DeepSeek API key.

The first activation migrates legacy Redux conversations, verifies their persisted message counts, and only then clears the legacy payload. Migration is restartable and preserves IDs, titles, visible text and timestamps. Legacy histories had no account identity; the first migration assigns them to the currently signed-in account. New history is account-separated. Disabling the preview after migration pauses execution and leaves history readable; it does not copy large histories back into Redux.

`src/utils/campusModel.ts` defines the default model name shared by legacy chat and the agent: `DeepSeek-V4.1-Flash`. `src/agent/types.ts` contains its capability descriptor, with a 128K (131,072) context token budget and a 4,096 output token limit. These gateway limits remain **unverified**. Only **Provider default** is enabled; it sends neither `thinking` nor `reasoning_effort`. Add a thinking choice only after checking its actual behavior on the campus gateway, not merely whether a request accepts the parameter. The settings UI follows this descriptor.

## Boundaries

```text
DeepSeek screen / native approval UI
  → account-scoped AgentService (one active runner)
    → AI SDK ToolLoopAgent + campus Chat Completions adapter
      → import_tools("") → category → category.function
        → reviewed generated InfoHelper binding or dedicated native wrapper
      → read_result / request_user_input
    → immutable conversation chunks + atomic manifest pointer
```

- Portal access stays in `@thu-info/lib`; no portal endpoints, login, redirect or cookie algorithms were changed.
- `packages/thu-info-lib/src/agent/metadata.ts` explicitly classifies all 137 public callables/hooks: 112 discoverable tools and 25 internal-only entries. Three app-local schedule tools are added by the registry.
- Library credentials, authentication hooks, captchas and opaque mutable form objects are not tools. Secret-dependent flows and assessment submission use allowlisted native screens, never model-supplied navigation destinations. Campus-card recharge has a reviewed app wrapper: approved bank transfers use the existing library API without a PIN, while Alipay requires the user to finish payment in Alipay. Payment URLs come only from the library and are not returned to the model.
- App/account locks are checked before preparation, dispatch and result delivery. Conversations that have read locked data retain that protection, including after compaction. Backgrounding, changing accounts or disabling the feature pauses execution. Native requests already dispatched cannot be remotely “un-sent.”

## Adding or changing a tool

1. Add/change its typed `InfoHelper` method using the library guide. Add a reviewed policy entry: category, real business effect, approval impact, direct/wrapper/native/internal mode, privacy lock, result handling and any private arguments. Do not infer effects from names or HTTP methods: `getEleRechargePayCode`, for example, creates an order.
2. Run `yarn workspace @thu-info/lib agent:generate`. The build-time TypeScript reflection pass derives parameter/result schemas and descriptions from types and JSDoc, emits static calls, and hashes the reviewed descriptor. It rejects unclassified callables, stale policies and unsupported exposed input types. A small shared JSON-schema-subset validator consumes these artifacts without runtime compilation or `eval`.
3. Implement any semantic adapter in `src/agent/nativeTools.ts`. Wrappers must use the same dispatcher and approval gate as generated tools. Examples: local schedule IDs → Dayjs schedules, current room availability and participants, fresh course-selection targets, assessment question projection, observed news URLs → text-only article, document → native document screen.
4. Add positive/negative tests and regenerate the catalog. `agent:check` in CI fails if the artifact drifts. Changing write semantics also requires changing the reviewed descriptor/version; do not leave pending approvals valid across a policy change.

The model sees only three root tools initially. The root overview includes real example functions and fits one result page, so a general capabilities question does not require expanding every category or executing campus services. Category discovery returns short leaf descriptions; importing a leaf activates its generated schema on subsequent steps. At most 16 leaves are active (LRU); unimported names cannot execute. Internal methods cannot be reached through generic property access.

## Approval and recovery contract

- Requested routine local schedules, single news favorites/subscriptions and a single non-recurring local deletion may run directly. Subsequent distinct writes of the same tool in one run are treated as a batch and require approval. Recurring-series deletion, portal schedule synchronization/deletion, bookings/cancellations, course changes, email/feedback, account/network changes and payments require review.
- Approval cards appear above the message composer, independently of conversation scrolling and collapsed action records. Long previews scroll while the decision buttons remain visible; multiple approvals are reviewed one at a time. Cards show exact arguments and fresh target information, with no silent preview truncation. Approval binds account, run, tool/schema version, arguments and target preview. It expires after 10 minutes, is revalidated on the UI decision and immediately before execution, and can be consumed once. A stale/changed approval must be rejected and requested again. Model-generated prose or a clarification response cannot approve an operation.
- The completed assistant tool-call message is saved **before** the SDK receives executable tool calls. A dispatch record is saved **before** any write. The remote result is saved before refreshing UI state. Stream reconnection and automatic model retries are disabled.
- The SDK executes approved calls before its first model step on resume. Their protocol results are checkpointed before honoring a handoff/pause at that step. Clarifications repair interrupted exchanges before appending the user response; recovered results stay beside their calls, before later user turns, and never replay the write.
- Campus-card recharge accepts 10–200 yuan, at most two decimal places, and the bank/Alipay methods offered by the native screen. Its approval names the amount, account, payment method and effect, and retains the existing recharge commitment, repeated-recharge warning and daily limit. A successful bank transfer returns a structured result and refreshes the stored balance; creating or opening an Alipay order does not claim successful recharge.
- Interrupted dispatches become `unknown`; exact unknown writes are blocked across later runs in the same conversation. “I checked the native record” records an explicitly user-reported observation, does not independently verify it, and does not retry. Another attempt needs a new request. There is no claim of distributed exactly-once delivery or a cross-conversation server idempotency key.
- Regenerate is answer-only: it cannot dispatch business writes. The loop pauses for clarification/native handoff, approval, cancellation, errors or the 24-step limit. Continue is explicit. Opening a native screen is a `handoff`, never a successful booking/payment.
- Seat booking responses are normalized using the portal status. Course selection/drop/preference messages are checked and followed by a selected-course read; an unverified result is not shown as success. Reservations and affected news views are refreshed after successful writes.

## Context and disk usage

- The wire adapter preserves `reasoning_content` for retained assistant messages across tool rounds **and user turns**. It validates complete tool exchanges and rejects malformed, duplicate or truncated executable calls. It never guesses how to repair write arguments.
- Explicit legacy `<think>` content is separated for display and retention, including interrupted drafts; the original protocol remains intact until compaction. Markdown images never auto-load remote URLs; opening an HTTP(S) link requires a native confirmation.
- Context accounting conservatively includes UTF-8 message, schema and instruction bytes. Before a step reaches the budget, compaction summarizes closed exchanges using a tools-disabled request, with a deterministic offline fallback. The newest small complete tool exchange can remain verbatim; old assistant messages leave together with their reasoning. Pending approval/tool exchanges are not split. User goals, bounded factual memory and operation records survive outside the discarded protocol.
- Catalog listing paths persist separately from protocol messages. Subsequent instructions rebuild a compact inventory from the reviewed registry, including every function in inspected categories. Compaction cannot erase discovery progress and restart an all-category discovery loop. This inventory does not activate tools or retain campus data.
- Conversation text persists until the user deletes it. Reasoning and protocol details expire after seven days, and maintenance runs when the agent is used. Expiring a protocol invalidates old approvals and retains a bounded continuation summary. Old operation payloads shrink to compact receipts/digests. Cleanup never removes conversation text merely to meet a quota.
- AsyncStorage contains only small account-scoped manifests. Immutable message/detail/checkpoint chunks live under the app-private `DocumentDir/agent-sessions-v1`; each manifest is committed after its referenced chunks. Pages hold 100 message references. History search/listing reads headers, not all transcripts. Only the selected conversation is loaded into the runner.
- Streaming updates render at roughly 150 ms intervals and checkpoint drafts at roughly two seconds. Content-addressing reuses unchanged data; periodic and end-of-run garbage collection removes superseded and crash-orphaned chunks, including unfinished temporary files. This avoids accumulating full trace snapshots for every delta.
- Tool results are redacted and returned in roughly 4 KiB pages (up to 20 items), with a 4 MiB transient LRU / 2 MiB per-result ceiling. Oversized data is re-fetchable; PDFs/images are opened natively instead of copied into prompts. Handles expire on eviction/restart. No raw result blob archive is retained indefinitely.
- Settings show usage, offer “clear details” and “delete all,” and warn at 50/100 MiB. There is intentionally no fixed disk cap. Plain-text history can still grow over time; user-entered secrets must not be pasted into chat. These files use the app's normal private storage/OS protection, not a new application-level encryption system.

## Validation

```sh
yarn workspace @thu-info/lib agent:check
yarn workspace @thu-info/app test:agent
yarn workspace @thu-info/app test --runInBand
```

The agent suite uses the real SDK with scripted Chat Completions streams and mocked portal/native boundaries. It covers hierarchy, schema validation, approvals/restart, multiple approvals, denials, replay prevention, malformed streams, reasoning replay, compaction, migration, account separation, privacy locks, redaction and storage growth. No real write or authenticated gateway request is made by these tests.

Before enabling by default, verify on **Android, iOS and HarmonyOS**:

1. Campus gateway streaming: fragmented reasoning/content, indexed parallel calls, `finish_reason`, `[DONE]`, usage and errors. Run several tool rounds and a subsequent user turn with reasoning enabled. Confirm context/output limits and each exposed thinking option.
2. Book a deliberately chosen test resource only after native approval; cancel only after a separate approval. Change/expire a target while its card is open. Repeat for a course change in a suitable test environment. Test rejected business responses, not only HTTP success.
3. Stop/background/kill the app before dispatch, during a dispatched write, while awaiting approval and after the remote response. Restart: no automatic write replay; unknown outcomes require review. Test two approvals, native handoff return and regeneration.
4. Switch accounts and exercise app/grade/finance/physical-exam locks both before reads and after data already exists in conversation memory. Verify no protected data flashes on screen or enters another model request.
5. Migrate a large legacy history, simulate storage failures, expire details, search old titles, delete individual sessions/details/all, and exercise logout with and without clearing data. Confirm disk usage settles after repeated long streams.
6. Check keyboard, scrolling, history modal, document links, action cards, source selection, text sizes and accessibility in both languages/themes. Native bundle success alone does not verify filesystem/SSE behavior on a device.

Local verification on Node 24.21.0: 47 agent tests and 29 existing app tests pass (one existing test skipped); Android/iOS Metro bundles built; the library typecheck passes with `--skipLibCheck`. Full app typecheck still has existing React Native/Harmony typing errors; no new agent-file errors were found. The Harmony CLI command is unavailable in this environment.

Android emulator inspection covered the chat composer above the keyboard, thinking/answer separation, new conversation and settings in dark mode. It caught legacy responses that omit the opening thinking delimiter, and unreadable default Markdown code colors; both are handled. Device filesystem persistence survived a JavaScript reload without clearing login.

### Live gateway limitation observed on 2026-09-09

A catalog-only request returned prose instead of native tool calls. Its saved checkpoint contained no tool exchange, and a separate direct non-streaming Chat Completions capture also had `tool_calls: null` with `finish_reason: "stop"`. Direct synthetic probes tested default/disabled thinking, forced/required function selection, legacy `functions`, structured text messages, Codex-style request fields and the captured generic Codex system prompt (personal memory/context excluded). None returned a native tool call. Some emitted function-shaped JSON in `content`; schema-only names/markers were not used correctly. Synthetic tool results were readable on a subsequent turn. This suggests a declaration/adapter issue on the public route, not an SDK stream-decoding problem; server-side behavior is not independently verified. The user's working Codex setup enters through Responses, not this public Chat Completions route. No campus writes or local schedule writes were dispatched in these checks.

Settings now include side-effect-free native function-call diagnostics, using the normal output budget, for provider-default and explicitly disabled thinking. They do not execute tools, change thinking settings or persist raw responses. A valid single call is only an initial compatibility check, not proof of complete multi-round support. Live write/approval/recovery flows still need validation. Gateway configuration/model compatibility must be resolved before rollout; do not turn prose or arbitrary JSON into executable calls as a workaround. A separate strict action-protocol adapter would be an explicit compatibility choice, not something this implementation silently enables. The feature remains opt-in. Never commit authenticated request captures or bearer tokens.

### Capabilities discovery loop observed and fixed on 2026-10-12

The latest Android trace for “What can you do” had reached 22 steps and 11 compactions: the model repeatedly expanded all 15 categories, lost the oversized exchange during compaction, and started discovery again. Native tool calls and catalog results were present. The root overview now supplies capability examples, instructions request one overview for a broad question, and catalog progress survives compaction independently of generated summaries.

A live Android check with `DeepSeek-V4.1-Flash` completed in 7.8 seconds with one `import_tools` call, two model requests and no compaction. The diagnostic session stayed in memory and disabled campus operations. The 60 agent tests and 263 existing app tests pass (one skipped); lint has no errors and 20 existing warnings. Live iOS/HarmonyOS and write/approval flows were not checked in this investigation.
