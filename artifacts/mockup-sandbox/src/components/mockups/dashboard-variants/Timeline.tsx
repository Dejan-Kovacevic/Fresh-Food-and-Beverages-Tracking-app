import React from "react";
import { Plus } from "lucide-react";

export function Timeline() {
  return (
    <div className="min-h-screen bg-[#f8f7f4] flex items-start justify-center font-sans">
      <div className="w-[390px] min-h-screen bg-[#fffdfa] shadow-xl relative flex flex-col text-[#4a423e]">
        {/* Header Summary */}
        <div className="p-6 pb-4 pt-10">
          <h1 className="text-xl font-medium mb-6 text-center text-[#3c3431]">Today's Log</h1>
          
          <div className="flex items-center gap-6 mb-8">
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="44" fill="none" stroke="#f0ece5" strokeWidth="6" />
                <circle cx="48" cy="48" r="44" fill="none" stroke="#d48a60" strokeWidth="6" strokeDasharray="276" strokeDashoffset={276 - (276 * 1350) / 2000} strokeLinecap="round" />
              </svg>
              <div className="text-center flex flex-col items-center">
                <span className="text-2xl font-semibold text-[#3c3431] leading-none">1350</span>
                <span className="text-[10px] uppercase tracking-wider text-[#968a85] mt-1">/ 2000 kcal</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-3">
              {/* Protein */}
              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-[#c16e59]">Protein</span>
                  <span className="text-[#8c827d]">89 / 150g</span>
                </div>
                <div className="h-2 bg-[#f4e8e5] rounded-full overflow-hidden">
                  <div className="h-full bg-[#c16e59] rounded-full" style={{ width: '59%' }} />
                </div>
              </div>
              {/* Carbs */}
              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-[#d89f55]">Carbs</span>
                  <span className="text-[#8c827d]">162 / 250g</span>
                </div>
                <div className="h-2 bg-[#f9f1e6] rounded-full overflow-hidden">
                  <div className="h-full bg-[#d89f55] rounded-full" style={{ width: '65%' }} />
                </div>
              </div>
              {/* Fat */}
              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-[#5b8c85]">Fat</span>
                  <span className="text-[#8c827d]">41 / 65g</span>
                </div>
                <div className="h-2 bg-[#e8f0ef] rounded-full overflow-hidden">
                  <div className="h-full bg-[#5b8c85] rounded-full" style={{ width: '63%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 px-6 pb-20 overflow-y-auto">
          {/* Morning */}
          <div className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#a69c98] mb-4">Morning</h2>
            <div className="relative pl-[4.5rem]">
              <div className="absolute left-[3rem] top-2 bottom-0 w-[2px] bg-[#f0ece5]" />
              
              <div className="relative mb-6">
                <div className="absolute -left-[4.5rem] top-1 text-xs font-medium text-[#8c827d] w-12 text-right">7:00am</div>
                <div className="absolute -left-[1.85rem] top-1 w-[11px] h-[11px] rounded-full bg-[#fffdfa] border-[2px] border-[#d48a60] z-10" />
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#f2eee9] flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#f9f5f0] flex items-center justify-center text-xl shrink-0">🥣</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-[#3c3431]">Oatmeal</span>
                      <span className="font-semibold text-[#d48a60]">310</span>
                    </div>
                    <div className="text-[11px] text-[#968a85] flex gap-2">
                      <span>8g P</span>
                      <span>•</span>
                      <span>58g C</span>
                      <span>•</span>
                      <span>5g F</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative mb-6">
                <div className="absolute -left-[4.5rem] top-1 text-xs font-medium text-[#8c827d] w-12 text-right">9:00am</div>
                <div className="absolute -left-[1.85rem] top-1 w-[11px] h-[11px] rounded-full bg-[#fffdfa] border-[2px] border-[#d48a60] z-10" />
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#f2eee9] flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#f9f5f0] flex items-center justify-center text-xl shrink-0">☕</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-[#3c3431]">Coffee</span>
                      <span className="font-semibold text-[#d48a60]">15</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Afternoon */}
          <div className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#a69c98] mb-4">Afternoon</h2>
            <div className="relative pl-[4.5rem]">
              <div className="absolute left-[3rem] top-2 bottom-0 w-[2px] bg-[#f0ece5]" />
              
              <div className="relative mb-6">
                <div className="absolute -left-[4.5rem] top-1 text-xs font-medium text-[#8c827d] w-12 text-right">12:30pm</div>
                <div className="absolute -left-[1.85rem] top-1 w-[11px] h-[11px] rounded-full bg-[#fffdfa] border-[2px] border-[#d48a60] z-10" />
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#f2eee9] flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#f9f5f0] flex items-center justify-center text-xl shrink-0">🥗</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-[#3c3431] leading-tight">Grilled chicken salad</span>
                      <span className="font-semibold text-[#d48a60] pl-2">480</span>
                    </div>
                    <div className="text-[11px] text-[#968a85] flex gap-2">
                      <span>42g P</span>
                      <span>•</span>
                      <span>28g C</span>
                      <span>•</span>
                      <span>21g F</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative mb-6">
                <div className="absolute -left-[4.5rem] top-1 text-xs font-medium text-[#8c827d] w-12 text-right">3:00pm</div>
                <div className="absolute -left-[1.85rem] top-1 w-[11px] h-[11px] rounded-full bg-[#fffdfa] border-[2px] border-[#d48a60] z-10" />
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#f2eee9] flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#f9f5f0] flex items-center justify-center text-xl shrink-0">🫙</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-[#3c3431]">Greek yogurt</span>
                      <span className="font-semibold text-[#d48a60]">130</span>
                    </div>
                    <div className="text-[11px] text-[#968a85] flex gap-2">
                      <span>17g P</span>
                      <span>•</span>
                      <span>14g C</span>
                      <span>•</span>
                      <span>1g F</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Evening */}
          <div className="mb-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#a69c98] mb-4">Evening</h2>
            <div className="relative pl-[4.5rem]">
              <div className="absolute left-[3rem] top-2 bottom-6 w-[2px] bg-[#f0ece5]" />
              
              <div className="relative mb-6">
                <div className="absolute -left-[4.5rem] top-1 text-xs font-medium text-[#8c827d] w-12 text-right">7:00pm</div>
                <div className="absolute -left-[1.85rem] top-1 w-[11px] h-[11px] rounded-full bg-[#fffdfa] border-[2px] border-[#d48a60] z-10" />
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#f2eee9] flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#f9f5f0] flex items-center justify-center text-xl shrink-0">🐟</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-[#3c3431]">Salmon</span>
                      <span className="font-semibold text-[#d48a60]">420</span>
                    </div>
                    <div className="text-[11px] text-[#968a85] flex gap-2">
                      <span>38g P</span>
                      <span>•</span>
                      <span>22g C</span>
                      <span>•</span>
                      <span>14g F</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAB */}
        <div className="absolute bottom-6 right-6">
          <button className="w-14 h-14 bg-[#d48a60] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#d48a60]/30 hover:bg-[#c37a50] transition-colors">
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
