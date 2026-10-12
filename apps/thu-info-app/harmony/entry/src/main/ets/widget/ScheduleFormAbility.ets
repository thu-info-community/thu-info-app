// Form provider for the three schedule cards (next / today / week). The three
// cards share this ability; the form config profile declares them separately
// and the live-form registry records which card (name) and size (dim) each
// formId uses, so pushes from the app process carry the right dimension.
import { FormExtensionAbility, formBindingData, formError, formInfo, formProvider } from '@kit.FormKit';
import { Want } from '@kit.AbilityKit';
import { BusinessError } from '@kit.BasicServicesKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import {
  addForm,
  findForm,
  readLiveFormsLocal,
  readSnapshotFresh,
  removeForm,
  setFormDimension,
} from './WidgetStore';
import { armNextRefresh, policyForForm } from './WidgetRefresh';
import { dimensionToString, refreshPolicyFor, stampSnapshot } from './common/WidgetModels';

const TAG = 'ScheduleFormAbility';

export default class ScheduleFormAbility extends FormExtensionAbility {
  onAddForm(want: Want): formBindingData.FormBindingData {
    const params = want.parameters ?? {};
    const formId = params[formInfo.FormParam.IDENTITY_KEY] as string;
    const name = params[formInfo.FormParam.NAME_KEY] as string;
    const dimRaw = params[formInfo.FormParam.DIMENSION_KEY];
    const dim = typeof dimRaw === 'number' ? dimRaw : 2;
    addForm(this.context, formId, name, dim).catch((_err: BusinessError) => {});
    // The registry write above is async; build the first binding from the want
    // params directly so the initial paint already carries the right dimension.
    // `name` is already in hand, so a brand-new card can start its self-refresh
    // chain without waiting for the registry to catch up.
    armNextRefresh(this.context, formId, refreshPolicyFor(name))
      .catch((_err: BusinessError) => {});
    return this.bindingData(dim, 0);
  }

  onUpdateForm(formId: string): void {
    // Unconditional, and deliberately before any early return downstream: this
    // line is the only observable record of a timed refresh actually firing.
    // There is no API to read the remaining daily allowance, so counting these
    // per formId is the only way to watch the 50/day quota — and it is also the
    // check for whether the system delivers a refresh that came due while the
    // card was off-screen.
    hilog.info(0xFF00, TAG, 'onUpdateForm %{public}s', formId);
    this.pushUpdate(formId, Date.now());
    this.armRefresh(formId);
  }

  onFormEvent(formId: string, _message: string): void {
    this.pushUpdate(formId, Date.now());
    this.armRefresh(formId);
  }

  onRemoveForm(formId: string): void {
    removeForm(this.context, formId).catch((_err: BusinessError) => {});
  }

  onSizeChanged(formId: string, newDimension: formInfo.FormDimension,
    _newRect: formInfo.Rect): void {
    setFormDimension(this.context, formId, newDimension).catch((_err: BusinessError) => {});
    // Push with the callback's dimension directly — re-reading the registry
    // here could still observe the pre-resize value. Not stamped: the refresh
    // target does not depend on the dimension.
    formProvider.updateForm(formId, this.bindingData(newDimension, 0))
      .catch((_err: BusinessError) => {
        hilog.warn(0xFF00, TAG, 'updateForm failed for %{public}s', formId);
      });
  }

  // Aim the next timed refresh at the next class boundary. Fire-and-forget:
  // `armNextRefresh` swallows its own failures, so a card that cannot be armed
  // just falls back to the periodic `updateDuration` wake-up.
  private armRefresh(formId: string): void {
    armNextRefresh(this.context, formId, policyForForm(this.context, formId))
      .catch((_err: BusinessError) => {});
  }

  // `stamp` is non-zero only on the timed/event repaint paths. It is folded
  // into the snapshot string so the binding data differs even when the stored
  // snapshot has not changed, which is what makes the card actually repaint
  // and re-derive "now". The add/resize paths pass 0 so their payload stays
  // byte-comparable with the app process' pushes.
  private bindingData(dim: number, stamp: number): formBindingData.FormBindingData {
    const stored = readSnapshotFresh(this.context);
    const formData: Record<string, string> = {
      'snapshot': stamp === 0 ? stored : stampSnapshot(stored, stamp),
      'dimension': dimensionToString(dim),
    };
    return formBindingData.createFormBindingData(formData);
  }

  private pushUpdate(formId: string, stamp: number): void {
    const record = findForm(readLiveFormsLocal(this.context), formId);
    if (record === null) {
      // Not registered (yet) — pushing an empty dimension would reset the
      // layout, so wait for the next tick after the registry catches up.
      return;
    }
    formProvider.updateForm(formId, this.bindingData(record.dim, stamp))
      .catch((err: BusinessError) => {
        hilog.warn(0xFF00, TAG, 'updateForm failed for %{public}s, code %{public}d', formId, err.code);
        // `formProvider` reports 16501001 / 16501003, while the FormError enum
        // stops at 36 — accept both so the prune works whichever is reported.
        if (err.code === 16501001 || err.code === 16501003 ||
          err.code === formError.FormError.ERR_NOT_EXIST_ID ||
          err.code === formError.FormError.ERR_OPERATION_FORM_NOT_SELF) {
          // The form is gone; the extension owns the registry, so prune here.
          removeForm(this.context, formId).catch((_e: BusinessError) => {});
        }
      });
  }
}
