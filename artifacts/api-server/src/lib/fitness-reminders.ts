import { ReplitConnectors } from "@replit/connectors-sdk";
import { and, eq, gte } from "drizzle-orm";
import { db, fitnessMessagesTable, fitnessProfilesTable, fitnessVisitsTable, type FitnessProfile } from "@workspace/db";
import { GOAL, localDate, reminderSlots, shiftDay, weekStart } from "./fitness-time";
import { fitnessAudienceFilters, fitnessAudienceTags, fitnessTagsApplied, fitnessTagUpdate } from "./fitness-audience";

// Public application identifier, supplied by the owner; not an API credential.
export const FITNESS_APP_ID = "d17da91e-5428-49a4-887d-8bff2034887d";
const FITNESS_WEB_URL = "https://fresh-food-and-beverages-tracking-app.replit.app/fitness";
export const externalId = (profileId: string) => `nutri-fitness-${profileId}`;
const connectors = new ReplitConnectors();

export class ReminderError extends Error {
  constructor(message: string, readonly provider?: { status: number; code?: string; operation: string }) {
    super(message);
    this.name = "ReminderError";
  }
}

async function oneSignal(path: string, method = "GET", body?: unknown) {
  const response = await connectors.proxy("onesignal", path, {
    method,
    ...(body === undefined ? {} : {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  });
  const data = await response.json() as {
    id?: string;
    errors?: unknown;
    properties?: { tags?: Record<string, string> };
    subscriptions?: { id: string; enabled?: boolean; type?: string }[];
  };
  const hasErrors = Array.isArray(data.errors) ? data.errors.length > 0 : Boolean(data.errors);
  if (!response.ok || hasErrors) {
    // Log only a bounded machine error code/status, never a provider payload,
    // user URL, device token, subscription identifier, or authentication data.
    const firstError = Array.isArray(data.errors) ? data.errors[0] : undefined;
    const rawCode = firstError && typeof firstError === "object" && "code" in firstError
      ? firstError.code : undefined;
    const code = typeof rawCode === "string" && /^[a-z0-9_-]{1,80}$/i.test(rawCode) ? rawCode : undefined;
    throw new ReminderError(
      code === "entitlements-tag-limit"
        ? "OneSignal meldet ein Limit für Geräte-Merkmale. Bitte prüfe die OneSignal-Einstellungen."
        : response.status === 401 || response.status === 403
        ? "OneSignal-Verbindung prüfen: App ID, Berechtigung oder Verbindung stimmen nicht."
        : response.status === 429
        ? "OneSignal erhält gerade zu viele Anfragen. Bitte warte kurz und versuche es erneut."
        : "OneSignal konnte die Erinnerungen nicht übernehmen. Bitte erneut versuchen.",
      { status: response.status, code, operation: path === "/notifications" ? "create-message" : `${method.toLowerCase()}-user` },
    );
  }
  return data;
}

function userPath(profile: FitnessProfile) {
  return `/apps/${FITNESS_APP_ID}/users/by/external_id/${externalId(profile.id)}`;
}

export async function verifySubscription(profile: FitnessProfile, subscriptionId: string) {
  const user = await oneSignal(userPath(profile));
  if (!user.subscriptions?.some(s => s.id === subscriptionId && s.enabled !== false)) {
    throw new ReminderError("Dieses Gerät ist noch nicht für Push angemeldet. Öffne die installierte App und erlaube Benachrichtigungen.");
  }
}

export async function syncFitnessTags(profile: FitnessProfile) {
  if (!profile.subscriptionId) return;
  const now = new Date();
  const today = localDate(now, profile.timezone);
  const currentWeek = weekStart(today);
  const visits = await db.select({ date: fitnessVisitsTable.date }).from(fitnessVisitsTable)
    .where(and(eq(fitnessVisitsTable.profileId, profile.id), gte(fitnessVisitsTable.date, currentWeek)));
  const end = shiftDay(currentWeek, 7);
  const count = visits.filter(v => v.date < end).length;
  const tags = fitnessTagUpdate(fitnessAudienceTags(profile, currentWeek, count));
  await oneSignal(userPath(profile), "PATCH", { properties: { tags } });
  // OneSignal user updates are asynchronous. Do not create campaigns against
  // tags which have not yet been applied.
  for (let attempt = 0; attempt < 6; attempt++) {
    // The OneSignal user-read API is limited to roughly one request per second.
    await new Promise(resolve => setTimeout(resolve, 1100));
    const user = await oneSignal(userPath(profile));
    if (fitnessTagsApplied(tags, user.properties?.tags)) return;
  }
  throw new ReminderError("Die Push-Einstellungen werden noch übernommen. Bitte gleich erneut versuchen.");
}

export async function scheduleFitnessReminders(profile: FitnessProfile) {
  await syncFitnessTags(profile);
  if (!profile.enabled || !profile.subscriptionId) {
    await db.update(fitnessProfilesTable).set({ scheduledUntil: null, error: null })
      .where(eq(fitnessProfilesTable.id, profile.id));
    return;
  }
  const now = new Date();
  const today = localDate(now, profile.timezone);
  const start = weekStart(today);
  const end = shiftDay(start, 7);
  const visits = await db.select({ date: fitnessVisitsTable.date }).from(fitnessVisitsTable)
    .where(and(eq(fitnessVisitsTable.profileId, profile.id), gte(fitnessVisitsTable.date, start)));
  const complete = visits.filter(v => v.date < end).length >= GOAL;
  const slots = reminderSlots(profile, now);
  for (const sendAt of slots) {
    const day = localDate(sendAt, profile.timezone);
    const slotWeek = weekStart(day);
    if (complete && slotWeek === start) continue;
    await db.insert(fitnessMessagesTable).values({
      profileId: profile.id, revision: profile.revision, sendAt,
    }).onConflictDoNothing();
    const [slot] = await db.select().from(fitnessMessagesTable).where(and(
      eq(fitnessMessagesTable.profileId, profile.id),
      eq(fitnessMessagesTable.revision, profile.revision),
      eq(fitnessMessagesTable.sendAt, sendAt),
    ));
    if (slot.messageId) continue;
    const message = await oneSignal("/notifications", "POST", {
      app_id: FITNESS_APP_ID,
      target_channel: "push",
      // Scheduled filters are evaluated by OneSignal at delivery. Changing the
      // revision, disabling, or reaching the goal excludes obsolete campaigns.
      filters: fitnessAudienceFilters(profile, slotWeek),
      headings: { en: "Dein Fitnessziel", de: "Dein Fitnessziel" },
      contents: {
        en: "Zeit fürs Fitness – dein Ziel: mindestens 2 Besuche pro Woche.",
        de: "Zeit fürs Fitness – dein Ziel: mindestens 2 Besuche pro Woche.",
      },
      data: { path: "/fitness" },
      web_url: FITNESS_WEB_URL,
      send_after: sendAt.toISOString(),
      idempotency_key: slot.id,
      ttl: 3600,
    });
    if (!message.id) throw new ReminderError("Keine Push-Zustellung möglich. Bitte prüfe, ob Benachrichtigungen auf diesem Gerät erlaubt sind.");
    await db.update(fitnessMessagesTable).set({ messageId: message.id })
      .where(eq(fitnessMessagesTable.id, slot.id));
  }
  const scheduledUntil = slots.at(-1) ?? now;
  await db.update(fitnessProfilesTable).set({ scheduledUntil, error: null })
    .where(eq(fitnessProfilesTable.id, profile.id));
}

export async function sendFitnessTest(profile: FitnessProfile) {
  if (!profile.enabled || !profile.subscriptionId) {
    throw new ReminderError("Aktiviere zuerst die Erinnerungen auf diesem Gerät.");
  }
  await verifySubscription(profile, profile.subscriptionId);
  const result = await oneSignal("/notifications", "POST", {
    app_id: FITNESS_APP_ID,
    include_subscription_ids: [profile.subscriptionId],
    headings: { en: "Fitness-Test", de: "Fitness-Test" },
    contents: {
      en: "Zeit fürs Fitness. Dein Wochenziel: mindestens 2 Besuche.",
      de: "Zeit fürs Fitness. Dein Wochenziel: mindestens 2 Besuche.",
    },
    data: { path: "/fitness" },
    web_url: FITNESS_WEB_URL,
    idempotency_key: crypto.randomUUID(),
    ttl: 300,
  });
  if (!result.id) throw new ReminderError("Keine Push-Zustellung möglich. Bitte prüfe die Benachrichtigungsfreigabe.");
}
