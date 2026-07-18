import { useGetHistory, getGetHistoryQueryKey, useGetWeeklySummary, getGetWeeklySummaryQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarDays, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export function History() {
  const { data: history, isLoading: isLoadingHistory } = useGetHistory(
    { limit: 30 },
    { query: { enabled: true, queryKey: getGetHistoryQueryKey({ limit: 30 }) } }
  );

  const { data: weekly, isLoading: isLoadingWeekly } = useGetWeeklySummary(
    { query: { enabled: true, queryKey: getGetWeeklySummaryQueryKey() } }
  );

  return (
    <Layout>
      <div className="p-4 space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Verlauf</h1>
          <p className="text-muted-foreground">Deine vergangenen Tage & Trends</p>
        </header>

        {/* Weekly Chart */}
        <section className="bg-card border rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="font-bold">Diese Woche</h2>
          </div>
          
          <div className="h-48 w-full">
            {isLoadingWeekly ? (
              <Skeleton className="w-full h-full rounded-xl" />
            ) : weekly && weekly.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border text-popover-foreground shadow-sm rounded-lg p-2 text-xs font-semibold">
                            {payload[0].value} kcal
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="calories" radius={[4, 4, 0, 0]}>
                    {weekly.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.calories > 2000 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Noch keine Daten diese Woche
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-bold text-lg">Vergangene Tage</h2>
          {isLoadingHistory ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          ) : history?.length === 0 ? (
            <div className="text-center p-8 bg-muted/30 rounded-3xl border border-dashed">
              <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold">Noch kein Verlauf</h3>
              <p className="text-sm text-muted-foreground">Logge dein Essen, um deinen Verlauf aufzubauen.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history?.map((day, i) => {
                const progress = Math.min(day.totalCalories / day.calorieGoal, 1);
                const isOver = day.totalCalories > day.calorieGoal;
                
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={day.date}
                    className="bg-card border rounded-2xl p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-foreground">
                        {format(parseISO(day.date), 'EEEE, d. MMM', { locale: de })}
                      </h3>
                      <div className="flex items-center gap-1 text-sm font-semibold">
                        <span className={isOver ? "text-destructive" : "text-primary"}>
                          {day.totalCalories}
                        </span>
                        <span className="text-muted-foreground">/ {day.calorieGoal}</span>
                      </div>
                    </div>
                    
                    {/* Progress bar line */}
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-4">
                      <div 
                        className={`h-full rounded-full ${isOver ? 'bg-destructive' : 'bg-primary'}`}
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Protein</div>
                        <div className="font-semibold text-sm tabular-nums text-chart-2">{day.totalProtein}g</div>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Kohlenh.</div>
                        <div className="font-semibold text-sm tabular-nums text-chart-3">{day.totalCarbs}g</div>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Fett</div>
                        <div className="font-semibold text-sm tabular-nums text-chart-4">{day.totalFat}g</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
