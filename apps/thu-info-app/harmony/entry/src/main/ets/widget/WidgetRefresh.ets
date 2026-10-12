// Self-refresh chain for the schedule cards.
//
// A card re-derives "now" from the wall clock whenever it paints, so it only
// goes stale because nothing paints it at a class boundary. After every
// refresh we look at the stored snapshot, find the next boundary worth
// repainting for, and ask the form manager to wake us then. The wake-up calls
// `onUpdateForm`, which pushes fresh data and arms the following link.
//
// The timer lives in the form manager service, not in this process, so the
// chain survives the extension process being killed. It does NOT survive the
// card being removed, which is fine: `onAddForm` starts a new chain.
import { formError, formProvider } from '@kit.FormKit';
import { BusinessError } from '@kit.BasicServicesKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { common } from '@kit.AbilityKit';
import { findForm, FormRecord, readLiveFormsLocal, readSnapshotFresh } from './WidgetStore';
import {
  armDelayMinutes,
  nextRefreshTargetMs,
  parseSnapshot,
  refreshPolicyFor,
  REFRESH_POLICY_BOUNDARIES,
  REFRESH_POLICY_NONE,
} from './common/WidgetModels';

const TAG = 'WidgetRefresh';
const DOMAIN = 0xFF00;

// `formProvider` documents 16501001 / 16501003, but the SDK's FormError enum
// only goes up to 36. Accept both spellings so the prune works whichever one
// the runtime actually reports.
const isDeadFormError = (code: number): boolean => {
  return code === 16501001 || code === 16501003 ||
    code === formError.FormError.ERR_NOT_EXIST_ID ||
    code === formError.FormError.ERR_OPERATION_FORM_NOT_SELF;
};

export const policyForRecord = (record: FormRecord): number => {
  return refreshPolicyFor(record.name);
};

// Policy of a live form, looked up in the extension-owned registry. A form that
// is not registered yet (only possible in the first moments after `onAddForm`)
// defaults to the boundary policy: over-arming a Next card wastes a few
// refreshes, while under-arming a Today card leaves a visible bug.
export const policyForForm = (context: common.Context, formId: string): number => {
  const record = findForm(readLiveFormsLocal(context), formId);
  return record === null ? REFRESH_POLICY_BOUNDARIES : refreshPolicyFor(record.name);
};

// Arm the next timed refresh for one card. Never rejects and never throws: a
// card that cannot be armed simply falls back to `updateDuration`.
export const armNextRefresh = async (context: common.Context, formId: string,
  policy: number): Promise<void> => {
  if (policy === REFRESH_POLICY_NONE) {
    return;
  }

  let minutes = 0;
  let target = 0;
  try {
    const snapshot = parseSnapshot(readSnapshotFresh(context));
    if (snapshot === null) {
      hilog.debug(DOMAIN, TAG, 'no snapshot yet, not arming %{public}s', formId);
      return;
    }
    const now = Date.now();
    target = nextRefreshTargetMs(snapshot, now, policy);
    minutes = armDelayMinutes(target, now);
  } catch (err) {
    hilog.warn(DOMAIN, TAG, 'could not compute target for %{public}s: %{public}s',
      formId, JSON.stringify(err));
    return;
  }

  if (minutes === 0) {
    hilog.debug(DOMAIN, TAG, 'no boundary ahead for %{public}s', formId);
    return;
  }

  hilog.info(DOMAIN, TAG, 'arm %{public}s policy %{public}d in %{public}d min (target %{public}d)',
    formId, policy, minutes, target);
  try {
    await formProvider.setFormNextRefreshTime(formId, minutes);
  } catch (err) {
    const code = (err as BusinessError).code;
    // Deliberately does NOT prune the registry here, even for a "no such form"
    // code: `onAddForm` arms while the add is still in flight, so a form the
    // manager does not know about yet is not necessarily a dead one. The
    // registry is pruned by `onRemoveForm`, and by `pushUpdate` on a failed
    // update, which only runs for a form that certainly exists.
    if (isDeadFormError(code)) {
      hilog.info(DOMAIN, TAG, 'form %{public}s is gone, not arming', formId);
      return;
    }
    hilog.warn(DOMAIN, TAG, 'setFormNextRefreshTime %{public}s failed: %{public}d', formId, code);
  }
};
