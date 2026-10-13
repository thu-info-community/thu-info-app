# DeepSeek agent framework

## Enable and rollout

The **Assistant / 助手** uses the on-device agent implementation. **Settings → Assistant** offers message display preferences and storage management. The implementation uses **AI SDK Core 7 `ToolLoopAgent`**, running on the device, with a custom model provider that calls only the existing campus **`/v1/chat/completions`** endpoint. It does not use Responses, Codex CLI, a shell, a new backend, or an upstream DeepSeek API key.

The first activation migrates Redux conversations from `master`, verifies their persisted message counts, and only then clears the Redux payload. Migration is restartable and preserves IDs, titles, visible text and timestamps. These histories had no account identity; the migration assigns them to the currently signed-in account. New history is account-separated.

Treat `master` → branch tip as one atomic change. Agent checkpoints always contain `catalogPaths` and `protectedTools` arrays, including when empty; every operation contains its `targetFingerprint` when recorded, including denied actions. Session loading rejects incomplete checkpoints through `SessionDataError`, without backfilling fields or rewriting saved data. Intermediate branch formats are unsupported. The storage path and checkpoint version remain unchanged. Main's history migration and persisted model-token removal remain part of the upgrade.

`src/utils/campusModel.ts` defines the assistant's default model name: `DeepSeek-V4.1-Flash`. `src/agent/types.ts` contains its capability descriptor, with a 128K (131,072) context token budget and a 4,096 output token limit. These gateway limits remain **unverified**. Requests use the provider default and send neither `thinking` nor `reasoning_effort`. Thinking controls are not exposed in settings.

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
- `packages/thu-info-lib/src/agent/metadata.ts` explicitly classifies all public callables/hooks as discoverable tools or internal-only entries. Three app-local schedule tools are added by the registry.
- Library credentials, authentication hooks, captchas and opaque mutable form objects are not tools. Secret-dependent flows and assessment submission use allowlisted native screens, never model-supplied navigation destinations. Campus-card recharge has a reviewed app wrapper: approved bank transfers use the existing library API without a PIN, while Alipay requires the user to finish payment in Alipay. Payment URLs come only from the library and are not returned to the model.
- App/account locks are checked before preparation, dispatch and result delivery. Conversations that have read locked data retain that protection, including after compaction. Backgrounding, changing accounts or locking the app pauses execution. Native requests already dispatched cannot be remotely “un-sent.”

## Adding or changing a tool

1. Add/change its typed `InfoHelper` method using the library guide. Add a reviewed policy entry: category, real business effect, approval impact, direct/wrapper/native/internal mode, privacy lock, result handling and any private arguments. Do not infer effects from names or HTTP methods: `getEleRechargePayCode`, for example, creates an order.
2. The build-time TypeScript reflection pass generates `packages/thu-info-lib/src/agent/catalog.generated.ts` from types, JSDoc and reviewed policies. It derives input schemas and descriptions, emits static calls, and hashes the reviewed descriptor. It rejects unclassified callables, stale policies and unsupported exposed input types. A small shared JSON-schema-subset validator consumes these artifacts without runtime compilation or `eval`. The generated file is ignored by Git and included in published library packages.
3. Implement any semantic adapter in `src/agent/nativeTools.ts`. Wrappers must use the same dispatcher and approval gate as generated tools. Examples: local schedule IDs → Dayjs schedules, current room availability and participants, fresh course-selection targets, assessment question projection, observed news URLs → text-only article, document → native document screen.
4. Add positive/negative tests. Root dependency installation, library build/watch/test commands, and app start/Android/iOS/Harmony bundle/test commands generate the catalog before starting. CI generates and checks it before lint and tests; library packing regenerates it before publication. There is no continuous source watcher: after changing types, JSDoc or policies during a running development session, restart the command or run `yarn workspace @thu-info/lib agent:generate`. Unchanged output is not rewritten. Changing write semantics also requires changing the reviewed descriptor/version; do not leave pending approvals valid across a policy change.

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
- Each assistant reply has one expandable activity timeline. Its summary shows “Thinking / 思考中” while running, “Completed / 已完成” on completion, or its actual paused/approval/error state, followed by the number of recorded tool invocations when nonzero. The timeline interleaves reasoning/intermediate prose and tool invocations without model-step numbers. Active, failed, interrupted, declined and pending-decision invocations remain visible while collapsed. Native approval controls stay above the composer; unknown-outcome verification lives with the corresponding invocation.
- Tool invocations are recorded on their owning assistant message before executable calls reach the SDK. SDK execution callbacks update them immediately, including ordinary reads and auxiliary tools. Approval resumes update the same call ID. Business operation receipts override generic SDK completion; model prose never proves success. Invocation receipts survive model-context compaction and retain the reply's terminal status when history is reopened.
- Conversation text and compact tool receipts persist until the user deletes them. Reasoning, bounded tool parameters/results and protocol details expire after seven days, and maintenance runs when the agent is used. Tool details are redacted and capped at 4 KiB each, stored in expiring detail chunks rather than permanent transcript chunks. Clearing details retains tool names, statuses, timestamps and counts. Expiring a protocol invalidates old approvals and retains a bounded continuation summary. Old operation payloads shrink to compact receipts/digests. Cleanup never removes conversation text merely to meet a quota.
- AsyncStorage contains only small account-scoped manifests. Immutable message/detail/checkpoint chunks live under the app-private `DocumentDir/agent-sessions-v1`; each manifest is committed after its referenced chunks. Pages hold 100 message references. History search/listing reads headers, not all transcripts. Only the selected conversation is loaded into the runner.
- New conversations stay in memory until the first nonblank user message is sent, then persist before the model request. Failed or interrupted replies retain that message. Existing empty histories, including legacy migration, remain unchanged. Explicit new conversations bypass historical loading, migration and cleanup. Maintenance skips individual damaged conversations; opening one reports its error without deleting it. Invalid manifests cannot prevent listing other histories. Garbage collection preserves chunks when the complete reference graph cannot be read, and optional post-save GC cannot turn a committed save into a failed request. Failed legacy migration retains the Redux payload.
- Streaming updates render at roughly 150 ms intervals and checkpoint drafts at roughly two seconds. Content-addressing reuses unchanged data; periodic and end-of-run garbage collection removes superseded and crash-orphaned chunks, including unfinished temporary files. This avoids accumulating full trace snapshots for every delta.
- Tool results are redacted and returned in roughly 4 KiB pages (up to 20 items), with a 4 MiB transient LRU / 2 MiB per-result ceiling. Oversized data is re-fetchable; PDFs/images are opened natively instead of copied into prompts. Handles expire on eviction/restart. No raw result blob archive is retained indefinitely.
- Settings show usage, offer “clear details” and “delete all,” and warn at 50/100 MiB. There is intentionally no fixed disk cap. Plain-text history can still grow over time; user-entered secrets must not be pasted into chat. These files use the app's normal private storage/OS protection, not a new application-level encryption system.

## Validation

```sh
yarn workspace @thu-info/lib agent:generate
yarn workspace @thu-info/lib agent:check
yarn workspace @thu-info/app test:agent
yarn workspace @thu-info/app test --runInBand
```

The agent suite uses the real SDK with scripted Chat Completions streams and mocked portal/native boundaries. It covers hierarchy, schema validation, approvals/restart, multiple approvals, denials, replay prevention, malformed streams, reasoning replay, compaction, migration, account separation, privacy locks, redaction and storage growth. No real write or authenticated gateway request is made by these tests.

Verify on **Android, iOS and HarmonyOS**:

1. Campus gateway streaming: fragmented reasoning/content, indexed parallel calls, `finish_reason`, `[DONE]`, usage and errors. Run several tool rounds and a subsequent user turn. Confirm reasoning replay and context/output limits.
2. Book a deliberately chosen test resource only after native approval; cancel only after a separate approval. Change/expire a target while its card is open. Repeat for a course change in a suitable test environment. Test rejected business responses, not only HTTP success.
3. Stop/background/kill the app before dispatch, during a dispatched write, while awaiting approval and after the remote response. Restart: no automatic write replay; unknown outcomes require review. Test two approvals, native handoff return and regeneration.
4. Switch accounts and exercise app/grade/finance/physical-exam locks both before reads and after data already exists in conversation memory. Verify no protected data flashes on screen or enters another model request.
5. Migrate a large legacy history, simulate storage failures, expire details, search old titles, delete individual sessions/details/all, and exercise logout with and without clearing data. Confirm disk usage settles after repeated long streams.
6. Check keyboard, scrolling, history modal, document links, action cards, source selection, text sizes and accessibility in both languages/themes. Native bundle success alone does not verify filesystem/SSE behavior on a device.
