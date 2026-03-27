"use client";
import { useState } from "react";

interface ContentProps {
  statusLocation: string;
  archiveTab: string;
  urgentTab: string;
  userRole: "ADMIN" | "STAFF";
  historyEvents: any[];
  clearHistory: () => void;
  items: any[];
  urgentItems: any[];
  setInventoryItems: any[];
  noticeItems: any[];
  usageItems: any[];
  disposalItems: any[];
  closingRecords: any[];
  YANGGANG_TYPES: string[];
  SET_TYPES: string[];
  getLocationStock: (pName: string, loc: any) => number; // [수정] 타입 호환성 해결
  getDaysUntilExpiry: (date: string) => number;
  ensureAuthenticated: () => boolean;
  setEditTarget: (item: any) => void;
  setMoveTarget: (item: any) => void;
  setMoveQty: (qty: number) => void;
  setDeleteMode: (mode: string) => void;
  setDeleteTarget: (item: any) => void;
  setShowMoveUrgentModal: (show: boolean) => void;
  setMoveUrgentTarget: (item: any) => void;
  fmtDate: (iso: string) => string;
}

export default function InventoryContent(props: ContentProps) {
  const {
    statusLocation,
    archiveTab,
    urgentTab,
    userRole,
    historyEvents,
    clearHistory,
    items,
    urgentItems,
    setInventoryItems,
    noticeItems,
    usageItems,
    disposalItems,
    closingRecords,
    YANGGANG_TYPES,
    SET_TYPES,
    getLocationStock,
    getDaysUntilExpiry,
    ensureAuthenticated,
    setEditTarget,
    setMoveTarget,
    setMoveQty,
    setDeleteMode,
    setDeleteTarget,
    setShowMoveUrgentModal,
    setMoveUrgentTarget,
    fmtDate,
  } = props;

  const [showDetail, setShowDetail] = useState(false);

  // 1. 재고 합계 화면 (통합 뷰 + 상세보기 기능)
  if (statusLocation === "TOTAL") {
    return (
      <div className="w-full bg-white rounded-2xl border border-[#EFE9E1] overflow-hidden mb-12 shadow-sm">
        <div className="p-4 border-b border-[#F5F0E9] flex justify-between items-center bg-[#F9F5F0]">
          <h3 className="text-sm font-bold text-[#5D2E2E]">전체 재고 통합 뷰</h3>
          <button
            onClick={() => setShowDetail(!showDetail)}
            className="text-[10px] font-bold px-3 py-1.5 rounded-lg border bg-white text-[#A68966] active:scale-95 transition-all"
          >
            {showDetail ? "간략히 보기" : "상세 내역 보기"}
          </button>
        </div>
        <table className="w-full text-center table-fixed border-collapse">
          <thead>
            <tr className="bg-[#F9F5F0] text-[#5D2E2E] text-[11px] font-bold border-b border-[#EFE9E1]">
              <th className="py-3 w-[30%] border-r border-[#EFE9E1]">품목</th>
              <th className="py-3 w-[23%] border-r border-[#EFE9E1]">홀</th>
              <th className="py-3 w-[23%] border-r border-[#EFE9E1]">창고</th>
              <th className="py-3 w-[24%]">총계</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F0E9]">
            {YANGGANG_TYPES.map((name: string) => {
              const h = getLocationStock(`${name} 양갱`, "FLOOR");
              const w = getLocationStock(`${name} 양갱`, "WAREHOUSE");
              const details = items.filter((i: any) => i.product_name === `${name} 양갱`);
              return (
                <tr key={name} className="text-[13px]">
                  <td className="py-4 border-r border-[#F5F0E9]">
                    <div className="font-bold text-[#5D2E2E]">{name}</div>
                    {showDetail && details.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {details.map((d: any) => (
                          <div key={d.id} className="text-[9px] text-gray-400 font-medium">
                            [{d.location === "FLOOR" ? "홀" : "창"}] {d.expiry_date.slice(5)} ({d.quantity})
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-4 border-r border-[#F5F0E9] font-medium">{h}개</td>
                  <td className="py-4 border-r border-[#F5F0E9] font-medium">{w}개</td>
                  <td className="py-4 font-black text-[#5D2E2E] bg-[#FDFBF7]/50">{h + w}개</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // 2. 기록 보관소 (입출고 기록 / 일마감 기록)
  if (statusLocation === "ARCHIVE") {
    if (archiveTab === "DAILY") {
      return (
        <div className="w-full space-y-3 mb-12">
          <h3 className="px-1 text-sm font-bold text-[#5D2E2E]">일마감 기록 보관소</h3>
          {closingRecords.map((rec: any) => (
            <div key={rec.id} className="bg-white rounded-2xl border border-[#EFE9E1] p-5 shadow-sm flex justify-between items-center">
              <div>
                <div className="text-sm font-bold text-[#5D2E2E]">{rec.closing_date} 마감 기록</div>
                <div className="text-[10px] text-[#A68966] mt-1">담당: {rec.user_id}</div>
              </div>
              <button
                onClick={() => {
                  if (userRole === "ADMIN") {
                    setDeleteMode("daily");
                    setDeleteTarget(rec);
                  }
                }}
                className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${
                  userRole === "ADMIN" ? "bg-[#FFF5F5] text-[#DC3545] active:scale-95" : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                삭제
              </button>
            </div>
          ))}
          {closingRecords.length === 0 && <div className="py-20 text-center text-sm text-[#A68966] italic">저장된 마감 기록이 없습니다.</div>}
        </div>
      );
    }

    return (
      <div className="w-full space-y-3 mb-12">
        <div className="flex justify-between items-center px-1 mb-2">
          <h3 className="text-sm font-bold text-[#5D2E2E]">입출고 활동 로그</h3>
          {userRole === "ADMIN" && (
            <button onClick={clearHistory} className="text-[10px] font-bold text-[#A68966] hover:text-[#5D2E2E]">기록 비우기</button>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-[#EFE9E1] divide-y divide-[#F5F0E9] overflow-hidden shadow-sm">
          {historyEvents.map((ev: any) => (
            <div key={ev.id} className="px-4 py-4 flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-[11px] border ${
                  ev.kind === "MOVE" ? "bg-[#FFF9F0] text-[#A68966] border-[#F5E9D1]" : ev.delta > 0 ? "bg-[#F0F7F4] text-[#198754] border-[#D1E7DD]" : "bg-[#FFF5F5] text-[#DC3545] border-[#F8D7DA]"
                }`}
              >
                {ev.kind === "MOVE" ? "이동" : ev.delta > 0 ? "입고" : "출고"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[14px] text-[#3E2723] truncate">{ev.product_name}</div>
                <div className="text-[10px] text-[#A68966] mt-0.5">
                  {fmtDate(ev.expiry_date)} · {ev.user_id || "시스템"}
                </div>
              </div>
              <div className={`font-bold text-sm ${ev.delta > 0 && ev.kind !== "MOVE" ? "text-[#198754]" : "text-[#DC3545]"}`}>
                {ev.delta > 0 && ev.kind !== "MOVE" ? "+" : ""}
                {ev.delta}개
              </div>
            </div>
          ))}
          {historyEvents.length === 0 && <div className="py-20 text-center text-sm text-[#A68966] italic">활동 기록이 없습니다.</div>}
        </div>
      </div>
    );
  }

  // 3. 공지사항 화면
  if (statusLocation === "NOTICE") {
    return (
      <div className="w-full space-y-4 mb-12">
        <h3 className="px-1 text-sm font-bold text-[#5D2E2E]">매장 공지사항</h3>
        {noticeItems.map((n: any) => (
          <div key={n.id} className="bg-white rounded-3xl border border-[#EFE9E1] p-6 shadow-sm relative group">
            <div className="text-[10px] font-bold text-[#A68966] mb-2">{new Date(n.created_at).toLocaleDateString()}</div>
            <div className="text-lg font-bold text-[#5D2E2E] mb-3">{n.title}</div>
            <div className="text-sm text-[#3E2723] leading-relaxed whitespace-pre-wrap">{n.content}</div>
            {userRole === "ADMIN" && (
              <button
                onClick={() => {
                  setDeleteMode("notice");
                  setDeleteTarget(n);
                }}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center text-[#DC3545] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            )}
          </div>
        ))}
        {noticeItems.length === 0 && <div className="py-20 text-center text-sm text-[#A68966] italic">등록된 공지사항이 없습니다.</div>}
      </div>
    );
  }

  // 4. 임박 사용/폐기 내역 화면
  if (statusLocation === "URGENT" && (urgentTab === "USAGE" || urgentTab === "DISPOSAL")) {
    const list = urgentTab === "USAGE" ? usageItems : disposalItems;
    const mode = urgentTab === "USAGE" ? "usage" : "disposal";
    return (
      <div className="w-full space-y-4 mb-12">
        <h3 className="px-1 text-sm font-bold text-[#5D2E2E]">{urgentTab === "USAGE" ? "사용" : "폐기"} 내역 (최근 30일)</h3>
        <div className="bg-white rounded-2xl border border-[#EFE9E1] divide-y divide-[#F5F0E9] overflow-hidden shadow-sm">
          {list.map((item: any) => (
            <div key={item.id} className="px-4 py-4 flex justify-between items-center">
              <div>
                <div className="font-bold text-[14px] text-[#3E2723]">{item.product_name}</div>
                <div className="text-[10px] text-[#A68966] mt-0.5">{fmtDate(item.expiry_date)} 등록 내역</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-black text-[#5D2E2E]">{item.quantity}개</span>
                <button
                  onClick={() => {
                    if (ensureAuthenticated()) {
                      setDeleteMode(mode);
                      setDeleteTarget(item);
                    }
                  }}
                  className="text-[#DC3545] font-bold w-8 h-8 flex items-center justify-center bg-[#FFF5F5] rounded-lg active:scale-90 transition-all"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          {list.length === 0 && <div className="py-20 text-center text-sm text-[#A68966] italic">내역이 존재하지 않습니다.</div>}
        </div>
      </div>
    );
  }

  // 5. 메인 리스트 뷰 (홀/창고/세트/임박보관)
  const currentTypes = statusLocation === "SET" ? SET_TYPES : YANGGANG_TYPES;
  if (statusLocation === "CLOSING") return null;

  return (
    <div className="w-full space-y-4 mb-12">
      {currentTypes.map((name: string) => {
        const pName = statusLocation === "SET" ? name : `${name} 양갱`;
        let list =
          statusLocation === "SET"
            ? setInventoryItems.filter((i: any) => i.set_name === pName)
            : statusLocation === "URGENT"
            ? urgentItems.filter((i: any) => i.product_name === pName)
            : items.filter((i: any) => i.product_name === pName && i.location === statusLocation);

        return (
          <div key={name} className={`bg-white rounded-[24px] border border-[#EFE9E1] shadow-sm overflow-hidden transition-all ${list.length === 0 ? "opacity-60" : ""}`}>
            <div className="bg-[#F9F5F0] px-4 py-2 border-b border-[#F5F0E9] font-bold text-[13px] text-[#5D2E2E]">{name}</div>
            <div className="p-2">
              {list.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {list.sort((a,b) => a.expiry_date.localeCompare(b.expiry_date)).map((item: any) => {
                    const d = getDaysUntilExpiry(item.expiry_date);
                    const b = d <= 1 ? "bg-red-500 shadow-[0_0_5px_#ef4444]" : d <= 14 ? "bg-orange-500 shadow-[0_0_5px_#f97316]" : "bg-green-500 shadow-[0_0_5px_#22c55e]";
                    return (
                      <div key={item.id} className="bg-[#FDFBF7] rounded-xl border border-[#F5F0E9] p-2 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <div
                            onClick={() => {
                              if (ensureAuthenticated() && statusLocation !== "SET") {
                                setEditTarget(item);
                              }
                            }}
                            className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                          >
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${b}`} />
                            <span className="text-[12px] font-bold text-[#5D2E2E] shrink-0">{fmtDate(item.expiry_date)}</span>
                            <span className="text-[12px] font-black text-[#3E2723] shrink-0">{item.quantity}개</span>
                          </div>
                          <div className="flex gap-1 shrink-0 ml-1">
                            {statusLocation === "FLOOR" && d <= 14 && (
                              <button
                                onClick={() => {
                                  if (ensureAuthenticated()) {
                                    setMoveUrgentTarget(item);
                                    setShowMoveUrgentModal(true);
                                  }
                                }}
                                className="w-6 h-6 bg-white border border-[#F5F0E9] rounded text-orange-500 font-bold text-[10px] active:scale-90"
                              >
                                !
                              </button>
                            )}
                            {statusLocation === "WAREHOUSE" && (
                              <button
                                onClick={() => {
                                  if (ensureAuthenticated()) {
                                    setMoveTarget(item);
                                    setMoveQty(item.quantity);
                                  }
                                }}
                                className="w-6 h-6 bg-white border border-[#F5F0E9] rounded text-[11px] active:scale-90"
                              >
                                🚚
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (ensureAuthenticated()) {
                                  const mode = statusLocation === "SET" ? "set" : statusLocation === "URGENT" ? "urgent" : "inventory";
                                  setDeleteMode(mode);
                                  setDeleteTarget(item);
                                }
                              }}
                              className="w-6 h-6 bg-[#FFF5F5] border border-[#FFE3E3] text-[#DC3545] rounded font-bold text-sm active:scale-90"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                        {item.color_data && (
                          <div
                            className="text-[10px] font-bold ml-3.5"
                            style={{ color: item.color_data === "Red" ? "#DC3545" : item.color_data === "Navy" ? "#001F3F" : "#FF69B4" }}
                          >
                            ● {item.color_data}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-4 text-center text-[12px] text-[#D1C4B5] italic font-medium">재고 없음</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}