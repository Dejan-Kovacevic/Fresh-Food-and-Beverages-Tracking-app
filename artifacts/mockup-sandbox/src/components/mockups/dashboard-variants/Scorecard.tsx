import React from "react";
import { Plus, MoreVertical, Flame, Target } from "lucide-react";

export function Scorecard() {
  const data = {
    calories: { consumed: 1355, goal: 2000 },
    macros: {
      protein: { amount: 105, goal: 150, color: "bg-emerald-500" },
      carbs: { amount: 122, goal: 200, color: "bg-amber-500" },
      fat: { amount: 41, goal: 65, color: "bg-rose-500" },
    },
    meals: [
      {
        type: "Breakfast",
        accent: "bg-blue-400",
        items: [
          { name: "Oatmeal", cals: 310, p: 8, c: 58, f: 5 },
          { name: "Black Coffee", cals: 15, p: 0, c: 0, f: 0 },
        ],
      },
      {
        type: "Lunch",
        accent: "bg-orange-400",
        items: [
          { name: "Grilled Chicken Salad", cals: 480, p: 42, c: 28, f: 21 },
        ],
      },
      {
        type: "Snack",
        accent: "bg-purple-400",
        items: [
          { name: "Greek Yogurt", cals: 130, p: 17, c: 14, f: 1 },
        ],
      },
      {
        type: "Dinner",
        accent: "bg-indigo-400",
        items: [
          { name: "Pan-seared Salmon", cals: 420, p: 38, c: 22, f: 14 },
        ],
      },
    ],
  };

  const calPercent = Math.min((data.calories.consumed / data.calories.goal) * 100, 100);
  
  const totalMacros = data.macros.protein.amount + data.macros.carbs.amount + data.macros.fat.amount;
  const pPct = (data.macros.protein.amount / totalMacros) * 100;
  const cPct = (data.macros.carbs.amount / totalMacros) * 100;
  const fPct = (data.macros.fat.amount / totalMacros) * 100;

  return (
    <div className="min-h-screen bg-neutral-100 flex items-start justify-center font-sans text-neutral-900">
      <div className="w-[390px] min-h-screen bg-white shadow-xl overflow-hidden flex flex-col relative">
        {/* Header / Stats Bar */}
        <div className="pt-12 pb-4 px-4 bg-white border-b border-neutral-200 sticky top-0 z-10">
          <div className="flex items-end justify-between mb-3">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight leading-none mb-1">
                {data.calories.consumed.toLocaleString()}
              </h1>
              <p className="text-xs text-neutral-500 font-medium tracking-wide uppercase">
                / {data.calories.goal.toLocaleString()} kcal
              </p>
            </div>
            <button className="h-8 w-8 bg-black text-white rounded-full flex items-center justify-center hover:bg-neutral-800 transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Calorie Progress */}
          <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-black rounded-full" 
              style={{ width: `${calPercent}%` }}
            />
          </div>

          {/* Macros Segmented Proportion Bar */}
          <div className="flex flex-col gap-1.5 mb-2">
            <div className="flex h-1.5 w-full rounded-full overflow-hidden gap-[1px]">
              <div className="h-full bg-emerald-500" style={{ width: `${pPct}%` }} />
              <div className="h-full bg-amber-500" style={{ width: `${cPct}%` }} />
              <div className="h-full bg-rose-500" style={{ width: `${fPct}%` }} />
            </div>
          </div>

          {/* Macro Pills */}
          <div className="flex items-center justify-between text-[11px] font-medium tracking-wide">
            <div className="flex items-center gap-1.5 text-emerald-700">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{data.macros.protein.amount}g PRO</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-700">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>{data.macros.carbs.amount}g CRB</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-700">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <span>{data.macros.fat.amount}g FAT</span>
            </div>
          </div>
        </div>

        {/* Food Log Feed */}
        <div className="flex-1 overflow-y-auto bg-neutral-50 p-3 pb-24">
          <div className="space-y-4">
            {data.meals.map((meal, idx) => {
              const mealCals = meal.items.reduce((acc, item) => acc + item.cals, 0);
              
              return (
                <div key={idx} className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
                  <div className="px-3 py-2 bg-neutral-50 border-b border-neutral-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${meal.accent}`} />
                      <h2 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">{meal.type}</h2>
                    </div>
                    <span className="text-xs font-semibold text-neutral-500">{mealCals} kcal</span>
                  </div>
                  <div className="divide-y divide-neutral-50">
                    {meal.items.map((item, i) => (
                      <div key={i} className="flex items-center p-3 hover:bg-neutral-50 transition-colors relative">
                        <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${meal.accent} opacity-20`} />
                        <div className="flex-1 min-w-0 pl-1">
                          <p className="text-sm font-medium text-neutral-900 truncate mb-0.5">{item.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-medium">
                            {item.p > 0 || item.c > 0 || item.f > 0 ? (
                              <>
                                <span>{item.p}p</span>
                                <span>·</span>
                                <span>{item.c}c</span>
                                <span>·</span>
                                <span>{item.f}f</span>
                              </>
                            ) : (
                              <span>No macros tracked</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 pl-3">
                          <span className="text-sm font-semibold text-neutral-700">{item.cals}</span>
                          <button className="text-neutral-300 hover:text-neutral-500 transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
