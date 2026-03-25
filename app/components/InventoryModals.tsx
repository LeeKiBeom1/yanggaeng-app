"use client";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function InventoryModals(props: any) {
  const { showInputModal, setShowInputModal, isBatchMode, statusLocation, YANGGANG_TYPES, selectedProducts, setSelectedProducts, expiryDate, setExpiryDate, quantity, setQuantity, saveInventory, showAuthModal, loginId, setLoginId, loginPassword, setLoginPassword, isAuthLoading, signIn, editTarget, setEditTarget, editQty, setEditQty, confirmEdit, moveTarget, setMoveTarget, moveQty, setMoveQty, moveInventory, deleteTarget, setDeleteTarget, setDeleteMode, execDelete, showMoveUrgentModal, setShowMoveUrgentModal, moveUrgentTarget, confirmMoveToUrgent, closingItems, closingIndex, setClosingIndex, setStatusLocation, triggerToast, refreshData } = props;

  const handleClosingNext = async (val: number) => {
    const item = closingItems[closingIndex];
    const after = val;

    // 마감 재고 수정 시에는 홀 재고이므로 히스토리(창고용)를 남기지 않음
    if (item.quantity !== after) {
      await supabase.from("inventory").update({ quantity: after }).eq("id", item.id);
    }

    if (closingIndex < closingItems.length - 1) {
      setClosingIndex(closingIndex + 1);
    } else {
      triggerToast("✅ 마감 정산 완료");
      refreshData();
      setStatusLocation("TOTAL");
    }
  };

  return (
    <>
      {/* 재고 추가 및 일괄 입고 모달 */}
      {showInputModal && (
        <div className="fixed inset-0 bg-black/60 z-[700] flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setShowInputModal(false)}>
          <div className="bg-[#FDFBF7] w-full max-w-sm rounded-[32px] p-8 border border-[#EFE9E1] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl mb-6 text-center font-bold text-[#5D2E2E]">{isBatchMode ? "일괄 입고" : "재고 추가"}</h2>
            <div className="grid grid-cols-4 gap-2 mb-6 max-h-40 overflow-y-auto p-2 border border-[#F5F0E9] rounded-2xl bg-white text-center shadow-inner">
              {YANGGANG_TYPES.map((p:any) => {
                const pName = `${p} 양갱`;
                const isSelected = selectedProducts.includes(pName);
                return (
                  <button key={p} 
                    onClick={() => {
                      if (isBatchMode) {
                        setSelectedProducts(isSelected ? selectedProducts.filter((x:any) => x !== pName) : [...selectedProducts, pName]);
                      } else {
                        setSelectedProducts([pName]);
                      }
                    }} 
                    className={`py-2 text-[10px] rounded-xl border font-bold transition-all ${isSelected ? "bg-[#5D2E2E] text-white border-[#5D2E2E]" : "bg-white text-[#A68966] border-[#F5F0E9]"}`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full mb-4 p-4 border border-[#F5F0E9] rounded-2xl font-bold text-center bg-white" />
            <div className="flex gap-2 mb-6">
              <button onClick={() => setQuantity(quantity + 10)} className="flex-1 py-3 bg-white border border-[#F5F0E9] rounded-xl text-[11px] font-bold text-[#A68966]">+10</button>
              <button onClick={() => setQuantity(quantity + 40)} className="flex-1 py-3 bg-white border border-[#F5F0E9] rounded-xl text-[11px] font-bold text-[#A68966]">+40</button>
              <button onClick={() => setQuantity(0)} className="flex-1 py-3 bg-[#FFF5F5] border border-[#FFE3E3] rounded-xl text-[11px] font-bold text-[#DC3545]">초기화</button>
            </div>
            <div className="flex items-center justify-center gap-8 mb-8">
              <button onClick={() => setQuantity(Math.max(0, quantity - 1))} className="w-12 h-12 border border-[#F5F0E9] rounded-full font-bold bg-white text-[#5D2E2E] shadow-sm">-</button>
              <input type="number" value={quantity || ""} placeholder="0" onChange={(e) => setQuantity(parseInt(e.target.value) || 0)} className="w-20 text-center text-4xl font-black bg-transparent outline-none" />
              <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 border border-[#F5F0E9] rounded-full font-bold bg-white text-[#5D2E2E] shadow-sm">+</button>
            </div>
            <div className="flex gap-3 text-center">
              <button onClick={() => setShowInputModal(false)} className="flex-1 py-4 text-[#A68966] font-bold">취소</button>
              <button onClick={saveInventory} className="flex-[2] py-4 bg-[#5D2E2E] text-white rounded-2xl font-bold shadow-lg">저장하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 마감 재고 정산 모드 */}
      {statusLocation === "CLOSING" && closingItems.length > 0 && (
        <div className="fixed inset-0 bg-white z-[800] flex flex-col p-6 overflow-hidden">
          <div className="max-w-md mx-auto w-full h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <span className="text-xs font-bold text-[#A68966]">마감 정산 중 ({closingIndex + 1}/{closingItems.length})</span>
              <button onClick={() => setStatusLocation("FLOOR")} className="text-sm font-bold text-[#DC3545]">중단</button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="bg-[#F9F5F0] px-6 py-2 rounded-full text-[#5D2E2E] font-bold text-sm mb-4">{closingItems[closingIndex].product_name}</div>
              <div className="text-[#A68966] text-xs font-bold mb-8">유통기한: {closingItems[closingIndex].expiry_date}</div>
              <div className="text-[10px] text-gray-400 mb-2 font-bold uppercase tracking-widest">실제 수량 입력</div>
              <input 
                autoFocus 
                type="number" 
                key={closingItems[closingIndex].id}
                defaultValue={closingItems[closingIndex].quantity}
                onKeyDown={(e) => { if (e.key === "Enter") handleClosingNext(Number(e.currentTarget.value) || 0); }}
                className="w-full text-center text-7xl font-black bg-transparent outline-none text-[#5D2E2E] mb-12" 
              />
              <button 
                onClick={(e) => {
                  const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                  handleClosingNext(Number(input.value) || 0);
                }} 
                className="w-full py-6 bg-[#5D2E2E] text-white rounded-[32px] text-xl font-bold shadow-xl active:scale-95 transition-all"
              >
                확인 후 다음
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 로그인 모달 */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 z-[760] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-[#FDFBF7] w-full max-w-sm rounded-[32px] p-8 border border-[#EFE9E1] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl mb-2 text-center font-bold text-[#5D2E2E]">잠금 해제</h2>
            <p className="text-[11px] text-center text-[#A68966] font-bold mb-8">아이디와 비밀번호를 입력해주세요.</p>
            <input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="아이디" className="w-full mb-3 p-4 border border-[#F5F0E9] rounded-2xl font-bold text-sm bg-white outline-none focus:border-[#5D2E2E]" />
            <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="비밀번호" className="w-full mb-8 p-4 border border-[#F5F0E9] rounded-2xl font-bold text-sm bg-white outline-none focus:border-[#5D2E2E]" />
            <button onClick={signIn} disabled={isAuthLoading} className="w-full py-4 bg-[#5D2E2E] text-white rounded-2xl font-bold shadow-lg disabled:bg-[#F5F0E9] transition-all">로그인</button>
          </div>
        </div>
      )}
      
      {/* 수정 모달 */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/60 z-[700] flex items-center justify-center p-6" onClick={() => setEditTarget(null)}>
          <div className="bg-[#FDFBF7] w-full max-w-sm rounded-[32px] p-8 border shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-2 text-[#5D2E2E]">수량 수정</h3>
            <p className="text-xs text-[#A68966] mb-8 font-bold">{editTarget.product_name} ({editTarget.expiry_date})</p>
            <div className="flex items-center justify-center gap-8 mb-10">
              <button onClick={() => setEditQty(Math.max(0, editQty - 1))} className="w-12 h-12 border border-[#F5F0E9] rounded-full font-bold bg-white text-[#5D2E2E] shadow-sm">-</button>
              <input type="number" value={editQty} onChange={(e) => setEditQty(parseInt(e.target.value) || 0)} className="w-20 text-center text-4xl font-black bg-transparent outline-none" />
              <button onClick={() => setEditQty(editQty + 1)} className="w-12 h-12 border border-[#F5F0E9] rounded-full font-bold bg-white text-[#5D2E2E] shadow-sm">+</button>
            </div>
            <button onClick={confirmEdit} className="w-full py-4 bg-[#5D2E2E] text-white rounded-2xl font-bold shadow-lg">수정 완료</button>
          </div>
        </div>
      )}

      {/* 임박 이동 확인 모달 */}
      {showMoveUrgentModal && (
        <div className="fixed inset-0 bg-black/60 z-[700] flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setShowMoveUrgentModal(false)}>
          <div className="bg-[#FDFBF7] w-full max-w-xs rounded-[32px] p-10 text-center border border-[#EFE9E1] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 bg-[#FDFBF7] border-2 border-orange-400 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold">!</div>
            <p className="font-bold text-lg mb-8 text-[#3E2723]">해당 재고를<br/>임박 재고로 보낼까요?</p>
            <div className="flex gap-3 text-center">
              <button onClick={() => setShowMoveUrgentModal(false)} className="flex-1 py-4 bg-white border border-[#F5F0E9] text-[#A68966] rounded-2xl font-bold">취소</button>
              <button onClick={confirmMoveToUrgent} className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-bold shadow-md">이동</button>
            </div>
          </div>
        </div>
      )}

      {/* 이동 모달 (홀<->창고) */}
      {moveTarget && (
        <div className="fixed inset-0 bg-black/60 z-[700] flex items-center justify-center p-6" onClick={() => setMoveTarget(null)}>
          <div className="bg-[#FDFBF7] w-full max-w-xs rounded-[32px] p-8 border shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-6 text-[#5D2E2E]">홀 이동</h3>
            <div className="flex items-center justify-center gap-6 mb-8 text-center">
              <button onClick={() => setMoveQty(Math.max(1, moveQty - 1))} className="w-10 h-10 border rounded-full font-bold bg-white text-[#5D2E2E] shadow-sm">-</button>
              <span className="text-3xl font-black text-[#3E2723]">{moveQty}개</span>
              <button onClick={() => setMoveQty(Math.min(moveTarget.quantity, moveQty + 1))} className="w-10 h-10 border rounded-full font-bold bg-white text-[#5D2E2E] shadow-sm">+</button>
            </div>
            <button onClick={moveInventory} className="w-full py-4 bg-[#5D2E2E] text-white rounded-2xl font-bold shadow-lg">확인</button>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 z-[700] flex items-center justify-center p-6" onClick={() => { setDeleteTarget(null); setDeleteMode("inventory"); }}>
          <div className="bg-[#FDFBF7] w-full max-w-xs rounded-[32px] p-10 text-center border shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="font-bold text-lg mb-8 text-[#3E2723]">해당 재고 내역을<br/>삭제할까요?</p>
            <div className="flex gap-3 text-center">
              <button onClick={() => { setDeleteTarget(null); setDeleteMode("inventory"); }} className="flex-1 py-4 bg-white border border-[#F5F0E9] text-[#A68966] rounded-2xl font-bold">취소</button>
              <button onClick={execDelete} className="flex-1 py-4 bg-[#DC3545] text-white rounded-2xl font-bold">삭제</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}