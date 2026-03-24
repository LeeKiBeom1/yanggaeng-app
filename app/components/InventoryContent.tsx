"use client";

interface ContentProps {
  statusLocation: string;
  historyEvents: any[];
  persistHistory: (next: any[]) => void;
  triggerToast: (msg: string) => void;
  fmtDate: (iso: string) => string; // string으로 수정됨
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

  if (statusLocation === "HISTORY") {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-12">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-[11px] font-bold text-gray-600">히스토리 (+입고 / -차감 / 이동)</div>
          <div className="flex items-center gap-2">
            <div className="text-[10px] font-bold text-gray-400">{historyEvents.length}건</div>
            <button
              onClick={() => { persistHistory([]); triggerToast("🧹 히스토리 삭제 완료"); }}
              className="px-2 py-1 rounded-lg bg-white border border-gray-200 text-[10px] font-bold text-gray-500 hover:bg-gray-50"
            >
              비우기
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {historyEvents.map((ev) => {
            const time = new Date(ev.ts);
            const timeLabel = `${String(time.getMonth() + 1).padStart(2, "0")}/${String(time.getDate()).padStart(2, "0")} ${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`;
            
            if (ev.kind === "MOVE") {
              return (
                <div key={ev.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-10 shrink-0 text-center">
                    <span className="inline-flex items-center justify-center w-10 h-7 rounded-xl bg-gray-50 border border-gray-200 font-bold text-[11px] text-gray-600">이동</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-gray-800 truncate">{ev.product_name}</div>
                    <div className="text-[11px] font-bold text-gray-400">{fmtDate(ev.expiry_date)} · {fmtLoc(ev.from)} → {fmtLoc(ev.to)} · {timeLabel}</div>
                  </div>
                  <div className="font-bold text-sm text-gray-700">{ev.qty}개</div>
                </div>
              );
            }
            const delta = ev.delta;
            const isPlus = delta > 0;
            const badgeClass = isPlus ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-red-50 border-red-100 text-red-600";
            
            // 여기서 ${} 형태인지 다시 한 번 확인했습니다.
            const sub = ev.kind === "EDIT" 
              ? `${fmtDate(ev.expiry_date)} · ${fmtLoc(ev.location)} · ${ev.before} → ${ev.after} · ${timeLabel}` 
              : `${fmtDate(ev.expiry_date)} · ${fmtLoc(ev.location)} · ${timeLabel}`;

            return (
              <div key={ev.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-10 shrink-0 text-center">
                  <span className={`inline-flex items-center justify-center w-10 h-7 rounded-xl border font-bold text-[12px] ${badgeClass}`}>{isPlus ? "+" : "-"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-gray-800 truncate">{ev.product_name}</div>
                  <div className="text-[11px] font-bold text-gray-400">{sub}</div>
                </div>
                <div className={`font-bold text-sm ${isPlus ? "text-blue-600" : "text-red-600"}`}>{isPlus ? `+${delta}` : `${delta}`}개</div>
              </div>
            );
          })}
          {historyEvents.length === 0 && <div className="px-6 py-10 text-center text-sm font-bold text-gray-400">아직 기록된 히스토리가 없습니다.</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-12">
      <table className="w-full text-center border-collapse">
        <thead>
          <tr className="bg-gray-50 text-[#666] text-[11px] border-b border-gray-200 font-bold">
            <th className="py-3 border-r border-gray-100 w-24">품목</th>
            {statusLocation === "TOTAL" ? (
              <>
                <th className="py-3 px-6 border-r border-gray-100 min-w-[92px]">홀</th>
                <th className="py-3 px-6 border-r border-gray-100 min-w-[92px]">창고</th>
                <th className="py-3 px-6 bg-blue-50 text-blue-600 min-w-[92px]">총합</th>
              </>
            ) : (
              <th className="py-3 text-left pl-6 font-bold">{statusLocation === "URGENT" ? `임박 재고 (D-${URGENT_DAYS} 이내)` : "상세 수량"}</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {YANGGANG_TYPES.map((name) => {
            const productName = `${name} 양갱`;
            if (statusLocation === "TOTAL") {
              const floorQty = getLocationStock(productName, "FLOOR");
              const warehouseQty = getLocationStock(productName, "WAREHOUSE");
              const total = floorQty + warehouseQty;
              return (
                <tr key={name} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 border-r border-gray-100 font-bold text-[12px] bg-gray-50/30">{name}</td>
                  <td className="py-3 px-6 border-r border-gray-100 font-medium text-sm text-gray-600">{floorQty || "-"}</td>
                  <td className="py-3 px-6 border-r border-gray-100 font-medium text-sm text-gray-600">{warehouseQty || "-"}</td>
                  <td className="py-3 px-6 font-bold text-base text-blue-600 bg-blue-50/20">{total || "0"}</td>
                </tr>
              );
            }
            let filteredItems = statusLocation === "URGENT" ? urgentItems.filter((i) => i.product_name === productName) : items.filter((i) => i.product_name === productName && i.location === statusLocation);
            if (statusLocation === "URGENT" && filteredItems.length === 0) return null;
            filteredItems = filteredItems.slice().sort((a, b) => String(a.expiry_date).localeCompare(String(b.expiry_date)));
            return (
              <tr key={name} className="hover:bg-gray-50 transition-colors">
                <td className="py-4 border-r border-gray-100 font-bold text-[12px] bg-gray-50/30">{name}</td>
                <td className="py-3 px-4 text-left">
                  <div className="flex flex-col gap-2">
                    {filteredItems.map((item) => (
                      <div key={item.id} className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 min-w-full relative shadow-sm">
                        <div
                          onClick={() => {
                            if (statusLocation !== "URGENT") {
                              if (!ensureAuthenticated()) return;
                              setEditTarget(item);
                              setEditQty(item.quantity);
                            }
                          }}
                          className={`flex-1 font-bold text-sm ${statusLocation === "URGENT" ? "text-left" : "text-center cursor-pointer"} pr-14`}
                        >
                          {(() => {
                            const daysLeft = getDaysUntilExpiry(item.expiry_date);
                            const urgentTextClass = daysLeft <= 1 ? "text-red-600" : daysLeft <= URGENT_DAYS ? "text-orange-500" : "text-gray-700";
                            return <><span className={urgentTextClass}>{item.expiry_date.slice(5).replace("-", "/")}</span><span className="mx-2 opacity-30">-</span><span className={urgentTextClass}>{item.quantity}개</span></>;
                          })()}
                        </div>
                        <div className="absolute right-1 flex gap-1">
                          {statusLocation !== "URGENT" && (
                            <button onClick={() => { if (!ensureAuthenticated()) return; setMoveTarget(item); setMoveQty(item.quantity); }} className="p-1 hover:bg-gray-100 rounded text-blue-500 text-xs font-bold">🚚</button>
                          )}
                          <button onClick={() => { if (!ensureAuthenticated()) return; setDeleteMode(statusLocation === "URGENT" ? "urgent" : "inventory"); setDeleteTarget(item); }} className="p-1 hover:bg-red-50 rounded text-red-500 text-lg font-bold leading-none">×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}