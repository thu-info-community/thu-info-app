import localUnitTest from './LocalUnit.test';
import scheduleRefreshTest from './ScheduleRefresh.test';

export default function testsuite() {
  localUnitTest();
  scheduleRefreshTest();
}
