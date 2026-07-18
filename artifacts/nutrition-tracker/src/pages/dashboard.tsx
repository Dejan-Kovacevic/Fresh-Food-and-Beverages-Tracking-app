import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  useGetDailySummary,
  useListEntries,
  getGetDailySummaryQueryKey,
  useDeleteEntry,
  getListEntriesQueryKey,
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar, Coffee, Sun, Apple, Moon, Plus, MoreHorizontal, Trash2, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MACRO_GOALS = { protein: 150, carbs: 250, fat: 65 };

const MEAL_META: Record<string, { icon: React.ReactNode; label: string }> = {
  breakfast: { icon: <Coffee className="w-4 h-4 text-amber-500" />, label: "Frühstück" },
  lunch:     { icon: <Sun    className="w-4 h-4 text-orange-500" />, label: "Mittagessen" },
  snack:     { icon: <Apple  className="w-4 h-4 text-green-500"  />, label: "Snack" },
  dinner:    { icon: <Moon   className="w-4 h-4 text-indigo-400" />, label: "Abendessen" },
};

const MEAL_ORDER = ["breakfast", "lunch", "snack", "dinner"] as const;

export function Dashboard() {
  const today = format(new Date(), "yyyy-MM-dd");
  const queryClient = useQueryClient();

  const { data: summary, isLoading: isLoadingSummary } = useGetDailySummary(
    { date: today },
    { query: { enabled: true, queryKey: getGetDailySummaryQueryKey({ date: today }) } }
  );

  const { data: entries, isLoading: isLoadingEntries } = useListEntries(
    { date: today },
    { query: { enabled: true, queryKey: getListEntriesQueryKey({ date: today }) } }
  );

  const deleteEntry = useDeleteEntry();

  const handleDelete = (id: number) => {
    deleteEntry.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey({ date: today }) });
          queryClient.invalidateQueries({ queryKey: getGetDailySummaryQueryKey({ date: today }) });
        },
      }
    );
  };

  const calorieGoal = summary?.calorieGoal ?? 2000;
  const consumed    = summary?.totalCalories ?? 0;
  const remaining   = Math.max(0, calorieGoal - consumed);
  const ringProgress = Math.min(consumed / calorieGoal, 1);
  const circumference = 2 * Math.PI * 120;

  const macros = [
    {
      name: "Protein",
      current: summary?.totalProtein ?? 0,
      goal: MACRO_GOALS.protein,
      strokeColor: "#60a5fa",
      trackColor: "#dbeafe",
    },
    {
      name: "Kohlenhydrate",
      current: summary?.totalCarbs ?? 0,
      goal: MACRO_GOALS.carbs,
      strokeColor: "#34d399",
      trackColor: "#d1fae5",
    },
    {
      name: "Fett",
      current: summary?.totalFat ?? 0,
      goal: MACRO_GOALS.fat,
      strokeColor: "#fb923c",
      trackColor: "#ffedd5",
    },
  ];

  const getMealEntries = (mealType: string) =>
    entries?.filter((e) => e.mealType === mealType) ?? [];

  return (
    <Layout hideHeader>
      <div className="flex flex-col min-h-full bg-slate-50">

        {/* ── Full-Bleed Hero ── */}
        <div className="relative bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-800 pt-12 pb-24 px-6 text-white rounded-b-[40px] overflow-hidden">
          {/* subtle dot-grid texture */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />

          {/* Header row */}
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
              <span className="text-sm font-bold tracking-tight">NutriAI</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
              <Calendar className="w-4 h-4 text-indigo-300" />
              <span className="text-sm font-medium">{format(new Date(), "d. MMMM", { locale: de })}</span>
            </div>
            <Link href="/history">
              <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                <MoreHorizontal className="w-5 h-5 text-white" />
              </button>
            </Link>
          </div>

          {/* Calorie Ring */}
          <div className="flex justify-center items-center relative z-10 mb-4">
            {isLoadingSummary ? (
              <Skeleton className="w-64 h-64 rounded-full bg-white/10" />
            ) : (
              <div className="relative w-64 h-64 flex justify-center items-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 260 260">
                  <circle
                    cx="130" cy="130" r="120"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="16"
                    fill="none"
                  />
                  <motion.circle
                    cx="130" cy="130" r="120"
                    stroke="#818cf8"
                    strokeWidth="16"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference - ringProgress * circumference }}
                    transition={{ duration: 1.1, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-indigo-300 font-medium tracking-widest uppercase text-[10px] mb-1">
                    Übrig
                  </span>
                  <span className="text-6xl font-black tracking-tighter text-white tabular-nums leading-none">
                    {remaining}
                  </span>
                  <span className="text-indigo-200 text-sm mt-1">kcal</span>
                </div>
              </div>
            )}
          </div>

          {/* Sub-text */}
          <p className="text-center text-indigo-200 text-sm font-medium relative z-10">
            {isLoadingSummary
              ? "Lädt…"
              : `${consumed} kcal gegessen · Ziel ${calorieGoal}`}
          </p>
        </div>

        {/* ── Floating Macro Cards ── */}
        <div className="px-5 -mt-[68px] relative z-10 flex gap-3">
          {macros.map((macro, idx) => {
            const pct = macro.goal > 0 ? Math.min(macro.current / macro.goal, 1) : 0;
            const mCirc = 2 * Math.PI * 18;
            return (
              <div
                key={macro.name}
                className="flex-1 bg-white rounded-2xl p-4 shadow-xl border border-slate-100 flex flex-col items-center"
              >
                {isLoadingSummary ? (
                  <Skeleton className="w-12 h-12 rounded-full mb-2" />
                ) : (
                  <div className="relative w-12 h-12 mb-2 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
                      <circle
                        cx="22" cy="22" r="18"
                        stroke={macro.trackColor}
                        strokeWidth="4"
                        fill="none"
                      />
                      <motion.circle
                        cx="22" cy="22" r="18"
                        stroke={macro.strokeColor}
                        strokeWidth="4"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={mCirc}
                        initial={{ strokeDashoffset: mCirc }}
                        animate={{ strokeDashoffset: mCirc - pct * mCirc }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.15 + idx * 0.1 }}
                      />
                    </svg>
                    <span className="absolute text-[10px] font-bold text-slate-700">
                      {Math.round(pct * 100)}%
                    </span>
                  </div>
                )}
                <div className="text-center">
                  {isLoadingSummary ? (
                    <Skeleton className="h-4 w-10 mx-auto mb-1" />
                  ) : (
                    <div className="text-sm font-bold text-slate-900">{macro.current}g</div>
                  )}
                  <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                    {macro.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Food Log ── */}
        <div className="flex-1 px-5 pt-8 pb-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-slate-900">Heutige Einträge</h2>
            <Link href="/history" className="text-indigo-600 font-semibold text-sm">
              Verlauf
            </Link>
          </div>

          {isLoadingEntries ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-36 w-full rounded-2xl" />
              ))}
            </div>
          ) : entries?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
                <Flame className="w-7 h-7 text-slate-300" />
              </div>
              <h3 className="font-semibold text-slate-700">Noch nichts geloggt</h3>
              <p className="text-sm text-slate-400 mb-5 mt-1">
                Beginne zu tracken, um deine Makros zu sehen.
              </p>
              <Link href="/add">
                <button className="h-10 bg-indigo-600 text-white rounded-full px-7 text-sm font-semibold shadow-md shadow-indigo-600/25 hover:bg-indigo-700 transition-colors">
                  Essen loggen
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {MEAL_ORDER.map((mealType) => {
                const mealEntries = getMealEntries(mealType);
                if (mealEntries.length === 0) return null;

                const mealTotal = mealEntries.reduce((s, e) => s + e.calories, 0);
                const meta = MEAL_META[mealType];

                return (
                  <div
                    key={mealType}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100/80"
                  >
                    {/* Meal header */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                          {meta.icon}
                        </div>
                        <h3 className="font-semibold text-slate-900">{meta.label}</h3>
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        {mealTotal}{" "}
                        <span className="font-normal text-slate-400">kcal</span>
                      </span>
                    </div>

                    {/* Food items */}
                    <AnimatePresence>
                      {mealEntries.map((entry, i) => (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: i * 0.04 }}
                          className="group flex justify-between items-start py-3 border-t border-slate-50 first:border-0"
                        >
                          <div className="flex-1 min-w-0 pr-3">
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {entry.name}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {entry.servingSize ? `${entry.servingSize} · ` : ""}
                              {entry.protein}g P · {entry.carbs}g K · {entry.fat}g F
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-semibold text-slate-700 tabular-nums">
                              {entry.calories}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-300 hover:text-red-400 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDelete(entry.id)}
                              disabled={deleteEntry.isPending}
                              data-testid={`button-delete-${entry.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Add to meal */}
                    <Link href={`/add?meal=${mealType}`}>
                      <button className="w-full mt-4 py-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-100 rounded-xl transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                        Zum {meta.label} hinzufügen
                      </button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
