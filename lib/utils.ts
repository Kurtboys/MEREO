// ============================================
// MEREO - Utility Functions
// ============================================

import { format, differenceInMinutes, addDays } from "date-fns";

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Format date to YYYY-MM-DD string
 */
export function formatDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function getTodayDateString(): string {
  return formatDateKey(new Date());
}

/**
 * Alias for getTodayDateString for consistency
 */
export const getTodayKey = getTodayDateString;

/**
 * Get tomorrow's date as YYYY-MM-DD
 */
export function getTomorrowDateString(): string {
  return formatDateKey(addDays(new Date(), 1));
}

/**
 * Format minutes to display string (e.g., "1h 30m")
 */
export function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Format minutes to longer display string (e.g., "1h 30min")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}min`;
}

/**
 * Format seconds to MM:SS or H:MM:SS timer display
 */
export function formatTimer(totalSeconds: number): string {
  const absSeconds = Math.abs(totalSeconds);
  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const seconds = absSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Format seconds to +MM:SS for overtime display
 */
export function formatOvertime(totalSeconds: number): string {
  const absSeconds = Math.abs(totalSeconds);
  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const seconds = absSeconds % 60;

  if (hours > 0) {
    return `+${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `+${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return formatDateKey(date1) === formatDateKey(date2);
}

/**
 * Calculate difference in minutes between two dates
 */
export function getMinutesDifference(start: Date, end: Date): number {
  return differenceInMinutes(end, start);
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * CSS class name helper (simple version)
 */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Calculate total estimated minutes from checkpoints
 */
export function calculateTotalMinutes(
  checkpoints: { estimatedMinutes: number }[]
): number {
  return checkpoints.reduce((sum, cp) => sum + cp.estimatedMinutes, 0);
}

/**
 * Parse date string (YYYY-MM-DD) to Date object
 */
export function parseDateString(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format date for display (e.g., "January 12, 2025")
 */
export function formatDateDisplay(date: Date | string): string {
  const d = typeof date === "string" ? parseDateString(date) : date;
  return format(d, "MMMM d, yyyy");
}

/**
 * Format time for display (e.g., "2:30 PM")
 */
export function formatTimeDisplay(date: Date): string {
  return format(date, "h:mm a");
}

/**
 * Check if a date string is today
 */
export function isToday(dateString: string): boolean {
  return dateString === getTodayDateString();
}

/**
 * Sort items by order property
 */
export function sortByOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}
