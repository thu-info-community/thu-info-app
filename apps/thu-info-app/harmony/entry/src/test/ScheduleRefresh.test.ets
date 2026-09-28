import { describe, it, expect } from '@ohos/hypium';
import {
  armDelayMinutes,
  nextRefreshTargetMs,
  parseSnapshot,
  refreshPolicyFor,
  stampSnapshot,
  REFRESH_POLICY_BOUNDARIES,
  REFRESH_POLICY_ENDS,
  REFRESH_POLICY_NONE,
  WidgetDayModel,
  WidgetItem,
  WidgetSnapshotModel,
} from '../main/ets/widget/common/WidgetModels';

// 2026-09-28 is a Monday.
const at = (day: number, hour: number, minute: number): number => {
  return new Date(2026, 8, day, hour, minute, 0, 0).getTime();
};

const item = (begin: number, end: number, name: string = 'Course'): WidgetItem => {
  return {
    name: name,
    loc: 'Room',
    from: '08:00',
    to: '09:35',
    begin: begin,
    end: end,
    color: '#000000',
  };
};

const day = (date: string, dayOfWeek: number, items: WidgetItem[]): WidgetDayModel => {
  return { dayOfWeek: dayOfWeek, date: date, label: '周一', items: items };
};

const EMPTY_DAY: WidgetDayModel = { dayOfWeek: 2, date: '2026-09-29', label: '周二', items: [] };

const snapshotOf = (days: WidgetDayModel[]): WidgetSnapshotModel => {
  return {
    v: 1,
    generatedAt: 0,
    week: 2,
    today: days[0],
    tomorrow: days.length > 1 ? days[1] : days[0],
    nextDays: days,
    empty: false,
  };
};

// Monday: 08:00-09:35 and 09:50-11:25.
const TWO_CLASSES = snapshotOf([
  day('2026-09-28', 1, [item(at(28, 8, 0), at(28, 9, 35)), item(at(28, 9, 50), at(28, 11, 25))]),
]);

export default function scheduleRefreshTest() {
  describe('scheduleRefresh', () => {
    it('picks end + 3min while a class is running', 0, () => {
      const target = nextRefreshTargetMs(TWO_CLASSES, at(28, 8, 30), REFRESH_POLICY_BOUNDARIES);
      expect(target).assertEqual(at(28, 9, 38));
    });

    it('picks begin + 1min between classes when boundaries matter', 0, () => {
      // 09:38 is already past, so the next interesting instant is the second
      // class starting — TodayCard moves its window and highlight there.
      const target = nextRefreshTargetMs(TWO_CLASSES, at(28, 9, 40), REFRESH_POLICY_BOUNDARIES);
      expect(target).assertEqual(at(28, 9, 51));
    });

    it('ignores class starts under the ends-only policy', 0, () => {
      // NextCard renders the first item with end > now, which a class *begin*
      // never changes — so it must not spend a refresh there.
      const target = nextRefreshTargetMs(TWO_CLASSES, at(28, 9, 40), REFRESH_POLICY_ENDS);
      expect(target).assertEqual(at(28, 11, 28));
    });

    it('keeps an exact-boundary end as the next target', 0, () => {
      const target = nextRefreshTargetMs(TWO_CLASSES, at(28, 9, 35), REFRESH_POLICY_ENDS);
      expect(target).assertEqual(at(28, 9, 38));
    });

    it('collapses a split period into a single refresh', 0, () => {
      // 08:00-08:45 / 08:50-09:35: end+3 (08:48) and the next begin+1 (08:51)
      // are one repaint, not two.
      const split = snapshotOf([
        day('2026-09-28', 1, [item(at(28, 8, 0), at(28, 8, 45)), item(at(28, 8, 50), at(28, 9, 35))]),
      ]);
      const target = nextRefreshTargetMs(split, at(28, 8, 30), REFRESH_POLICY_BOUNDARIES);
      expect(target).assertEqual(at(28, 8, 51));
    });

    it('falls back to the midnight heartbeat when classes are far away', 0, () => {
      const target = nextRefreshTargetMs(TWO_CLASSES, at(28, 23, 0), REFRESH_POLICY_BOUNDARIES);
      expect(target).assertEqual(at(29, 0, 5));
    });

    it('still heartbeats when the window has no classes at all', 0, () => {
      const empty = snapshotOf([EMPTY_DAY]);
      const target = nextRefreshTargetMs(empty, at(28, 14, 0), REFRESH_POLICY_BOUNDARIES);
      expect(target).assertEqual(at(29, 0, 5));
    });

    it('never arms the week card', 0, () => {
      expect(nextRefreshTargetMs(TWO_CLASSES, at(28, 8, 30), REFRESH_POLICY_NONE)).assertEqual(0);
      expect(refreshPolicyFor('schedule_week')).assertEqual(REFRESH_POLICY_NONE);
      expect(refreshPolicyFor('schedule_next')).assertEqual(REFRESH_POLICY_ENDS);
      expect(refreshPolicyFor('schedule_today')).assertEqual(REFRESH_POLICY_BOUNDARIES);
    });

    it('ignores non-finite boundaries', 0, () => {
      const broken = snapshotOf([
        day('2026-09-28', 1, [item(Number.NaN, Number.NaN), item(at(28, 9, 50), at(28, 11, 25))]),
      ]);
      const target = nextRefreshTargetMs(broken, at(28, 8, 30), REFRESH_POLICY_BOUNDARIES);
      expect(target).assertEqual(at(28, 9, 51));
    });

    it('clamps to the 5 minute floor the platform enforces', 0, () => {
      const now = at(28, 8, 30);
      expect(armDelayMinutes(now + 3 * 60 * 1000, now)).assertEqual(5);
      expect(armDelayMinutes(now + 5 * 60 * 1000, now)).assertEqual(5);
      expect(armDelayMinutes(now + 6 * 60 * 1000, now)).assertEqual(6);
    });

    it('refuses to arm for a target that is not ahead', 0, () => {
      const now = at(28, 8, 30);
      expect(armDelayMinutes(now, now)).assertEqual(0);
      expect(armDelayMinutes(now - 60 * 1000, now)).assertEqual(0);
      expect(armDelayMinutes(0, now)).assertEqual(0);
    });

    it('stamps the snapshot without breaking it', 0, () => {
      const raw = JSON.stringify(TWO_CLASSES);
      const stamped = stampSnapshot(raw, 1234);
      const parsed = parseSnapshot(stamped);
      expect(parsed === null).assertFalse();
      expect(parsed?.tick).assertEqual(1234);
      expect(parsed?.nextDays.length).assertEqual(1);
      // The stored snapshot is a different string from the stamped one, which
      // is the whole point: the card must see a change to repaint.
      expect(stamped === raw).assertFalse();
    });

    it('leaves an unparseable snapshot alone', 0, () => {
      expect(stampSnapshot('', 1234)).assertEqual('');
      expect(stampSnapshot('{"v":2}', 1234)).assertEqual('{"v":2}');
    });
  });
}
