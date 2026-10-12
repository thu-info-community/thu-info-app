// Data model shared between the schedule form cards and their host abilities.
// This file must stay free of @ohos/@kit/@rnoh imports so that card pages
// (which run in the form render process with restricted imports) can use it.

export interface WidgetItem {
  name: string;
  loc: string;
  from: string;
  to: string;
  begin: number;
  end: number;
  color: string;
}

export interface WidgetDayModel {
  dayOfWeek: number;
  date: string;
  label: string;
  dateText?: string;
  items: WidgetItem[];
}

export interface WidgetWeekRowModel {
  kind: string;
  period?: number;
  begin: string;
  end: string;
  top: number;
  height: number;
}

export interface WidgetWeekBlockModel extends WidgetItem {
  dayOfWeek: number;
  top: number;
  height: number;
  timeLabel: string;
  compact: boolean;
  fill: string;
  textColor: string;
}

export interface WidgetWeekViewModel {
  week: number;
  days: WidgetDayModel[];
  rows: WidgetWeekRowModel[];
  blocks: WidgetWeekBlockModel[];
  classPeriods: boolean;
  showWeekend: boolean;
  showAxisTimes: boolean;
}

export interface WidgetSnapshotModel {
  v: number;
  generatedAt: number;
  week: number;
  today: WidgetDayModel;
  tomorrow: WidgetDayModel;
  nextDays: WidgetDayModel[];
  weekView?: WidgetWeekViewModel;
  empty: boolean;
  // Optional repaint stamp, added by the form extension (never written back to
  // the stored snapshot). Its only job is to make the binding data differ
  // between two otherwise identical timed refreshes, so that a card which has
  // not changed in content still goes through a render pass.
  tick?: number;
}

export const parseSnapshot = (text: string): WidgetSnapshotModel | null => {
  try {
    const parsed = JSON.parse(text) as WidgetSnapshotModel;
    if (parsed === null || parsed.v !== 1 || !Array.isArray(parsed.nextDays) ||
      parsed.nextDays.length === 0) {
      return null;
    }
    return parsed;
  } catch (_err) {
    return null;
  }
};

// The first item that has not finished yet across the (already sorted,
// consecutive) days of the snapshot — "now" in epoch milliseconds.
export const pickNextItem = (snapshot: WidgetSnapshotModel, now: number): WidgetItem | null => {
  for (let d = 0; d < snapshot.nextDays.length; d++) {
    const day = snapshot.nextDays[d];
    for (let i = 0; i < day.items.length; i++) {
      const item = day.items[i];
      if (item.end > now) {
        return item;
      }
    }
  }
  return null;
};

export const dimensionToString = (dim: number): string => {
  switch (dim) {
    case 1:
      return '1*2';
    case 2:
      return '2*2';
    case 3:
      return '2*4';
    case 4:
      return '4*4';
    case 7:
      return '6*4';
    default:
      return '';
  }
};

// --- self-refresh scheduling ------------------------------------------------
//
// The cards re-derive "now" from the wall clock at paint time, so a repaint at
// the right moment is enough to un-stick them. Nothing used to repaint them at
// class boundaries, which is why a card could keep showing a lesson that had
// already ended. The form extension therefore arms one `setFormNextRefreshTime`
// per refresh, aimed at the next boundary, and the chain sustains itself.
//
// Schedule forms are limited to 50 timed refreshes per card per day, shared
// with `updateDuration`, so which boundaries are worth a refresh depends on
// what the card actually renders from the clock:
//   - schedule_next  only shows the first item with `end > now`, so a class
//                    *begin* changes nothing. Ends only.
//   - schedule_today starts its window at a class *begin* and moves its
//                    "ongoing" highlight then too, so it needs both.
//   - schedule_week  is a static grid (no wall-clock input at all), so no
//                    boundary repaint can ever change it. Never armed.

export const REFRESH_POLICY_NONE = 0;
export const REFRESH_POLICY_ENDS = 1;
export const REFRESH_POLICY_BOUNDARIES = 2;

// Grace past a boundary: late enough that the boundary is unambiguously in the
// past when the refresh lands, early enough to look immediate.
export const END_GRACE_MS = 3 * 60 * 1000;
export const BEGIN_GRACE_MS = 1 * 60 * 1000;
// Nightly heartbeat. Keeps the chain alive across class-free stretches (night,
// weekend, semester break) for one refresh a day.
export const MIDNIGHT_GRACE_MS = 5 * 60 * 1000;
// Two boundaries closer together than this are one repaint, not two: the first
// would only paint a state that is superseded moments later.
export const CANDIDATE_MERGE_MS = 5 * 60 * 1000;

// `setFormNextRefreshTime` rejects anything below 5 minutes (error 401).
export const MIN_ARM_MINUTES = 5;
// Bounds a corrupt snapshot; 25 h keeps every arm inside "tomorrow".
export const MAX_ARM_MINUTES = 1500;

export const refreshPolicyFor = (name: string): number => {
  if (name === 'schedule_week') {
    return REFRESH_POLICY_NONE;
  }
  if (name === 'schedule_next') {
    return REFRESH_POLICY_ENDS;
  }
  return REFRESH_POLICY_BOUNDARIES;
};

// Local midnight at the end of the day containing `nowMs`.
export const nextLocalMidnightMs = (nowMs: number): number => {
  const date = new Date(nowMs);
  date.setHours(24, 0, 0, 0);
  return date.getTime();
};

// The next instant worth repainting for, as an epoch-ms target, or 0 when the
// policy has nothing to offer. Works on the set of boundary instants rather
// than by walking items, which tolerates overlapping slices and collapses the
// two halves of a split period into one refresh.
export const nextRefreshTargetMs = (snapshot: WidgetSnapshotModel, nowMs: number,
  policy: number): number => {
  if (policy === REFRESH_POLICY_NONE) {
    return 0;
  }

  const candidates: number[] = [];
  for (let d = 0; d < snapshot.nextDays.length; d++) {
    const day = snapshot.nextDays[d];
    for (let i = 0; i < day.items.length; i++) {
      const item = day.items[i];
      if (policy === REFRESH_POLICY_BOUNDARIES) {
        candidates.push(item.begin + BEGIN_GRACE_MS);
      }
      candidates.push(item.end + END_GRACE_MS);
    }
  }
  candidates.push(nextLocalMidnightMs(nowMs) + MIDNIGHT_GRACE_MS);

  const future: number[] = [];
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    if (Number.isFinite(candidate) && candidate > nowMs) {
      future.push(candidate);
    }
  }
  if (future.length === 0) {
    return 0;
  }
  future.sort((a: number, b: number): number => a - b);

  // Collapse the earliest run of near-simultaneous boundaries into its last
  // member, which is the one that actually shows the settled state.
  let target = future[0];
  for (let i = 1; i < future.length; i++) {
    if (future[i] - target > CANDIDATE_MERGE_MS) {
      break;
    }
    target = future[i];
  }
  return target;
};

// Minutes to hand to `setFormNextRefreshTime`, or 0 for "do not arm". The clamp
// only ever pushes the fire time later, so the target chosen here is always in
// the past by the time the refresh lands. That is what keeps the chain from
// hot-looping: every arm consumes at least one candidate, so the number of
// fires is bounded by the number of candidates and they are >= 5 min apart.
export const armDelayMinutes = (targetMs: number, nowMs: number): number => {
  if (!Number.isFinite(targetMs) || targetMs <= nowMs) {
    return 0;
  }
  const minutes = Math.ceil((targetMs - nowMs) / 60000);
  return Math.min(MAX_ARM_MINUTES, Math.max(MIN_ARM_MINUTES, minutes));
};

// Re-serialize the snapshot with a repaint stamp. Returns the input untouched
// when it does not parse, so a corrupt snapshot is never made worse.
export const stampSnapshot = (snapshotText: string, stamp: number): string => {
  const parsed = parseSnapshot(snapshotText);
  if (parsed === null) {
    return snapshotText;
  }
  parsed.tick = stamp;
  return JSON.stringify(parsed);
};
