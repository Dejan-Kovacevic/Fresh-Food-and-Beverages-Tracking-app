import { Router } from "express";
import { db, foodEntriesTable } from "@workspace/db";
import { and, gte, lt, sql } from "drizzle-orm";
import { GetDailySummaryQueryParams, GetHistoryQueryParams } from "@workspace/api-zod";

const router = Router();

const CALORIE_GOAL = 2000;

function getDayRange(dateStr?: string): { start: Date; end: Date; dateLabel: string } {
  const base = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(base);
  start.setHours(0, 0, 0, 0);
  const end = new Date(base);
  end.setHours(23, 59, 59, 999);
  const dateLabel = start.toISOString().split("T")[0];
  return { start, end, dateLabel };
}

// GET /summary/daily
router.get("/summary/daily", async (req, res): Promise<void> => {
  const parsed = GetDailySummaryQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { start, end, dateLabel } = getDayRange(parsed.data.date ?? undefined);
  const entries = await db
    .select()
    .from(foodEntriesTable)
    .where(and(gte(foodEntriesTable.loggedAt, start), lt(foodEntriesTable.loggedAt, end)));

  const totalCalories = entries.reduce((s, e) => s + e.calories, 0);
  const totalProtein = entries.reduce((s, e) => s + e.protein, 0);
  const totalCarbs = entries.reduce((s, e) => s + e.carbs, 0);
  const totalFat = entries.reduce((s, e) => s + e.fat, 0);

  res.json({
    date: dateLabel,
    totalCalories: Math.round(totalCalories * 10) / 10,
    totalProtein: Math.round(totalProtein * 10) / 10,
    totalCarbs: Math.round(totalCarbs * 10) / 10,
    totalFat: Math.round(totalFat * 10) / 10,
    entryCount: entries.length,
    calorieGoal: CALORIE_GOAL,
  });
});

// GET /summary/weekly
router.get("/summary/weekly", async (req, res): Promise<void> => {
  const days: Array<{ date: string; calories: number; label: string }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const { start, end, dateLabel } = getDayRange(d.toISOString().split("T")[0]);
    const entries = await db
      .select()
      .from(foodEntriesTable)
      .where(and(gte(foodEntriesTable.loggedAt, start), lt(foodEntriesTable.loggedAt, end)));
    const calories = entries.reduce((s, e) => s + e.calories, 0);
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    days.push({ date: dateLabel, calories: Math.round(calories), label });
  }
  res.json(days);
});

// GET /history
router.get("/history", async (req, res): Promise<void> => {
  const parsed = GetHistoryQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const limit = parsed.data.limit ?? 30;
  const results = [];
  for (let i = 1; i <= limit; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const { start, end, dateLabel } = getDayRange(d.toISOString().split("T")[0]);
    const entries = await db
      .select()
      .from(foodEntriesTable)
      .where(and(gte(foodEntriesTable.loggedAt, start), lt(foodEntriesTable.loggedAt, end)));
    if (entries.length > 0) {
      results.push({
        date: dateLabel,
        totalCalories: Math.round(entries.reduce((s, e) => s + e.calories, 0) * 10) / 10,
        totalProtein: Math.round(entries.reduce((s, e) => s + e.protein, 0) * 10) / 10,
        totalCarbs: Math.round(entries.reduce((s, e) => s + e.carbs, 0) * 10) / 10,
        totalFat: Math.round(entries.reduce((s, e) => s + e.fat, 0) * 10) / 10,
        entryCount: entries.length,
        calorieGoal: CALORIE_GOAL,
      });
    }
  }
  res.json(results);
});

export default router;
