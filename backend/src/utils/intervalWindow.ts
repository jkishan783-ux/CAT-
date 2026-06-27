export interface IntervalWindowDetails {
  windowKey: string;     // Unique identifier like "YYYY-MM-DD-06"
  startTime: Date;       // Start timestamp of the 6-hour block
  endTime: Date;         // End timestamp of the 6-hour block
  nextRefreshTime: Date; // Timestamp of the next block refresh
}

/**
 * Calculates the 6-hour interval window details for any given date.
 * Windows are:
 * - 00:00:00 to 05:59:59 -> 12 AM (Key suffix: "00")
 * - 06:00:00 to 11:59:59 -> 6 AM (Key suffix: "06")
 * - 12:00:00 to 17:59:59 -> 12 PM (Key suffix: "12")
 * - 18:00:00 to 23:59:59 -> 6 PM (Key suffix: "18")
 * 
 * @param date The reference date (defaults to current server time)
 * @returns IntervalWindowDetails
 */
export function getIntervalWindow(date: Date = new Date()): IntervalWindowDetails {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const hours = date.getHours();

  const floorHour = Math.floor(hours / 6) * 6; // Will be 0, 6, 12, or 18

  // Format month and day with padding
  const pad = (num: number) => num.toString().padStart(2, '0');
  const monthStr = pad(month + 1);
  const dayStr = pad(day);
  const hourStr = pad(floorHour);

  const windowKey = `${year}-${monthStr}-${dayStr}-${hourStr}`;

  const startTime = new Date(year, month, day, floorHour, 0, 0, 0);
  const endTime = new Date(year, month, day, floorHour + 5, 59, 59, 999);
  
  const nextRefreshTime = new Date(year, month, day, floorHour + 6, 0, 0, 0);

  return {
    windowKey,
    startTime,
    endTime,
    nextRefreshTime,
  };
}
