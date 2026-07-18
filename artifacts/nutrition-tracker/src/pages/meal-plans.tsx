import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  useCreateEntry,
  getListEntriesQueryKey,
  getGetDailySummaryQueryKey,
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Coffee, Sun, Apple, Moon, Plus, Loader2, Flame, Dumbbell, Droplet, Wheat, CalendarPlus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

interface PlanMeal {
  mealType: MealType;
  title: string;
  foods: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Plan {
  id: string;
  name: string;
  tagline: string;
  gradient: string;
  targetKcal: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  meals: PlanMeal[];
}

const MEAL_META: Record<MealType, { icon: React.ReactNode; label: string }> = {
  breakfast: { icon: <Coffee className="w-4 h-4 text-amber-500" />, label: "Breakfast" },
  lunch:     { icon: <Sun    className="w-4 h-4 text-orange-500" />, label: "Lunch" },
  snack:     { icon: <Apple  className="w-4 h-4 text-green-500"  />, label: "Snack" },
  dinner:    { icon: <Moon   className="w-4 h-4 text-indigo-400" />, label: "Dinner" },
};

const PLANS: Plan[] = [
  {
    id: "cut",
    name: "Definition Phase",
    tagline: "High protein, calorie deficit — preserve muscle while losing fat",
    gradient: "from-emerald-950 via-slate-900 to-slate-800",
    targetKcal: 1730,
    targetProtein: 176,
    targetCarbs: 150,
    targetFat: 43,
    meals: [
      {
        mealType: "breakfast",
        title: "Protein Oatmeal with Berries",
        foods: "250g low-fat quark, 40g oats, 100g blueberries, cinnamon",
        servingSize: "1 bowl",
        calories: 380, protein: 38, carbs: 45, fat: 5,
      },
      {
        mealType: "lunch",
        title: "Grilled Chicken with Rice & Broccoli",
        foods: "150g chicken breast, 60g basmati rice (dry), 200g broccoli",
        servingSize: "1 plate",
        calories: 450, protein: 48, carbs: 48, fat: 6,
      },
      {
        mealType: "snack",
        title: "Skyr with Almonds",
        foods: "150g skyr, 10g almonds",
        servingSize: "1 cup",
        calories: 200, protein: 22, carbs: 10, fat: 8,
      },
      {
        mealType: "dinner",
        title: "Baked Salmon with Quinoa & Asparagus",
        foods: "150g salmon fillet, 50g quinoa (dry), 200g green asparagus",
        servingSize: "1 plate",
        calories: 520, protein: 40, carbs: 40, fat: 20,
      },
      {
        mealType: "snack",
        title: "Cottage Cheese Before Bed",
        foods: "200g cottage cheese (slow-release casein protein)",
        servingSize: "1 bowl",
        calories: 180, protein: 28, carbs: 7, fat: 4,
      },
    ],
  },
  {
    id: "bulk",
    name: "Muscle Building",
    tagline: "Calorie surplus with quality carbs & protein for maximum growth",
    gradient: "from-indigo-950 via-slate-900 to-slate-800",
    targetKcal: 2720,
    targetProtein: 177,
    targetCarbs: 300,
    targetFat: 85,
    meals: [
      {
        mealType: "breakfast",
        title: "Scrambled Eggs on Whole Grain Toast",
        foods: "3 eggs, 2 slices whole grain toast, ½ avocado",
        servingSize: "1 plate",
        calories: 550, protein: 32, carbs: 45, fat: 26,
      },
      {
        mealType: "snack",
        title: "Mass Gainer Shake",
        foods: "1 banana, 50g oats, 30g whey protein, 15g peanut butter, 300ml milk",
        servingSize: "1 shake",
        calories: 520, protein: 35, carbs: 60, fat: 15,
      },
      {
        mealType: "lunch",
        title: "Beef Strips with Pasta",
        foods: "150g lean beef, 100g pasta (dry), tomato sauce, parmesan",
        servingSize: "1 plate",
        calories: 650, protein: 45, carbs: 75, fat: 18,
      },
      {
        mealType: "snack",
        title: "Greek Yogurt with Granola & Honey",
        foods: "200g Greek yogurt, 40g granola, 1 tsp honey",
        servingSize: "1 bowl",
        calories: 380, protein: 20, carbs: 50, fat: 10,
      },
      {
        mealType: "dinner",
        title: "Chicken Thighs with Rice & Vegetables",
        foods: "180g chicken thigh, 80g jasmine rice (dry), mixed vegetables",
        servingSize: "1 plate",
        calories: 620, protein: 45, carbs: 70, fat: 16,
      },
    ],
  },
];

export function MealPlans() {
  const [activePlanId, setActivePlanId] = useState<string>("cut");
  const [loggingKey, setLoggingKey] = useState<string | null>(null);
  const [loggingDay, setLoggingDay] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createEntry = useCreateEntry();
  const today = format(new Date(), "yyyy-MM-dd");

  const plan = PLANS.find((p) => p.id === activePlanId)!;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey({ date: today }) });
    queryClient.invalidateQueries({ queryKey: getGetDailySummaryQueryKey({ date: today }) });
  };

  const logMeal = async (meal: PlanMeal, key: string) => {
    setLoggingKey(key);
    try {
      await createEntry.mutateAsync({
        data: {
          name: meal.title,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          servingSize: meal.servingSize,
          mealType: meal.mealType,
        },
      });
      invalidate();
      toast({ title: "Meal logged!", description: `${meal.title} added to today's log.` });
    } catch {
      toast({ title: "Error", description: "Could not log the meal. Please try again.", variant: "destructive" });
    } finally {
      setLoggingKey(null);
    }
  };

  const logFullDay = async () => {
    setLoggingDay(true);
    try {
      for (const meal of plan.meals) {
        await createEntry.mutateAsync({
          data: {
            name: meal.title,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
            servingSize: meal.servingSize,
            mealType: meal.mealType,
          },
        });
      }
      invalidate();
      toast({ title: "Full day logged!", description: `All ${plan.meals.length} meals from "${plan.name}" added to today.` });
    } catch {
      invalidate();
      toast({ title: "Error", description: "Some meals could not be logged. Check today's log.", variant: "destructive" });
    } finally {
      setLoggingDay(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col min-h-full bg-slate-50">
        <div className="px-5 pt-5 pb-6 space-y-5">
          <header>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Meal Plans</h1>
            <p className="text-sm text-slate-500">Optimized daily plans — log meals with one tap</p>
          </header>

          {/* Plan toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/60 rounded-xl">
            {PLANS.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePlanId(p.id)}
                data-testid={`tab-plan-${p.id}`}
                className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activePlanId === p.id
                    ? "bg-white shadow text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Targets card */}
              <div className={`relative bg-gradient-to-b ${plan.gradient} rounded-3xl p-6 text-white overflow-hidden`}>
                <div
                  className="absolute inset-0 opacity-[0.06] pointer-events-none"
                  style={{
                    backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                    backgroundSize: "22px 22px",
                  }}
                />
                <div className="relative z-10">
                  <p className="text-sm text-white/70 mb-4">{plan.tagline}</p>
                  <div className="flex items-end gap-1.5 mb-5">
                    <Flame className="w-5 h-5 text-orange-400 mb-1.5" />
                    <span className="text-4xl font-black tracking-tighter tabular-nums leading-none">
                      {plan.targetKcal}
                    </span>
                    <span className="text-white/60 text-sm mb-0.5">kcal / day</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Protein", value: plan.targetProtein, icon: <Dumbbell className="w-3.5 h-3.5 text-blue-300" /> },
                      { label: "Carbs",   value: plan.targetCarbs,   icon: <Wheat    className="w-3.5 h-3.5 text-emerald-300" /> },
                      { label: "Fat",     value: plan.targetFat,     icon: <Droplet  className="w-3.5 h-3.5 text-orange-300" /> },
                    ].map((m) => (
                      <div key={m.label} className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {m.icon}
                          <span className="text-[10px] font-medium text-white/60 uppercase tracking-wider">{m.label}</span>
                        </div>
                        <span className="text-lg font-bold tabular-nums">{m.value}g</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Log full day */}
              <Button
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold shadow-md shadow-indigo-600/20"
                onClick={logFullDay}
                disabled={loggingDay || loggingKey !== null}
                data-testid="button-log-full-day"
              >
                {loggingDay ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Logging day…</>
                ) : (
                  <><CalendarPlus className="w-4 h-4 mr-2" /> Log entire day</>
                )}
              </Button>

              {/* Meals */}
              <div className="space-y-3">
                {plan.meals.map((meal, idx) => {
                  const key = `${plan.id}-${idx}`;
                  const meta = MEAL_META[meal.mealType];
                  return (
                    <div key={key} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100/80">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                            {meta.icon}
                          </div>
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            {meta.label}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-slate-900 tabular-nums">
                          {meal.calories} <span className="font-normal text-slate-400">kcal</span>
                        </span>
                      </div>

                      <h3 className="font-semibold text-slate-900">{meal.title}</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{meal.foods}</p>
                      <p className="text-[11px] text-slate-400 mt-2">
                        {meal.protein}g P · {meal.carbs}g C · {meal.fat}g F
                      </p>

                      <button
                        onClick={() => logMeal(meal, key)}
                        disabled={loggingKey !== null || loggingDay}
                        data-testid={`button-log-meal-${key}`}
                        className="w-full mt-4 py-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-100 rounded-xl transition-colors disabled:opacity-50"
                      >
                        {loggingKey === key ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Logging…</>
                        ) : (
                          <><Plus className="w-3.5 h-3.5" /> Log this meal</>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-400 text-center px-4 leading-relaxed">
                Values are estimates for an average adult. Adjust portions to your body weight
                and activity level (protein: ~2g per kg body weight).
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}
