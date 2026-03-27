"use client";

import { useState } from "react";
import { UrgentInventory } from "@/app/types/inventory";
import { getCalendarDays } from "@/lib/utils/date";

interface InputModalProps {
  showInputModal: boolean; setShowInputModal: (show: boolean) => void;
  isBatchMode: boolean; statusLocation: string; urgentTab: string; urgentItems: UrgentInventory[];
  YANGGANG_TYPES: string[]; SET_TYPES: string[];
  selectedProduct: string; setSelectedProduct: (p: string) => void;
  expiryDate: string; setExpiryDate: (e: string) => void;
  quantity: number; setQuantity: (q: number) => void;
  setMemo: string; setSetMemo: (m: string) => void;
  saveInventory: () => void; isSaving: boolean;
  pendingList: any[]; addToPending: () => void;
  setUrgentProcessTarget: (item: UrgentInventory) => void; setProcQty: (qty: number) => void;
}

export default function InputModal({
  showInputModal, setShowInputModal, isBatchMode, statusLocation, urgentTab, urgentItems,
  YANGGANG_TYPES, SET_TYPES, selectedProduct, setSelectedProduct, expiryDate, setExpiryDate,
  quantity, setQuantity, setMemo, setSetMemo, saveInventory, isSaving, pendingList, addToPending,
  setUrgentProcessTarget, setProcQty,
}: InputModalProps) {
  const [calDate, setCalDate] = useState(new Date());
  if (!showInputModal) return null;
  const isUrgentSelection = statusLocation === "URGENT" && urgentTab !== "STORAGE";
  const currYear = calDate.getFullYear(); const currMonth = calDate.getMonth();
  const days = getCalendarDays(currYear, currMonth);

  return (
    <div className="fixed inset-0 bg-black/60 z-[700] flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setShowInputModal(false)}>
      <div className="bg-[#FDFBF7] w-full max-w-sm rounded-[32px] p-8 border border-[#EFE9E1] shadow-2xl overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl mb-6 text-center font-bold text-[#5D2E2E]">{isUrgentSelection ? "처리 항목 선택" : "재고 추가"}</h2>
        {isUrgentSelection ? (
          <div className="space-y-2 mb-6">
            {urgentItems.map((item) => (
              <button key={item.id} onClick={() => { setUrgentProcessTarget(item); setProcQty(item.quantity); setShowInputModal(false); }} className="w-full p-4 border border-[#F5F0E9] rounded-xl flex justify-between bg-white shadow-sm active:scale-95 transition-all">
                <span className="font-bold text-sm text-[#3E2723]">{item.product_name} ({item.expiry_date.slice(5)})</span>
                <span className="font-black text-[#5D2E2E]">{item.quantity}개</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-1.5 mb-6 max-h-32 overflow-y-auto p-2 border border-[#F5F0E9] rounded-2xl bg-white shadow-inner">
              {(statusLocation === "SET" ? SET_TYPES : YANGGANG_TYPES).map((p) => {
                const pName = statusLocation === "SET" ? p : `${p} 양갱`;
                return (
                  <button key={p} onClick={() => setSelectedProduct(pName)} className={`py-2 text-[10px] rounded-lg border font-bold transition-all ${selectedProduct === pName ? "bg-[#5D2E2E] text-white border-[#5D2E2E]" : "bg-white text-[#A68966] border-[#F5F0E9]"}`}>{p}</button>
                );
              })}
            </div>
            <div className="bg-white border border-[#F5F0E9] rounded-2xl p-4 mb-4 shadow-sm text-center">
              <div className="flex justify-between items-center mb-3">
                <button onClick={() => setCalDate(new Date(currYear, currMonth - 1))} className="text-[#A68966] font-bold p-1">{"<"}</button>
                <div className="text-[14px] font-black text-[#5D2E2E]">{currYear}. {currMonth + 1}</div>
                <button onClick={() => setCalDate(new Date(currYear, currMonth + 1))} className="text-[#A68966] font-bold p-1">{">"}</button>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {["일","월","화","수","목","금","토"].map(d => <div key={d} className="text-[9px] text-gray-400 font-bold py-1">{d}</div>)}
                {days.map((day, idx) => {
                  if (!day) return <div key={idx} />;
                  const dStr = `${currYear}-${String(currMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  return (
                    <button key={idx} onClick={() => setExpiryDate(dStr)} className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${expiryDate === dStr ? "bg-[#5D2E2E] text-white" : "hover:bg-[#F9F5F0] text-[#3E2723]"}`}>{day}</button>
                  );
                })}
              </div>
            </div>
            {statusLocation === "SET" && (
              <div className="flex gap-2 mb-4">
                {["Red", "Navy", "Pink"].map((color) => (
                  <button key={color} onClick={() => setSetMemo(color)} className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${setMemo === color ? "bg-[#5D2E2E] text-white" : "bg-white text-[#A68966] border-[#F5F0E9]"}`}>{color}</button>
                ))}
              </div>
            )}
            <div className="flex gap-2 mb-6">
              <button onClick={() => setQuantity(quantity + 10)} className="flex-1 py-3 bg-white border border-[#F5F0E9] rounded-xl text-[11px] font-bold text-[#A68966] active:scale-95 shadow-sm">+10</button>
              <button onClick={() => setQuantity(quantity + 40)} className="flex-1 py-3 bg-white border border-[#F5F0E9] rounded-xl text-[11px] font-bold text-[#A68966] active:scale-95 shadow-sm">+40</button>
              {/* [요구사항 2 반영] 0 -> 초기화 */}
              <button onClick={() => setQuantity(0)} className="flex-1 py-3 bg-[#FFF5F5] border border-[#FFE3E3] rounded-xl text-[11px] font-bold text-[#DC3545] active:scale-95 shadow-sm">초기화</button>
            </div>
            <div className="flex items-center justify-center gap-8 mb-8">
              <button onClick={() => setQuantity(Math.max(0, quantity - 1))} className="w-12 h-12 border border-[#F5F0E9] rounded-full font-bold bg-white text-[#5D2E2E] shadow-sm active:scale-95">-</button>
              <input type="number" value={quantity || ""} placeholder="0" onChange={(e) => setQuantity(parseInt(e.target.value) || 0)} className="w-20 text-center text-4xl font-black bg-transparent outline-none text-[#3E2723]" />
              <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 border border-[#F5F0E9] rounded-full font-bold bg-white text-[#5D2E2E] shadow-sm active:scale-95">+</button>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-3 text-center">
                <button onClick={() => setShowInputModal(false)} className="flex-1 py-4 text-[#A68966] font-bold">취소</button>
                {isBatchMode && <button onClick={addToPending} className="flex-1 py-4 bg-white border border-[#5D2E2E] text-[#5D2E2E] rounded-2xl font-bold active:scale-95 shadow-sm">+ 추가</button>}
              </div>
              <button onClick={saveInventory} disabled={isSaving} className={`w-full py-4 text-white rounded-2xl font-bold shadow-lg transition-all active:scale-[0.98] ${isSaving ? "bg-[#D1C4B5]" : "bg-[#5D2E2E]"}`}>{isSaving ? "저장 중..." : "확인"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}