"use client";

import { fmtDate } from "@/lib/utils/date";
import { HistoryEvent, DailyClosing } from "@/app/types/inventory";

interface InventoryArchiveProps {
  archiveTab: "HISTORY" | "DAILY";
  userRole: "ADMIN" | "STAFF";
  historyEvents: HistoryEvent[];
  closingRecords: DailyClosing[];
  clearHistory: () => void;
  setClosingDetail: (record: DailyClosing) => void;
  setDeleteMode: (mode: string) => void;
  setDeleteTarget: (target: any) => void;
}

export default function InventoryArchive({
  archiveTab,
  userRole,
  historyEvents,
  closingRecords,
  clearHistory,
  setClosingDetail,
  setDeleteMode,
  setDeleteTarget,
}: InventoryArchiveProps) {
  
  // 1. 일마감 기록 탭일 때
  if (archiveTab === "DAILY") {
    return (
      <div className="w-full space-y-3 mb-12">
        <h3 className="px-1 text-sm font-bold text-[#5D2E2E]">일마감 기록 보관소 (클릭 시 상세)</h3>
        {closingRecords.map((rec) => (
          <div 
            key={rec.id} 
            onClick={() => setClosingDetail(rec)} 
            className="bg-white rounded-2xl border border-[#EFE9E1] p-5 shadow-sm flex justify-between items-center active:scale-[0.98] transition-all cursor-pointer"
          >
            <div>
              <div className="text-sm font-bold text-[#5D2E2E]">{rec.closing_date} 마감 기록</div>
              <div className="text-[10px] text-[#A68966] mt-1">담당: {rec.user_id}</div>
            </div>
            {/* 관리자만 삭제 가능 */}
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                if (userRole === "ADMIN") { 
                  setDeleteMode("daily"); 
                  setDeleteTarget(rec); 
                } 
              }} 
              className={`px-4 py-2 rounded-xl text-[11px] font-bold ${userRole === "ADMIN" ? "bg-[#FFF5F5] text-[#DC3545]" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
            >
              삭제
            </button>
          </div>
        ))}
        {closingRecords.length === 0 && (
          <div className="py-20 text-center text-sm text-[#A68966] italic">기록이 없습니다.</div>
        )}
      </div>
    );
  }

  // 2. 입출고 활동 로그 탭일 때
  return (
    <div className="w-full space-y-3 mb-12">
      <div className="flex justify-between items-center px-1 mb-2">
        <h3 className="text-sm font-bold text-[#5D2E2E]">입출고 활동 로그</h3>
        {userRole === "ADMIN" && (
          <button onClick={clearHistory} className="text-[10px] font-bold text-[#A68966] hover:underline">
            기록 비우기
          </button>
        )}
      </div>
      <div className="bg-white rounded-2xl border border-[#EFE9E1] divide-y divide-[#F5F0E9] overflow-hidden shadow-sm">
        {historyEvents.map((ev) => (
          <div key={ev.id} className="px-4 py-4 flex items-center gap-4">
            {/* 상태 아이콘 (입고/출고/이동 구분) */}
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-[11px] border 
              ${ev.kind === "MOVE" ? "bg-[#FFF9F0] text-[#A68966]" : 
                ev.delta > 0 ? "bg-[#F0F7F4] text-[#198754]" : "bg-[#FFF5F5] text-[#DC3545]"}`}
            >
              {ev.kind === "MOVE" ? "이동" : ev.delta > 0 ? "입고" : "출고"}
            </div>
            
            <div className="flex-1">
              <div className="font-bold text-[14px] text-[#3E2723]">{ev.product_name}</div>
              <div className="text-[10px] text-[#A68966]">
                {fmtDate(ev.expiry_date)} · {ev.user_id || "시스템"}
              </div>
            </div>
            
            {/* 수량 표시 */}
            <div className={`font-bold text-sm ${ev.delta > 0 && ev.kind !== "MOVE" ? "text-[#198754]" : "text-[#DC3545]"}`}>
              {ev.delta > 0 && ev.kind !== "MOVE" ? "+" : ""}{ev.delta}개
            </div>
          </div>
        ))}
        {historyEvents.length === 0 && (
          <div className="py-20 text-center text-sm text-[#A68966] italic">로그가 없습니다.</div>
        )}
      </div>
    </div>
  );
}