import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

export const GOAL = 2;
export const HORIZON_DAYS = 28;

export function localDate(now: Date, timezone: string): string {
  return formatInTimeZone(now, timezone, "yyyy-MM-dd");
}

export function shiftDay(day: string, offset: number): string {
  const value = new Date(`${day}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

export function validDay(day: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const value = new Date(`${day}T12:00:00Z`);
  return !Number.isNaN(value.getTime()) && value.toISOString().slice(0, 10) === day;
}

export function weekStart(day: string): string {
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay() || 7;
  return shiftDay(day, 1 - weekday);
}

// Five rotating week slots keep the provider tag count bounded. Including the
// actual week as the tag value prevents an old campaign matching a later week.
export function weekTag(day: string): string {
  const week = Math.floor(new Date(`${weekStart(day)}T12:00:00Z`).getTime() / (7 * 86400_000));
  return `fitness_due_${week % 5}`;
}

export function reminderSlots(
  profile: { days: number[]; time: string; timezone: string },
  now = new Date(),
): Date[] {
  const today = localDate(now, profile.timezone);
  const slots: Date[] = [];
  for (let offset = 0; offset < HORIZON_DAYS; offset++) {
    const day = shiftDay(today, offset);
    const weekday = new Date(`${day}T12:00:00Z`).getUTCDay() || 7;
    if (!profile.days.includes(weekday)) continue;
    const instant = fromZonedTime(`${day}T${profile.time}:00`, profile.timezone);
    // Exclude nonexistent local times during spring DST transitions.
    if (formatInTimeZone(instant, profile.timezone, "HH:mm") !== profile.time) continue;
    if (instant.getTime() > now.getTime() + 60_000) slots.push(instant);
  }
  return slots;
}
