"use client";

interface ContentProps {
  statusLocation: string;
  historyEvents: any[];
  persistHistory: (next: any[]) => void;
  triggerToast: (msg: string) => void;
  fmtDate: (iso: string) => string;
  fmtLoc: (loc: any) => string;
  items: any[];
  urgentItems: any[];
  YANGGANG_TYPES: string[];
  getLocationStock: (name: string, loc: any) => number;
  getDaysUntilExpiry: (date: string) => number;
  URGENT_DAYS: number;
  ensureAuthenticated: () => boolean;
  setEditTarget: (item: any) => void;
  setEditQty: (qty: number) => void;
  setMoveTarget: (item: any) => void;
  setMoveQty: (qty: number) => void;
  setDeleteMode: (mode: any) => void;
  setDeleteTarget: (item: any) => void;
}

export default function InventoryContent(props: ContentProps) {
  const {
    statusLocation, historyEvents, persistHistory, triggerToast,
    fmtDate, fmtLoc, items, urgentItems, YANGGANG_TYPES,
    getLocationStock, getDaysUntilExpiry, URGENT_DAYS,
    ensureAuthenticated, setEditTarget, setEditQty,
    setMoveTarget, setMoveQty, setDeleteMode, setDeleteTarget
  } = props;

  // 1. 히스토리 디자인 (프리미엄 스타일)
  if (statusLocation === "HISTORY") {
    return (
      <div className="space-y-3 mb-12">
        <div className="flex justify-between items-center px-2 mb-2">
          <h3 className="text-sm font-bold text-[#5D2E2E]">최근 활동 기록</h3>
          <button
            onClick={() => { persistHistory([]); triggerToast("🧹 히스토리 삭제 완료"); }}
            className="text-[10px] font-bold text-[#A68966] hover:text-[#5D2E2E] transition-colors"
          >
            기록 비우기
          </button>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-[#EFE9E1] overflow-hidden shadow-sm">
          <div className="divide-y divide-[#F5F0E9]">
            {historyEvents.map((ev) => {
              const time = new Date(ev.ts);
              const timeLabel = `${String(time.getMonth() + 1).padStart(2, "0")}/${String(time.getDate()).padStart(2, "0")} ${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`;
              const isMove = ev.kind === "MOVE";
              const isPlus = ev.delta > 0;

              return (
                <div key={ev.id} className="px-5 py-4 flex items-center gap-4 hover:bg-[#FDFBF7] transition-colors">
                  <div className={`w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center font-bold text-[11px] border ${
                    isMove ? "bg-gray-50 border-gray-100 text-gray-400" : 
                    isPlus ? "bg-[#F0F7F4] border-[#D1E7DD] text-[#198754]" : "bg-[#FFF5F5] border-[#FFE3E3] text-[#DC3545]"
                  }`}>
                    {isMove ? "이동" : isPlus ? "입고" : "출고"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14px] text-[#3E2723] truncate">{ev.product_name}</div>
                    <div className="text-[11px] text-[#A68966] font-medium mt-0.5">
                       {fmtDate(ev.expiry_date)} · {isMove ? `${fmtLoc(ev.from)} → ${fmtLoc(ev.to)}` : fmtLoc(ev.location)} · {timeLabel}
                    </div>
                  </div>
                  <div className={`font-bold text-sm ${isMove ? "text-[#3E2723]" : isPlus ? "text-[#198754]" : "text-[#DC3545]"}`}>
                    {isMove ? `${ev.qty}개` : `${isPlus ? "+" : ""}${ev.delta}개`}
                  </div>
                </div>
              );
            })}
          </div>
          {historyEvents.length === 0 && <div className="px-6 py-16 text-center text-sm font-medium text-[#A68966]">아직 기록된 활동이 없습니다.</div>}
        </div>
      </div>
    );
  }

  // 2. 재고 목록 및 합계 (카드 리스트 스타일)
  return (
    <div className="space-y-4 mb-12 px-1">
      {YANGGANG_TYPES.map((name) => {
        const productName = `${name} 양갱`;
        
        // 데이터 필터링 로직 (기능 유지)
        if (statusLocation === "TOTAL") {
          const floorQty = getLocationStock(productName, "FLOOR");
          const warehouseQty = getLocationStock(productName, "WAREHOUSE");
          const total = floorQty + warehouseQty;
          if (total === 0) return null; // 합계가 0이면 표시 안 함 (깔끔하게)

          return (
            <div key={name} className="bg-white rounded-3xl p-5 border border-[#EFE9E1] shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-[#F9F5F0] rounded-2xl flex items-center justify-center text-[#5D2E2E] font-bold text-xs shrink-0 border border-[#F0E6D9]">
                {name[0]}
              </div>
              <div className="flex-1">
                <div className="font-bold text-[15px] text-[#3E2723]">{name} 양갱</div>
                <div className="flex gap-3 mt-1">
                   <span className="text-[11px] font-medium text-[#A68966]">홀: <span className="text-[#3E2723]">{floorQty}</span></span>
                   <span className="text-[11px] font-medium text-[#A68966]">창고: <span className="text-[#3E2723]">{warehouseQty}</span></span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-[#A68966] uppercase tracking-wider mb-1">Total</div>
                <div className="text-xl font-black text-[#5D2E2E]">{total}</div>
              </div>
            </div>
          );
        }

        let filteredItems = statusLocation === "URGENT" 
          ? urgentItems.filter((i) => i.product_name === productName) 
          : items.filter((i) => i.product_name === productName && i.location === statusLocation);

        if (filteredItems.length === 0) return null;
        filteredItems = filteredItems.slice().sort((a, b) => String(a.expiry_date).localeCompare(String(b.expiry_date)));

        return (
          <div key={name} className="bg-white rounded-3xl border border-[#EFE9E1] shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-[#F9F5F0]/50 border-b border-[#F5F0E9] flex justify-between items-center">
              <span className="font-bold text-[13px] text-[#5D2E2E]">{name} 양갱</span>
              <span className="text-[10px] font-bold text-[#A68966] bg-white px-2 py-0.5 rounded-full border border-[#EFE9E1]">
                {filteredItems.length} Batch
              </span>
            </div>
            <div className="p-3 space-y-2">
              {filteredItems.map((item) => {
                const daysLeft = getDaysUntilExpiry(item.expiry_date);
                const isUrgent = daysLeft <= URGENT_DAYS;
                const isDanger = daysLeft <= 1;

                return (
                  <div key={item.id} className="flex items-center justify-between bg-[#FDFBF7] border border-[#F5F0E9] rounded-2xl px-4 py-3 group">
                    <div 
                      onClick={() => {
                        if (statusLocation !== "URGENT") {
                          if (!ensureAuthenticated()) return;
                          setEditTarget(item); setEditQty(item.quantity);
                        }
                      }}
                      className={`flex-1 flex items-center gap-3 ${statusLocation !== "URGENT" ? "cursor-pointer" : ""}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${isDanger ? "bg-red-500" : isUrgent ? "bg-orange-400" : "bg-green-400"}`} />
                      <div className="font-bold text-[13px] text-[#3E2723]">
                        {item.expiry_date.slice(5).replace("-", "/")} 
                        <span className="mx-2 text-[#EFE9E1]">|</span>
                        <span className={isDanger ? "text-red-600" : "text-[#5D2E2E]"}>{item.quantity}개</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {statusLocation !== "URGENT" && (
                        <button onClick={() => { if (!ensureAuthenticated()) return; setMoveTarget(item); setMoveQty(item.quantity); }} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#EFE9E1] text-[#A68966] transition-colors">🚚</button>
                      )}
                      <button onClick={() => { if (!ensureAuthenticated()) return; setDeleteMode(statusLocation === "URGENT" ? "urgent" : "inventory"); setDeleteTarget(item); }} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#FFE3E3] text-[#DC3545] transition-colors text-lg">×</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}