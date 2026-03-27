"use client";

import { useState } from "react";
import { fmtDate } from "@/lib/utils/date";
import { InventoryItem } from "@/app/types/inventory";

interface InventoryTotalProps {
  items: InventoryItem[];
  YANGGANG_TYPES: string[];
}

export default function InventoryTotal({ items, YANGGANG_TYPES }: InventoryTotalProps) {
  const [showDetail, setShowDetail] = useState(false);

  /**
   * 특정 품목과 위치의 합계 수량을 계산합니다.
   */
  const getLocationStock = (productName: string, location: "FLOOR" | "WAREHOUSE") => {
    return items
      .filter((i) => i.product_name === productName && i.location === location)
      .reduce((acc, cur) => acc + cur.quantity, 0);
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-[#EFE9E1] overflow-hidden mb-12 shadow-sm">
      {/* 상단 컨트롤 바 */}
      <div className="p-4 border-b border-[#F5F0E9] flex justify-between items-center bg-[#F9F5F0]">
        <h3 className="text-sm font-bold text-[#5D2E2E]">전체 재고 통합 뷰</h3>
        <button 
          onClick={() => setShowDetail(!showDetail)} 
          className="text-[10px] font-bold px-3 py-1.5 rounded-lg border bg-white text-[#A68966] active:scale-95 transition-all shadow-sm"
        >
          {showDetail ? "간략히 보기" : "상세 내역 보기"}
        </button>
      </div>

      {/* 엑셀 스타일 재고 표 */}
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
            const fullName = `${name} 양갱`;
            const h = getLocationStock(fullName, "FLOOR");
            const w = getLocationStock(fullName, "WAREHOUSE");
            const details = items.filter((i) => i.product_name === fullName);

            return (
              <tr key={name} className="text-[13px]">
                {/* 품목명 및 상세 유통기한 */}
                <td className="py-4 border-r border-[#F5F0E9] align-top">
                  <div className="font-bold text-[#5D2E2E]">{name}</div>
                  {showDetail && details.length > 0 && (
                    <div className="mt-2 space-y-1 px-1">
                      {details.sort((a,b) => a.expiry_date.localeCompare(b.expiry_date)).map((d) => (
                        <div key={d.id} className="text-[9px] text-gray-400 font-medium">
                          [{d.location === "FLOOR" ? "홀" : "창"}] {fmtDate(d.expiry_date)} ({d.quantity})
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                {/* 홀 재고 */}
                <td className="py-4 border-r border-[#F5F0E9] font-medium text-[#3E2723]">
                  {h > 0 ? `${h}개` : "-"}
                </td>
                {/* 창고 재고 */}
                <td className="py-4 border-r border-[#F5F0E9] font-medium text-[#3E2723]">
                  {w > 0 ? `${w}개` : "-"}
                </td>
                {/* 총계 (강조) */}
                <td className="py-4 font-black text-[#5D2E2E] bg-[#FDFBF7]/50">
                  {h + w > 0 ? `${h + w}개` : "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}