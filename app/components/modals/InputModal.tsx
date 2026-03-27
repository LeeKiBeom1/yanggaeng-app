"use client";

import { UrgentInventory } from "@/app/types/inventory";

interface InputModalProps {
  showInputModal: boolean;
  setShowInputModal: (show: boolean) => void;
  isBatchMode: boolean;
  statusLocation: string;
  urgentTab: string;
  urgentItems: UrgentInventory[];
  YANGGANG_TYPES: string[];
  SET_TYPES: string[];
  selectedProduct: string;
  setSelectedProduct: (p: string) => void;
  expiryDate: string;
  setExpiryDate: (e: string) => void;
  quantity: number;
  setQuantity: (q: number) => void;
  setMemo: string;
  setSetMemo: (m: string) => void;
  saveInventory: () => void;
  isSaving: boolean;
  pendingList: any[];
  addToPending: () => void;
  setUrgentProcessTarget: (item: UrgentInventory) => void;
  setProcQty: (qty: number) => void;
}

export default function InputModal({
  showInputModal,
  setShowInputModal,
  isBatchMode,
  statusLocation,
  urgentTab,
  urgentItems,
  YANGGANG_TYPES,
  SET_TYPES,
  selectedProduct,
  setSelectedProduct,
  expiryDate,
  setExpiryDate,
  quantity,
  setQuantity,
  setMemo,
  setSetMemo,
  saveInventory,
  isSaving,
  pendingList,
  addToPending,
  setUrgentProcessTarget,
  setProcQty,
}: InputModalProps) {
  if (!showInputModal) return null;

  // 임박 재고 탭에서 '사용/폐기' 등록을 위해 항목을 먼저 선택하는 화면인지 확인
  const isUrgentSelection = statusLocation === "URGENT" && urgentTab !== "STORAGE";

  return (
    <div className="fixed inset-0 bg-black/60 z-[700] flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setShowInputModal(false)}>
      <div 
        className="bg-[#FDFBF7] w-full max-w-sm rounded-[32px] p-8 border border-[#EFE9E1] shadow-2xl overflow-y-auto max-h-[90vh]" 
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl mb-6 text-center font-bold text-[#5D2E2E]">
          {isUrgentSelection ? "처리할 항목 선택" : "재고 추가"}
        </h2>

        {isUrgentSelection ? (
          /* 1. 임박 재고 처리(사용/폐기)를 위한 품목 선택 리스트 */
          <div className="space-y-2 mb-6">
            {urgentItems.length > 0 ? (
              urgentItems.map((item) => (
                <button 
                  key={item.id} 
                  onClick={() => { 
                    setUrgentProcessTarget(item); 
                    setProcQty(item.quantity); 
                    setShowInputModal(false); 
                  }} 
                  className="w-full p-4 border border-[#F5F0E9] rounded-xl flex justify-between bg-white shadow-sm active:scale-95 transition-all"
                >
                  <span className="font-bold text-sm text-[#3E2723]">
                    {item.product_name} ({item.expiry_date.slice(5)})
                  </span>
                  <span className="font-black text-[#5D2E2E]">{item.quantity}개</span>
                </button>
              ))
            ) : (
              <p className="text-center py-10 text-sm text-[#A68966] italic">보관 중인 임박 재고가 없습니다.</p>
            )}
          </div>
        ) : (
          /* 2. 일반 재고 추가 입력 폼 */
          <>
            {/* 품목 선택 그리드 */}
            <div className="grid grid-cols-4 gap-2 mb-6 max-h-40 overflow-y-auto p-2 border border-[#F5F0E9] rounded-2xl bg-white text-center shadow-inner">
              {(statusLocation === "SET" ? SET_TYPES : YANGGANG_TYPES).map((p) => {
                const pName = statusLocation === "SET" ? p : `${p} 양갱`;
                return (
                  <button 
                    key={p} 
                    onClick={() => setSelectedProduct(pName)} 
                    className={`py-2 text-[10px] rounded-xl border font-bold transition-all ${selectedProduct === pName ? "bg-[#5D2E2E] text-white border-[#5D2E2E]" : "bg-white text-[#A68966] border-[#F5F0E9]"}`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            {/* 유통기한 선택 */}
            <input 
              type="date" 
              value={expiryDate} 
              onChange={(e) => setExpiryDate(e.target.value)} 
              className="w-full mb-4 p-4 border border-[#F5F0E9] rounded-2xl font-bold text-center bg-white outline-none text-[16px] text-[#3E2723]" 
            />

            {/* 세트 재고일 경우 색상 선택 노출 */}
            {statusLocation === "SET" && (
              <div className="flex gap-2 mb-4">
                {["Red", "Navy", "Pink"].map((color) => (
                  <button 
                    key={color} 
                    onClick={() => setSetMemo(color)} 
                    className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${setMemo === color ? "bg-[#5D2E2E] text-white" : "bg-white text-[#A68966] border-[#F5F0E9]"}`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            )}

            {/* 수량 조절 퀵 버튼 */}
            <div className="flex gap-2 mb-6">
              <button onClick={() => setQuantity(quantity + 10)} className="flex-1 py-3 bg-white border border-[#F5F0E9] rounded-xl text-[11px] font-bold text-[#A68966] active:scale-95 shadow-sm">+10</button>
              <button onClick={() => setQuantity(quantity + 40)} className="flex-1 py-3 bg-white border border-[#F5F0E9] rounded-xl text-[11px] font-bold text-[#A68966] active:scale-95 shadow-sm">+40</button>
              <button onClick={() => setQuantity(0)} className="flex-1 py-3 bg-[#FFF5F5] border border-[#FFE3E3] rounded-xl text-[11px] font-bold text-[#DC3545] active:scale-95">초기화</button>
            </div>

            {/* 수량 직접 입력 및 증감 */}
            <div className="flex items-center justify-center gap-8 mb-8">
              <button onClick={() => setQuantity(Math.max(0, quantity - 1))} className="w-12 h-12 border border-[#F5F0E9] rounded-full font-bold bg-white text-[#5D2E2E] shadow-sm active:scale-95">-</button>
              <input 
                type="number" 
                value={quantity || ""} 
                placeholder="0" 
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)} 
                className="w-20 text-center text-4xl font-black bg-transparent outline-none placeholder:text-[#EFE9E1] text-[#3E2723]" 
              />
              <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 border border-[#F5F0E9] rounded-full font-bold bg-white text-[#5D2E2E] shadow-sm active:scale-95">+</button>
            </div>

            {/* 일괄 입고(Batch) 목록 미리보기 */}
            {isBatchMode && pendingList.length > 0 && (
              <div className="mb-6 p-3 bg-[#F9F5F0] rounded-2xl border border-[#F5F0E9] max-h-32 overflow-y-auto shadow-inner">
                {pendingList.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px] font-bold mb-1 border-b border-white/50 pb-1 text-[#A68966]">
                    <span>{item.product_name.replace(" 양갱", "")} ({item.expiry_date.slice(5)})</span>
                    <span>{item.quantity}개</span>
                  </div>
                ))}
              </div>
            )}

            {/* 하단 액션 버튼 */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-3 text-center">
                <button onClick={() => setShowInputModal(false)} className="flex-1 py-4 text-[#A68966] font-bold">취소</button>
                {isBatchMode && (
                  <button onClick={addToPending} className="flex-1 py-4 bg-white border border-[#5D2E2E] text-[#5D2E2E] rounded-2xl font-bold active:scale-95 shadow-sm">+ 추가</button>
                )}
              </div>
              <button 
                onClick={saveInventory} 
                disabled={isSaving} 
                className={`w-full py-4 text-white rounded-2xl font-bold shadow-lg transition-all active:scale-[0.98] ${isSaving ? "bg-[#D1C4B5]" : "bg-[#5D2E2E]"}`}
              >
                {isSaving ? "저장 중..." : "확인"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}