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
import { dimensionToString } from './common/WidgetModels';

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
    return this.bindingData(dim);
  }

  onUpdateForm(formId: string): void {
    this.pushUpdate(formId);
  }

  onFormEvent(formId: string, _message: string): void {
    this.pushUpdate(formId);
  }

  onRemoveForm(formId: string): void {
    removeForm(this.context, formId).catch((_err: BusinessError) => {});
  }

  onSizeChanged(formId: string, newDimension: formInfo.FormDimension,
    _newRect: formInfo.Rect): void {
    setFormDimension(this.context, formId, newDimension).catch((_err: BusinessError) => {});
    // Push with the callback's dimension directly — re-reading the registry
    // here could still observe the pre-resize value.
    formProvider.updateForm(formId, this.bindingData(newDimension)).catch((_err: BusinessError) => {
      hilog.warn(0xFF00, TAG, 'updateForm failed for %{public}s', formId);
    });
  }

  private bindingData(dim: number): formBindingData.FormBindingData {
    const formData: Record<string, string> = {
      'snapshot': readSnapshotFresh(this.context),
      'dimension': dimensionToString(dim),
    };
    return formBindingData.createFormBindingData(formData);
  }

  private pushUpdate(formId: string): void {
    const record = findForm(readLiveFormsLocal(this.context), formId);
    if (record === null) {
      // Not registered (yet) — pushing an empty dimension would reset the
      // layout, so wait for the next tick after the registry catches up.
      return;
    }
    formProvider.updateForm(formId, this.bindingData(record.dim)).catch((err: BusinessError) => {
      hilog.warn(0xFF00, TAG, 'updateForm failed for %{public}s, code %{public}d', formId, err.code);
      if (err.code === formError.FormError.ERR_NOT_EXIST_ID ||
        err.code === formError.FormError.ERR_OPERATION_FORM_NOT_SELF) {
        // The form is gone; the extension owns the registry, so prune here.
        removeForm(this.context, formId).catch((_e: BusinessError) => {});
      }
    });
  }
}
