"use client";

interface ContentProps {
  statusLocation: string; historyEvents: any[]; persistHistory: (next: any[]) => void; triggerToast: (msg: string) => void; fmtDate: (iso: string) => string; fmtLoc: (loc: any) => string; items: any[]; urgentItems: any[]; YANGGANG_TYPES: string[]; 
  getLocationStock: (name: string, loc: any) => number; getDaysUntilExpiry: (date: string) => number; URGENT_DAYS: number; ensureAuthenticated: () => boolean; 
  setEditTarget: (item: any) => void; setEditQty: (qty: number) => void; setMoveTarget: (item: any) => void; setMoveQty: (qty: number) => void; setDeleteMode: (mode: any) => void; setDeleteTarget: (item: any) => void;
  setShowMoveUrgentModal: (show: boolean) => void; setMoveUrgentTarget: (item: any) => void;
}

export default function InventoryContent(props: ContentProps) {
  const { statusLocation, historyEvents, persistHistory, triggerToast, fmtDate, fmtLoc, items, urgentItems, YANGGANG_TYPES, getLocationStock, getDaysUntilExpiry, URGENT_DAYS, ensureAuthenticated, setEditTarget, setEditQty, setMoveTarget, setMoveQty, setDeleteMode, setDeleteTarget, setShowMoveUrgentModal, setMoveUrgentTarget } = props;

  if (statusLocation === "HISTORY") {
    return (
      <div className="space-y-3 mb-12">
        <div className="flex justify-between items-center px-2 mb-2"><h3 className="text-sm font-bold text-[#5D2E2E]">최근 활동 기록</h3><button onClick={() => { persistHistory([]); triggerToast("🧹 히스토리 삭제 완료"); }} className="text-[10px] font-bold text-[#A68966] hover:text-[#5D2E2E]">기록 비우기</button></div>
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-[#EFE9E1] shadow-sm divide-y divide-[#F5F0E9]">
          {historyEvents.map((ev: any) => (
            <div key={ev.id} className="px-5 py-4 flex items-center gap-4">
              <div className={`w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center font-bold text-[11px] border ${ev.kind === "MOVE" ? "bg-gray-50 text-gray-400" : ev.delta > 0 ? "bg-[#F0F7F4] text-[#198754]" : "bg-[#FFF5F5] text-[#DC3545]"}`}>{ev.kind === "MOVE" ? "이동" : ev.delta > 0 ? "입고" : "출고"}</div>
              <div className="flex-1 min-w-0"><div className="font-bold text-[14px] text-[#3E2723] truncate">{ev.product_name}</div><div className="text-[11px] text-[#A68966] mt-0.5">{fmtDate(ev.expiry_date)} · {ev.kind === "MOVE" ? `${fmtLoc(ev.from)} → ${fmtLoc(ev.to)}` : fmtLoc(ev.location)}</div></div>
              <div className={`font-bold text-sm ${ev.kind === "MOVE" ? "text-[#3E2723]" : ev.delta > 0 ? "text-[#198754]" : "text-[#DC3545]"}`}>{ev.kind === "MOVE" ? `${ev.qty}개` : `${ev.delta > 0 ? "+" : ""}${ev.delta}개`}</div>
            </div>
          ))}
          {historyEvents.length === 0 && <div className="px-6 py-16 text-center text-sm font-medium text-[#A68966]">기록 없음</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 mb-12 px-1">
      {YANGGANG_TYPES.map((name) => {
        const productName = `${name} 양갱`;
        
        if (statusLocation === "TOTAL") {
          const floorQty = getLocationStock(productName, "FLOOR"); const warehouseQty = getLocationStock(productName, "WAREHOUSE"); const total = floorQty + warehouseQty;
          return (
            <div key={name} className={`bg-white rounded-[20px] p-4 border shadow-sm flex items-center justify-between transition-all ${total === 0 ? "opacity-40 border-[#F5F0E9]" : "border-[#EFE9E1]"}`}>
              <span className="font-bold text-[14px] text-[#3E2723]">{name}</span>
              <div className="flex gap-4 text-[11px] font-medium text-[#A68966]"><span>홀 <span className="text-[#3E2723]">{floorQty}</span></span><span>창고 <span className="text-[#3E2723]">{warehouseQty}</span></span></div>
              <span className={`text-[16px] font-black w-10 text-right ${total === 0 ? "text-[#D1C4B5]" : "text-[#5D2E2E]"}`}>{total}</span>
            </div>
          );
        }

        let filteredItems = statusLocation === "URGENT" ? urgentItems.filter((i: any) => i.product_name === productName) : items.filter((i: any) => i.product_name === productName && i.location === statusLocation);
        if (statusLocation === "URGENT" && filteredItems.length === 0) return null;
        
        return (
          <div key={name} className={`bg-white rounded-[24px] border border-[#EFE9E1] p-2 shadow-sm ${filteredItems.length === 0 ? "opacity-60" : ""}`}>
            <div className="grid grid-cols-2 gap-2">
              {filteredItems.length > 0 ? filteredItems.sort((a,b)=>a.expiry_date.localeCompare(b.expiry_date)).map((item: any) => {
                const daysLeft = getDaysUntilExpiry(item.expiry_date);
                return (
                  <div key={item.id} className="bg-[#FDFBF7] rounded-xl border border-[#F5F0E9] p-2 flex items-center justify-between gap-1 overflow-hidden">
                    <div onClick={() => { if (statusLocation !== "URGENT" && ensureAuthenticated()) { setEditTarget(item); setEditQty(item.quantity); } }} className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer">
                      <span className="font-bold text-[11px] text-[#5D2E2E] shrink-0">{name}</span>
                      <span className={`text-[9px] font-bold shrink-0 ${daysLeft <= 1 ? "text-red-500" : daysLeft <= 14 ? "text-orange-500" : "text-[#A68966]"}`}>{fmtDate(item.expiry_date)}</span>
                      <span className="font-black text-[11px] text-[#3E2723] shrink-0">{item.quantity}개</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {statusLocation === "FLOOR" && daysLeft <= 14 && (
                        <button onClick={() => { if (ensureAuthenticated()) { setMoveUrgentTarget(item); setShowMoveUrgentModal(true); } }} className="w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm active:scale-90">!</button>
                      )}
                      {statusLocation === "WAREHOUSE" && (
                        <button onClick={() => { if (ensureAuthenticated()) { setMoveTarget(item); setMoveQty(item.quantity); } }} className="w-5 h-5 flex items-center justify-center text-[10px]">🚚</button>
                      )}
                      <button onClick={() => { if (ensureAuthenticated()) { setDeleteMode(statusLocation === "URGENT" ? "urgent" : "inventory"); setDeleteTarget(item); } }} className="w-5 h-5 flex items-center justify-center text-[#DC3545] text-[15px] font-bold">×</button>
                    </div>
                  </div>
                );
              }) : (
                <div className="col-span-2 py-2 flex items-center justify-center gap-3">
                  <span className="font-bold text-[12px] text-[#D1C4B5]">{name}</span>
                  <span className="text-[11px] text-[#D1C4B5] italic">재고 없음</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}