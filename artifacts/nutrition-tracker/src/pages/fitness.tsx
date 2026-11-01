import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell, Check, Plus, Trash2, Bell, BellOff, RotateCw, AlertTriangle, Smartphone, Send, CalendarDays, Info,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  useFitness, useFitnessMutations, useFitnessAutoRefresh, useFitnessPushConfig,
  getRememberedSubId, rememberSubId, addDays, formatDe, WEEKDAYS_SHORT, WEEKDAYS_LONG,
} from "@/hooks/use-fitness";
import { enableFitnessPush, getPushSupport, disableFitnessPush } from "@/lib/fitness-push";

const TZ = "Europe/Zurich";
const TEST_TEXT = "Zeit fürs Fitness. Dein Wochenziel: mindestens 2 Besuche.";
const REMINDER_TEXT = "Zeit fürs Fitness – dein Ziel: mindestens 2 Besuche pro Woche.";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Unbekannter Fehler";
}

function permissionState(): NotificationPermission | "unsupported" {
  return typeof Notification === "undefined" ? "unsupported" : Notification.permission;
}

export function Fitness() {
  const { data, isLoading, isError, refetch, isFetching } = useFitness();
  const refresh = useFitnessAutoRefresh(data?.reminders.enabled);
  const { create, remove, save, test } = useFitnessMutations();
  const pushConfig = useFitnessPushConfig();
  const { toast } = useToast();

  const [backdate, setBackdate] = useState("");
  const [toDelete, setToDelete] = useState<{ id: number; date: string } | null>(null);
  const [days, setDays] = useState<number[]>([2, 5]);
  const [time, setTime] = useState("18:00");
  const [initFor, setInitFor] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [perm, setPerm] = useState(permissionState());
  const support = useMemo(() => getPushSupport(), []);

  useEffect(() => {
    if (data && !initFor) {
      setInitFor(true);
      if (data.reminders.days.length === 2) setDays([...data.reminders.days].sort());
      if (data.reminders.time) setTime(data.reminders.time);
    }
  }, [data, initFor]);

  const visitDates = useMemo(() => new Set(data?.visits.map((v) => v.date) ?? []), [data]);

  if (isLoading)
    return (
      <Layout>
        <div className="p-5 space-y-4">
          <Skeleton className="h-56 rounded-3xl" /><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" />
        </div>
      </Layout>
    );

  if (isError || !data)
    return (
      <Layout>
        <div className="p-8 text-center mt-16">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 flex items-center justify-center mb-4"><AlertTriangle className="w-7 h-7 text-rose-500" /></div>
          <h2 className="font-bold text-slate-900">Fitness-Daten nicht erreichbar</h2>
          <p className="text-sm text-slate-500 mt-1 mb-5">Wir zeigen lieber nichts als eine falsche Null.</p>
          <button onClick={() => refetch()} data-testid="button-retry-fitness"
            className="inline-flex items-center gap-2 h-10 px-6 rounded-full bg-teal-700 text-white text-sm font-semibold active:scale-95 transition-transform">
            <RotateCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} /> Erneut versuchen
          </button>
        </div>
      </Layout>
    );

  const r = data.reminders;
  const loggedToday = visitDates.has(data.today);
  const done = data.count >= data.goal;
  const minDate = addDays(data.today, -89);
  const backdateTaken = backdate !== "" && visitDates.has(backdate);
  const backdateInvalid = backdate !== "" && (backdate > data.today || backdate < minDate);
  const active = r.enabled && !!r.scheduledUntil && r.scheduledCount > 0 && !r.error;
  const daysChanged = JSON.stringify([...days].sort()) !== JSON.stringify([...r.days].sort()) || time !== r.time;

  const logVisit = (date: string) =>
    create.mutate({ data: { date } }, {
      onSuccess: () => { toast({ title: "Besuch eingetragen", description: formatDe(date, { weekday: "long", day: "numeric", month: "long" }) }); setBackdate(""); },
      onError: (e) => toast({ title: "Nicht gespeichert", description: errMsg(e), variant: "destructive" }),
    });

  const toggleDay = (d: number) =>
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : cur.length >= 2 ? [cur[1], d] : [...cur, d]).sort());

  const saveEnabled = (subscriptionId: string) =>
    save.mutateAsync({ data: { enabled: true, days, time, timezone: TZ, subscriptionId } });

  const activate = async () => {
    if (!pushConfig.data) { toast({ title: "Push-Konfiguration fehlt", description: "Bitte später erneut versuchen.", variant: "destructive" }); return; }
    setPushBusy(true);
    try {
      const id = await enableFitnessPush(pushConfig.data);
      rememberSubId(id);
      setPerm(permissionState());
      const saved = await saveEnabled(id);
      if (saved.reminders.error) throw new Error(saved.reminders.error);
      toast({ title: "Erinnerungen aktiviert" });
    } catch (e) {
      setPerm(permissionState());
      toast({ title: "Aktivierung fehlgeschlagen", description: errMsg(e), variant: "destructive" });
    } finally { setPushBusy(false); }
  };

  const saveSchedule = async () => {
    setPushBusy(true);
    try {
      let id = getRememberedSubId();
      if (!id && pushConfig.data) { id = await enableFitnessPush(pushConfig.data); rememberSubId(id); }
      if (!id) throw new Error("Keine Push-Verbindung auf diesem Gerät.");
      const saved = await saveEnabled(id);
      if (saved.reminders.error) throw new Error(saved.reminders.error);
      toast({ title: "Plan gespeichert" });
    } catch (e) {
      toast({ title: "Speichern fehlgeschlagen", description: errMsg(e), variant: "destructive" });
    } finally { setPushBusy(false); }
  };

  const deactivate = async () => {
    setPushBusy(true);
    try {
      const saved = await save.mutateAsync({ data: { enabled: false, days: r.days, time: r.time, timezone: r.timezone, subscriptionId: getRememberedSubId() } });
      if (saved.reminders.error) throw new Error(saved.reminders.error);
      await disableFitnessPush();
      rememberSubId(null);
      toast({ title: "Erinnerungen ausgeschaltet" });
    } catch (e) {
      toast({ title: "Ausschalten fehlgeschlagen", description: errMsg(e), variant: "destructive" });
    } finally { setPushBusy(false); }
  };

  const sendTest = () =>
    test.mutate(undefined, {
      onSuccess: (res) => toast({ title: "Test gesendet an dieses Handy", description: res.message }),
      onError: (e) => toast({ title: "Test fehlgeschlagen", description: errMsg(e), variant: "destructive" }),
    });

  const progress = Math.min(data.count / data.goal, 1);
  const circ = 2 * Math.PI * 70;

  return (
    <Layout>
      <div className="bg-[hsl(170_30%_97%)] min-h-full pb-6">
        {/* Hero */}
        <section className="relative m-4 rounded-[32px] overflow-hidden bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-900 text-white p-6">
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(135deg, white 0 1px, transparent 1px 14px)" }} />
          <div className="relative flex items-center gap-5">
            <div className="relative w-36 h-36 shrink-0">
              <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.12)" strokeWidth="12" fill="none" />
                <motion.circle cx="80" cy="80" r="70" stroke="#fcd34d" strokeWidth="12" fill="none" strokeLinecap="round"
                  strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ - progress * circ }}
                  transition={{ type: "spring", stiffness: 60, damping: 16 }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span key={data.count} initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="text-5xl font-black tabular-nums leading-none" data-testid="text-week-count">{data.count}</motion.span>
                <span className="text-[11px] uppercase tracking-widest text-teal-200 mt-1">von {data.goal}</span>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-widest text-teal-300 font-semibold">Diese Woche</p>
              <h1 className="text-2xl font-black leading-tight mt-1" data-testid="text-week-status">
                {done ? "Ziel erreicht. Stark." : data.count === 1 ? "Einer noch." : "Dein Ziel: zweimal pro Woche."}
              </h1>
              <p className="text-xs text-teal-100/80 mt-2">
                {formatDe(data.weekStart, { day: "numeric", month: "short" })} – {formatDe(data.weekEnd, { day: "numeric", month: "short" })}
                {done && r.enabled ? " · restliche Erinnerungen pausiert" : ""}
              </p>
            </div>
          </div>
          <div className="relative grid grid-cols-7 gap-1.5 mt-6">
            {WEEKDAYS_SHORT.map((d, i) => {
              const date = addDays(data.weekStart, i);
              const hit = visitDates.has(date);
              const isToday = date === data.today;
              return (
                <div key={d} className={`flex flex-col items-center gap-1.5 py-2 rounded-xl ${isToday ? "bg-white/10" : ""}`}>
                  <span className="text-[10px] font-semibold text-teal-200">{d}</span>
                  <motion.div layout className={`w-7 h-7 rounded-full flex items-center justify-center ${hit ? "bg-amber-300 text-teal-950" : "border border-white/20"}`}>
                    {hit && <Check className="w-4 h-4" strokeWidth={3} />}
                  </motion.div>
                </div>
              );
            })}
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => logVisit(data.today)} disabled={loggedToday || create.isPending}
            data-testid="button-log-today"
            className="relative mt-5 w-full h-12 rounded-2xl bg-amber-300 text-teal-950 font-bold text-sm flex items-center justify-center gap-2 disabled:bg-white/10 disabled:text-teal-100 transition-colors">
            {loggedToday ? <><Check className="w-4 h-4" /> Heute schon eingetragen</> : create.isPending ? "Speichert…" : <><Dumbbell className="w-4 h-4" /> Heute war ich im Gym</>}
          </motion.button>
        </section>

        <div className="px-4 space-y-4">
          {/* Backdate */}
          <section className="bg-white rounded-2xl p-4 border border-teal-900/5 shadow-sm">
            <div className="flex items-center gap-2 mb-3"><CalendarDays className="w-4 h-4 text-teal-700" /><h2 className="font-bold text-slate-900 text-sm">Besuch nachtragen</h2></div>
            <div className="flex gap-2">
              <input type="date" value={backdate} max={data.today} min={minDate} onChange={(e) => setBackdate(e.target.value)}
                data-testid="input-backdate"
                className="flex-1 h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/40" />
              <button onClick={() => logVisit(backdate)} disabled={!backdate || backdateTaken || backdateInvalid || create.isPending}
                data-testid="button-backdate"
                className="h-11 px-4 rounded-xl bg-teal-700 text-white text-sm font-semibold flex items-center gap-1 disabled:opacity-40 active:scale-95 transition-transform">
                <Plus className="w-4 h-4" /> Eintragen
              </button>
            </div>
            {backdateTaken && <p className="text-xs text-amber-700 mt-2">An diesem Tag ist schon ein Besuch eingetragen.</p>}
            {backdateInvalid && <p className="text-xs text-rose-600 mt-2">Nur Tage der letzten 90 Tage, keine Zukunft.</p>}
          </section>

          {/* Reminders */}
          <section className="bg-white rounded-2xl p-4 border border-teal-900/5 shadow-sm" data-testid="section-reminders">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2"><Bell className="w-4 h-4 text-teal-700" /><h2 className="font-bold text-slate-900 text-sm">Erinnerungen</h2></div>
              <span data-testid="status-reminders" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                r.error ? "bg-rose-100 text-rose-700" : active ? "bg-teal-100 text-teal-800" : r.enabled ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500"}`}>
                {r.error ? "Fehler" : active ? "Aktiv" : r.enabled ? "Unbestätigt" : "Aus"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">Zwei Tage, eine Uhrzeit. Zeitzone: {TZ}.</p>

            {r.error && (
              <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 flex gap-2" data-testid="text-reminder-error">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <div className="text-xs text-rose-800"><p className="font-bold">Planung fehlgeschlagen</p><p className="mt-0.5">{r.error}</p>
                  <p className="mt-1">Vorherige Erinnerungen können bis zur erfolgreichen Synchronisierung weiterlaufen.</p>
                  <button onClick={() => refresh.mutate()} disabled={refresh.isPending} data-testid="button-refresh-reminders" className="mt-2 font-semibold underline">
                    {refresh.isPending ? "Versucht…" : "Erneut planen"}</button></div>
              </div>
            )}

            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAYS_SHORT.map((d, i) => {
                const n = i + 1; const on = days.includes(n);
                return (
                  <motion.button key={d} whileTap={{ scale: 0.9 }} onClick={() => toggleDay(n)} aria-label={WEEKDAYS_LONG[i]} aria-pressed={on}
                    data-testid={`button-day-${n}`}
                    className={`h-11 rounded-xl text-xs font-bold transition-colors ${on ? "bg-teal-700 text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>{d}</motion.button>
                );
              })}
            </div>
            <div className="flex items-center gap-3 mt-3">
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} data-testid="input-reminder-time"
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-600/40" />
              <span className="text-xs text-slate-500">{days.length === 2 ? `${WEEKDAYS_LONG[days[0] - 1]} & ${WEEKDAYS_LONG[days[1] - 1]}` : "Genau zwei Tage wählen"}</span>
            </div>

            <p className="mt-4 text-xs text-slate-600 bg-teal-50/60 rounded-xl p-3">
              Text der Erinnerung: <span className="font-semibold">„{REMINDER_TEXT}"</span> Sobald zwei Besuche eingetragen sind, fallen die restlichen Erinnerungen der Woche weg.
            </p>

            {/* Permission / support state */}
            {!r.enabled && support.needsInstall && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 flex gap-2 text-xs text-amber-900" data-testid="text-needs-install">
                <Smartphone className="w-5 h-5 shrink-0" />
                <div><p className="font-bold">Auf dem iPhone zuerst installieren</p>
                  <p className="mt-0.5">In Safari: Teilen &gt; Zum Home-Bildschirm. Danach die installierte App öffnen (iOS 16.4 oder neuer). In der Vorschau-Ansicht klappt es nicht – öffne die veröffentlichte URL in Safari.</p></div>
              </div>
            )}
            {!r.enabled && !support.supported && !support.needsInstall && (
              <p className="mt-3 text-xs text-slate-500 flex gap-2"><Info className="w-4 h-4 shrink-0" />{support.reason ?? "Push wird hier nicht unterstützt."} In der Vorschau evtl. die veröffentlichte URL direkt öffnen.</p>
            )}
            {perm === "denied" && (
              <p className="mt-3 text-xs text-rose-700 bg-rose-50 rounded-xl p-3" data-testid="text-permission-denied">
                Mitteilungen sind blockiert. Erlaube sie in den Einstellungen deines Browsers bzw. iPhones für diese App, dann erneut aktivieren.</p>
            )}

            <div className="mt-4 space-y-2">
              {!r.enabled ? (
                <button onClick={activate} disabled={pushBusy || days.length !== 2 || !support.supported || perm === "denied" || pushConfig.isLoading}
                  data-testid="button-enable-reminders"
                  className="w-full h-12 rounded-xl bg-teal-700 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-transform">
                  <Bell className="w-4 h-4" /> {pushBusy ? "Fragt nach Erlaubnis…" : "Mitteilungen erlauben und aktivieren"}
                </button>
              ) : (
                <>
                  <button onClick={saveSchedule} disabled={pushBusy || days.length !== 2 || !daysChanged} data-testid="button-save-reminders"
                    className="w-full h-11 rounded-xl bg-teal-700 text-white font-semibold text-sm disabled:opacity-40 active:scale-[0.98] transition-transform">
                    {pushBusy ? "Speichert…" : "Plan speichern"}</button>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={sendTest} disabled={test.isPending} data-testid="button-test-reminder"
                      className="h-11 rounded-xl bg-amber-100 text-amber-900 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
                      <Send className="w-3.5 h-3.5" /> {test.isPending ? "Sendet…" : "Test an dieses Handy"}</button>
                    <button onClick={deactivate} disabled={pushBusy} data-testid="button-disable-reminders"
                      className="h-11 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
                      <BellOff className="w-3.5 h-3.5" /> Ausschalten</button>
                  </div>
                  <p className="text-[11px] text-slate-500">Testinhalt: „{TEST_TEXT}" – geht nur an dieses Gerät.</p>
                </>
              )}
            </div>

            {r.enabled && (
              <div className="mt-4 text-xs text-slate-600 border-t border-slate-100 pt-3 space-y-1" data-testid="text-schedule-info">
                {active ? (
                  <>
                    <p>{r.scheduledCount} Erinnerungen bestätigt geplant.{r.nextReminder && <> Nächste: <span className="font-semibold">{formatDe(r.nextReminder, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span></>}</p>
                    <p>Vier Wochen im Voraus geplant. Beim Öffnen verlängert. Ohne erneutes Öffnen enden die Erinnerungen am <span className="font-semibold">{formatDe(r.scheduledUntil!, { day: "numeric", month: "long", year: "numeric" })}</span>.</p>
                  </>
                ) : !r.error && <p>{refresh.isPending ? "Planung wird verlängert…" : "Noch keine bestätigte Planung."}</p>}
              </div>
            )}
          </section>

          {/* History */}
          <section className="bg-white rounded-2xl p-4 border border-teal-900/5 shadow-sm">
            <h2 className="font-bold text-slate-900 text-sm mb-1">Verlauf · 90 Tage</h2>
            <p className="text-[11px] text-slate-400 mb-3">Gespeichert für diesen Browser bzw. diese App-Installation. Nur manuelle Einträge.</p>
            {data.visits.length === 0 ? (
              <div className="py-8 text-center">
                <Dumbbell className="w-8 h-8 mx-auto text-teal-200" />
                <p className="text-sm text-slate-500 mt-2">Noch keine Besuche. Trag deinen ersten Besuch ein.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-50">
                <AnimatePresence initial={false}>
                  {[...data.visits].sort((a, b) => b.date.localeCompare(a.date)).map((v) => (
                    <motion.li key={v.id} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-between py-2.5" data-testid={`row-visit-${v.id}`}>
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${v.date >= data.weekStart ? "bg-amber-400" : "bg-teal-500"}`} />
                        <span className="text-sm text-slate-800">{formatDe(v.date, { weekday: "long", day: "numeric", month: "long" })}</span>
                      </div>
                      <button onClick={() => setToDelete(v)} aria-label="Entfernen" data-testid={`button-delete-visit-${v.id}`}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                        <Trash2 className="w-4 h-4" /></button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </section>
        </div>
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Besuch entfernen?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete && formatDe(toDelete.date, { weekday: "long", day: "numeric", month: "long" })} wird aus deinem Verlauf gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Behalten</AlertDialogCancel>
            <AlertDialogAction data-testid="button-confirm-delete" className="bg-rose-600 hover:bg-rose-700"
              onClick={() => toDelete && remove.mutate({ id: toDelete.id }, {
                onSuccess: () => toast({ title: "Besuch entfernt" }),
                onError: (e) => toast({ title: "Entfernen fehlgeschlagen", description: errMsg(e), variant: "destructive" }),
              })}>Entfernen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
