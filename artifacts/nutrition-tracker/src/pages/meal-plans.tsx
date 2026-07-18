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
  Coffee, Sun, Apple, Moon, Plus, Loader2, Flame, Dumbbell, Droplet, Wheat,
  CalendarPlus, RefreshCw, PartyPopper,
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

interface PlanSlot {
  options: PlanMeal[];
}

interface Plan {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  gradient: string;
  slots: PlanSlot[];
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
    shortName: "Definition",
    tagline: "High protein, calorie deficit — preserve muscle while losing fat",
    gradient: "from-emerald-950 via-slate-900 to-slate-800",
    slots: [
      {
        options: [
          { mealType: "breakfast", title: "Protein Oatmeal with Berries", foods: "250g low-fat quark, 40g oats, 100g blueberries, cinnamon", servingSize: "1 bowl", calories: 380, protein: 38, carbs: 45, fat: 5 },
          { mealType: "breakfast", title: "Egg White Omelette with Toast", foods: "4 egg whites + 1 egg, 1 slice whole grain toast, tomatoes, spinach", servingSize: "1 plate", calories: 360, protein: 35, carbs: 35, fat: 8 },
          { mealType: "breakfast", title: "Skyr Bowl with Banana & Chia", foods: "250g skyr, ½ banana, 10g chia seeds, dash of honey", servingSize: "1 bowl", calories: 360, protein: 30, carbs: 40, fat: 8 },
        ],
      },
      {
        options: [
          { mealType: "lunch", title: "Grilled Chicken with Rice & Broccoli", foods: "150g chicken breast, 60g basmati rice (dry), 200g broccoli", servingSize: "1 plate", calories: 450, protein: 48, carbs: 48, fat: 6 },
          { mealType: "lunch", title: "Turkey Steak with Potatoes & Beans", foods: "150g turkey breast, 300g potatoes, 150g green beans", servingSize: "1 plate", calories: 440, protein: 45, carbs: 50, fat: 6 },
          { mealType: "lunch", title: "Tuna Salad with Chickpeas", foods: "1 can tuna in water, 120g chickpeas, mixed greens, 1 tsp olive oil", servingSize: "1 large bowl", calories: 430, protein: 42, carbs: 35, fat: 12 },
        ],
      },
      {
        options: [
          { mealType: "snack", title: "Skyr with Almonds", foods: "150g skyr, 10g almonds", servingSize: "1 cup", calories: 200, protein: 22, carbs: 10, fat: 8 },
          { mealType: "snack", title: "Protein Shake with Apple", foods: "30g whey protein in water, 1 apple", servingSize: "1 shake + fruit", calories: 210, protein: 25, carbs: 25, fat: 2 },
          { mealType: "snack", title: "Cottage Cheese with Cucumber", foods: "200g cottage cheese, ½ cucumber, pepper", servingSize: "1 bowl", calories: 180, protein: 24, carbs: 8, fat: 5 },
        ],
      },
      {
        options: [
          { mealType: "dinner", title: "Baked Salmon with Quinoa & Asparagus", foods: "150g salmon fillet, 50g quinoa (dry), 200g green asparagus", servingSize: "1 plate", calories: 520, protein: 40, carbs: 40, fat: 20 },
          { mealType: "dinner", title: "Lean Beef with Zucchini & Rice", foods: "150g lean beef strips, 50g rice (dry), zucchini, soy sauce", servingSize: "1 plate", calories: 500, protein: 45, carbs: 45, fat: 15 },
          { mealType: "dinner", title: "Shrimp Stir-Fry with Basmati Rice", foods: "200g shrimp, 60g basmati rice (dry), wok vegetables, 1 tsp oil", servingSize: "1 plate", calories: 480, protein: 42, carbs: 55, fat: 9 },
        ],
      },
      {
        options: [
          { mealType: "snack", title: "Cottage Cheese Before Bed", foods: "200g cottage cheese (slow-release casein protein)", servingSize: "1 bowl", calories: 180, protein: 28, carbs: 7, fat: 4 },
          { mealType: "snack", title: "Casein Shake", foods: "30g casein protein in water", servingSize: "1 shake", calories: 120, protein: 25, carbs: 3, fat: 1 },
          { mealType: "snack", title: "Harzer Cheese with Pickles", foods: "100g Harzer cheese, gherkins", servingSize: "1 portion", calories: 130, protein: 27, carbs: 1, fat: 1 },
        ],
      },
    ],
  },
  {
    id: "bulk",
    name: "Muscle Building",
    shortName: "Muscle Gain",
    tagline: "Calorie surplus with quality carbs & protein for maximum growth",
    gradient: "from-indigo-950 via-slate-900 to-slate-800",
    slots: [
      {
        options: [
          { mealType: "breakfast", title: "Scrambled Eggs on Whole Grain Toast", foods: "3 eggs, 2 slices whole grain toast, ½ avocado", servingSize: "1 plate", calories: 550, protein: 32, carbs: 45, fat: 26 },
          { mealType: "breakfast", title: "Protein Pancakes with Banana", foods: "50g oats, 30g whey, 2 eggs, 1 banana, maple syrup", servingSize: "3 pancakes", calories: 560, protein: 38, carbs: 70, fat: 12 },
          { mealType: "breakfast", title: "Breakfast Burrito", foods: "1 large tortilla, 2 eggs, cheese, black beans, salsa", servingSize: "1 burrito", calories: 570, protein: 30, carbs: 55, fat: 24 },
        ],
      },
      {
        options: [
          { mealType: "snack", title: "Mass Gainer Shake", foods: "1 banana, 50g oats, 30g whey protein, 15g peanut butter, 300ml milk", servingSize: "1 shake", calories: 520, protein: 35, carbs: 60, fat: 15 },
          { mealType: "snack", title: "PB&J Sandwich with Milk", foods: "2 slices bread, 20g peanut butter, jam, 300ml milk", servingSize: "1 sandwich + glass", calories: 540, protein: 22, carbs: 65, fat: 20 },
          { mealType: "snack", title: "Trail Mix with Greek Yogurt", foods: "40g nut & raisin mix, 200g Greek yogurt", servingSize: "1 bowl", calories: 500, protein: 22, carbs: 45, fat: 25 },
        ],
      },
      {
        options: [
          { mealType: "lunch", title: "Beef Strips with Pasta", foods: "150g lean beef, 100g pasta (dry), tomato sauce, parmesan", servingSize: "1 plate", calories: 650, protein: 45, carbs: 75, fat: 18 },
          { mealType: "lunch", title: "Chicken Burrito Bowl", foods: "150g chicken, 80g rice (dry), black beans, corn, salsa", servingSize: "1 bowl", calories: 660, protein: 48, carbs: 80, fat: 14 },
          { mealType: "lunch", title: "Salmon with Sweet Potato Mash", foods: "180g salmon, 300g sweet potato, 10g butter, greens", servingSize: "1 plate", calories: 640, protein: 40, carbs: 60, fat: 24 },
        ],
      },
      {
        options: [
          { mealType: "snack", title: "Greek Yogurt with Granola & Honey", foods: "200g Greek yogurt, 40g granola, 1 tsp honey", servingSize: "1 bowl", calories: 380, protein: 20, carbs: 50, fat: 10 },
          { mealType: "snack", title: "Rice Cakes with Peanut Butter", foods: "4 rice cakes, 20g peanut butter, 1 banana", servingSize: "1 portion", calories: 370, protein: 12, carbs: 50, fat: 14 },
          { mealType: "snack", title: "Cheese Sandwich", foods: "2 slices whole grain bread, 2 slices gouda, butter", servingSize: "1 sandwich", calories: 390, protein: 18, carbs: 40, fat: 16 },
        ],
      },
      {
        options: [
          { mealType: "dinner", title: "Chicken Thighs with Rice & Vegetables", foods: "180g chicken thigh, 80g jasmine rice (dry), mixed vegetables", servingSize: "1 plate", calories: 620, protein: 45, carbs: 70, fat: 16 },
          { mealType: "dinner", title: "Beef Chili with Rice", foods: "150g ground beef, kidney beans, 70g rice (dry), tomatoes", servingSize: "1 bowl", calories: 630, protein: 42, carbs: 65, fat: 20 },
          { mealType: "dinner", title: "Turkey Bolognese with Pasta", foods: "150g ground turkey, 100g whole grain pasta (dry), tomato sauce", servingSize: "1 plate", calories: 610, protein: 48, carbs: 75, fat: 12 },
        ],
      },
    ],
  },
  {
    id: "cheat",
    name: "Cheat Day",
    shortName: "Cheat Day",
    tagline: "Enjoy guilt-free once a week — it helps you stay on track long-term",
    gradient: "from-rose-950 via-slate-900 to-slate-800",
    slots: [
      {
        options: [
          { mealType: "breakfast", title: "Fluffy Pancakes with Maple Syrup", foods: "3 pancakes, maple syrup, 2 strips bacon, butter", servingSize: "1 stack", calories: 650, protein: 18, carbs: 85, fat: 26 },
          { mealType: "breakfast", title: "French Toast with Berries & Cream", foods: "3 slices french toast, berries, whipped cream, powdered sugar", servingSize: "1 plate", calories: 620, protein: 16, carbs: 75, fat: 28 },
        ],
      },
      {
        options: [
          { mealType: "lunch", title: "Cheeseburger with Fries", foods: "1 cheeseburger, medium fries, ketchup & mayo", servingSize: "1 meal", calories: 850, protein: 35, carbs: 80, fat: 42 },
          { mealType: "lunch", title: "Pizza Margherita", foods: "1 whole pizza with mozzarella, tomato & basil", servingSize: "1 pizza", calories: 900, protein: 35, carbs: 110, fat: 32 },
          { mealType: "lunch", title: "Döner Kebab", foods: "1 döner with meat, salad, sauce in flatbread", servingSize: "1 döner", calories: 750, protein: 35, carbs: 65, fat: 38 },
        ],
      },
      {
        options: [
          { mealType: "snack", title: "Ice Cream Sundae", foods: "3 scoops ice cream, chocolate sauce, whipped cream", servingSize: "1 sundae", calories: 420, protein: 8, carbs: 50, fat: 20 },
          { mealType: "snack", title: "Chocolate Croissant", foods: "1 large pain au chocolat", servingSize: "1 piece", calories: 380, protein: 6, carbs: 42, fat: 20 },
          { mealType: "snack", title: "Vanilla Milkshake", foods: "400ml milkshake with vanilla ice cream", servingSize: "1 shake", calories: 450, protein: 10, carbs: 55, fat: 20 },
        ],
      },
      {
        options: [
          { mealType: "dinner", title: "Creamy Pasta Carbonara", foods: "120g pasta (dry), bacon, cream, parmesan, egg", servingSize: "1 plate", calories: 800, protein: 28, carbs: 85, fat: 38 },
          { mealType: "dinner", title: "Loaded Nachos with Guacamole", foods: "Tortilla chips, cheese, ground beef, guacamole, sour cream", servingSize: "1 platter", calories: 780, protein: 22, carbs: 70, fat: 45 },
          { mealType: "dinner", title: "Schnitzel with Fries", foods: "1 pork schnitzel, fries, lemon & remoulade", servingSize: "1 plate", calories: 820, protein: 40, carbs: 70, fat: 40 },
        ],
      },
      {
        options: [
          { mealType: "snack", title: "Chocolate & Chips", foods: "50g chocolate, small bag of chips", servingSize: "1 portion", calories: 350, protein: 4, carbs: 40, fat: 19 },
          { mealType: "snack", title: "Cookies with Milk", foods: "3 chocolate chip cookies, 250ml milk", servingSize: "1 portion", calories: 340, protein: 8, carbs: 45, fat: 14 },
        ],
      },
    ],
  },
];

export function MealPlans() {
  const [activePlanId, setActivePlanId] = useState<string>("cut");
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [loggingKey, setLoggingKey] = useState<string | null>(null);
  const [loggingDay, setLoggingDay] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createEntry = useCreateEntry();
  const today = format(new Date(), "yyyy-MM-dd");

  const plan = PLANS.find((p) => p.id === activePlanId)!;

  const getSelectedMeal = (slotIdx: number): PlanMeal => {
    const slot = plan.slots[slotIdx];
    const sel = selections[`${plan.id}-${slotIdx}`] ?? 0;
    return slot.options[sel % slot.options.length];
  };

  const swapMeal = (slotIdx: number) => {
    const key = `${plan.id}-${slotIdx}`;
    const count = plan.slots[slotIdx].options.length;
    setSelections((prev) => ({ ...prev, [key]: ((prev[key] ?? 0) + 1) % count }));
  };

  const selectedMeals = plan.slots.map((_, i) => getSelectedMeal(i));
  const totals = selectedMeals.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey({ date: today }) });
    queryClient.invalidateQueries({ queryKey: getGetDailySummaryQueryKey({ date: today }) });
  };

  const entryData = (meal: PlanMeal) => ({
    name: meal.title,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    servingSize: meal.servingSize,
    mealType: meal.mealType,
  });

  const logMeal = async (meal: PlanMeal, key: string) => {
    setLoggingKey(key);
    try {
      await createEntry.mutateAsync({ data: entryData(meal) });
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
      for (const meal of selectedMeals) {
        await createEntry.mutateAsync({ data: entryData(meal) });
      }
      invalidate();
      toast({ title: "Full day logged!", description: `All ${selectedMeals.length} meals from "${plan.name}" added to today.` });
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
            <p className="text-sm text-slate-500">Optimized daily plans — swap alternatives & log with one tap</p>
          </header>

          {/* Plan toggle */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/60 rounded-xl">
            {PLANS.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePlanId(p.id)}
                data-testid={`tab-plan-${p.id}`}
                aria-pressed={activePlanId === p.id}
                className={`py-2.5 px-1 rounded-lg text-xs font-semibold transition-all ${
                  activePlanId === p.id
                    ? "bg-white shadow text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {p.shortName}
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
              {/* Totals card (live — reflects current selection) */}
              <div className={`relative bg-gradient-to-b ${plan.gradient} rounded-3xl p-6 text-white overflow-hidden`}>
                <div
                  className="absolute inset-0 opacity-[0.06] pointer-events-none"
                  style={{
                    backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                    backgroundSize: "22px 22px",
                  }}
                />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    {plan.id === "cheat" && <PartyPopper className="w-4 h-4 text-rose-300 shrink-0" />}
                    <p className="text-sm text-white/70">{plan.tagline}</p>
                  </div>
                  <div className="flex items-end gap-1.5 mb-5">
                    <Flame className="w-5 h-5 text-orange-400 mb-1.5" />
                    <span className="text-4xl font-black tracking-tighter tabular-nums leading-none">
                      {totals.kcal}
                    </span>
                    <span className="text-white/60 text-sm mb-0.5">kcal / day</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Protein", value: totals.protein, icon: <Dumbbell className="w-3.5 h-3.5 text-blue-300" /> },
                      { label: "Carbs",   value: totals.carbs,   icon: <Wheat    className="w-3.5 h-3.5 text-emerald-300" /> },
                      { label: "Fat",     value: totals.fat,     icon: <Droplet  className="w-3.5 h-3.5 text-orange-300" /> },
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

              {/* Meal slots */}
              <div className="space-y-3">
                {plan.slots.map((slot, slotIdx) => {
                  const meal = getSelectedMeal(slotIdx);
                  const key = `${plan.id}-${slotIdx}`;
                  const selIdx = (selections[key] ?? 0) % slot.options.length;
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

                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`${key}-${selIdx}`}
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          transition={{ duration: 0.15 }}
                        >
                          <h3 className="font-semibold text-slate-900">{meal.title}</h3>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{meal.foods}</p>
                          <p className="text-[11px] text-slate-400 mt-2">
                            {meal.protein}g P · {meal.carbs}g C · {meal.fat}g F
                          </p>
                        </motion.div>
                      </AnimatePresence>

                      <div className="flex gap-2 mt-4">
                        {slot.options.length > 1 && (
                          <button
                            onClick={() => swapMeal(slotIdx)}
                            disabled={loggingKey !== null || loggingDay}
                            data-testid={`button-swap-${key}`}
                            className="flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 active:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Swap ({selIdx + 1}/{slot.options.length})
                          </button>
                        )}
                        <button
                          onClick={() => logMeal(meal, key)}
                          disabled={loggingKey !== null || loggingDay}
                          data-testid={`button-log-meal-${key}`}
                          className="flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-100 rounded-xl transition-colors disabled:opacity-50"
                        >
                          {loggingKey === key ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Logging…</>
                          ) : (
                            <><Plus className="w-3.5 h-3.5" /> Log this meal</>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-400 text-center px-4 leading-relaxed">
                {plan.id === "cheat"
                  ? "A cheat day once a week can help you stay consistent — get back to your plan tomorrow."
                  : "Values are estimates for an average adult. Adjust portions to your body weight and activity level (protein: ~2g per kg body weight)."}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}
