"use client";

export default function InventoryContent({ statusLocation, historyEvents, clearHistory, triggerToast, items, urgentItems, YANGGANG_TYPES, getLocationStock, getDaysUntilExpiry, URGENT_DAYS, ensureAuthenticated, setEditTarget, setEditQty, setMoveTarget, setMoveQty, setDeleteMode, setDeleteTarget, setShowMoveUrgentModal, setMoveUrgentTarget, fmtDate, fmtLoc }: any) {

  // 히스토리 화면
  if (statusLocation === "HISTORY") {
    return (
      <div className="w-full space-y-3 mb-12">
        <div className="flex justify-between items-center px-1 mb-2">
          <h3 className="text-sm font-bold text-[#5D2E2E]">최근 창고 기록</h3>
          <button onClick={clearHistory} className="text-[10px] font-bold text-[#A68966]">비우기</button>
        </div>
        <div className="bg-white rounded-2xl border border-[#EFE9E1] overflow-hidden divide-y">
          {historyEvents.map((ev: any) => (
            <div key={ev.id} className="px-4 py-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-[11px] border ${ev.delta > 0 ? "bg-[#F0F7F4] text-[#198754]" : "bg-[#FFF5F5] text-[#DC3545]"}`}>
                {ev.delta > 0 ? "입고" : "출고"}
              </div>
              <div className="flex-1">
                <div className="font-bold text-[14px]">{ev.product_name}</div>
                <div className="text-[11px] text-[#A68966]">{fmtDate(ev.expiry_date)} · 창고</div>
              </div>
              <div className={`font-bold text-sm ${ev.delta > 0 ? "text-[#198754]" : "text-[#DC3545]"}`}>
                {ev.delta > 0 ? "+" : ""}{ev.delta}개
              </div>
            </div>
          ))}
          {historyEvents.length === 0 && <div className="py-16 text-center text-sm text-[#A68966]">기록 없음</div>}
        </div>
      </div>
    );
  }

  // 재고 합계
  if (statusLocation === "TOTAL") {
    return (
      <div className="w-full bg-white rounded-2xl border border-[#EFE9E1] overflow-hidden mb-12">
        <table className="w-full text-center table-fixed">
          <thead>
            <tr className="bg-[#F9F5F0] text-[#5D2E2E] text-[12px] font-bold border-b">
              <th className="py-3 w-[28%]">품목</th>
              <th className="py-3 w-[24%]">홀</th>
              <th className="py-3 w-[24%]">창고</th>
              <th className="py-3 w-[24%]">합계</th>
            </tr>
          </thead>
          <tbody className="divide-y text-[13px]">
            {YANGGANG_TYPES.map((name: string) => {
              const h = getLocationStock(`${name} 양갱`, "FLOOR");
              const w = getLocationStock(`${name} 양갱`, "WAREHOUSE");
              return (
                <tr key={name}>
                  <td className="py-3 border-r font-bold">{name}</td>
                  <td className="py-3 border-r">{h}개</td>
                  <td className="py-3 border-r">{w}개</td>
                  <td className="py-3 font-black text-[#5D2E2E]">{h+w}개</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  if (statusLocation === "CLOSING") return null;

  return (
    <div className="w-full space-y-4 mb-12">
      {YANGGANG_TYPES.map((name: string) => {
        const pName = `${name} 양갱`;
        const list = statusLocation === "URGENT" 
          ? urgentItems.filter((i: any) => i.product_name === pName) 
          : items.filter((i: any) => i.product_name === pName && i.location === statusLocation);
        
        return (
          <div key={name} className={`bg-white rounded-[24px] border border-[#EFE9E1] overflow-hidden ${list.length === 0 ? "opacity-50" : ""}`}>
            <div className="bg-[#F9F5F0] px-4 py-2 border-b font-bold text-[13px] text-[#5D2E2E]">{name}</div>
            <div className="p-2">
              {list.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {list.map((item: any) => {
                    const days = getDaysUntilExpiry(item.expiry_date);
                    const bulb = days <= 1 ? "bg-red-500" : days <= 14 ? "bg-orange-500" : "bg-green-500";
                    return (
                      <div key={item.id} className="bg-[#FDFBF7] rounded-xl border p-2 flex items-center justify-between">
                        <div onClick={() => { if (statusLocation !== "URGENT" && ensureAuthenticated()) { setEditTarget(item); setEditQty(item.quantity); } }} className="flex items-center gap-2 cursor-pointer overflow-hidden">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${bulb}`} />
                          <span className="text-[12px] font-bold shrink-0">{fmtDate(item.expiry_date)}</span>
                          <span className="text-[12px] font-black shrink-0">{item.quantity}개</span>
                        </div>
                        <div className="flex gap-1">
                          {statusLocation === "FLOOR" && days <= 14 && (<button onClick={() => { if (ensureAuthenticated()) { setMoveUrgentTarget(item); setShowMoveUrgentModal(true); } }} className="w-6 h-6 bg-white border rounded text-orange-500 font-bold">!</button>)}
                          {statusLocation === "WAREHOUSE" && (<button onClick={() => { if (ensureAuthenticated()) { setMoveTarget(item); setMoveQty(item.quantity); } }} className="w-6 h-6 bg-white border rounded text-[11px]">🚚</button>)}
                          <button onClick={() => { if (ensureAuthenticated()) { setDeleteMode(statusLocation === "URGENT" ? "urgent" : "inventory"); setDeleteTarget(item); } }} className="w-6 h-6 bg-[#FFF5F5] border text-[#DC3545] rounded font-bold">×</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-4 text-center text-[12px] text-[#D1C4B5] italic">재고 없음</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}