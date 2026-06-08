import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { 
  useGetDailySummary, 
  useListEntries, 
  getGetDailySummaryQueryKey,
  useDeleteEntry,
  getListEntriesQueryKey
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Dumbbell, Droplet, Wheat, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Dashboard() {
  const today = format(new Date(), 'yyyy-MM-dd');
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
        }
      }
    );
  };

  const progress = summary ? Math.min(summary.totalCalories / summary.calorieGoal, 1) : 0;
  
  const getMealEntries = (mealType: string) => {
    return entries?.filter(e => e.mealType === mealType) || [];
  };

  return (
    <Layout>
      <div className="p-4 space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Today</h1>
          <p className="text-muted-foreground">{format(new Date(), 'EEEE, MMMM d')}</p>
        </header>

        {/* Hero Progress Section */}
        <section className="flex flex-col items-center justify-center p-6 bg-card rounded-3xl border shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl -ml-10 -mb-10" />
          
          {isLoadingSummary ? (
            <Skeleton className="w-40 h-40 rounded-full" />
          ) : (
            <ProgressCircle progress={progress} size={180} strokeWidth={14}>
              <div className="flex flex-col items-center text-center">
                <span className="text-4xl font-black tabular-nums tracking-tighter text-foreground">
                  {summary?.totalCalories || 0}
                </span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  / {summary?.calorieGoal || 2000} kcal
                </span>
              </div>
            </ProgressCircle>
          )}
        </section>

        {/* Macros */}
        <section className="grid grid-cols-3 gap-3">
          <MacroCard 
            title="Protein" 
            value={summary?.totalProtein || 0} 
            unit="g"
            icon={<Dumbbell className="w-4 h-4 text-chart-2" />} 
            color="hsl(var(--chart-2))"
            isLoading={isLoadingSummary}
          />
          <MacroCard 
            title="Carbs" 
            value={summary?.totalCarbs || 0} 
            unit="g"
            icon={<Wheat className="w-4 h-4 text-chart-3" />} 
            color="hsl(var(--chart-3))"
            isLoading={isLoadingSummary}
          />
          <MacroCard 
            title="Fat" 
            value={summary?.totalFat || 0} 
            unit="g"
            icon={<Droplet className="w-4 h-4 text-chart-4" />} 
            color="hsl(var(--chart-4))"
            isLoading={isLoadingSummary}
          />
        </section>

        {/* Meals Log */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Food Log</h2>
            <Link href="/add" className="text-sm font-semibold text-primary hover:underline">
              Add Item
            </Link>
          </div>

          {isLoadingEntries ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          ) : entries?.length === 0 ? (
            <div className="text-center p-8 bg-muted/50 rounded-2xl border border-dashed">
              <div className="bg-background w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                <Flame className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground">No food logged yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Start tracking to see your macros.</p>
              <Link href="/add" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                Log Food
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => {
                const mealEntries = getMealEntries(mealType);
                if (mealEntries.length === 0) return null;
                
                return (
                  <div key={mealType} className="space-y-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">
                      {mealType}
                    </h3>
                    <div className="space-y-2">
                      <AnimatePresence>
                        {mealEntries.map((entry, i) => (
                          <motion.div 
                            key={entry.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: i * 0.05 }}
                            className="group flex items-center justify-between p-3 bg-card border rounded-xl shadow-sm hover:shadow-md transition-all"
                          >
                            <div className="flex-1 min-w-0 pr-4">
                              <h4 className="font-semibold text-sm truncate">{entry.name}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {entry.servingSize ? `${entry.servingSize} • ` : ''}
                                {entry.protein}g P • {entry.carbs}g C • {entry.fat}g F
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-primary tabular-nums">
                                {entry.calories}
                              </span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDelete(entry.id)}
                                disabled={deleteEntry.isPending}
                                data-testid={`button-delete-${entry.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

function MacroCard({ title, value, unit, icon, color, isLoading }: { title: string, value: number, unit: string, icon: React.ReactNode, color: string, isLoading: boolean }) {
  return (
    <Card className="overflow-hidden border-none shadow-sm bg-muted/30">
      <CardContent className="p-3 relative">
        <div className="absolute -right-2 -top-2 opacity-10">{icon}</div>
        <div className="flex items-center gap-1.5 mb-1.5 text-muted-foreground">
          {icon}
          <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
        </div>
        {isLoading ? (
          <Skeleton className="h-6 w-12" />
        ) : (
          <div className="flex items-baseline gap-0.5">
            <span className="text-xl font-bold tracking-tight">{value}</span>
            <span className="text-xs font-medium text-muted-foreground">{unit}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
