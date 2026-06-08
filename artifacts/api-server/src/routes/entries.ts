import { Router } from "express";
import { db, foodEntriesTable } from "@workspace/db";
import { eq, and, gte, lt } from "drizzle-orm";
import {
  ListEntriesQueryParams,
  CreateEntryBody,
  UpdateEntryParams,
  UpdateEntryBody,
  DeleteEntryParams,
  GetEntryParams,
} from "@workspace/api-zod";

const router = Router();

function getDayRange(dateStr?: string): { start: Date; end: Date } {
  const base = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(base);
  start.setHours(0, 0, 0, 0);
  const end = new Date(base);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// GET /entries
router.get("/entries", async (req, res): Promise<void> => {
  const parsed = ListEntriesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { start, end } = getDayRange(parsed.data.date ?? undefined);
  const entries = await db
    .select()
    .from(foodEntriesTable)
    .where(and(gte(foodEntriesTable.loggedAt, start), lt(foodEntriesTable.loggedAt, end)))
    .orderBy(foodEntriesTable.loggedAt);
  res.json(entries.map(e => ({
    id: e.id,
    name: e.name,
    calories: e.calories,
    protein: e.protein,
    carbs: e.carbs,
    fat: e.fat,
    servingSize: e.servingSize,
    mealType: e.mealType,
    loggedAt: e.loggedAt.toISOString(),
  })));
});

// POST /entries
router.post("/entries", async (req, res): Promise<void> => {
  const parsed = CreateEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { loggedAt, ...rest } = parsed.data;
  const [entry] = await db
    .insert(foodEntriesTable)
    .values({
      ...rest,
      loggedAt: loggedAt ? new Date(loggedAt) : new Date(),
    })
    .returning();
  res.status(201).json({
    id: entry.id,
    name: entry.name,
    calories: entry.calories,
    protein: entry.protein,
    carbs: entry.carbs,
    fat: entry.fat,
    servingSize: entry.servingSize,
    mealType: entry.mealType,
    loggedAt: entry.loggedAt.toISOString(),
  });
});

// GET /entries/:id
router.get("/entries/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramsParsed = GetEntryParams.safeParse({ id: parseInt(raw, 10) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: paramsParsed.error.message });
    return;
  }
  const [entry] = await db
    .select()
    .from(foodEntriesTable)
    .where(eq(foodEntriesTable.id, paramsParsed.data.id));
  if (!entry) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }
  res.json({
    id: entry.id,
    name: entry.name,
    calories: entry.calories,
    protein: entry.protein,
    carbs: entry.carbs,
    fat: entry.fat,
    servingSize: entry.servingSize,
    mealType: entry.mealType,
    loggedAt: entry.loggedAt.toISOString(),
  });
});

// PATCH /entries/:id
router.patch("/entries/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramsParsed = UpdateEntryParams.safeParse({ id: parseInt(raw, 10) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: paramsParsed.error.message });
    return;
  }
  const bodyParsed = UpdateEntryBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }
  const [entry] = await db
    .update(foodEntriesTable)
    .set(bodyParsed.data)
    .where(eq(foodEntriesTable.id, paramsParsed.data.id))
    .returning();
  if (!entry) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }
  res.json({
    id: entry.id,
    name: entry.name,
    calories: entry.calories,
    protein: entry.protein,
    carbs: entry.carbs,
    fat: entry.fat,
    servingSize: entry.servingSize,
    mealType: entry.mealType,
    loggedAt: entry.loggedAt.toISOString(),
  });
});

// DELETE /entries/:id
router.delete("/entries/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramsParsed = DeleteEntryParams.safeParse({ id: parseInt(raw, 10) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: paramsParsed.error.message });
    return;
  }
  const deleted = await db
    .delete(foodEntriesTable)
    .where(eq(foodEntriesTable.id, paramsParsed.data.id))
    .returning();
  if (!deleted.length) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }
  res.status(204).send();
});

export default router;
