"use client";

import { fmtDate } from "@/lib/utils/date";
import { InventoryItem } from "@/app/types/inventory";

interface EditModalProps {
  // 수정 관련
  editTarget: any;
  setEditTarget: (target: any) => void;
  editQty: number;
  setEditQty: (qty: number) => void;
  confirmEdit: () => void;
  
  // 이동 관련
  moveTarget: any;
  setMoveTarget: (target: any) => void;
  moveQty: number;
  setMoveQty: (qty: number) => void;
  moveInventory: () => void;
  
  // 삭제 관련
  deleteTarget: any;
  setDeleteTarget: (target: any) => void;
  execDelete: () => void;
  
  // 임박 전송 관련
  showMoveUrgentModal: boolean;
  setShowMoveUrgentModal: (show: boolean) => void;
  moveUrgentTarget: any;
  confirmMoveToUrgent: () => void;
}

export default function EditModal({
  editTarget,
  setEditTarget,
  editQty,
  setEditQty,
  confirmEdit,
  moveTarget,
  setMoveTarget,
  moveQty,
  setMoveQty,
  moveInventory,
  deleteTarget,
  setDeleteTarget,
  execDelete,
  showMoveUrgentModal,
  setShowMoveUrgentModal,
  moveUrgentTarget,
  confirmMoveToUrgent,
}: EditModalProps) {
  
  return (
    <>
      {/* 1. 수량 수정 모달 */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/60 z-[700] flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setEditTarget(null)}>
          <div className="bg-[#FDFBF7] w-full max-w-sm rounded-[32px] p-8 border border-[#EFE9E1] shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-2 text-[#5D2E2E]">수량 수정</h3>
            <p className="text-xs text-[#A68966] mb-8 font-bold">
              {editTarget.product_name} ({fmtDate(editTarget.expiry_date)})
            </p>
            
            <div className="flex items-center justify-center gap-8 mb-10">
              <button onClick={() => setEditQty(Math.max(0, editQty - 1))} className="w-12 h-12 border border-[#F5F0E9] rounded-full font-bold bg-white text-[#5D2E2E] shadow-sm active:scale-95">-</button>
              <input 
                type="number" 
                value={editQty} 
                onChange={(e) => setEditQty(parseInt(e.target.value) || 0)} 
                className="w-20 text-center text-4xl font-black bg-transparent outline-none text-[#3E2723]" 
              />
              <button onClick={() => setEditQty(editQty + 1)} className="w-12 h-12 border border-[#F5F0E9] rounded-full font-bold bg-white text-[#5D2E2E] shadow-sm active:scale-95">+</button>
            </div>
            
            <button onClick={confirmEdit} className="w-full py-4 bg-[#5D2E2E] text-white rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-all">
              확인
            </button>
          </div>
        </div>
      )}

      {/* 2. 위치 이동 모달 (창고 <-> 홀) */}
      {moveTarget && (
        <div className="fixed inset-0 bg-black/60 z-[700] flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setMoveTarget(null)}>
          <div className="bg-[#FDFBF7] w-full max-w-xs rounded-[32px] p-8 border border-[#EFE9E1] shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-2 text-[#5D2E2E]">재고 이동</h3>
            <p className="text-[11px] text-[#A68966] mb-6 font-bold">
              {moveTarget.location === "WAREHOUSE" ? "창고 → 홀 이동" : "홀 → 창고 이동"}
            </p>
            
            <div className="flex items-center justify-center gap-6 mb-8">
              <button onClick={() => setMoveQty(Math.max(1, moveQty - 1))} className="w-10 h-10 border border-[#F5F0E9] rounded-full font-bold bg-white text-[#5D2E2E] shadow-sm active:scale-95">-</button>
              <span className="text-3xl font-black text-[#3E2723]">{moveQty}개</span>
              <button onClick={() => setMoveQty(Math.min(moveTarget.quantity, moveQty + 1))} className="w-10 h-10 border border-[#F5F0E9] rounded-full font-bold bg-white text-[#5D2E2E] shadow-sm active:scale-95">+</button>
            </div>
            
            <button onClick={moveInventory} className="w-full py-4 bg-[#5D2E2E] text-white rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-all">
              확인
            </button>
          </div>
        </div>
      )}

      {/* 3. 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 z-[700] flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-[#FDFBF7] w-full max-w-xs rounded-[32px] p-10 text-center border border-[#EFE9E1] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="font-bold text-lg mb-8 text-[#3E2723]">정말 삭제할까요?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-4 bg-white border border-[#F5F0E9] text-[#A68966] rounded-2xl font-bold active:scale-95">취소</button>
              <button onClick={execDelete} className="flex-1 py-4 bg-[#DC3545] text-white rounded-2xl font-bold shadow-md active:scale-95">삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. 임박 재고 전송 모달 [!] */}
      {showMoveUrgentModal && moveUrgentTarget && (
        <div className="fixed inset-0 bg-black/60 z-[700] flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setShowMoveUrgentModal(false)}>
          <div className="bg-[#FDFBF7] w-full max-w-xs rounded-[32px] p-8 text-center border border-[#EFE9E1] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">!</div>
            <h3 className="font-bold mb-2 text-[#5D2E2E]">임박 재고 등록</h3>
            <p className="text-xs text-[#A68966] mb-8 leading-relaxed font-medium">
              <span className="font-bold text-[#3E2723]">{moveUrgentTarget.product_name}</span>을(를)<br />
              임박 재고 목록으로 이동할까요?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowMoveUrgentModal(false)} className="flex-1 py-4 bg-white border border-[#F5F0E9] text-[#A68966] rounded-2xl font-bold active:scale-95">취소</button>
              <button onClick={confirmMoveToUrgent} className="flex-1 py-4 bg-[#5D2E2E] text-white rounded-2xl font-bold shadow-lg active:scale-95">확인</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}