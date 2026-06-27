import { calculateNewStreak } from '../utils/streakTracker';

describe('Daily Streak Tracker tests', () => {
  test('First daily test: should set streak to 1', () => {
    const result = calculateNewStreak(null, '2026-06-27', 0);
    expect(result.streak).toBe(1);
    expect(result.updated).toBe(true);
  });

  test('Consecutive day completion: should increment the streak', () => {
    const result = calculateNewStreak('2026-06-26', '2026-06-27', 4);
    expect(result.streak).toBe(5);
    expect(result.updated).toBe(true);
  });

  test('Same day completion: should preserve the streak and return updated=false', () => {
    const result = calculateNewStreak('2026-06-27', '2026-06-27', 3);
    expect(result.streak).toBe(3);
    expect(result.updated).toBe(false);
  });

  test('Skipped day completion: should reset streak to 1', () => {
    const result = calculateNewStreak('2026-06-24', '2026-06-26', 10);
    expect(result.streak).toBe(1);
    expect(result.updated).toBe(true);
  });

  test('Throw error on invalid format', () => {
    expect(() => {
      calculateNewStreak('2026/06/24', 'invalid-date', 2);
    }).toThrow();
  });
});
