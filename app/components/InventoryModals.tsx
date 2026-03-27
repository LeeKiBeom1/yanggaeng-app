"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function InventoryModals(props: any) {
  const { showInputModal, setShowInputModal, isBatchMode, statusLocation, urgentTab, urgentItems, YANGGANG_TYPES, SET_TYPES, selectedProduct, setSelectedProduct, expiryDate, setExpiryDate, quantity, setQuantity, setMemo, setSetMemo, saveInventory, isSaving, showAuthModal, loginId, setLoginId, loginPassword, setLoginPassword, isAuthLoading, signIn, editTarget, setEditTarget, editQty, setEditQty, confirmEdit, moveTarget, setMoveTarget, moveQty, setMoveQty, moveInventory, deleteTarget, setDeleteTarget, setDeleteMode, execDelete, showMoveUrgentModal, setShowMoveUrgentModal, moveUrgentTarget, confirmMoveToUrgent, closingItems, closingIndex, setClosingIndex, setStatusLocation, triggerToast, refreshData, saveClosing, showNoticeInput, setShowNoticeInput, noticeTitle, setNoticeTitle, noticeContent, setNoticeContent, saveNotice, pendingList, setPendingList, urgentProcessTarget, setUrgentProcessTarget, confirmUrgentProcess } = props;

  const [procQty, setProcQty] = useState(0);

  const handleClosingNext = async (val: number) => {
    const item = closingItems[closingIndex];
    if (item.quantity !== val) await supabase.from("inventory").update({ quantity: val }).eq("id", item.id);
    if (closingIndex < closingItems.length - 1) setClosingIndex(closingIndex + 1);
    else {
      // 마감 완료 시점 스냅샷 생성 루틴 (생략된 데이터 없이 저장)
      saveClosing({}); 
      setStatusLocation("TOTAL");
    }
  };

  const addToPending = () => {
    if (quantity <= 0) { triggerToast("수량을 입력해주세요."); return; }
    setPendingList([...pendingList, { product_name: selectedProduct, quantity: quantity, expiry_date: expiryDate }]);
    setQuantity(40);
  };

  const currentTypes = statusLocation === "SET" ? SET_TYPES : YANGGANG_TYPES;

  return (
    <>
      {showInputModal && (
        <div className="fixed inset-0 bg-black/60 z-[700] flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setShowInputModal(false)}>
          <div className="bg-[#FDFBF7] w-full max-w-sm rounded-[32px] p-8 border border-[#EFE9E1] shadow-2xl overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl mb-6 text-center font-bold text-[#5D2E2E]">{statusLocation === "URGENT" && urgentTab !== "STORAGE" ? "항목 선택" : "재고 추가"}</h2>
            
            {statusLocation === "URGENT" && urgentTab !== "STORAGE" ? (
              <div className="space-y-2 mb-6">
                {urgentItems.map((item: any) => (
                  <button key={item.id} onClick={() => { setUrgentProcessTarget(item); setProcQty(item.quantity); setShowInputModal(false); }} className="w-full p-4 border rounded-xl flex justify-between bg-white shadow-sm active:scale-95">
                    <span className="font-bold text-sm">{item.product_name} ({item.expiry_date.slice(5)})</span>
                    <span className="font-black text-[#5D2E2E]">{item.quantity}개</span>
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-2 mb-6 max-h-40 overflow-y-auto p-2 border border-[#F5F0E9] rounded-2xl bg-white text-center shadow-inner">
                  {currentTypes.map((p: any) => {
                    const pName = statusLocation === "SET" ? p : `${p} 양갱`;
                    return (<button key={p} onClick={() => setSelectedProduct(pName)} className={`py-2 text-[10px] rounded-xl border font-bold transition-all ${selectedProduct === pName ? "bg-[#5D2E2E] text-white border-[#5D2E2E]" : "bg-white text-[#A68966] border-[#F5F0E9]"}`}>{p}</button>);
                  })}
                </div>
                <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full mb-4 p-4 border border-[#F5F0E9] rounded-2xl font-bold text-center bg-white outline-none" />
                {statusLocation === "SET" && (
                  <div className="flex gap-2 mb-4">
                    {["Red", "Navy", "Pink"].map((color) => (
                      <button key={color} onClick={() => setSetMemo(color)} className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${setMemo === color ? "bg-[#5D2E2E] text-white" : "bg-white text-[#A68966] border-[#F5F0E9]"}`}>{color}</button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mb-6"><button onClick={() => setQuantity(quantity + 10)} className="flex-1 py-3 bg-white border border-[#F5F0E9] rounded-xl text-[11px] font-bold text-[#A68966]">+10</button><button onClick={() => setQuantity(quantity + 40)} className="flex-1 py-3 bg-white border border-[#F5F0E9] rounded-xl text-[11px] font-bold text-[#A68966]">+40</button><button onClick={() => setQuantity(0)} className="flex-1 py-3 bg-[#FFF5F5] border border-[#FFE3E3] rounded-xl text-[11px] font-bold text-[#DC3545]">초기화</button></div>
                <div className="flex items-center justify-center gap-8 mb-8"><button onClick={() => setQuantity(Math.max(0, quantity - 1))} className="w-12 h-12 border border-[#F5F0E9] rounded-full font-bold bg-white text-[#5D2E2E]">-</button><input type="number" value={quantity || ""} placeholder="0" onChange={(e) => setQuantity(parseInt(e.target.value) || 0)} className="w-20 text-center text-4xl font-black bg-transparent outline-none placeholder:text-[#EFE9E1]" /><button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 border border-[#F5F0E9] rounded-full font-bold bg-white text-[#5D2E2E]">+</button></div>
                {isBatchMode && (
                  <div className="mb-6 p-3 bg-[#F9F5F0] rounded-2xl border border-[#F5F0E9] max-h-32 overflow-y-auto">
                    {pendingList.map((item: any, idx: number) => (<div key={idx} className="flex justify-between text-[11px] font-bold mb-1 border-b border-white/50"><span>{item.product_name.replace(" 양갱", "")} ({item.expiry_date.slice(5)})</span><span>{item.quantity}개</span></div>))}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-3 text-center"><button onClick={() => setShowInputModal(false)} className="flex-1 py-4 text-[#A68966] font-bold">취소</button>{isBatchMode && <button onClick={addToPending} className="flex-1 py-4 bg-white border border-[#5D2E2E] text-[#5D2E2E] rounded-2xl font-bold">추가</button>}</div>
                  <button onClick={saveInventory} disabled={isSaving} className={`w-full py-4 text-white rounded-2xl font-bold shadow-lg ${isSaving ? "bg-[#D1C4B5]" : "bg-[#5D2E2E]"}`}>{isSaving ? "저장 중..." : "전체 저장하기"}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {urgentProcessTarget && (
        <div className="fixed inset-0 bg-black/60 z-[750] flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setUrgentProcessTarget(null)}>
          <div className="bg-[#FDFBF7] w-full max-w-sm rounded-[32px] p-8 border text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-2 text-[#5D2E2E]">{urgentTab === "USAGE" ? "사용 수량" : "폐기 수량"}</h3>
            <p className="text-xs text-[#A68966] mb-8 font-bold">{urgentProcessTarget.product_name} ({urgentProcessTarget.expiry_date})</p>
            <div className="flex items-center justify-center gap-8 mb-10"><button onClick={() => setProcQty(Math.max(1, procQty - 1))} className="w-12 h-12 border rounded-full font-bold">-</button><input type="number" value={procQty} onChange={(e) => setProcQty(Math.min(urgentProcessTarget.quantity, parseInt(e.target.value) || 0))} className="w-20 text-center text-4xl font-black bg-transparent outline-none" /><button onClick={() => setProcQty(Math.min(urgentProcessTarget.quantity, procQty + 1))} className="w-12 h-12 border rounded-full font-bold">+</button></div>
            <div className="flex gap-3"><button onClick={() => setUrgentProcessTarget(null)} className="flex-1 py-4 text-[#A68966] font-bold">취소</button><button onClick={() => confirmUrgentProcess(procQty)} className="flex-[2] py-4 bg-[#5D2E2E] text-white rounded-2xl font-bold">확인</button></div>
          </div>
        </div>
      )}

      {statusLocation === "CLOSING" && closingItems.length > 0 && (
        <div className="fixed inset-0 bg-white z-[800] flex flex-col p-6 overflow-hidden">
          <div className="max-w-md mx-auto w-full h-full flex flex-col">
            <div className="flex justify-between items-center mb-8"><span className="text-xs font-bold text-[#A68966]">마감 정산 중 ({closingIndex + 1}/{closingItems.length})</span><button onClick={() => setStatusLocation("FLOOR")} className="text-sm font-bold text-[#DC3545]">중단</button></div>
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="bg-[#F9F5F0] px-6 py-2 rounded-full text-[#5D2E2E] font-bold text-sm mb-4">{closingItems[closingIndex].product_name}</div>
              <div className="text-[#A68966] text-base font-bold mb-8">유통기한: {closingItems[closingIndex].expiry_date}</div>
              <input autoFocus type="number" key={closingItems[closingIndex].id} defaultValue={closingItems[closingIndex].quantity} onKeyDown={(e) => { if (e.key === "Enter") handleClosingNext(Number(e.currentTarget.value) || 0); }} className="w-full text-center text-7xl font-black bg-transparent outline-none text-[#5D2E2E] mb-12" />
              <button onClick={(e) => handleClosingNext(Number((e.currentTarget.previousElementSibling as HTMLInputElement).value) || 0)} className="w-full py-6 bg-[#5D2E2E] text-white rounded-[32px] text-xl font-bold shadow-xl active:scale-95 transition-all">확인 후 다음</button>
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 z-[760] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-[#FDFBF7] w-full max-w-sm rounded-[32px] p-8 border border-[#EFE9E1] shadow-2xl">
            <h2 className="text-xl mb-2 text-center font-bold text-[#5D2E2E]">잠금 해제</h2><p className="text-[11px] text-center text-[#A68966] font-bold mb-8">아이디와 비밀번호를 입력해주세요.</p>
            <input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="아이디" className="w-full mb-3 p-4 border border-[#F5F0E9] rounded-2xl font-bold text-sm bg-white outline-none" />
            <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="비밀번호" className="w-full mb-8 p-4 border border-[#F5F0E9] rounded-2xl font-bold text-sm bg-white outline-none" />
            <button onClick={signIn} disabled={isAuthLoading} className="w-full py-4 bg-[#5D2E2E] text-white rounded-2xl font-bold shadow-lg disabled:bg-[#F5F0E9]">로그인</button>
          </div>
        </div>
      )}

      {editTarget && (
        <div className="fixed inset-0 bg-black/60 z-[700] flex items-center justify-center p-6" onClick={() => setEditTarget(null)}>
          <div className="bg-[#FDFBF7] w-full max-w-sm rounded-[32px] p-8 border shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-2 text-[#5D2E2E]">수량 수정</h3><p className="text-xs text-[#A68966] mb-8 font-bold">{editTarget.product_name} ({editTarget.expiry_date})</p>
            <div className="flex items-center justify-center gap-8 mb-10"><button onClick={() => setEditQty(Math.max(0, editQty - 1))} className="w-12 h-12 border border-[#F5F0E9] rounded-full font-bold bg-white text-[#5D2E2E]">-</button><input type="number" value={editQty} onChange={(e) => setEditQty(parseInt(e.target.value) || 0)} className="w-20 text-center text-4xl font-black bg-transparent outline-none" /><button onClick={() => setEditQty(editQty + 1)} className="w-12 h-12 border border-[#F5F0E9] rounded-full font-bold bg-white text-[#5D2E2E]">+</button></div>
            <button onClick={confirmEdit} className="w-full py-4 bg-[#5D2E2E] text-white rounded-2xl font-bold shadow-lg">수정 완료</button>
          </div>
        </div>
      )}

      {showMoveUrgentModal && (
        <div className="fixed inset-0 bg-black/60 z-[700] flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setShowMoveUrgentModal(false)}>
          <div className="bg-[#FDFBF7] w-full max-w-xs rounded-[32px] p-10 text-center border shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 bg-[#FDFBF7] border-2 border-orange-400 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold">!</div>
            <p className="font-bold text-lg mb-8 text-[#3E2723]">해당 재고를<br/>임박 재고로 보낼까요?</p>
            <div className="flex gap-3"><button onClick={() => setShowMoveUrgentModal(false)} className="flex-1 py-4 bg-white border text-[#A68966] rounded-2xl font-bold">취소</button><button onClick={confirmMoveToUrgent} className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-bold">이동</button></div>
          </div>
        </div>
      )}

      {moveTarget && (
        <div className="fixed inset-0 bg-black/60 z-[700] flex items-center justify-center p-6" onClick={() => setMoveTarget(null)}>
          <div className="bg-[#FDFBF7] w-full max-w-xs rounded-[32px] p-8 border shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-6 text-[#5D2E2E]">홀 이동</h3>
            <div className="flex items-center justify-center gap-6 mb-8"><button onClick={() => setMoveQty(Math.max(1, moveQty - 1))} className="w-10 h-10 border rounded-full font-bold bg-white text-[#5D2E2E]">-</button><span className="text-3xl font-black text-[#3E2723]">{moveQty}개</span><button onClick={() => setMoveQty(Math.min(moveTarget.quantity, moveQty + 1))} className="w-10 h-10 border rounded-full font-bold bg-white text-[#5D2E2E]">+</button></div>
            <button onClick={moveInventory} className="w-full py-4 bg-[#5D2E2E] text-white rounded-2xl font-bold shadow-lg">확인</button>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 z-[700] flex items-center justify-center p-6" onClick={() => setDeleteTarget(null)}>
          <div className="bg-[#FDFBF7] w-full max-w-xs rounded-[32px] p-10 text-center border shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="font-bold text-lg mb-8 text-[#3E2723]">정말 삭제할까요?</p>
            <div className="flex gap-3"><button onClick={() => setDeleteTarget(null)} className="flex-1 py-4 bg-white border text-[#A68966] rounded-2xl font-bold">취소</button><button onClick={execDelete} className="flex-1 py-4 bg-[#DC3545] text-white rounded-2xl font-bold">삭제</button></div>
          </div>
        </div>
      )}

      {showNoticeInput && (
        <div className="fixed inset-0 bg-black/60 z-[700] flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setShowNoticeInput(false)}>
          <div className="bg-[#FDFBF7] w-full max-w-sm rounded-[32px] p-8 border shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl mb-6 text-center font-bold text-[#5D2E2E]">공지사항 작성</h2>
            <input type="text" value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} placeholder="제목" className="w-full mb-4 p-4 border rounded-2xl bg-white outline-none" />
            <textarea value={noticeContent} onChange={(e) => setNoticeContent(e.target.value)} placeholder="내용" className="w-full mb-8 p-4 border rounded-2xl bg-white outline-none min-h-[150px] resize-none" />
            <div className="flex gap-3"><button onClick={() => setShowNoticeInput(false)} className="flex-1 py-4 text-[#A68966] font-bold">취소</button><button onClick={saveNotice} className="flex-[2] py-4 bg-[#5D2E2E] text-white rounded-2xl font-bold shadow-lg">등록</button></div>
          </div>
        </div>
      )}
    </>
  );
}