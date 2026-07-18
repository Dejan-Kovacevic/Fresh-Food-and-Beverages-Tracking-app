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
  CalendarPlus, RefreshCw, PartyPopper, ChefHat, ChevronDown, Lightbulb,
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
  prep: string[];
  note: string;
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
          {
            mealType: "breakfast", title: "Protein Oatmeal with Berries", foods: "250g low-fat quark, 40g oats, 100g blueberries, cinnamon", servingSize: "1 bowl", calories: 380, protein: 38, carbs: 45, fat: 5,
            prep: ["Soak the oats in a splash of hot water or milk for 2–3 minutes.", "Stir the quark in until creamy — add a little milk if too thick.", "Top with blueberries and a dusting of cinnamon."],
            note: "Let cold quark sit 5 minutes at room temperature before stirring — it turns noticeably creamier.",
          },
          {
            mealType: "breakfast", title: "Egg White Omelette with Toast", foods: "4 egg whites + 1 egg, 1 slice whole grain toast, tomatoes, spinach", servingSize: "1 plate", calories: 360, protein: 35, carbs: 35, fat: 8,
            prep: ["Whisk egg whites with the whole egg, salt and pepper.", "Cook in a non-stick pan over medium-low heat until just set.", "Fold in spinach and tomatoes, serve on the toasted bread."],
            note: "Low heat is everything — egg whites turn rubbery the moment you rush them.",
          },
          {
            mealType: "breakfast", title: "Skyr Bowl with Banana & Chia", foods: "250g skyr, ½ banana, 10g chia seeds, dash of honey", servingSize: "1 bowl", calories: 360, protein: 30, carbs: 40, fat: 8,
            prep: ["Stir the skyr smooth and spread into a bowl.", "Slice the banana and arrange on top.", "Sprinkle chia seeds and finish with a drizzle of honey."],
            note: "Give the chia seeds 10 minutes to soften — they develop a pleasant pudding-like bite.",
          },
        ],
      },
      {
        options: [
          {
            mealType: "lunch", title: "Grilled Chicken with Rice & Broccoli", foods: "150g chicken breast, 60g basmati rice (dry), 200g broccoli", servingSize: "1 plate", calories: 450, protein: 48, carbs: 48, fat: 6,
            prep: ["Season the chicken with salt, pepper and paprika; grill or pan-sear 5–6 minutes per side.", "Cook the rice according to package instructions.", "Steam the broccoli 4–5 minutes until bright green.", "Rest the chicken 3 minutes before slicing."],
            note: "Resting is non-negotiable — slice immediately and the juices end up on the board, not in the meat.",
          },
          {
            mealType: "lunch", title: "Turkey Steak with Potatoes & Beans", foods: "150g turkey breast, 300g potatoes, 150g green beans", servingSize: "1 plate", calories: 440, protein: 45, carbs: 50, fat: 6,
            prep: ["Boil the potatoes in salted water for 15–20 minutes.", "Sear the turkey steak 4–5 minutes per side over medium-high heat.", "Blanch the green beans 4 minutes and toss with a touch of butter."],
            note: "Turkey dries out fast — pull it off the heat at 72°C core temperature, not a minute later.",
          },
          {
            mealType: "lunch", title: "Tuna Salad with Chickpeas", foods: "1 can tuna in water, 120g chickpeas, mixed greens, 1 tsp olive oil", servingSize: "1 large bowl", calories: 430, protein: 42, carbs: 35, fat: 12,
            prep: ["Drain the tuna and chickpeas.", "Toss with greens, cucumber and red onion.", "Dress with olive oil, lemon juice, salt and pepper."],
            note: "A spoonful of the chickpea brine (aquafaba) emulsifies the dressing beautifully.",
          },
        ],
      },
      {
        options: [
          {
            mealType: "snack", title: "Skyr with Almonds", foods: "150g skyr, 10g almonds", servingSize: "1 cup", calories: 200, protein: 22, carbs: 10, fat: 8,
            prep: ["Spoon the skyr into a cup.", "Roughly chop the almonds and scatter on top."],
            note: "Toast the almonds 2 minutes in a dry pan — the flavor gets dramatically deeper.",
          },
          {
            mealType: "snack", title: "Protein Shake with Apple", foods: "30g whey protein in water, 1 apple", servingSize: "1 shake + fruit", calories: 210, protein: 25, carbs: 25, fat: 2,
            prep: ["Shake the whey with 300ml cold water until smooth.", "Enjoy with the apple on the side."],
            note: "Ice-cold water makes a whey shake noticeably creamier than lukewarm.",
          },
          {
            mealType: "snack", title: "Cottage Cheese with Cucumber", foods: "200g cottage cheese, ½ cucumber, pepper", servingSize: "1 bowl", calories: 180, protein: 24, carbs: 8, fat: 5,
            prep: ["Slice the cucumber.", "Season the cottage cheese with pepper and fresh herbs, serve together."],
            note: "Fresh dill or chives lift this from plain to genuinely delicious.",
          },
        ],
      },
      {
        options: [
          {
            mealType: "dinner", title: "Baked Salmon with Quinoa & Asparagus", foods: "150g salmon fillet, 50g quinoa (dry), 200g green asparagus", servingSize: "1 plate", calories: 520, protein: 40, carbs: 40, fat: 20,
            prep: ["Rinse the quinoa, then simmer 15 minutes in double its volume of water.", "Season the salmon and bake 12–14 minutes at 200°C.", "Roast the asparagus alongside with olive oil, salt and lemon."],
            note: "Salmon is done when it flakes but still looks glossy in the center — matte means overcooked.",
          },
          {
            mealType: "dinner", title: "Lean Beef with Zucchini & Rice", foods: "150g lean beef strips, 50g rice (dry), zucchini, soy sauce", servingSize: "1 plate", calories: 500, protein: 45, carbs: 45, fat: 15,
            prep: ["Cook the rice.", "Sear the beef strips hot and fast, 1–2 minutes, then set aside.", "Stir-fry the zucchini, deglaze with soy sauce and return the beef."],
            note: "Sear in batches — a crowded pan steams the meat gray instead of browning it.",
          },
          {
            mealType: "dinner", title: "Shrimp Stir-Fry with Basmati Rice", foods: "200g shrimp, 60g basmati rice (dry), wok vegetables, 1 tsp oil", servingSize: "1 plate", calories: 480, protein: 42, carbs: 55, fat: 9,
            prep: ["Cook the basmati rice.", "Stir-fry the vegetables 3–4 minutes in a very hot wok.", "Add the shrimp for the final 2–3 minutes until pink."],
            note: "Shrimp are done the moment they curl into a loose C — a tight O means overcooked.",
          },
        ],
      },
      {
        options: [
          {
            mealType: "snack", title: "Cottage Cheese Before Bed", foods: "200g cottage cheese (slow-release casein protein)", servingSize: "1 bowl", calories: 180, protein: 28, carbs: 7, fat: 4,
            prep: ["Spoon into a bowl and season — sweet with cinnamon or savory with pepper."],
            note: "Casein digests over 6–7 hours and feeds your muscles while you sleep.",
          },
          {
            mealType: "snack", title: "Casein Shake", foods: "30g casein protein in water", servingSize: "1 shake", calories: 120, protein: 25, carbs: 3, fat: 1,
            prep: ["Mix the casein with 300ml water and shake vigorously."],
            note: "Casein thickens on standing — use more water than you would for whey.",
          },
          {
            mealType: "snack", title: "Harzer Cheese with Pickles", foods: "100g Harzer cheese, gherkins", servingSize: "1 portion", calories: 130, protein: 27, carbs: 1, fat: 1,
            prep: ["Slice the cheese and serve with the gherkins."],
            note: "27g protein at almost zero fat — the most underrated cutting food in any German supermarket.",
          },
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
          {
            mealType: "breakfast", title: "Scrambled Eggs on Whole Grain Toast", foods: "3 eggs, 2 slices whole grain toast, ½ avocado", servingSize: "1 plate", calories: 550, protein: 32, carbs: 45, fat: 26,
            prep: ["Whisk the eggs with a pinch of salt.", "Scramble over low heat, stirring slowly, until softly set.", "Serve on the toast with sliced avocado."],
            note: "Pull the pan off the heat just before the eggs look done — they finish cooking on the plate.",
          },
          {
            mealType: "breakfast", title: "Protein Pancakes with Banana", foods: "50g oats, 30g whey, 2 eggs, 1 banana, maple syrup", servingSize: "3 pancakes", calories: 560, protein: 38, carbs: 70, fat: 12,
            prep: ["Blend oats, whey, eggs and banana into a smooth batter.", "Cook small pancakes 2–3 minutes per side over medium heat.", "Stack and top with maple syrup."],
            note: "Rest the batter 5 minutes so the oats bind — the pancakes flip much cleaner.",
          },
          {
            mealType: "breakfast", title: "Breakfast Burrito", foods: "1 large tortilla, 2 eggs, cheese, black beans, salsa", servingSize: "1 burrito", calories: 570, protein: 30, carbs: 55, fat: 24,
            prep: ["Scramble the eggs and warm the beans.", "Layer eggs, cheese, beans and salsa on the tortilla.", "Roll tightly and toast seam-side down in the pan."],
            note: "Toasting the seam seals the burrito shut and adds a satisfying crunch.",
          },
        ],
      },
      {
        options: [
          {
            mealType: "snack", title: "Mass Gainer Shake", foods: "1 banana, 50g oats, 30g whey protein, 15g peanut butter, 300ml milk", servingSize: "1 shake", calories: 520, protein: 35, carbs: 60, fat: 15,
            prep: ["Blend all ingredients for 30–45 seconds until completely smooth."],
            note: "Use a frozen banana instead of ice — milkshake thickness without watering it down.",
          },
          {
            mealType: "snack", title: "PB&J Sandwich with Milk", foods: "2 slices bread, 20g peanut butter, jam, 300ml milk", servingSize: "1 sandwich + glass", calories: 540, protein: 22, carbs: 65, fat: 20,
            prep: ["Spread peanut butter on one slice, jam on the other.", "Close, slice diagonally, enjoy with the glass of milk."],
            note: "Spread peanut butter on both slices as a moisture barrier — no more soggy bread.",
          },
          {
            mealType: "snack", title: "Trail Mix with Greek Yogurt", foods: "40g nut & raisin mix, 200g Greek yogurt", servingSize: "1 bowl", calories: 500, protein: 22, carbs: 45, fat: 25,
            prep: ["Stir the trail mix into the yogurt, or eat them side by side."],
            note: "Buy nuts unsalted — you control the sodium and the natural flavor comes through.",
          },
        ],
      },
      {
        options: [
          {
            mealType: "lunch", title: "Beef Strips with Pasta", foods: "150g lean beef, 100g pasta (dry), tomato sauce, parmesan", servingSize: "1 plate", calories: 650, protein: 45, carbs: 75, fat: 18,
            prep: ["Cook the pasta al dente in well-salted water.", "Sear the beef strips over high heat for 1–2 minutes.", "Simmer briefly with the tomato sauce, toss with the pasta, finish with parmesan."],
            note: "Save a cup of pasta water — one splash turns any sauce silky and helps it cling.",
          },
          {
            mealType: "lunch", title: "Chicken Burrito Bowl", foods: "150g chicken, 80g rice (dry), black beans, corn, salsa", servingSize: "1 bowl", calories: 660, protein: 48, carbs: 80, fat: 14,
            prep: ["Cook the rice; season the chicken with cumin and paprika, then sear.", "Warm the beans and corn.", "Assemble the bowl and top with salsa."],
            note: "15 minutes in lime juice tenderizes the chicken and brightens the whole bowl.",
          },
          {
            mealType: "lunch", title: "Salmon with Sweet Potato Mash", foods: "180g salmon, 300g sweet potato, 10g butter, greens", servingSize: "1 plate", calories: 640, protein: 40, carbs: 60, fat: 24,
            prep: ["Boil the sweet potato 15 minutes, then mash with butter.", "Pan-sear the salmon 3–4 minutes skin-side down, then 2 more minutes.", "Serve with the greens."],
            note: "Start skin-side down and don't touch it — that patience is the whole secret to crisp skin.",
          },
        ],
      },
      {
        options: [
          {
            mealType: "snack", title: "Greek Yogurt with Granola & Honey", foods: "200g Greek yogurt, 40g granola, 1 tsp honey", servingSize: "1 bowl", calories: 380, protein: 20, carbs: 50, fat: 10,
            prep: ["Layer yogurt, granola and honey in a bowl."],
            note: "Add the granola right before eating so it stays crunchy instead of soaking soft.",
          },
          {
            mealType: "snack", title: "Rice Cakes with Peanut Butter", foods: "4 rice cakes, 20g peanut butter, 1 banana", servingSize: "1 portion", calories: 370, protein: 12, carbs: 50, fat: 14,
            prep: ["Spread peanut butter on the rice cakes and top with banana slices."],
            note: "A tiny pinch of sea salt on the banana makes the sweetness pop.",
          },
          {
            mealType: "snack", title: "Cheese Sandwich", foods: "2 slices whole grain bread, 2 slices gouda, butter", servingSize: "1 sandwich", calories: 390, protein: 18, carbs: 40, fat: 16,
            prep: ["Butter the bread, layer the gouda, done."],
            note: "Aged gouda carries far more flavor per gram — you need less of it.",
          },
        ],
      },
      {
        options: [
          {
            mealType: "dinner", title: "Chicken Thighs with Rice & Vegetables", foods: "180g chicken thigh, 80g jasmine rice (dry), mixed vegetables", servingSize: "1 plate", calories: 620, protein: 45, carbs: 70, fat: 16,
            prep: ["Season the thighs and roast 25 minutes at 200°C, skin-side up.", "Cook the rice and steam or stir-fry the vegetables.", "Rest the chicken 5 minutes before serving."],
            note: "Thighs are forgiving — a few extra minutes make them more tender, not drier.",
          },
          {
            mealType: "dinner", title: "Beef Chili with Rice", foods: "150g ground beef, kidney beans, 70g rice (dry), tomatoes", servingSize: "1 bowl", calories: 630, protein: 42, carbs: 65, fat: 20,
            prep: ["Brown the beef properly in a hot pot.", "Add beans and tomatoes, simmer at least 20 minutes.", "Serve over the rice."],
            note: "Chili is always better on day two — double the batch and thank yourself tomorrow.",
          },
          {
            mealType: "dinner", title: "Turkey Bolognese with Pasta", foods: "150g ground turkey, 100g whole grain pasta (dry), tomato sauce", servingSize: "1 plate", calories: 610, protein: 48, carbs: 75, fat: 12,
            prep: ["Brown the ground turkey with onion and garlic.", "Add the tomato sauce and simmer 15 minutes.", "Toss with the cooked pasta."],
            note: "A small pinch of sugar in the sauce balances the tomato acidity perfectly.",
          },
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
          {
            mealType: "breakfast", title: "Fluffy Pancakes with Maple Syrup", foods: "3 pancakes, maple syrup, 2 strips bacon, butter", servingSize: "1 stack", calories: 650, protein: 18, carbs: 85, fat: 26,
            prep: ["Mix the batter until just combined — lumps are fine.", "Cook on a buttered griddle until bubbles form, then flip once.", "Crisp the bacon, stack everything, drown in maple syrup."],
            note: "Overmixing develops gluten and makes pancakes tough — stop stirring while it's still lumpy.",
          },
          {
            mealType: "breakfast", title: "French Toast with Berries & Cream", foods: "3 slices french toast, berries, whipped cream, powdered sugar", servingSize: "1 plate", calories: 620, protein: 16, carbs: 75, fat: 28,
            prep: ["Whisk eggs, milk, cinnamon and vanilla.", "Soak the bread 30 seconds per side.", "Fry golden in butter, top with berries and cream."],
            note: "Day-old bread soaks up the custard without falling apart — fresh bread turns mushy.",
          },
        ],
      },
      {
        options: [
          {
            mealType: "lunch", title: "Cheeseburger with Fries", foods: "1 cheeseburger, medium fries, ketchup & mayo", servingSize: "1 meal", calories: 850, protein: 35, carbs: 80, fat: 42,
            prep: ["Form loose patties and season only the outside.", "Sear hot, add the cheese for the final minute.", "Toast the buns, stack, serve with fries."],
            note: "Press a small dimple into the patty center — it cooks flat instead of doming.",
          },
          {
            mealType: "lunch", title: "Pizza Margherita", foods: "1 whole pizza with mozzarella, tomato & basil", servingSize: "1 pizza", calories: 900, protein: 35, carbs: 110, fat: 32,
            prep: ["Stretch the dough, sauce it thin, add mozzarella and basil.", "Bake as hot as your oven goes, 8–10 minutes."],
            note: "A preheated tray or pizza stone mimics a pizza oven and crisps the base properly.",
          },
          {
            mealType: "lunch", title: "Döner Kebab", foods: "1 döner with meat, salad, sauce in flatbread", servingSize: "1 döner", calories: 750, protein: 35, carbs: 65, fat: 38,
            prep: ["Warm the flatbread, load with meat, salad and both sauces."],
            note: "Homemade version: thin-sliced chicken marinated in yogurt and paprika, seared screaming hot.",
          },
        ],
      },
      {
        options: [
          {
            mealType: "snack", title: "Ice Cream Sundae", foods: "3 scoops ice cream, chocolate sauce, whipped cream", servingSize: "1 sundae", calories: 420, protein: 8, carbs: 50, fat: 20,
            prep: ["Scoop, sauce, cream — assemble and enjoy immediately."],
            note: "Warm the chocolate sauce slightly so it flows over the cold ice cream instead of seizing.",
          },
          {
            mealType: "snack", title: "Chocolate Croissant", foods: "1 large pain au chocolat", servingSize: "1 piece", calories: 380, protein: 6, carbs: 42, fat: 20,
            prep: ["Warm 3 minutes in the oven at 160°C — never the microwave."],
            note: "The microwave turns pastry chewy; the oven brings the flaky crispness back to life.",
          },
          {
            mealType: "snack", title: "Vanilla Milkshake", foods: "400ml milkshake with vanilla ice cream", servingSize: "1 shake", calories: 450, protein: 10, carbs: 55, fat: 20,
            prep: ["Blend the ice cream with milk until just smooth."],
            note: "Less milk means a thicker shake — and blend briefly, or it melts thin.",
          },
        ],
      },
      {
        options: [
          {
            mealType: "dinner", title: "Creamy Pasta Carbonara", foods: "120g pasta (dry), bacon, cream, parmesan, egg", servingSize: "1 plate", calories: 800, protein: 28, carbs: 85, fat: 38,
            prep: ["Crisp the bacon; cook the pasta al dente.", "Whisk egg, cream and parmesan together.", "Toss the hot pasta with the sauce off the heat."],
            note: "Off the heat is the entire secret — over the flame you get scrambled eggs, not carbonara.",
          },
          {
            mealType: "dinner", title: "Loaded Nachos with Guacamole", foods: "Tortilla chips, cheese, ground beef, guacamole, sour cream", servingSize: "1 platter", calories: 780, protein: 22, carbs: 70, fat: 45,
            prep: ["Layer chips, cheese and seasoned beef on a tray.", "Bake 8–10 minutes at 200°C until melted.", "Top with guacamole and sour cream."],
            note: "Layer cheese between the chip levels, not just on top — every chip deserves cheese.",
          },
          {
            mealType: "dinner", title: "Schnitzel with Fries", foods: "1 pork schnitzel, fries, lemon & remoulade", servingSize: "1 plate", calories: 820, protein: 40, carbs: 70, fat: 40,
            prep: ["Pound the schnitzel thin; bread it in flour, egg, then breadcrumbs.", "Fry in generous butterfat until deep golden.", "Serve with fries and a lemon wedge."],
            note: "Swirl the pan gently while frying — the breading puffs into the classic wavy soufflé crust.",
          },
        ],
      },
      {
        options: [
          {
            mealType: "snack", title: "Chocolate & Chips", foods: "50g chocolate, small bag of chips", servingSize: "1 portion", calories: 350, protein: 4, carbs: 40, fat: 19,
            prep: ["No cooking required — pure couch enjoyment."],
            note: "Portion into a bowl instead of eating from the bag — your future self says thanks.",
          },
          {
            mealType: "snack", title: "Cookies with Milk", foods: "3 chocolate chip cookies, 250ml milk", servingSize: "1 portion", calories: 340, protein: 8, carbs: 45, fat: 14,
            prep: ["Warm the cookies 2 minutes in the oven for the fresh-baked effect."],
            note: "Dunk timing matters: 3 seconds is the sweet spot before structural failure.",
          },
        ],
      },
    ],
  },
];

export function MealPlans() {
  const [activePlanId, setActivePlanId] = useState<string>("cut");
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
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

  const toggleExpanded = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
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
                  const isExpanded = !!expanded[key];
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

                          {/* Preparation & chef's note (expandable) */}
                          <button
                            onClick={() => toggleExpanded(key)}
                            aria-expanded={isExpanded}
                            data-testid={`button-prep-${key}`}
                            className="w-full mt-3 py-2.5 px-3 flex items-center justify-between gap-2 bg-amber-50 hover:bg-amber-100 active:bg-amber-100 border border-amber-200/60 rounded-xl transition-colors"
                          >
                            <span className="flex items-center gap-2 text-xs font-semibold text-amber-800">
                              <ChefHat className="w-4 h-4 text-amber-600" />
                              Recipe & chef's note
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 text-amber-600 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                            />
                          </button>

                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <ol className="mt-3 space-y-2">
                                  {meal.prep.map((step, i) => (
                                    <li key={i} className="flex gap-2.5 text-xs text-slate-600 leading-relaxed">
                                      <span className="shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-500 font-bold text-[10px] flex items-center justify-center mt-[1px]">
                                        {i + 1}
                                      </span>
                                      {step}
                                    </li>
                                  ))}
                                </ol>
                                <div className="mt-3 flex gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                                  <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                  <p className="text-[11px] text-amber-800 leading-relaxed">
                                    <span className="font-semibold">Chef's note:</span> {meal.note}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
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
