import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

/**
 * Time Utilities
 * Timezone-aware time parsing and formatting utilities
 */

// Constants for time calculations
export const MILLISECONDS_PER_MINUTE = 60 * 1000;

/**
 * Parse date and time in a specific timezone and return UTC Date object
 * @param date - Date string in format YYYY-MM-DD
 * @param time - Time string in format HH:MM
 * @param timezone - IANA timezone identifier (e.g., 'America/New_York')
 * @returns Date object representing the time in UTC
 */
export function parseTimeInZone(date: string, time: string, timezone: string): Date {
  // Validate time format with regex (HH:MM or H:MM or HH:M or H:M)
  const timeRegex = /^\d{1,2}:\d{1,2}$/;
  if (!timeRegex.test(time)) {
    throw new Error(`Invalid time format: ${time}`);
  }

  const [hours, minutes] = time.split(':').map(Number);

  if (
    hours === undefined
    || minutes === undefined
    || Number.isNaN(hours)
    || Number.isNaN(minutes)
    || hours < 0
    || hours > 23
    || minutes < 0
    || minutes > 59
  ) {
    throw new Error(`Invalid time format: ${time}`);
  }

  const dateTimeStr = `${date} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;

  return fromZonedTime(dateTimeStr, timezone);
}

/**
 * Format a Date object to HH:MM string in a specific timezone
 * @param date - Date object to format
 * @param timezone - IANA timezone identifier (e.g., 'America/New_York')
 * @returns Time string in format HH:MM
 */
export function formatTimeInZone(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, 'HH:mm');
}
