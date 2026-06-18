import React from "react";
import { Plus, Coffee, Sun, Moon, Apple, ChevronLeft, Calendar, Info, MoreHorizontal } from "lucide-react";

export function Cockpit() {
  const goal = 2000;
  const consumed = 1350;
  const remaining = goal - consumed;
  const progress = (consumed / goal) * 100;
  
  const macros = [
    { name: "Protein", current: 89, goal: 150, color: "text-blue-500", stroke: "stroke-blue-500", bg: "bg-blue-500/10" },
    { name: "Carbs", current: 162, goal: 250, color: "text-emerald-500", stroke: "stroke-emerald-500", bg: "bg-emerald-500/10" },
    { name: "Fat", current: 41, goal: 65, color: "text-orange-500", stroke: "stroke-orange-500", bg: "bg-orange-500/10" },
  ];

  const meals = [
    {
      name: "Breakfast",
      icon: <Coffee className="w-4 h-4 text-amber-500" />,
      totalKcal: 325,
      items: [
        { name: "Oatmeal", kcal: 310, details: "8g P • 58g C • 5g F" },
        { name: "Coffee, black", kcal: 15, details: "0g P • 0g C • 0g F" },
      ]
    },
    {
      name: "Lunch",
      icon: <Sun className="w-4 h-4 text-orange-500" />,
      totalKcal: 480,
      items: [
        { name: "Grilled chicken salad", kcal: 480, details: "42g P • 28g C • 21g F" },
      ]
    },
    {
      name: "Snack",
      icon: <Apple className="w-4 h-4 text-green-500" />,
      totalKcal: 130,
      items: [
        { name: "Greek yogurt", kcal: 130, details: "17g P • 14g C • 1g F" },
      ]
    },
    {
      name: "Dinner",
      icon: <Moon className="w-4 h-4 text-indigo-500" />,
      totalKcal: 420,
      items: [
        { name: "Baked Salmon", kcal: 420, details: "38g P • 22g C • 14g F" },
      ]
    }
  ];

  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center font-sans">
      <div className="w-[390px] min-h-screen bg-slate-50 shadow-2xl overflow-hidden flex flex-col relative text-slate-900">
        
        {/* Full Bleed Hero */}
        <div className="relative bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-800 pt-12 pb-24 px-6 text-white rounded-b-[40px] z-0">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none" />
          
          {/* Header */}
          <div className="flex justify-between items-center mb-8 relative z-10">
            <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
              <Calendar className="w-4 h-4 text-indigo-300" />
              <span className="text-sm font-medium">Today</span>
            </div>
            <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
              <MoreHorizontal className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Calorie Ring */}
          <div className="flex justify-center items-center relative z-10 mb-4">
            <div className="relative w-64 h-64 flex justify-center items-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 260 260">
                {/* Background Ring */}
                <circle
                  cx="130"
                  cy="130"
                  r="120"
                  className="stroke-indigo-950/50"
                  strokeWidth="16"
                  fill="none"
                />
                {/* Progress Ring */}
                <circle
                  cx="130"
                  cy="130"
                  r="120"
                  className="stroke-indigo-400"
                  strokeWidth="16"
                  fill="none"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: circumference,
                    strokeDashoffset: strokeDashoffset,
                    transition: "stroke-dashoffset 1s ease-in-out",
                  }}
                />
              </svg>
              
              {/* Center Content */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-indigo-300 font-medium tracking-wide uppercase text-xs mb-1">Remaining</span>
                <span className="text-6xl font-bold tracking-tighter text-white tabular-nums leading-none">
                  {remaining}
                </span>
                <span className="text-indigo-200 text-sm mt-1">kcal</span>
              </div>
            </div>
          </div>
          
          {/* Subtext */}
          <div className="text-center relative z-10">
            <p className="text-indigo-200 text-sm font-medium">
              {consumed} kcal consumed of {goal} goal
            </p>
          </div>
        </div>

        {/* Floating Macro Cards */}
        <div className="px-5 -mt-16 relative z-10 flex gap-3">
          {macros.map((macro, idx) => {
            const mProgress = (macro.current / macro.goal) * 100;
            const mCirc = 2 * Math.PI * 18;
            const mOffset = mCirc - (mProgress / 100) * mCirc;

            return (
              <div key={idx} className="flex-1 bg-white rounded-2xl p-4 shadow-xl shadow-indigo-900/5 border border-slate-100 flex flex-col items-center">
                <div className="relative w-12 h-12 mb-2 flex items-center justify-center">
                   <svg className="w-full h-full transform -rotate-90" viewBox="0 0 44 44">
                    <circle cx="22" cy="22" r="18" className="stroke-slate-100" strokeWidth="4" fill="none" />
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      className={macro.stroke}
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                      style={{
                        strokeDasharray: mCirc,
                        strokeDashoffset: mOffset,
                      }}
                    />
                  </svg>
                  <span className="absolute text-[10px] font-bold text-slate-700">{Math.round(mProgress)}%</span>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-slate-900">{macro.current}g</div>
                  <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{macro.name}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Food Log */}
        <div className="flex-1 px-5 pt-8 pb-24 overflow-y-auto">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl font-bold text-slate-900">Today's Log</h2>
            <button className="text-indigo-600 font-semibold text-sm">See all</button>
          </div>

          <div className="space-y-4">
            {meals.map((meal, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100/60">
                {/* Meal Header */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                      {meal.icon}
                    </div>
                    <h3 className="font-semibold text-slate-900">{meal.name}</h3>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{meal.totalKcal} <span className="text-slate-500 font-normal">kcal</span></span>
                </div>
                
                {/* Food Items */}
                <div className="space-y-3">
                  {meal.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-start pt-3 border-t border-slate-50 group">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{item.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.details}</p>
                      </div>
                      <span className="text-sm font-medium text-slate-600">{item.kcal}</span>
                    </div>
                  ))}
                </div>
                
                <button className="w-full mt-4 py-2 flex items-center justify-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-xl transition-colors active:bg-indigo-100">
                  <Plus className="w-3.5 h-3.5" />
                  Add to {meal.name}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FAB / Bottom Action */}
        <div className="absolute bottom-6 left-0 right-0 px-6 flex justify-center pointer-events-none">
          <button className="pointer-events-auto h-14 bg-indigo-600 text-white rounded-full px-8 shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 font-semibold hover:scale-105 transition-transform active:scale-95">
            <Plus className="w-5 h-5" />
            <span>Log Food</span>
          </button>
        </div>

      </div>
    </div>
  );
}
