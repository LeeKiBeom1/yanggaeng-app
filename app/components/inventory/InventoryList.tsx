"use client";

import { fmtDate, getExpiryStatusColor, getDaysUntilExpiry } from "@/lib/utils/date";
import { InventoryItem, SetInventory, UrgentInventory } from "@/app/types/inventory";

interface InventoryListProps {
  statusLocation: string;
  items: InventoryItem[];
  setInventoryItems: SetInventory[];
  urgentItems: UrgentInventory[];
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
  
  // 현재 위치에 따라 표시할 품목 리스트(양갱 또는 세트) 결정
  const currentTypes = statusLocation === "SET" ? SET_TYPES : YANGGANG_TYPES;

  return (
    <div className="w-full space-y-4 mb-12">
      {currentTypes.map((name: string) => {
        const pName = statusLocation === "SET" ? name : `${name} 양갱`;
        
        // 데이터 필터링 로직
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
            {/* 품목 타이틀 (예: 팥) */}
            <div className="bg-[#F9F5F0] px-4 py-2 border-b border-[#F5F0E9] font-bold text-[13px] text-[#5D2E2E]">
              {name}
            </div>
            
            <div className="p-2">
              {list.length > 0 ? (
                /* 콤팩트 가로 레이아웃 (한 줄에 2개) */
                <div className="grid grid-cols-2 gap-2">
                  {list.sort((a, b) => a.expiry_date.localeCompare(b.expiry_date)).map((item) => {
                    const d = getDaysUntilExpiry(item.expiry_date);
                    const bColorClass = getExpiryStatusColor(item.expiry_date);

                    return (
                      <div key={item.id} className="bg-[#FDFBF7] rounded-xl border border-[#F5F0E9] p-2 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          {/* 정보 클릭 시 수정 모달 (세트 제외) */}
                          <div 
                            onClick={() => { if (ensureAuthenticated() && statusLocation !== "SET") setEditTarget(item); }} 
                            className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                          >
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${bColorClass}`} />
                            <span className="text-[12px] font-bold text-[#5D2E2E] shrink-0">{fmtDate(item.expiry_date)}</span>
                            <span className="text-[12px] font-black text-[#3E2723] shrink-0">{item.quantity}개</span>
                          </div>

                          {/* 조작 버튼 영역 */}
                          <div className="flex gap-1 shrink-0 ml-1">
                            {/* [!] 경고등 버튼 (홀 재고이고 14일 이하일 때만 노출) */}
                            {statusLocation === "FLOOR" && d <= 14 && (
                              <button 
                                onClick={() => { if (ensureAuthenticated()) { setMoveUrgentTarget(item); setShowMoveUrgentModal(true); } }} 
                                className="w-6 h-6 bg-white border border-[#F5F0E9] rounded text-orange-500 font-bold text-[10px]"
                              >
                                !
                              </button>
                            )}
                            {/* 창고에서 홀로 이동 버튼 */}
                            {statusLocation === "WAREHOUSE" && (
                              <button 
                                onClick={() => { if (ensureAuthenticated()) { setMoveTarget(item); setMoveQty(item.quantity); } }} 
                                className="w-6 h-6 bg-white border border-[#F5F0E9] rounded text-[11px]"
                              >
                                🚚
                              </button>
                            )}
                            {/* 삭제 버튼 */}
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
                        {/* 세트 색상 표시 (있는 경우만) */}
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