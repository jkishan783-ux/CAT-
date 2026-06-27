/**
 * Calculates the new streak counter and whether the streak has updated.
 * Date format is assumed to be "YYYY-MM-DD" to avoid timezone errors.
 * 
 * @param lastTestDateStr The last daily test date string (YYYY-MM-DD) or null.
 * @param currentTestDateStr The current daily test date string (YYYY-MM-DD).
 * @param currentStreak The current streak counter value.
 * @returns { streak: number, updated: boolean }
 */
export function calculateNewStreak(
  lastTestDateStr: string | null,
  currentTestDateStr: string,
  currentStreak: number
): { streak: number; updated: boolean } {
  // If there's no last test, set streak to 1.
  if (!lastTestDateStr) {
    return { streak: 1, updated: true };
  }

  // Parse strings as UTC dates to ensure timezone-independent comparison
  const lastDate = new Date(`${lastTestDateStr}T00:00:00Z`);
  const currentDate = new Date(`${currentTestDateStr}T00:00:00Z`);

  if (isNaN(lastDate.getTime()) || isNaN(currentDate.getTime())) {
    throw new Error('Invalid date format. Expected YYYY-MM-DD.');
  }

  // Difference in milliseconds
  const diffTime = currentDate.getTime() - lastDate.getTime();
  // Difference in days
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    // Current test date is actually before the last recorded test date (clock drift or client timezone issues)
    // We do not modify the streak
    return { streak: currentStreak, updated: false };
  }

  if (diffDays === 0) {
    // Test taken on the same day. Streak remains unchanged.
    return { streak: currentStreak, updated: false };
  }

  if (diffDays === 1) {
    // Consecutive day test. Increment streak.
    return { streak: currentStreak + 1, updated: true };
  }

  // Skipped days (diffDays > 1). Reset streak to 1.
  return { streak: 1, updated: true };
}
