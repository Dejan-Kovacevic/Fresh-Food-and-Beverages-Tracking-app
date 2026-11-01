import { GOAL } from "./fitness-time";

type FitnessPlan = { id: string; revision: number; enabled: boolean };

// Keep just two nonempty tags: the free plan's per-user tag allowance is small.
// The installation and revision share one value, so another device or an
// obsolete plan cannot match. Use nonempty sentinels: "" deletes a OneSignal tag.
export function fitnessAudienceTags(profile: FitnessPlan, currentWeek: string, visits: number) {
  return {
    fitness_plan: profile.enabled ? `${profile.id}:${profile.revision}` : "off",
    fitness_completed_week: visits >= GOAL ? currentWeek : "none",
  };
}

export function fitnessAudienceFilters(profile: FitnessPlan, slotWeek: string) {
  return [
    { field: "tag", key: "fitness_plan", relation: "=", value: `${profile.id}:${profile.revision}` },
    { field: "tag", key: "fitness_completed_week", relation: "!=", value: slotWeek },
  ];
}

// Remove only tags owned by the previous implementation, never unrelated tags.
export function fitnessTagUpdate(tags: ReturnType<typeof fitnessAudienceTags>): Record<string, string> {
  return {
    fitness_owner: "", fitness_revision: "", fitness_enabled: "",
    fitness_due_0: "", fitness_due_1: "", fitness_due_2: "", fitness_due_3: "", fitness_due_4: "",
    ...tags,
  };
}

export function fitnessTagsApplied(expected: Record<string, string>, actual: Record<string, string> = {}) {
  return Object.entries(expected).every(([key, value]) =>
    value === "" ? !actual[key] : actual[key] === value);
}
