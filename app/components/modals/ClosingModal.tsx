"use client";

import { useState, useEffect } from "react";
import { DailyClosing, UrgentInventory } from "@/app/types/inventory";
import { fmtDate } from "@/lib/utils/date";

interface ClosingModalProps {
  closingItems: any[];
  closingIndex: number;
  handleClosingNext: (val: number) => void;
  setStatusLocation: (loc: string) => void;
  cancelClosing: () => void; // 추가
  closingDetail: DailyClosing | null;
  setClosingDetail: (detail: DailyClosing | null) => void;
  showNoticeInput: boolean;
  setShowNoticeInput: (show: boolean) => void;
  noticeTitle: string;
  setNoticeTitle: (title: string) => void;
  noticeContent: string;
  setNoticeContent: (content: string) => void;
  saveNotice: () => void;
  urgentProcessTarget: UrgentInventory | null;
  setUrgentProcessTarget: (target: UrgentInventory | null) => void;
  confirmUrgentProcess: (qty: number) => void;
}

export default function ClosingModal({
  closingItems,
  closingIndex,
  handleClosingNext,
  setStatusLocation,
  cancelClosing,
  closingDetail,
  setClosingDetail,
  showNoticeInput,
  setShowNoticeInput,
  noticeTitle,
  setNoticeTitle,
  noticeContent,
  setNoticeContent,
  saveNotice,
  urgentProcessTarget,
  setUrgentProcessTarget,
  confirmUrgentProcess,
}: ClosingModalProps) {
  const [procQty, setProcQty] = useState(0);

  // 단계가 바뀔 때 해당 항목의 현재 수량을 기본값으로 세팅
  useEffect(() => {
    if (closingItems[closingIndex]) {
      setProcQty(closingItems[closingIndex].quantity);
    }
  }, [closingIndex, closingItems]);

  useEffect(() => {
    if (urgentProcessTarget) setProcQty(urgentProcessTarget.quantity);
  }, [urgentProcessTarget]);

  return (
    <>
      {/* 1. 일마감 단계별 입력 모달 */}
      {closingItems.length > 0 && closingIndex < closingItems.length && (
        <div 
          className="fixed inset-0 bg-black/60 z-[800] flex items-center justify-center p-6 backdrop-blur-sm"
          onClick={cancelClosing} // 백드롭 클릭 시 취소
        >
          <div className="bg-[#FDFBF7] w-full max-w-sm rounded-[32px] p-8 border border-[#EFE9E1] shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6">
              <span className="text-[10px] font-bold text-[#A68966] uppercase tracking-widest">Daily Closing ({closingIndex + 1}/{closingItems.length})</span>
              <h3 className="text-2xl font-black text-[#5D2E2E] mt-1">{closingItems[closingIndex].product_name}</h3>
              <div className="mt-2 inline-block px-3 py-1 bg-[#F9F5F0] border border-[#F5F0E9] rounded-full text-[12px] font-bold text-[#3E2723]">
                유통기한: {fmtDate(closingItems[closingIndex].expiry_date)}
              </div>
              <p className="text-xs text-[#A68966] font-bold mt-4">현재 홀에 있는 실제 수량을 입력하세요.</p>
            </div>
            
            <div className="flex items-center justify-center gap-8 mb-10">
              <button onClick={() => setProcQty(Math.max(0, procQty - 1))} className="w-12 h-12 border border-[#F5F0E9] rounded-full font-bold bg-white text-[#5D2E2E] active:scale-95 shadow-sm">-</button>
              <input 
                type="number" 
                value={procQty} 
                onChange={(e) => setProcQty(parseInt(e.target.value) || 0)} 
                className="w-20 text-center text-4xl font-black bg-transparent outline-none text-[#3E2723]" 
              />
              <button onClick={() => setProcQty(procQty + 1)} className="w-12 h-12 border border-[#F5F0E9] rounded-full font-bold bg-white text-[#5D2E2E] active:scale-95 shadow-sm">+</button>
            </div>
            
            <div className="flex gap-3">
              <button onClick={cancelClosing} className="flex-1 py-4 text-[#A68966] font-bold">마감 취소</button>
              <button 
                onClick={() => handleClosingNext(procQty)} 
                className="flex-[2] py-4 bg-[#5D2E2E] text-white rounded-2xl font-bold shadow-lg active:scale-[0.98]"
              >
                확인 및 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. 일마감 상세 내역 모달 */}
      {closingDetail && (
        <div className="fixed inset-0 bg-black/60 z-[850] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setClosingDetail(null)}>
          <div className="bg-[#FDFBF7] w-full max-w-lg rounded-[32px] p-6 border border-[#EFE9E1] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[#5D2E2E]">{closingDetail.closing_date} 마감 상세 데이터</h3>
              <button onClick={() => setClosingDetail(null)} className="text-[#A68966] text-2xl font-bold px-2">×</button>
            </div>
            <div className="overflow-y-auto flex-1 rounded-xl border border-[#EFE9E1]">
              <table className="w-full text-center table-fixed border-collapse bg-white">
                <thead className="sticky top-0 bg-[#F9F5F0] text-[#5D2E2E] text-[10px] font-bold border-b border-[#EFE9E1]">
                  <tr>
                    <th className="py-2 w-[40%] border-r border-[#EFE9E1]">품목</th>
                    <th className="py-2 w-[20%] border-r border-[#EFE9E1]">홀</th>
                    <th className="py-2 w-[20%] border-r border-[#EFE9E1]">창고</th>
                    <th className="py-2 w-[20%]">합계</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F0E9] text-[12px]">
                  {closingDetail.stock_snapshot?.map((s) => (
                    <tr key={s.product_name}>
                      <td className="py-2 border-r border-[#F5F0E9] font-medium text-left px-3 text-[#3E2723]">
                        {s.product_name.replace(" 양갱", "")}
                      </td>
                      <td className="py-2 border-r border-[#F5F0E9] text-[#A68966]">{s.floor}</td>
                      <td className="py-2 border-r border-[#F5F0E9] text-[#A68966]">{s.warehouse}</td>
                      <td className="py-2 font-bold text-[#5D2E2E] bg-[#FDFBF7]/50">{s.floor + s.warehouse}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. 공지사항 작성 모달 */}
      {showNoticeInput && (
        <div className="fixed inset-0 bg-black/60 z-[700] flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setShowNoticeInput(false)}>
          <div className="bg-[#FDFBF7] w-full max-w-sm rounded-[32px] p-8 border border-[#EFE9E1] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl mb-6 text-center font-bold text-[#5D2E2E]">공지사항 작성</h2>
            <input 
              type="text" 
              value={noticeTitle} 
              onChange={(e) => setNoticeTitle(e.target.value)} 
              placeholder="제목을 입력하세요" 
              className="w-full mb-4 p-4 border border-[#F5F0E9] rounded-2xl font-bold text-sm bg-white outline-none text-[#3E2723]" 
            />
            <textarea 
              value={noticeContent} 
              onChange={(e) => setNoticeContent(e.target.value)} 
              placeholder="내용을 입력하세요" 
              rows={5}
              className="w-full mb-8 p-4 border border-[#F5F0E9] rounded-2xl font-bold text-sm bg-white outline-none text-[#3E2723] resize-none" 
            />
            <button onClick={saveNotice} className="w-full py-4 bg-[#5D2E2E] text-white rounded-2xl font-bold shadow-lg active:scale-[0.98]">
              확인
            </button>
          </div>
        </div>
      )}

      {/* 4. 임박 재고 처리 수량 입력 모달 */}
      {urgentProcessTarget && (
        <div className="fixed inset-0 bg-black/60 z-[800] flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setUrgentProcessTarget(null)}>
          <div className="bg-[#FDFBF7] w-full max-w-xs rounded-[32px] p-8 border border-[#EFE9E1] shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-2 text-[#5D2E2E]">처리 수량 확인</h3>
            <p className="text-[11px] text-[#A68966] mb-8 font-bold leading-tight">
              {urgentProcessTarget.product_name}<br />({urgentProcessTarget.expiry_date})
            </p>
            <div className="flex items-center justify-center gap-6 mb-8 mt-8">
              <button onClick={() => setProcQty(Math.max(1, procQty - 1))} className="w-10 h-10 border border-[#F5F0E9] rounded-full font-bold bg-white text-[#5D2E2E] active:scale-95 shadow-sm">-</button>
              <span className="text-3xl font-black text-[#3E2723]">{procQty}개</span>
              <button onClick={() => setProcQty(Math.min(urgentProcessTarget.quantity, procQty + 1))} className="w-10 h-10 border border-[#F5F0E9] rounded-full font-bold bg-white text-[#5D2E2E] active:scale-95 shadow-sm">+</button>
            </div>
            <button 
              onClick={() => confirmUrgentProcess(procQty)} 
              className="w-full py-4 bg-[#5D2E2E] text-white rounded-2xl font-bold shadow-lg active:scale-[0.98]"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}