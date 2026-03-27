"use client";
import { useInventory } from "./hooks/useInventory";
import InventoryHeader from "./components/InventoryHeader";
import InventoryModals from "./components/InventoryModals";
import InventoryContent from "./components/InventoryContent";

export default function 재고관리페이지() {
  const { auth, inventory, workflow, ui, constants } = useInventory();

  return (
    <div className="w-full min-h-screen bg-[#FDFBF7] font-sans text-[#3E2723] overflow-x-hidden">
      <div className="p-2 sm:p-4 max-w-5xl mx-auto">
        <style jsx global>{`
          input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
          input[type=number] { -moz-appearance: textfield; }
        `}</style>

        {/* 1. 상단 헤더 */}
        <InventoryHeader 
          statusLocation={ui.location} setStatusLocation={ui.setLocation} 
          archiveTab={ui.archiveTab} setArchiveTab={ui.setArchiveTab} 
          urgentTab={ui.urgentTab} setUrgentTab={ui.setUrgentTab}
          setIsMenuOpen={ui.setIsMenuOpen} isMenuOpen={ui.isMenuOpen} 
          isUnlocked={auth.isUnlocked} signOut={auth.logout} 
          checkClosing={workflow.startClosing} setShowAuthModal={auth.openLogin}
        />

        {/* 2. 상단 액션 버튼 영역 */}
        <div className="flex justify-between items-end mb-4 px-1 h-[42px]">
          {!["TOTAL", "ARCHIVE", "CLOSING", "NOTICE"].includes(ui.location) && (
            <div className="flex gap-2 h-full items-center">
              <button onClick={() => ui.openInput(false)} className="h-full px-5 bg-[#5D2E2E] text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all">
                + {ui.location === "URGENT" ? (ui.urgentTab === "USAGE" ? "사용" : "폐기") : "재고"} 추가
              </button>
              {ui.location === "WAREHOUSE" && (
                <button onClick={() => ui.openInput(true)} className="h-full px-5 bg-white border border-[#5D2E2E] text-[#5D2E2E] rounded-xl text-xs font-bold shadow-sm active:scale-95">📦 일괄 입고</button>
              )}
            </div>
          )}
          {ui.location === "NOTICE" && auth.userRole === "ADMIN" && (
            <button onClick={() => ui.setModals((p:any)=>({...p, notice:true}))} className="h-full px-5 bg-[#5D2E2E] text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all">+ 공지 작성</button>
          )}
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">{ui.location}</span>
        </div>

        {/* 3. 본문 콘텐츠 리스트 */}
        <InventoryContent 
          statusLocation={ui.location} archiveTab={ui.archiveTab} urgentTab={ui.urgentTab} userRole={auth.userRole} 
          historyEvents={inventory.history} items={inventory.items} urgentItems={inventory.urgent} 
          setInventoryItems={inventory.sets} noticeItems={inventory.notices} usageItems={inventory.usage} 
          disposalItems={inventory.disposal} closingRecords={inventory.closing}
          YANGGANG_TYPES={constants.YANGGANG_종류} SET_TYPES={constants.SET_종류} 
          getLocationStock={inventory.getLocationStock} ensureAuthenticated={auth.ensureAuth}
          clearHistory={inventory.clearHistory} 
          getDaysUntilExpiry={(d:any)=>Math.ceil((new Date(d).setHours(0,0,0,0)-new Date().setHours(0,0,0,0))/86400000)}
          setEditTarget={(t:any)=>ui.setModals((p:any)=>({...p, edit:t, editQty:t.quantity}))} 
          setMoveTarget={(t:any)=>ui.setModals((p:any)=>({...p, move:t, moveQty:t.quantity}))} 
          setMoveQty={(q:number)=>ui.setModals((p:any)=>({...p, moveQty:q}))} 
          setDeleteMode={(m:string)=>ui.setModals((p:any)=>({...p, deleteMode:m}))} 
          setDeleteTarget={(t:any)=>ui.setModals((p:any)=>({...p, delete:t}))} 
          setShowMoveUrgentModal={(s:boolean)=>ui.setModals((p:any)=>({...p, moveUrgent:s}))} 
          setMoveUrgentTarget={(t:any)=>ui.setModals((p:any)=>({...p, moveUrgentTarget:t}))} 
          fmtDate={(iso:any)=>iso.slice(5).replace("-","/")}
        />

        {/* 4. 각종 작업용 모달들 */}
        <InventoryModals 
          showInputModal={ui.modalStates.input} setShowInputModal={(s:any)=>ui.setModals((p:any)=>({...p, input:s}))} 
          isBatchMode={ui.modalStates.batch} statusLocation={ui.location} urgentTab={ui.urgentTab} urgentItems={inventory.urgent} 
          YANGGANG_TYPES={constants.YANGGANG_종류} SET_TYPES={constants.SET_종류} 
          selectedProduct={workflow.entryProduct} setSelectedProduct={(p:any)=>workflow.setEntry("entryProduct", p)} 
          expiryDate={workflow.entryExpiry} setExpiryDate={(e:any)=>workflow.setEntry("entryExpiry", e)} 
          quantity={workflow.entryQty} setQuantity={(q:any)=>workflow.setEntry("entryQty", q)} 
          setMemo={workflow.entrySetMemo} setSetMemo={(m:any)=>workflow.setEntry("entrySetMemo", m)} 
          saveInventory={inventory.save} isSaving={ui.isSaving} pendingList={workflow.pendingList} setPendingList={(l:any)=>workflow.setEntry("pendingList", l)}
          showAuthModal={auth.showModal} loginId={auth.userId} setLoginId={(id:any)=>auth.setUserId(id)} loginPassword={auth.password} setLoginPassword={(pw:any)=>auth.setPassword(pw)} isAuthLoading={auth.isLoading} signIn={auth.login}
          editTarget={ui.modalStates.edit} setEditTarget={(t:any)=>ui.setModals((p:any)=>({...p, edit:t}))} editQty={ui.modalStates.editQty} setEditQty={(q:any)=>ui.setModals((p:any)=>({...p, editQty:q}))} confirmEdit={inventory.confirmEdit}
          moveTarget={ui.modalStates.move} setMoveTarget={(t:any)=>ui.setModals((p:any)=>({...p, move:t}))} moveQty={ui.modalStates.moveQty} setMoveQty={(q:any)=>ui.setModals((p:any)=>({...p, moveQty:q}))} moveInventory={inventory.move}
          deleteTarget={ui.modalStates.delete} setDeleteTarget={(t:any)=>ui.setModals((p:any)=>({...p, delete:t}))} setDeleteMode={(m:any)=>ui.setModals((p:any)=>({...p, deleteMode:m}))} execDelete={inventory.delete}
          showMoveUrgentModal={ui.modalStates.moveUrgent} setShowMoveUrgentModal={(s:any)=>ui.setModals((p:any)=>({...p, moveUrgent:s}))} moveUrgentTarget={ui.modalStates.moveUrgentTarget} confirmMoveToUrgent={inventory.confirmMoveToUrgent}
          closingItems={workflow.closingList} closingIndex={workflow.closingIndex} setClosingIndex={(i:any)=>workflow.setEntry("closingIndex", i)} setStatusLocation={ui.setLocation} triggerToast={ui.triggerToast} refreshData={inventory.refresh} saveClosing={workflow.saveClosing}
          showNoticeInput={ui.modalStates.notice} setShowNoticeInput={(s:any)=>ui.setModals((p:any)=>({...p, notice:s}))} noticeTitle={ui.modalStates.noticeTitle} setNoticeTitle={(t:any)=>ui.setModals((p:any)=>({...p, noticeTitle:t}))} noticeContent={ui.modalStates.noticeContent} setNoticeContent={(c:any)=>ui.setModals((p:any)=>({...p, noticeContent:c}))} saveNotice={inventory.saveNotice}
          urgentProcessTarget={ui.modalStates.urgentProcess} setUrgentProcessTarget={(t:any)=>ui.setModals((p:any)=>({...p, urgentProcess:t}))} confirmUrgentProcess={inventory.confirmUrgentProcess}
        />

        {/* 5. 하단 알림 피드백 */}
        {ui.toast && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-gray-800 text-white text-sm font-bold shadow-xl z-[900]">{ui.toast}</div>}
      </div>
    </div>
  );
}