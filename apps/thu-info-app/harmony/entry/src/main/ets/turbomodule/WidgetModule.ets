import { TurboModule } from "@rnoh/react-native-openharmony/ts";
import { TM } from "@rnoh/react-native-openharmony/generated/ts";
import { formBindingData, formProvider } from "@kit.FormKit";
import { BusinessError } from "@kit.BasicServicesKit";
import { hilog } from "@kit.PerformanceAnalysisKit";
import {
  clearPendingLaunch,
  FormRecord,
  readLiveForms,
  readPendingLaunch,
  readSnapshot,
  writeSnapshot,
} from "../widget/WidgetStore";
import { dimensionToString } from "../widget/common/WidgetModels";

const TAG = "RTNWidget";
const LAUNCH_TTL_MS = 60_000;

interface WidgetFormStats {
  name: string;
  dimension: string;
}

interface WidgetStats {
  liveForms: number;
  forms: WidgetFormStats[];
  snapshotAgeMs: number;
}

interface WidgetFormData {
  snapshot: string;
  dimension: string;
}

export class WidgetModule extends TurboModule implements TM.RTNWidget.Spec {
  async updateScheduleSnapshot(snapshot: string): Promise<boolean> {
    const context = this.ctx.uiAbilityContext;
    await writeSnapshot(context, snapshot);
    return this.pushToAllForms();
  }

  async consumeLaunchParams(): Promise<string | null> {
    const context = this.ctx.uiAbilityContext;
    const raw = readPendingLaunch(context);
    if (raw === "") {
      return null;
    }
    await clearPendingLaunch(context);
    // Reject stale entries: a tap whose params never reached the running
    // instance (e.g. the app was already foreground) must not navigate later.
    const separator = raw.indexOf("|");
    const writtenAt = separator >= 0 ? Number(raw.substring(0, separator)) : 0;
    if (!Number.isFinite(writtenAt) || Date.now() - writtenAt > LAUNCH_TTL_MS) {
      return null;
    }
    return separator >= 0 ? raw.substring(separator + 1) : raw;
  }

  async getWidgetStats(): Promise<string> {
    const context = this.ctx.uiAbilityContext;
    const snapshotText = readSnapshot(context);
    let generatedAt = 0;
    try {
      const parsed = JSON.parse(snapshotText) as Record<string, number>;
      if (typeof parsed.generatedAt === "number") {
        generatedAt = parsed.generatedAt;
      }
    } catch (_err) {
      // Snapshot never written.
    }
    const records = readLiveForms(context);
    const forms: WidgetFormStats[] = records.map((record: FormRecord): WidgetFormStats => ({
      name: record.name,
      dimension: dimensionToString(record.dim),
    }));
    const stats: WidgetStats = {
      liveForms: records.length,
      forms: forms,
      snapshotAgeMs: generatedAt === 0 ? -1 : Date.now() - generatedAt,
    };
    return JSON.stringify(stats);
  }

  // Push the stored snapshot to every live form. The registry is owned by the
  // form extension process — this side only reads it. Forms that reject the
  // update are logged; the extension prunes dead entries itself when its own
  // updateForm fails (it is the single writer of the registry file).
  private async pushToAllForms(): Promise<boolean> {
    const context = this.ctx.uiAbilityContext;
    const snapshot = readSnapshot(context);
    const records = readLiveForms(context);
    for (const record of records) {
      const formData: WidgetFormData = {
        snapshot: snapshot,
        dimension: dimensionToString(record.dim),
      };
      try {
        await formProvider.updateForm(record.id,
          formBindingData.createFormBindingData(formData));
      } catch (err) {
        hilog.warn(0xff00, TAG,
          `updateForm ${record.id} failed: ${(err as BusinessError).code}`);
      }
    }
    return true;
  }
}
