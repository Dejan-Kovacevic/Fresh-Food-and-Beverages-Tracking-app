import { Link } from "wouter";
import { motion } from "framer-motion";
import { Dumbbell, ChevronRight, RotateCw, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useFitness, useFitnessAutoRefresh, addDays, WEEKDAYS_SHORT } from "@/hooks/use-fitness";

export function GymProgressCard() {
  const { data, isLoading, isError, refetch, isFetching } = useFitness();
  useFitnessAutoRefresh(data?.reminders.enabled);

  if (isLoading) return <Skeleton className="h-[92px] w-full rounded-2xl" data-testid="skeleton-gym" />;
  if (isError || !data)
    return (
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-rose-100 shadow-sm">
        <p className="text-sm text-slate-600">Gym-Fortschritt konnte nicht geladen werden.</p>
        <button onClick={() => refetch()} data-testid="button-retry-gym"
          className="flex items-center gap-1 text-xs font-semibold text-teal-700 px-3 py-1.5 rounded-full bg-teal-50 active:scale-95 transition-transform">
          <RotateCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} /> Erneut
        </button>
      </div>
    );

  const visitDates = new Set(data.visits.map((v) => v.date));
  const done = data.count >= data.goal;
  return (
    <Link href="/fitness" data-testid="link-gym-card"
      className="group flex items-center gap-4 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm active:scale-[0.99] transition-transform">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${done ? "bg-teal-600 text-white" : "bg-teal-50 text-teal-700"}`}>
        {done ? <Check className="w-6 h-6" /> : <Dumbbell className="w-6 h-6" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-black tabular-nums text-slate-900" data-testid="text-gym-count">{data.count}/{data.goal}</span>
          <span className="text-xs font-medium text-slate-500 truncate">
            {done ? "Wochenziel geschafft" : data.count === 1 ? "Noch ein Besuch diese Woche" : "Gym-Besuche diese Woche"}
          </span>
        </div>
        <div className="flex gap-1.5 mt-2">
          {WEEKDAYS_SHORT.map((d, i) => {
            const date = addDays(data.weekStart, i);
            const hit = visitDates.has(date);
            return (
              <div key={d} className="flex-1 flex flex-col items-center gap-1">
                <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: i * 0.04 }}
                  className={`h-1.5 w-full rounded-full origin-left ${hit ? "bg-teal-500" : date === data.today ? "bg-amber-300" : "bg-slate-100"}`} />
                <span className={`text-[9px] font-semibold ${date === data.today ? "text-slate-800" : "text-slate-400"}`}>{d}</span>
              </div>
            );
          })}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}
