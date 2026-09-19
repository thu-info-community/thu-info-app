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
  items: WidgetItem[];
}

export interface WidgetSnapshotModel {
  v: number;
  generatedAt: number;
  week: number;
  today: WidgetDayModel;
  tomorrow: WidgetDayModel;
  nextDays: WidgetDayModel[];
  empty: boolean;
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
