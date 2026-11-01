import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetFitness,
  getGetFitnessQueryKey,
  useCreateFitnessVisit,
  useDeleteFitnessVisit,
  useSaveFitnessReminders,
  useRefreshFitnessReminders,
  useTestFitnessReminder,
  useGetFitnessPushConfig,
  getGetFitnessPushConfigQueryKey,
} from "@workspace/api-client-react";
import type { FitnessDashboard } from "@workspace/api-client-react";

export const SUB_ID_KEY = "nutriai-fitness-subscription-id";

export function getRememberedSubId(): string | null {
  try { return localStorage.getItem(SUB_ID_KEY); } catch { return null; }
}
export function rememberSubId(id: string | null) {
  try { id ? localStorage.setItem(SUB_ID_KEY, id) : localStorage.removeItem(SUB_ID_KEY); } catch { /* ignore */ }
}

export function useFitness() {
  return useGetFitness({
    query: {
      queryKey: getGetFitnessQueryKey(),
      staleTime: 60_000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  });
}

export function useFitnessPushConfig() {
  const fitness = useFitness();
  return useGetFitnessPushConfig({
    query: { queryKey: getGetFitnessPushConfigQueryKey(), enabled: !!fitness.data, staleTime: 10 * 60_000, retry: 1 },
  });
}

function useWriteBack() {
  const qc = useQueryClient();
  return (data: FitnessDashboard) => {
    qc.setQueryData(getGetFitnessQueryKey(), data);
    qc.invalidateQueries({ queryKey: getGetFitnessQueryKey() });
  };
}

export function useFitnessMutations() {
  const writeBack = useWriteBack();
  const create = useCreateFitnessVisit({ mutation: { onSuccess: writeBack } });
  const remove = useDeleteFitnessVisit({ mutation: { onSuccess: writeBack } });
  const save = useSaveFitnessReminders({ mutation: { onSuccess: writeBack } });
  const test = useTestFitnessReminder();
  return { create, remove, save, test };
}

let lastRefreshAt = 0;

/** Extends the OneSignal schedule once per app open, only when reminders are enabled. */
export function useFitnessAutoRefresh(enabled: boolean | undefined) {
  const writeBack = useWriteBack();
  const refresh = useRefreshFitnessReminders({ mutation: { onSuccess: writeBack } });
  const mutate = refresh.mutate;
  useEffect(() => {
    if (!enabled) return;
    const extend = () => {
      if (document.visibilityState === "hidden" || Date.now() - lastRefreshAt < 6 * 3600_000) return;
      lastRefreshAt = Date.now();
      mutate(undefined, { onError: () => { lastRefreshAt = 0; } });
    };
    extend();
    window.addEventListener("focus", extend);
    document.addEventListener("visibilitychange", extend);
    return () => {
      window.removeEventListener("focus", extend);
      document.removeEventListener("visibilitychange", extend);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
  return refresh;
}

/* ---------- date helpers on YYYY-MM-DD strings ---------- */
export function addDays(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export const WEEKDAYS_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
export const WEEKDAYS_LONG = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
export function formatDe(iso: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(iso.length === 10 ? iso + "T12:00:00Z" : iso).toLocaleDateString("de-CH", { timeZone: iso.length === 10 ? "UTC" : "Europe/Zurich", ...opts });
}
