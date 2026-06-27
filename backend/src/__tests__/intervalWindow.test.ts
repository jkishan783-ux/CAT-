import { getIntervalWindow } from '../utils/intervalWindow';

describe('6-Hour Test Interval window tests', () => {
  test('Time is 3:30 AM: should select 12 AM (00:00) block', () => {
    const testDate = new Date(2026, 5, 27, 3, 30, 0); // Note: month index is 0-indexed (5 = June)
    const details = getIntervalWindow(testDate);

    expect(details.windowKey).toBe('2026-06-27-00');
    expect(details.startTime.getHours()).toBe(0);
    expect(details.endTime.getHours()).toBe(5);
    expect(details.nextRefreshTime.getHours()).toBe(6);
  });

  test('Time is 8:15 AM: should select 6 AM (06:00) block', () => {
    const testDate = new Date(2026, 5, 27, 8, 15, 0);
    const details = getIntervalWindow(testDate);

    expect(details.windowKey).toBe('2026-06-27-06');
    expect(details.startTime.getHours()).toBe(6);
    expect(details.endTime.getHours()).toBe(11);
    expect(details.nextRefreshTime.getHours()).toBe(12);
  });

  test('Time is 2:45 PM (14:45): should select 12 PM (12:00) block', () => {
    const testDate = new Date(2026, 5, 27, 14, 45, 0);
    const details = getIntervalWindow(testDate);

    expect(details.windowKey).toBe('2026-06-27-12');
    expect(details.startTime.getHours()).toBe(12);
    expect(details.endTime.getHours()).toBe(17);
    expect(details.nextRefreshTime.getHours()).toBe(18);
  });

  test('Time is 9:10 PM (21:10): should select 6 PM (18:00) block', () => {
    const testDate = new Date(2026, 5, 27, 21, 10, 0);
    const details = getIntervalWindow(testDate);

    expect(details.windowKey).toBe('2026-06-27-18');
    expect(details.startTime.getHours()).toBe(18);
    expect(details.endTime.getHours()).toBe(23);
    
    // The next refresh is at 00:00 the following day
    expect(details.nextRefreshTime.getHours()).toBe(0);
    expect(details.nextRefreshTime.getDate()).toBe(28); // 28th of June
  });
});
