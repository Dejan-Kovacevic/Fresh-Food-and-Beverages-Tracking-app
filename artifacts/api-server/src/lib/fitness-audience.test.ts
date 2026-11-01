import assert from "node:assert/strict";
import { test } from "node:test";
import { fitnessAudienceFilters, fitnessAudienceTags, fitnessTagsApplied, fitnessTagUpdate } from "./fitness-audience";

const plan = { id: "installation-a", revision: 2, enabled: true };
const week = "2026-11-02";

function matches(tags: Record<string, string>, target: typeof plan, slotWeek: string) {
  return fitnessAudienceFilters(target, slotWeek).every(filter =>
    filter.relation === "=" ? tags[filter.key] === filter.value : tags[filter.key] !== filter.value);
}

test("only two nonempty provider tags, including legacy cleanup", () => {
  const tags = fitnessTagUpdate(fitnessAudienceTags(plan, week, 0));
  assert.equal(Object.values(tags).filter(Boolean).length, 2);
  assert.equal(tags.fitness_owner, "");
  assert.equal(tags.fitness_due_4, "");
  assert.ok(fitnessTagsApplied(tags, fitnessAudienceTags(plan, week, 0)));
  assert.ok(!fitnessTagsApplied(tags, { ...fitnessAudienceTags(plan, week, 0), fitness_owner: "legacy" }));
});

test("under-goal visits receive this and future weeks' reminders", () => {
  for (const visits of [0, 1]) {
    const tags = fitnessAudienceTags(plan, week, visits);
    assert.ok(matches(tags, plan, week));
    assert.ok(matches(tags, plan, "2026-11-09"));
  }
});

test("two or more visits suppress only the completed week", () => {
  for (const visits of [2, 3, 7]) {
    const tags = fitnessAudienceTags(plan, week, visits);
    assert.ok(!matches(tags, plan, week));
    assert.ok(matches(tags, plan, "2026-11-09"));
  }
});

test("removing a visit and changing weeks restores eligibility", () => {
  assert.ok(matches(fitnessAudienceTags(plan, week, 1), plan, week));
  assert.ok(matches(fitnessAudienceTags(plan, "2026-11-09", 0), plan, "2026-11-09"));
});

test("disabled, outdated, and other installations never match", () => {
  assert.ok(!matches(fitnessAudienceTags({ ...plan, enabled: false }, week, 0), plan, week));
  assert.ok(!matches(fitnessAudienceTags({ ...plan, revision: 3 }, week, 0), plan, week));
  assert.ok(!matches(fitnessAudienceTags({ ...plan, id: "installation-b" }, week, 0), plan, week));
});
