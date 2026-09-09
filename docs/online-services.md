# Online Services (THOS)

The THUInfo home entry opens native lists for pending, active, completed, draft, unread and phased items, plus a searchable service catalog. Quick Services contains account-scoped local favorites. Cards open native task or item details; the explicit `进入在线服务网站` action opens official pages for forms, draft editing, unread-item viewing and complete workflow history.

## Authentication and requests

The UI calls `InfoHelper.prepareThosSession()`, `getThosTasks()` and `getThosServices()`. They reuse the existing `roamingWrapper` with the THOS roaming entry already used by course scores. There is no additional password, WebVPN or two-factor login implementation and no change to the shared login code.

The following THOS endpoints were traced from the portal's page scripts. The list endpoints use JSON POST requests through the existing WebVPN transport with a 30-second timeout. `pageNum` starts at 1. The portal uses a page size of 10 for drafts, unread items and phased items, 50 for task lists and 100 for the catalog. Pending tasks use `status: "1"`.

| Purpose | THOS path | Required response |
| --- | --- | --- |
| Counts/session validation | `/fp/fp/formHome/allNum` | `zbNum`, `AuditSvsNum`; other counts optional |
| Active applications | `/fp/fp/myserviceapply/getZBSXList` | `list`, `total`, optional `pageNum` |
| Pending work | `/fp/fp/taskcenter/getDBSXList` | `list`, `total`, optional `pageNum` |
| Completed applications | `/fp/fp/myserviceapply/getBJSXList` | `list`, `total`, optional `pageNum` |
| Drafts | `/fp/fp/draft/pageDraft` | `processInstId`, `serviceId`, `draftName`, `draftSummary`, `startTime`, `modifyTime` |
| Unread/read carbon-copy items | `/fp/fp/carboncopy/getDYSXList` | `procinst_id`, `task_id`, `service_id`, `service_name`, read/workflow status and display fields |
| Phased applications | `/fp/fp/aggregation/getAggItemList` | `AGG_PROC_ID`, `NAME`, `STATE`, `NUMS`, `SUMTEMP`, `REL` |
| Phased application steps | `/fp/aggregation/getActWork` | step list with `ACT_ORDER_ID`, `ACT_NAME`, `ACT_STATE`, `itemInfo` |
| Service catalog | `/fp/fp/formHome/AllSvsByConditionpage` | `list`, `total`, optional `pageNum` |

HTML, missing mandatory fields and malformed responses are errors, not empty lists. Pagination detects duplicate pages, changing totals and the page cap; incomplete data is marked partial. Task keys retain distinct work-item IDs within a process. Returned and completed states are treated separately. Missing or invalid progress is unknown, including for completed tasks.

Service `UW_TYPE` values 0/1/2 map to form/guide/integration, and 3/6 to a group. `IS_TIME_VALID` is an open-period flag, not proof of application eligibility. Unknown values stay unknown. Phased items load their step data separately using `AGG_PROC_ID`. No guide content, workflow history or native form-submission endpoint is inferred.

## Data lifecycle and official pages

Task/item/service data and detail parameters remain in memory. Favorite service IDs are saved to AsyncStorage under an account-scoped key; favorites do not call the server's collection endpoints. Account changes hide details and invalidate pending reads. Detail refresh reuses the audited list APIs; if an item is no longer in its original list, its last-known data is accompanied by a refresh warning. Opening a draft or unread item is an explicit official-page action; the native list reader does not submit drafts or mark unread items as read.

The Android WebView shares the platform CookieManager used by THUInfo networking and uses the library User-Agent. It does not export cookies or manufacture a Cookie header. Authentication redirects lead to recovery through THUInfo. The rendering-health script reports only a boolean; it does not send page text, form fields or cookies to native code. Only HTTPS university-origin, non-authentication messages can clear a rendering timeout, and rendering health is not proof of authentication. Failures provide recovery controls without automatically replaying submissions.

Opening an actual official service may start the site's own workflow or record a visit. Real-account automated checks must stay with the audited read endpoints and native navigation; do not treat an official launch URL as a side-effect-free API.

## Verification

The new library and UI tests use synthetic fixtures. The existing `8888` demo account has fictional THOS data and disables official-page actions.

```sh
# Run from the monorepo root after installing its normal dependencies.
yarn workspace @thu-info/lib test --runInBand __tests__/thos-services.ts
yarn workspace @thu-info/app test --runInBand test/thos.test.tsx test/i18n.test.ts
```

Android integration testing has verified real-account list/catalog reads and the official homepage in the preceding iteration, without submitting, approving, withdrawing or saving real applications. Native detail routing, missing fields, refresh failure and account-change isolation have automated coverage. The newest native detail screens still need on-device acceptance. Expired-session/2FA recovery, actual form submission, iOS and HarmonyOS are not verified.

The app-wide tablet breakpoint and home detail-navigation reference changes also affect other home functions and deserve tablet navigation regression coverage. The UI currently contains Chinese-only THOS text beyond the bilingual home entry; completing localization and deciding the feature's home placement remain review items. These limitations should be resolved or explicitly accepted before describing the feature as production-ready.
