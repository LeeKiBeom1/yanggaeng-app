"use client";

interface ContentProps {
  statusLocation: string; historyEvents: any[]; persistHistory: (next: any[]) => void; triggerToast: (msg: string) => void; fmtDate: (iso: string) => string; fmtLoc: (loc: any) => string; items: any[]; urgentItems: any[]; YANGGANG_TYPES: string[]; 
  getLocationStock: (name: string, loc: any) => number; getDaysUntilExpiry: (date: string) => number; URGENT_DAYS: number; ensureAuthenticated: () => boolean; 
  setEditTarget: (item: any) => void; setEditQty: (qty: number) => void; setMoveTarget: (item: any) => void; setMoveQty: (qty: number) => void; setDeleteMode: (mode: any) => void; setDeleteTarget: (item: any) => void;
  setShowMoveUrgentModal: (show: boolean) => void; setMoveUrgentTarget: (item: any) => void;
}

export default function InventoryContent(props: ContentProps) {
  const { statusLocation, historyEvents, persistHistory, triggerToast, fmtDate, fmtLoc, items, urgentItems, YANGGANG_TYPES, getLocationStock, getDaysUntilExpiry, URGENT_DAYS, ensureAuthenticated, setEditTarget, setEditQty, setMoveTarget, setMoveQty, setDeleteMode, setDeleteTarget, setShowMoveUrgentModal, setMoveUrgentTarget } = props;

  // 히스토리 화면
  if (statusLocation === "HISTORY") {
    return (
      <div className="space-y-3 mb-12">
        <div className="flex justify-between items-center px-2 mb-2"><h3 className="text-sm font-bold text-[#5D2E2E]">최근 활동 기록</h3><button onClick={() => { persistHistory([]); triggerToast("🧹 히스토리 삭제 완료"); }} className="text-[10px] font-bold text-[#A68966] hover:text-[#5D2E2E]">기록 비우기</button></div>
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-[#EFE9E1] shadow-sm divide-y divide-[#F5F0E9]">
          {historyEvents.map((ev: any) => {
            const isMove = ev.kind === "MOVE";
            const isHall = ev.location === "FLOOR" || ev.from === "FLOOR";
            const delta = ev.delta || 0;
            // 홀 재고 활동은 무조건 "수정"으로 표시 (증감 유지)
            const label = isMove ? "이동" : isHall ? "수정" : (delta > 0 ? "입고" : "출고");

            return (
              <div key={ev.id} className="px-5 py-4 flex items-center gap-4">
                <div className={`w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center font-bold text-[11px] border ${isMove ? "bg-gray-50 text-gray-400" : delta > 0 ? "bg-[#F0F7F4] text-[#198754]" : "bg-[#FFF5F5] text-[#DC3545]"}`}>{label}</div>
                <div className="flex-1 min-w-0"><div className="font-bold text-[14px] text-[#3E2723] truncate">{ev.product_name}</div><div className="text-[11px] text-[#A68966] mt-0.5">{fmtDate(ev.expiry_date)} · {isMove ? `${fmtLoc(ev.from)} → ${fmtLoc(ev.to)}` : fmtLoc(ev.location)}</div></div>
                <div className={`font-bold text-sm ${isMove ? "text-[#3E2723]" : delta > 0 ? "text-[#198754]" : "text-[#DC3545]"}`}>{isMove ? `${ev.qty}개` : `${delta > 0 ? "+" : ""}${delta}개`}</div>
              </div>
            );
          })}
          {historyEvents.length === 0 && <div className="px-6 py-16 text-center text-sm font-medium text-[#A68966]">기록 없음</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-12 px-1">
      {YANGGANG_TYPES.map((name) => {
        const productName = `${name} 양갱`;
        
        // 1. 재고 합계 모드 (3단 정렬 및 폰트 통일)
        if (statusLocation === "TOTAL") {
          const floorQty = getLocationStock(productName, "FLOOR"); const warehouseQty = getLocationStock(productName, "WAREHOUSE"); const total = floorQty + warehouseQty;
          return (
            <div key={name} className={`bg-white rounded-[24px] border shadow-sm overflow-hidden transition-all ${total === 0 ? "opacity-40 border-[#F5F0E9]" : "border-[#EFE9E1]"}`}>
              <div className="bg-[#F9F5F0] px-4 py-2 border-b border-[#F5F0E9] font-bold text-[13px] text-[#5D2E2E]">{name}</div>
              <div className="p-4 grid grid-cols-3 text-center items-center">
                <div className="text-[13px] font-medium text-[#A68966]">홀 <span className="text-[#3E2723] ml-1">{floorQty}개</span></div>
                <div className="text-[13px] font-medium text-[#A68966] border-x border-[#F5F0E9]">창고 <span className="text-[#3E2723] ml-1">{warehouseQty}개</span></div>
                <div className="text-[13px] font-bold text-[#5D2E2E]">합 <span className="text-lg font-black ml-1">{total}개</span></div>
              </div>
            </div>
          );
        }

        // 2. 홀/창고/임박 모드
        let filteredItems = statusLocation === "URGENT" ? urgentItems.filter((i: any) => i.product_name === productName) : items.filter((i: any) => i.product_name === productName && i.location === statusLocation);
        
        return (
          <div key={name} className={`bg-white rounded-[24px] border shadow-sm overflow-hidden transition-all ${filteredItems.length === 0 ? "opacity-60 border-[#F5F0E9]" : "border-[#EFE9E1]"}`}>
            <div className="bg-[#F9F5F0] px-4 py-2 border-b border-[#F5F0E9] font-bold text-[13px] text-[#5D2E2E]">{name}</div>
            <div className="p-2">
              {filteredItems.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {filteredItems.sort((a,b)=>a.expiry_date.localeCompare(b.expiry_date)).map((item: any) => {
                    const daysLeft = getDaysUntilExpiry(item.expiry_date);
                    const bulbColor = daysLeft <= 1 ? "bg-red-500 shadow-[0_0_5px_#ef4444]" : daysLeft <= 14 ? "bg-orange-500 shadow-[0_0_5px_#f97316]" : "bg-green-500 shadow-[0_0_5px_#22c55e]";
                    return (
                      <div key={item.id} className="bg-[#FDFBF7] rounded-xl border border-[#F5F0E9] p-2 flex items-center justify-between gap-1">
                        <div onClick={() => { if (statusLocation !== "URGENT" && ensureAuthenticated()) { setEditTarget(item); setEditQty(item.quantity); } }} className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${bulbColor}`} />
                          <span className="text-[12px] font-bold text-[#5D2E2E] shrink-0">{fmtDate(item.expiry_date)}</span>
                          <span className="text-[12px] font-black text-[#3E2723] shrink-0">{item.quantity}개</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          {statusLocation === "FLOOR" && daysLeft <= 14 && (<button onClick={() => { if (ensureAuthenticated()) { setMoveUrgentTarget(item); setShowMoveUrgentModal(true); } }} className="w-6 h-6 bg-white border border-[#F5F0E9] rounded-md flex items-center justify-center text-orange-500 text-[10px] font-bold shadow-sm active:scale-90">!</button>)}
                          {statusLocation === "WAREHOUSE" && (<button onClick={() => { if (ensureAuthenticated()) { setMoveTarget(item); setMoveQty(item.quantity); } }} className="w-6 h-6 bg-white border border-[#F5F0E9] rounded-md flex items-center justify-center text-[11px] shadow-sm">🚚</button>)}
                          <button onClick={() => { if (ensureAuthenticated()) { setDeleteMode(statusLocation === "URGENT" ? "urgent" : "inventory"); setDeleteTarget(item); } }} className="w-6 h-6 bg-[#FFF5F5] border border-[#FFE3E3] text-[#DC3545] rounded-md flex items-center justify-center text-[14px] font-bold shadow-sm active:scale-90">×</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-4 text-center text-[12px] font-medium text-[#D1C4B5] italic">재고 없음</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}