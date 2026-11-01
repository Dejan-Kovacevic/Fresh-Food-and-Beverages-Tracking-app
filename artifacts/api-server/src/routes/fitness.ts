import { randomUUID } from "node:crypto";
import { Router, type Request, type Response, type NextFunction } from "express";
import cookieParser from "cookie-parser";
import { and, eq, desc, gte, sql } from "drizzle-orm";
import { db, fitnessProfilesTable, fitnessVisitsTable, fitnessMessagesTable, type FitnessProfile } from "@workspace/db";
import { CreateFitnessVisitBody, DeleteFitnessVisitParams, GetFitnessResponse, SaveFitnessRemindersBody } from "@workspace/api-zod";
import { GOAL, localDate, shiftDay, validDay, weekStart } from "../lib/fitness-time";
import { FITNESS_APP_ID, externalId, ReminderError, scheduleFitnessReminders, sendFitnessTest, verifySubscription } from "../lib/fitness-reminders";

const router = Router();
const COOKIE = "nutri_fitness";
if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET is required for fitness installation cookies");
router.use(cookieParser(process.env.SESSION_SECRET));

// An anonymous installation identifier, not a login. No existing food data or
// authentication behavior is changed. Separate browsers cannot read each other.
router.use("/fitness", async (req, res, next): Promise<void> => {
  let id = req.signedCookies?.[COOKIE];
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/.test(id)) {
    id = randomUUID();
    res.cookie(COOKIE, id, {
      httpOnly: true, signed: true, sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 365 * 86400_000, path: "/api/fitness",
    });
  }
  await db.insert(fitnessProfilesTable).values({ id }).onConflictDoNothing();
  res.locals.fitnessId = id;
  res.setHeader("Cache-Control", "private, no-store");
  next();
});

async function profileFor(res: Response) {
  const [profile] = await db.select().from(fitnessProfilesTable)
    .where(eq(fitnessProfilesTable.id, res.locals.fitnessId));
  return profile;
}

// Serialize all profile mutations across API instances, including outbox sends.
async function locked<T>(res: Response, fn: (profile: FitnessProfile) => Promise<T>) {
  return db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${res.locals.fitnessId}))`);
    return fn(await profileFor(res));
  });
}

async function dashboard(res: Response) {
  const profile = await profileFor(res);
  const today = localDate(new Date(), profile.timezone);
  const start = weekStart(today);
  const end = shiftDay(start, 6);
  const visits = await db.select({ id: fitnessVisitsTable.id, date: fitnessVisitsTable.date })
    .from(fitnessVisitsTable).where(and(
      eq(fitnessVisitsTable.profileId, profile.id),
      gte(fitnessVisitsTable.date, shiftDay(today, -90)),
    )).orderBy(desc(fitnessVisitsTable.date));
  const count = visits.filter(v => v.date >= start && v.date <= end).length;
  const messages = profile.enabled ? await db.select().from(fitnessMessagesTable).where(and(
    eq(fitnessMessagesTable.profileId, profile.id),
    eq(fitnessMessagesTable.revision, profile.revision),
    gte(fitnessMessagesTable.sendAt, new Date()),
  )) : [];
  const active = messages.filter(message => message.messageId &&
    !(count >= GOAL && weekStart(localDate(message.sendAt, profile.timezone)) === start))
    .sort((a, b) => a.sendAt.getTime() - b.sendAt.getTime());
  return GetFitnessResponse.parse({
    goal: GOAL, today, weekStart: start, weekEnd: end, count, visits,
    reminders: {
      enabled: profile.enabled, days: profile.days, time: profile.time, timezone: profile.timezone,
      scheduledUntil: profile.scheduledUntil?.toISOString() ?? null,
      nextReminder: active[0]?.sendAt.toISOString() ?? null,
      scheduledCount: active.length, error: profile.error,
    },
  });
}

async function syncSafely(profile: FitnessProfile, req: Request) {
  try {
    await scheduleFitnessReminders(profile);
    return true;
  } catch (error) {
    req.log.warn({ profileId: profile.id, errorType: error instanceof Error ? error.name : "unknown" }, "Fitness reminder sync failed");
    await db.update(fitnessProfilesTable).set({
      error: error instanceof ReminderError ? error.message : "Erinnerungen konnten nicht geplant werden. Bitte erneut versuchen.",
    }).where(eq(fitnessProfilesTable.id, profile.id));
    return false;
  }
}

router.get("/fitness", async (_req, res): Promise<void> => {
  res.json(await dashboard(res));
});

router.get("/fitness/push-config", async (_req, res): Promise<void> => {
  res.json({ appId: FITNESS_APP_ID, externalId: externalId(res.locals.fitnessId) });
});

router.post("/fitness/visits", async (req, res): Promise<void> => {
  const parsed = CreateFitnessVisitBody.safeParse(req.body);
  if (!parsed.success || !validDay(parsed.data.date)) {
    res.status(400).json({ error: "Bitte ein gültiges Besuchsdatum wählen." });
    return;
  }
  await locked(res, async profile => {
    if (parsed.data.date > localDate(new Date(), profile.timezone)) {
      res.status(400).json({ error: "Ein Besuch kann nicht in der Zukunft liegen." });
      return;
    }
    if (parsed.data.date < shiftDay(localDate(new Date(), profile.timezone), -90)) {
      res.status(400).json({ error: "Bitte einen Besuch aus den letzten 90 Tagen wählen." });
      return;
    }
    const inserted = await db.insert(fitnessVisitsTable).values({
      profileId: profile.id, date: parsed.data.date,
    }).onConflictDoNothing().returning();
    if (!inserted.length) {
      res.status(409).json({ error: "Für diesen Tag ist bereits ein Fitnessbesuch eingetragen." });
      return;
    }
    // Never roll back a real visit because a notification provider is unavailable.
    if (profile.subscriptionId) await syncSafely(profile, req);
    res.status(201).json(await dashboard(res));
  });
});

router.delete("/fitness/visits/:id", async (req, res): Promise<void> => {
  const parsed = DeleteFitnessVisitParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Ungültiger Besuch." });
    return;
  }
  await locked(res, async profile => {
    const deleted = await db.delete(fitnessVisitsTable).where(and(
      eq(fitnessVisitsTable.id, parsed.data.id), eq(fitnessVisitsTable.profileId, profile.id),
    )).returning();
    if (!deleted.length) {
      res.status(404).json({ error: "Besuch nicht gefunden." });
      return;
    }
    if (profile.subscriptionId) await syncSafely(profile, req);
    res.json(await dashboard(res));
  });
});

router.put("/fitness/reminders", async (req, res): Promise<void> => {
  const parsed = SaveFitnessRemindersBody.safeParse(req.body);
  if (!parsed.success || new Set(parsed.data.days).size !== 2) {
    res.status(400).json({ error: "Wähle zwei verschiedene Wochentage und eine gültige Uhrzeit." });
    return;
  }
  try { new Intl.DateTimeFormat("de", { timeZone: parsed.data.timezone }); } catch {
    res.status(400).json({ error: "Ungültige Zeitzone." });
    return;
  }
  await locked(res, async profile => {
    const subscriptionId = parsed.data.subscriptionId ?? profile.subscriptionId;
    if (parsed.data.enabled) {
      if (!subscriptionId || !/^[a-f0-9-]{36}$/i.test(subscriptionId)) {
        res.status(400).json({ error: "Erlaube zuerst Benachrichtigungen auf diesem Gerät." });
        return;
      }
      await verifySubscription(profile, subscriptionId);
    }
    const [updated] = await db.update(fitnessProfilesTable).set({
      enabled: parsed.data.enabled, days: [...parsed.data.days].sort(),
      time: parsed.data.time, timezone: parsed.data.timezone,
      subscriptionId, revision: profile.revision + 1, scheduledUntil: null,
    }).where(eq(fitnessProfilesTable.id, profile.id)).returning();
    await syncSafely(updated, req);
    // Return truthful partial status; the UI must surface reminders.error.
    res.json(await dashboard(res));
  });
});

router.post("/fitness/reminders/refresh", async (req, res): Promise<void> => {
  await locked(res, async profile => {
    if (profile.enabled || (profile.subscriptionId && profile.error)) await syncSafely(profile, req);
    res.json(await dashboard(res));
  });
});

router.post("/fitness/reminders/test", async (req, res): Promise<void> => {
  await locked(res, async profile => {
    if (profile.lastTestAt && Date.now() - profile.lastTestAt.getTime() < 60_000) {
      res.status(429).json({ error: "Bitte eine Minute bis zur nächsten Testnachricht warten." });
      return;
    }
    await sendFitnessTest(profile);
    await db.update(fitnessProfilesTable).set({ lastTestAt: new Date() }).where(eq(fitnessProfilesTable.id, profile.id));
    res.json({ message: "Test an OneSignal übergeben. Prüfe die Benachrichtigungen auf diesem Gerät." });
  });
});

router.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
  req.log.error({ errorType: error instanceof Error ? error.name : "unknown" }, "Fitness request failed");
  res.status(error instanceof ReminderError ? 502 : 500).json({
    error: error instanceof ReminderError ? error.message : "Fitnessdaten konnten nicht geladen oder gespeichert werden. Bitte erneut versuchen.",
  });
});

export default router;
