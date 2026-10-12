// Preferences-backed store shared by the app process (RTNWidget turbo module,
// EntryAbility) and the form extension process (ScheduleFormAbility).
//
// The two processes are isolated, and preferences instances are cached per
// process. Ownership is strictly single-writer per file:
//   - thuinfo_widget_snapshot: written ONLY by the app process (snapshot JSON,
//     pending_launch). The app reads it through its own cached instance, so
//     same-process reads see un-flushed putSyncs and concurrent writes cannot
//     lose updates. The extension (read-only) opens it fresh each time.
//   - thuinfo_widget_meta: written ONLY by the extension process (live form
//     registry), with mutations serialized through a promise queue. The app
//     (read-only) opens it fresh each time.
import { preferences } from '@kit.ArkData';
import { common } from '@kit.AbilityKit';

const SNAPSHOT_FILE = 'thuinfo_widget_snapshot';
const META_FILE = 'thuinfo_widget_meta';
const KEY_SNAPSHOT = 'snapshot';
const KEY_PENDING_LAUNCH = 'pending_launch';
const KEY_LIVE_FORMS = 'live_forms';

export interface FormRecord {
  id: string;
  name: string;
  dim: number;
}

// One cached instance per file in THIS process — used by the owning (writing)
// process for reads and writes, so its view always includes its own putSyncs.
const localInstances = new Map<string, preferences.Preferences>();

const localPreferences = (context: common.Context, name: string): preferences.Preferences => {
  let prefs = localInstances.get(name);
  if (prefs === undefined) {
    prefs = preferences.getPreferencesSync(context, { name: name });
    localInstances.set(name, prefs);
  }
  return prefs;
};

// Fresh open for cross-process readers: drop the cached instance first so the
// other process' flushed writes become visible.
const freshPreferences = (context: common.Context, name: string): preferences.Preferences => {
  try {
    preferences.removePreferencesFromCacheSync(context, name);
  } catch (_err) {
    // Nothing cached yet on first access.
  }
  return preferences.getPreferencesSync(context, { name: name });
};

// --- snapshot file (owner: app process) ---

export const readSnapshot = (context: common.Context): string => {
  try {
    return localPreferences(context, SNAPSHOT_FILE).getSync(KEY_SNAPSHOT, '') as string;
  } catch (_err) {
    return '';
  }
};

export const readSnapshotFresh = (context: common.Context): string => {
  try {
    return freshPreferences(context, SNAPSHOT_FILE).getSync(KEY_SNAPSHOT, '') as string;
  } catch (_err) {
    return '';
  }
};

export const writeSnapshot = async (context: common.Context, snapshot: string): Promise<void> => {
  const prefs = localPreferences(context, SNAPSHOT_FILE);
  prefs.putSync(KEY_SNAPSHOT, snapshot);
  await prefs.flush();
};

// Timestamp-prefixed so stale entries (e.g. a tap that could not be delivered
// to a running instance) can be rejected instead of navigating later.
export const writePendingLaunch = async (context: common.Context, params: string): Promise<void> => {
  const prefs = localPreferences(context, SNAPSHOT_FILE);
  prefs.putSync(KEY_PENDING_LAUNCH, `${Date.now()}|${params}`);
  await prefs.flush();
};

export const readPendingLaunch = (context: common.Context): string => {
  try {
    return localPreferences(context, SNAPSHOT_FILE).getSync(KEY_PENDING_LAUNCH, '') as string;
  } catch (_err) {
    return '';
  }
};

export const clearPendingLaunch = async (context: common.Context): Promise<void> => {
  const prefs = localPreferences(context, SNAPSHOT_FILE);
  prefs.deleteSync(KEY_PENDING_LAUNCH);
  await prefs.flush();
};

// --- meta file (owner: extension process) ---

const sanitizeRecords = (parsed: object): FormRecord[] => {
  if (!Array.isArray(parsed)) {
    return [];
  }
  const records: FormRecord[] = [];
  const list = parsed as FormRecord[];
  for (let i = 0; i < list.length; i++) {
    const record = list[i];
    if (typeof record.id === 'string' && record.id !== '' &&
      typeof record.name === 'string' && typeof record.dim === 'number') {
      records.push({ id: record.id, name: record.name, dim: record.dim });
    }
  }
  return records;
};

const liveFormsOf = (prefs: preferences.Preferences): FormRecord[] => {
  const raw = prefs.getSync(KEY_LIVE_FORMS, '') as string;
  if (raw === '') {
    return [];
  }
  return sanitizeRecords(JSON.parse(raw) as object);
};

const saveLiveFormsTo = async (prefs: preferences.Preferences, records: FormRecord[]): Promise<void> => {
  prefs.putSync(KEY_LIVE_FORMS, JSON.stringify(records));
  await prefs.flush();
};

// Read-only view for the app process.
export const readLiveForms = (context: common.Context): FormRecord[] => {
  try {
    return liveFormsOf(freshPreferences(context, META_FILE));
  } catch (_err) {
    return [];
  }
};

export const findForm = (records: FormRecord[], formId: string): FormRecord | null => {
  for (let i = 0; i < records.length; i++) {
    if (records[i].id === formId) {
      return records[i];
    }
  }
  return null;
};

// Registry mutations run only in the extension process and are serialized so
// interleaved async flushes cannot drop a concurrent add/remove/resize.
let metaQueue: Promise<void> = Promise.resolve();

const enqueueMetaTask = (task: () => Promise<void>): Promise<void> => {
  const next = metaQueue.then(task);
  metaQueue = next.catch(() => {});
  return next;
};

export const addForm = (context: common.Context, formId: string,
  name: string, dim: number): Promise<void> => {
  return enqueueMetaTask(async () => {
    const prefs = localPreferences(context, META_FILE);
    const records = liveFormsOf(prefs).filter((record: FormRecord) => record.id !== formId);
    records.push({ id: formId, name: name, dim: dim });
    await saveLiveFormsTo(prefs, records);
  });
};

export const removeForm = (context: common.Context, formId: string): Promise<void> => {
  return enqueueMetaTask(async () => {
    const prefs = localPreferences(context, META_FILE);
    const records = liveFormsOf(prefs).filter((record: FormRecord) => record.id !== formId);
    await saveLiveFormsTo(prefs, records);
  });
};

export const setFormDimension = (context: common.Context, formId: string,
  dim: number): Promise<void> => {
  return enqueueMetaTask(async () => {
    const prefs = localPreferences(context, META_FILE);
    const records = liveFormsOf(prefs);
    const record = findForm(records, formId);
    if (record !== null && record.dim !== dim) {
      record.dim = dim;
      await saveLiveFormsTo(prefs, records);
    }
  });
};

// The extension's own (freshest) view, including not-yet-flushed mutations.
export const readLiveFormsLocal = (context: common.Context): FormRecord[] => {
  try {
    return liveFormsOf(localPreferences(context, META_FILE));
  } catch (_err) {
    return [];
  }
};
