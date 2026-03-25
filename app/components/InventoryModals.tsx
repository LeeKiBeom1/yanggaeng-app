"use client";

interface ModalsProps {
  showInputModal: boolean;
  setShowInputModal: (show: boolean) => void;
  statusLocation: string;
  YANGGANG_TYPES: string[];
  selectedProduct: string;
  setSelectedProduct: (p: string) => void;
  expiryDate: string;
  setExpiryDate: (d: string) => void;
  quantity: number;
  setQuantity: (q: number) => void;
  saveInventory: () => void;
  showAuthModal: boolean;
  loginId: string;
  setLoginId: (id: string) => void;
  loginPassword: string;
  setLoginPassword: (pw: string) => void;
  isAuthLoading: boolean;
  signIn: () => void;
  editTarget: any;
  setEditTarget: (t: any) => void;
  editQty: number;
  setEditQty: (q: number) => void;
  confirmEdit: () => void;
  moveTarget: any;
  setMoveTarget: (t: any) => void;
  moveQty: number;
  setMoveQty: (q: number) => void;
  moveInventory: () => void;
  deleteTarget: any;
  setDeleteTarget: (t: any) => void;
  setDeleteMode: (m: any) => void;
  execDelete: () => void;
}

export default function InventoryModals(props: ModalsProps) {
  const {
    showInputModal, setShowInputModal, statusLocation, YANGGANG_TYPES,
    selectedProduct, setSelectedProduct, expiryDate, setExpiryDate,
    quantity, setQuantity, saveInventory,
    showAuthModal, loginId, setLoginId, loginPassword, setLoginPassword, isAuthLoading, signIn,
    editTarget, setEditTarget, editQty, setEditQty, confirmEdit,
    moveTarget, setMoveTarget, moveQty, setMoveQty, moveInventory,
    deleteTarget, setDeleteTarget, setDeleteMode, execDelete
  } = props;

  return (
    <>
      {/* 1. 재고 추가 모달 */}
      {showInputModal && (
        <div className="fixed inset-0 bg-black/60 z-[700] flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setShowInputModal(false)}>
          <div className="bg-[#FDFBF7] w-full max-w-sm rounded-[32px] p-8 border border-[#EFE9E1] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl mb-6 text-center font-bold text-[#5D2E2E]">재고 추가</h2>
            
            {/* 품목 선택 그리드 */}
            <div className="grid grid-cols-4 gap-2 mb-6 max-h-40 overflow-y-auto p-2 border border-[#F5F0E9] rounded-2xl bg-white text-center shadow-inner">
              {YANGGANG_TYPES.map(p => (
                <button 
                  key={p} 
                  onClick={() => setSelectedProduct(`${p} 양갱`)} 
                  className={`py-2 text-[10px] rounded-xl border font-bold transition-all ${
                    selectedProduct === `${p} 양갱` 
                    ? "bg-[#5D2E2E] text-white border-[#5D2E2E] shadow-md" 
                    : "bg-white text-[#A68966] border-[#F5F0E9] hover:bg-[#F9F5F0]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* 날짜 선택 */}
            <input 
              type="date" 
              value={expiryDate} 
              onChange={(e) => setExpiryDate(e.target.value)} 
              className="w-full mb-4 p-4 border border-[#F5F0E9] rounded-2xl font-bold text-center bg-white text-[#3E2723] focus:border-[#5D2E2E] outline-none shadow-sm transition-all" 
            />
            
            {/* 빠른 수량 조절 버튼 */}
            <div className="flex gap-2 mb-6">
              <button onClick={() => setQuantity(quantity + 10)} className="flex-1 py-3 bg-white border border-[#F5F0E9] rounded-xl text-[11px] font-bold text-[#A68966] hover:bg-[#F9F5F0] shadow-sm transition-all">+10</button>
              <button onClick={() => setQuantity(quantity + 40)} className="flex-1 py-3 bg-white border border-[#F5F0E9] rounded-xl text-[11px] font-bold text-[#A68966] hover:bg-[#F9F5F0] shadow-sm transition-all">+40</button>
              <button onClick={() => setQuantity(0)} className="flex-1 py-3 bg-[#FFF5F5] border border-[#FFE3E3] rounded-xl text-[11px] font-bold text-[#DC3545] hover:bg-[#FEE2E2] shadow-sm transition-all">초기화</button>
            </div>

            {/* 메인 수량 조절 */}
            <div className="flex items-center justify-center gap-8 mb-8">
              <button onClick={() => setQuantity(Math.max(0, quantity - 1))} className="w-12 h-12 border border-[#F5F0E9] rounded-full font-bold text-xl bg-white text-[#5D2E2E] shadow-md hover:bg-[#F9F5F0] active:scale-95 transition-all">-</button>
              <input type="number" value={quantity || ""} placeholder="0" onChange={(e) => setQuantity(parseInt(e.target.value) || 0)} className="w-20 text-center text-4xl font-black bg-transparent focus:outline-none text-[#3E2723]" />
              <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 border border-[#F5F0E9] rounded-full font-bold text-xl bg-white text-[#5D2E2E] shadow-md hover:bg-[#F9F5F0] active:scale-95 transition-all">+</button>
            </div>

            {/* 하단 실행 버튼 */}
            <div className="flex gap-3 text-center">
              <button onClick={() => setShowInputModal(false)} className="flex-1 py-4 text-[#A68966] font-bold hover:text-[#5D2E2E] transition-colors">취소</button>
              <button onClick={saveInventory} className="flex-[2] py-4 bg-[#5D2E2E] text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all">저장하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. 로그인 모달 */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 z-[760] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-[#FDFBF7] w-full max-w-sm rounded-[32px] p-8 border border-[#EFE9E1] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl mb-2 text-center font-bold text-[#5D2E2E]">잠금 해제</h2>
            <p className="text-[11px] text-center text-[#A68966] font-bold mb-8 tracking-tight uppercase">Authentication Required</p>
            
            <input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="아이디" className="w-full mb-3 p-4 border border-[#F5F0E9] rounded-2xl font-bold text-sm bg-white focus:border-[#5D2E2E] outline-none shadow-sm" />
            <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="비밀번호" className="w-full mb-8 p-4 border border-[#F5F0E9] rounded-2xl font-bold text-sm bg-white focus:border-[#5D2E2E] outline-none shadow-sm" />
            
            <button 
              onClick={signIn} 
              disabled={isAuthLoading} 
              className="w-full py-4 bg-[#5D2E2E] text-white rounded-2xl font-bold shadow-lg hover:bg-[#3E2723] disabled:bg-[#F5F0E9] disabled:text-[#A68966] transition-all"
            >
              {isAuthLoading ? "확인 중..." : "시스템 시작하기"}
            </button>
          </div>
        </div>
      )}

      {/* 3. 수정 모달 */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/60 z-[700] flex items-center justify-center p-6" onClick={() => setEditTarget(null)}>
          <div className="bg-[#FDFBF7] w-full max-w-sm rounded-[32px] p-8 border border-[#EFE9E1] shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-2 text-[#5D2E2E]">수량 수정</h3>
            <p className="text-xs text-[#A68966] mb-8 font-bold">{editTarget.product_name} ({editTarget.expiry_date})</p>
            
            <div className="flex items-center justify-center gap-8 mb-10">
              <button onClick={() => setEditQty(Math.max(0, editQty - 1))} className="w-12 h-12 border border-[#F5F0E9] rounded-full font-bold text-xl bg-white text-[#5D2E2E] shadow-sm">-</button>
              <input type="number" value={editQty} onChange={(e) => setEditQty(parseInt(e.target.value) || 0)} className="w-20 text-center text-4xl font-black bg-transparent focus:outline-none text-[#3E2723]" />
              <button onClick={() => setEditQty(editQty + 1)} className="w-12 h-12 border border-[#F5F0E9] rounded-full font-bold text-xl bg-white text-[#5D2E2E] shadow-sm">+</button>
            </div>
            
            <button onClick={confirmEdit} className="w-full py-4 bg-[#5D2E2E] text-white rounded-2xl font-bold shadow-lg hover:bg-[#3E2723] transition-all">수정 완료</button>
          </div>
        </div>
      )}

      {/* 4. 이동 모달 */}
      {moveTarget && (
        <div className="fixed inset-0 bg-black/60 z-[700] flex items-center justify-center p-6" onClick={() => setMoveTarget(null)}>
          <div className="bg-[#FDFBF7] w-full max-w-xs rounded-[32px] p-8 border border-[#EFE9E1] shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-6 text-[#5D2E2E]">재고 위치 이동</h3>
            <p className="text-[11px] text-[#A68966] mb-4 font-bold uppercase tracking-wider">Stock Transfer</p>
            
            <div className="flex items-center justify-center gap-6 mb-8 text-center">
              <button onClick={() => setMoveQty(Math.max(1, moveQty - 1))} className="w-10 h-10 border border-[#F5F0E9] rounded-full font-bold bg-white text-[#5D2E2E] shadow-sm">-</button>
              <span className="text-3xl font-black text-[#3E2723]">{moveQty}개</span>
              <button onClick={() => setMoveQty(Math.min(moveTarget.quantity, moveQty + 1))} className="w-10 h-10 border border-[#F5F0E9] rounded-full font-bold bg-white text-[#5D2E2E] shadow-sm">+</button>
            </div>
            
            <button onClick={moveInventory} className="w-full py-4 bg-[#5D2E2E] text-white rounded-2xl font-bold shadow-lg hover:bg-[#3E2723] transition-all">이동 확정하기</button>
          </div>
        </div>
      )}

      {/* 5. 삭제 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 z-[700] flex items-center justify-center p-6" onClick={() => { setDeleteTarget(null); setDeleteMode("inventory"); }}>
          <div className="bg-[#FDFBF7] w-full max-w-xs rounded-[32px] p-10 text-center border border-[#EFE9E1] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 bg-[#FFF5F5] text-[#DC3545] rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">!</div>
            <p className="font-bold text-lg mb-8 text-[#3E2723]">해당 재고 내역을<br/>영구 삭제할까요?</p>
            
            <div className="flex gap-3 text-center">
              <button onClick={() => { setDeleteTarget(null); setDeleteMode("inventory"); }} className="flex-1 py-4 bg-white border border-[#F5F0E9] text-[#A68966] rounded-2xl font-bold hover:bg-[#F9F5F0] transition-all">취소</button>
              <button onClick={execDelete} className="flex-1 py-4 bg-[#DC3545] text-white rounded-2xl font-bold shadow-md hover:bg-[#C82333] transition-all">삭제</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}