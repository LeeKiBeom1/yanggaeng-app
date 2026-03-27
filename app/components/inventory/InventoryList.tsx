"use client";

import { fmtDate, getExpiryStatusColor, getDaysUntilExpiry } from "@/lib/utils/date";
import { InventoryItem, SetInventory, UrgentInventory, UrgentLog } from "@/app/types/inventory";

interface InventoryListProps {
  statusLocation: string;
  items: InventoryItem[];
  setInventoryItems: SetInventory[];
  urgentItems: UrgentInventory[];
  usageLogs?: UrgentLog[];      // 추가
  disposalLogs?: UrgentLog[];   // 추가
  urgentTab?: string;           // 추가
  YANGGANG_TYPES: string[];
  SET_TYPES: string[];
  ensureAuthenticated: () => boolean;
  setEditTarget: (item: any) => void;
  setMoveTarget: (item: any) => void;
  setMoveQty: (qty: number) => void;
  setDeleteMode: (mode: string) => void;
  setDeleteTarget: (item: any) => void;
  setShowMoveUrgentModal: (show: boolean) => void;
  setMoveUrgentTarget: (item: any) => void;
}

export default function InventoryList({
  statusLocation,
  items,
  setInventoryItems,
  urgentItems,
  usageLogs = [],
  disposalLogs = [],
  urgentTab = "STORAGE",
  YANGGANG_TYPES,
  SET_TYPES,
  ensureAuthenticated,
  setEditTarget,
  setMoveTarget,
  setMoveQty,
  setDeleteMode,
  setDeleteTarget,
  setShowMoveUrgentModal,
  setMoveUrgentTarget,
}: InventoryListProps) {
  
  // [정상화] 임박 재고의 '사용' 및 '폐기' 내역 처리 로직 추가
  if (statusLocation === "URGENT" && (urgentTab === "USAGE" || urgentTab === "DISPOSAL")) {
    const logs = urgentTab === "USAGE" ? usageLogs : disposalLogs;
    return (
      <div className="w-full bg-white rounded-3xl border border-[#EFE9E1] divide-y divide-[#F5F0E9] overflow-hidden shadow-sm">
        {logs.map((log) => (
          <div key={log.id} className="p-4 flex justify-between items-center bg-[#FDFBF7]/50">
            <div>
              <div className="font-bold text-[#5D2E2E] text-sm">{log.product_name}</div>
              <div className="text-[10px] text-[#A68966] mt-0.5">
                {fmtDate(log.expiry_date)} 기한 · {new Date(log.created_at).toLocaleDateString()} 처리
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-black text-[#3E2723]">{log.quantity}개</span>
              <button 
                onClick={() => { 
                  if(ensureAuthenticated()) {
                    setDeleteMode(urgentTab === "USAGE" ? "usage" : "disposal");
                    setDeleteTarget(log);
                  }
                }} 
                className="text-[#DC3545] font-bold px-2 text-lg active:scale-75 transition-all"
              >
                ×
              </button>
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="py-24 text-center text-sm text-[#A68966] italic">기록이 없습니다.</div>
        )}
      </div>
    );
  }

  const currentTypes = statusLocation === "SET" ? SET_TYPES : YANGGANG_TYPES;

  return (
    <div className="w-full space-y-4 mb-12">
      {currentTypes.map((name: string) => {
        const pName = statusLocation === "SET" ? name : `${name} 양갱`;
        
        let list: any[] = [];
        if (statusLocation === "SET") {
          list = setInventoryItems.filter((i) => i.set_name === pName);
        } else if (statusLocation === "URGENT") {
          list = urgentItems.filter((i) => i.product_name === pName);
        } else {
          list = items.filter((i) => i.product_name === pName && i.location === statusLocation);
        }

        return (
          <div 
            key={name} 
            className={`bg-white rounded-[24px] border border-[#EFE9E1] shadow-sm overflow-hidden ${list.length === 0 ? "opacity-60" : ""}`}
          >
            <div className="bg-[#F9F5F0] px-4 py-2 border-b border-[#F5F0E9] font-bold text-[13px] text-[#5D2E2E]">
              {name}
            </div>
            
            <div className="p-2">
              {list.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {list.sort((a, b) => a.expiry_date.localeCompare(b.expiry_date)).map((item) => {
                    const d = getDaysUntilExpiry(item.expiry_date);
                    const bColorClass = getExpiryStatusColor(item.expiry_date);

                    return (
                      <div key={item.id} className="bg-[#FDFBF7] rounded-xl border border-[#F5F0E9] p-2 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <div 
                            onClick={() => { if (ensureAuthenticated() && statusLocation !== "SET") setEditTarget(item); }} 
                            className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                          >
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${bColorClass}`} />
                            <span className="text-[12px] font-bold text-[#5D2E2E] shrink-0">{fmtDate(item.expiry_date)}</span>
                            <span className="text-[12px] font-black text-[#3E2723] shrink-0">{item.quantity}개</span>
                          </div>

                          <div className="flex gap-1 shrink-0 ml-1">
                            {statusLocation === "FLOOR" && d <= 14 && (
                              <button 
                                onClick={() => { if (ensureAuthenticated()) { setMoveUrgentTarget(item); setShowMoveUrgentModal(true); } }} 
                                className="w-6 h-6 bg-white border border-[#F5F0E9] rounded text-orange-500 font-bold text-[10px]"
                              >
                                !
                              </button>
                            )}
                            {statusLocation === "WAREHOUSE" && (
                              <button 
                                onClick={() => { if (ensureAuthenticated()) { setMoveTarget(item); setMoveQty(item.quantity); } }} 
                                className="w-6 h-6 bg-white border border-[#F5F0E9] rounded text-[11px]"
                              >
                                🚚
                              </button>
                            )}
                            <button 
                              onClick={() => { 
                                if (ensureAuthenticated()) { 
                                  setDeleteMode(statusLocation === "SET" ? "set" : statusLocation === "URGENT" ? "urgent" : "inventory"); 
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
                <div className="py-4 text-center text-[12px] text-[#D1C4B5] italic">재고 없음</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}