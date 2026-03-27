"use client";

export default function InventoryContent({ statusLocation, urgentTab, historyEvents, clearHistory, items, urgentItems, setInventoryItems, noticeItems, usageItems, disposalItems, YANGGANG_TYPES, SET_TYPES, getLocationStock, getDaysUntilExpiry, ensureAuthenticated, setEditTarget, setEditQty, setMoveTarget, setMoveQty, setDeleteMode, setDeleteTarget, setShowMoveUrgentModal, setMoveUrgentTarget, fmtDate }: any) {

  if (statusLocation === "HISTORY") {
    // 히스토리 내 임박 내역 그룹화 로직 생략(공통 렌더링 사용)
    return (
      <div className="w-full space-y-6 mb-12">
        <div className="bg-white rounded-2xl border border-[#EFE9E1] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#F5F0E9] flex justify-between items-center bg-[#F9F5F0]">
            <h3 className="text-sm font-bold text-[#5D2E2E]">최근 입출고 기록</h3>
            <button onClick={clearHistory} className="text-[10px] font-bold text-[#A68966]">기록 비우기</button>
          </div>
          <div className="divide-y divide-[#F5F0E9]">
            {historyEvents.map((ev: any) => (
              <div key={ev.id} className="px-4 py-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-[11px] border ${ev.kind === "MOVE" ? "bg-[#FFF9F0] text-[#A68966]" : ev.delta > 0 ? "bg-[#F0F7F4] text-[#198754]" : "bg-[#FFF5F5] text-[#DC3545]"}`}>{ev.kind === "MOVE" ? "이동" : ev.delta > 0 ? "입고" : "출고"}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[14px] text-[#3E2723] truncate">{ev.product_name}</div>
                  <div className="text-[11px] text-[#A68966]">{fmtDate(ev.expiry_date)} · 창고 {ev.kind === "MOVE" && "→ 홀"}</div>
                </div>
                <div className={`font-bold text-sm ${ev.delta > 0 && ev.kind !== "MOVE" ? "text-[#198754]" : "text-[#DC3545]"}`}>{ev.delta > 0 && ev.kind !== "MOVE" ? "+" : ""}{ev.delta}개</div>
              </div>
            ))}
            {historyEvents.length === 0 && <div className="py-16 text-center text-sm text-[#A68966]">기록 없음</div>}
          </div>
        </div>
      </div>
    );
  }

  if (statusLocation === "TOTAL") {
    return (
      <div className="w-full bg-white rounded-2xl border border-[#EFE9E1] overflow-hidden shadow-sm mb-12">
        <table className="w-full text-center table-fixed border-collapse">
          <thead>
            <tr className="bg-[#F9F5F0] text-[#5D2E2E] text-[12px] font-bold border-b border-[#EFE9E1]">
              <th className="py-3 border-r border-[#EFE9E1] w-[28%]">품목</th>
              <th className="py-3 border-r border-[#EFE9E1] w-[24%]">홀</th>
              <th className="py-3 border-r border-[#EFE9E1] w-[24%]">창고</th>
              <th className="py-3 w-[24%]">합계</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F0E9]">
            {YANGGANG_TYPES.map((name: string) => {
              const h = getLocationStock(`${name} 양갱`, "FLOOR");
              const w = getLocationStock(`${name} 양갱`, "WAREHOUSE");
              return (
                <tr key={name} className="text-[13px]">
                  <td className="py-3 border-r border-[#F5F0E9] font-bold text-[#5D2E2E]">{name}</td>
                  <td className="py-3 border-r border-[#F5F0E9] text-[#3E2723]">{h}개</td>
                  <td className="py-3 border-r border-[#F5F0E9] text-[#3E2723]">{w}개</td>
                  <td className="py-3 font-black text-[#5D2E2E]">{h + w}개</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  if (statusLocation === "NOTICE") {
    return (
      <div className="w-full space-y-4 mb-12">
        {noticeItems.map((n: any) => (
          <div key={n.id} className="bg-white rounded-3xl border border-[#EFE9E1] p-6 shadow-sm relative group">
            <div className="text-[10px] font-bold text-[#A68966] mb-2">{new Date(n.created_at).toLocaleDateString()}</div>
            <div className="text-lg font-bold text-[#5D2E2E] mb-3">{n.title}</div>
            <div className="text-sm text-[#3E2723] leading-relaxed whitespace-pre-wrap">{n.content}</div>
            <button onClick={() => { if (ensureAuthenticated()) { setDeleteMode("notice"); setDeleteTarget(n); } }} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center text-[#DC3545] opacity-0 group-hover:opacity-100 transition-opacity">×</button>
          </div>
        ))}
      </div>
    );
  }

  // 임박 사용/폐기 내역 렌더링
  if (statusLocation === "URGENT" && (urgentTab === "USAGE" || urgentTab === "DISPOSAL")) {
    const dataList = urgentTab === "USAGE" ? usageItems : disposalItems;
    const title = urgentTab === "USAGE" ? "사용 내역" : "폐기 내역";
    const mode = urgentTab === "USAGE" ? "usage" : "disposal";

    return (
      <div className="w-full space-y-4 mb-12">
        <h3 className="px-1 text-sm font-bold text-[#5D2E2E]">{title} (최근 30일)</h3>
        {dataList.length > 0 ? (
          <div className="bg-white rounded-2xl border border-[#EFE9E1] divide-y">
            {dataList.map((item: any) => (
              <div key={item.id} className="px-4 py-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[14px] text-[#3E2723]">{item.product_name}</div>
                  <div className="text-[11px] text-[#A68966]">{fmtDate(item.expiry_date)} 등록</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-black text-[#5D2E2E]">{item.quantity}개</span>
                  <button onClick={() => { if (ensureAuthenticated()) { setDeleteMode(mode); setDeleteTarget(item); } }} className="text-[#DC3545] font-bold px-2">×</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-sm text-[#A68966] italic">최근 {title}이 없습니다.</div>
        )}
      </div>
    );
  }

  const currentTypes = statusLocation === "SET" ? SET_TYPES : YANGGANG_TYPES;
  if (statusLocation === "CLOSING") return null;

  return (
    <div className="w-full space-y-4 mb-12">
      {currentTypes.map((name: string) => {
        const pName = statusLocation === "SET" ? name : `${name} 양갱`;
        let list = (statusLocation === "SET") 
          ? setInventoryItems.filter((i: any) => i.set_name === pName)
          : (statusLocation === "URGENT")
            ? urgentItems.filter((i: any) => i.product_name === pName)
            : items.filter((i: any) => i.product_name === pName && i.location === statusLocation);
        
        return (
          <div key={name} className={`bg-white rounded-[24px] border border-[#EFE9E1] shadow-sm overflow-hidden ${list.length === 0 ? "opacity-60" : ""}`}>
            <div className="bg-[#F9F5F0] px-4 py-2 border-b border-[#F5F0E9] font-bold text-[13px] text-[#5D2E2E]">{name}</div>
            <div className="p-2">
              {list.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {list.map((item: any) => {
                    const d = getDaysUntilExpiry(item.expiry_date);
                    const b = d <= 1 ? "bg-red-500 shadow-[0_0_5px_#ef4444]" : d <= 14 ? "bg-orange-500 shadow-[0_0_5px_#f97316]" : "bg-green-500 shadow-[0_0_5px_#22c55e]";
                    return (
                      <div key={item.id} className="bg-[#FDFBF7] rounded-xl border border-[#F5F0E9] p-2 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <div onClick={() => { if (statusLocation !== "URGENT" && statusLocation !== "SET" && ensureAuthenticated()) { setEditTarget(item); setEditQty(item.quantity); } }} className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${b}`} />
                            <span className="text-[12px] font-bold text-[#5D2E2E] shrink-0">{fmtDate(item.expiry_date)}</span>
                            <span className="text-[12px] font-black text-[#3E2723] shrink-0">{item.quantity}개</span>
                          </div>
                          <div className="flex gap-1 shrink-0 ml-1">
                            {statusLocation === "FLOOR" && d <= 14 && (<button onClick={() => { if (ensureAuthenticated()) { setMoveUrgentTarget(item); setShowMoveUrgentModal(true); } }} className="w-6 h-6 bg-white border border-[#F5F0E9] rounded text-orange-500 font-bold text-[10px]">!</button>)}
                            {statusLocation === "WAREHOUSE" && (<button onClick={() => { if (ensureAuthenticated()) { setMoveTarget(item); setMoveQty(item.quantity); } }} className="w-6 h-6 bg-white border border-[#F5F0E9] rounded text-[11px]">🚚</button>)}
                            <button onClick={() => { if (ensureAuthenticated()) { setDeleteMode(statusLocation === "SET" ? "set" : statusLocation === "URGENT" ? "urgent" : "inventory"); setDeleteTarget(item); } }} className="w-6 h-6 bg-[#FFF5F5] border border-[#FFE3E3] text-[#DC3545] rounded font-bold text-sm">×</button>
                          </div>
                        </div>
                        {item.color_data && <div className="text-[10px] font-bold ml-3.5" style={{ color: item.color_data === "Red" ? "#DC3545" : item.color_data === "Navy" ? "#001F3F" : "#FF69B4" }}>● {item.color_data}</div>}
                      </div>
                    );
                  })}
                </div>
              ) : (<div className="py-4 text-center text-[12px] text-[#D1C4B5] italic">재고 없음</div>)}
            </div>
          </div>
        );
      })}
    </div>
  );
}