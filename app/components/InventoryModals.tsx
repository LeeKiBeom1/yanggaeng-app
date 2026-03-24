"use client";

interface ModalsProps {
  // 재고 추가 모달 관련
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

  // 로그인 모달 관련
  showAuthModal: boolean;
  loginId: string;
  setLoginId: (id: string) => void;
  loginPassword: string;
  setLoginPassword: (pw: string) => void;
  isAuthLoading: boolean;
  signIn: () => void;

  // 수정/이동/삭제 관련
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
        <div className="fixed inset-0 bg-black/50 z-[700] flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setShowInputModal(false)}>
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 border border-gray-200 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg mb-6 text-center font-bold text-blue-600">재고 추가</h2>
            {statusLocation === "URGENT" && (
              <p className="text-[11px] text-center text-red-500 font-bold -mt-3 mb-4">임박 재고는 유통기한 14일 이내만 추가할 수 있습니다.</p>
            )}
            <div className="grid grid-cols-4 gap-2 mb-6 max-h-40 overflow-y-auto p-1 border border-gray-100 rounded-lg text-center">
              {YANGGANG_TYPES.map(p => (
                <button key={p} onClick={() => setSelectedProduct(`${p} 양갱`)} className={`py-1.5 text-[10px] rounded-md border font-bold ${selectedProduct === `${p} 양갱` ? "bg-blue-600 text-white border-blue-600" : "bg-gray-50 text-gray-400 border-gray-100"}`}>{p}</button>
              ))}
            </div>
            <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full mb-4 p-3 border border-gray-200 rounded-xl font-bold text-center" />
            <div className="flex gap-2 mb-4">
              <button onClick={() => setQuantity(quantity + 10)} className="flex-1 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-500 hover:bg-gray-100">+10</button>
              <button onClick={() => setQuantity(quantity + 40)} className="flex-1 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-500 hover:bg-gray-100">+40</button>
              <button onClick={() => setQuantity(0)} className="flex-1 py-2 bg-red-50 border border-red-100 rounded-lg text-[10px] font-bold text-red-400 hover:bg-red-100">초기화</button>
            </div>
            <div className="flex items-center justify-center gap-6 mb-6">
              <button onClick={() => setQuantity(Math.max(0, quantity - 1))} className="w-10 h-10 border border-gray-200 rounded-full font-bold text-xl">-</button>
              <input type="number" value={quantity || ""} placeholder="0" onChange={(e) => setQuantity(parseInt(e.target.value) || 0)} className="w-16 text-center text-3xl font-bold bg-transparent focus:outline-none" />
              <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 border border-gray-200 rounded-full font-bold text-xl">+</button>
            </div>
            <div className="flex gap-2 text-center">
              <button onClick={() => setShowInputModal(false)} className="flex-1 py-3 text-gray-400 font-bold">취소</button>
              <button onClick={saveInventory} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">저장</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. 로그인 모달 */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 z-[760] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 border border-gray-200 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg mb-2 text-center font-bold text-blue-600">잠금 해제 로그인</h2>
            <p className="text-[11px] text-center text-gray-500 font-bold mb-5">아이디와 비밀번호를 입력해야 사용 가능합니다.</p>
            <input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="아이디" className="w-full mb-3 p-3 border border-gray-200 rounded-xl font-bold text-sm" />
            <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="비밀번호" className="w-full mb-5 p-3 border border-gray-200 rounded-xl font-bold text-sm" />
            <button onClick={signIn} disabled={isAuthLoading} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold disabled:bg-blue-300">{isAuthLoading ? "로그인 중..." : "로그인"}</button>
          </div>
        </div>
      )}

      {/* 3. 수정 모달 */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 z-[700] flex items-center justify-center p-6" onClick={() => setEditTarget(null)}>
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-2 text-blue-600">수량 수정</h3>
            <p className="text-xs text-gray-400 mb-6 font-bold">{editTarget.product_name} ({editTarget.expiry_date})</p>
            <div className="flex items-center justify-center gap-6 mb-8 text-center">
              <button onClick={() => setEditQty(Math.max(0, editQty - 1))} className="w-10 h-10 border border-gray-200 rounded-full font-bold text-xl">-</button>
              <input type="number" value={editQty} onChange={(e) => setEditQty(parseInt(e.target.value) || 0)} className="w-16 text-center text-3xl font-bold bg-transparent focus:outline-none" />
              <button onClick={() => setEditQty(editQty + 1)} className="w-10 h-10 border border-gray-200 rounded-full font-bold text-xl">+</button>
            </div>
            <button onClick={confirmEdit} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md">수정 완료</button>
          </div>
        </div>
      )}

      {/* 4. 이동 모달 */}
      {moveTarget && (
        <div className="fixed inset-0 bg-black/50 z-[700] flex items-center justify-center p-6" onClick={() => setMoveTarget(null)}>
          <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-xl text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-4 text-blue-600">재고 이동 (홀 ↔ 창고)</h3>
            <div className="flex items-center justify-center gap-4 mb-6 text-center">
              <button onClick={() => setMoveQty(Math.max(1, moveQty - 1))} className="w-10 h-10 border border-gray-200 rounded-full font-bold">-</button>
              <span className="text-2xl font-bold">{moveQty}개</span>
              <button onClick={() => setMoveQty(Math.min(moveTarget.quantity, moveQty + 1))} className="w-10 h-10 border border-gray-200 rounded-full font-bold">+</button>
            </div>
            <button onClick={moveInventory} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">이동 확정</button>
          </div>
        </div>
      )}

      {/* 5. 삭제 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-[700] flex items-center justify-center p-6" onClick={() => { setDeleteTarget(null); setDeleteMode("inventory"); }}>
          <div className="bg-white w-full max-w-xs rounded-2xl p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="font-bold text-lg mb-6">정말 삭제하시겠습니까?</p>
            <div className="flex gap-2 text-center">
              <button onClick={() => { setDeleteTarget(null); setDeleteMode("inventory"); }} className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold">취소</button>
              <button onClick={execDelete} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold">삭제</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}