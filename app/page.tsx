"use client";

import { useEffect } from "react";
import { useInventory } from "./hooks/useInventory";

// 분리된 컴포넌트들 불러오기
import InventoryHeader from "./components/inventory/InventoryHeader";
import InventoryList from "./components/inventory/InventoryList";
import InventoryTotal from "./components/inventory/InventoryTotal";
import InventoryArchive from "./components/inventory/InventoryArchive";
import InventoryNotice from "./components/inventory/InventoryNotice";

// 분리된 모달들 불러오기
import AuthModal from "./components/modals/AuthModal";
import InputModal from "./components/modals/InputModal";
import EditModal from "./components/modals/EditModal";
import ClosingModal from "./components/modals/ClosingModal";

export default function 재고관리페이지() {
  const { auth, inventory, workflow, ui, constants } = useInventory();

  // [원칙] 모든 모달 오픈 시 뒷배경 스크롤 고정
  useEffect(() => {
    const isModalOpen = 
      auth.showModal || ui.modalStates.input || ui.modalStates.edit || 
      ui.modalStates.move || ui.modalStates.delete || ui.modalStates.moveUrgent || 
      ui.modalStates.notice || ui.modalStates.urgentProcess || 
      ui.modalStates.closingDetail || ui.location === "CLOSING" || workflow.closingList.length > 0;
      
    if (isModalOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
  }, [auth.showModal, ui.modalStates, ui.location, workflow.closingList]);

  // [보안] 로그아웃 상태에서는 로그인창만 노출
  if (!auth.isUnlocked) {
    return (
      <div className="w-full h-screen bg-[#FDFBF7] flex items-center justify-center">
        <AuthModal 
          showAuthModal={auth.showModal} 
          loginId={auth.userId} setLoginId={auth.setUserId} 
          loginPassword={auth.password} setLoginPassword={auth.setPassword} 
          isAuthLoading={auth.isLoading} signIn={auth.login}
        />
        {ui.toast && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-gray-800 text-white text-sm font-bold shadow-xl z-[1000]">
            {ui.toast}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#FDFBF7] font-sans text-[#3E2723] overflow-x-hidden">
      <div className="p-2 sm:p-4 max-w-5xl mx-auto">
        <style jsx global>{`
          input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
          input[type=number] { -moz-appearance: textfield; }
        `}</style>

        <InventoryHeader 
          statusLocation={ui.location} setStatusLocation={ui.setLocation} 
          archiveTab={ui.archiveTab} setArchiveTab={ui.setArchiveTab} 
          urgentTab={ui.urgentTab} setUrgentTab={ui.setUrgentTab}
          setIsMenuOpen={ui.setIsMenuOpen} isMenuOpen={ui.isMenuOpen} 
          isUnlocked={auth.isUnlocked} signOut={auth.logout} 
          checkClosing={workflow.startClosing} setShowAuthModal={auth.openLogin}
        />

        <div className="flex justify-between items-end mb-4 px-1 h-[42px]">
          {!["TOTAL", "ARCHIVE", "CLOSING", "NOTICE"].includes(ui.location) && (
            <div className="flex gap-2 h-full items-center">
              <button 
                onClick={() => ui.openInput(false)} 
                className="h-full px-5 bg-[#5D2E2E] text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all"
              >
                + {ui.location === "URGENT" ? "추가" : "재고 추가"}
              </button>
              {ui.location === "WAREHOUSE" && (
                <button 
                  onClick={() => ui.openInput(true)} 
                  className="h-full px-5 bg-white border border-[#5D2E2E] text-[#5D2E2E] rounded-xl text-xs font-bold shadow-sm active:scale-95"
                >
                  📦 일괄 입고
                </button>
              )}
            </div>
          )}
          {ui.location === "NOTICE" && auth.userRole === "ADMIN" && (
            <button 
              onClick={() => ui.setModals((p:any) => ({...p, notice: true}))} 
              className="h-full px-5 bg-[#5D2E2E] text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all"
            >
              + 공지 작성
            </button>
          )}
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">
            {ui.location}
          </span>
        </div>

        {ui.location === "TOTAL" ? (
          <InventoryTotal items={inventory.items} YANGGANG_TYPES={constants.YANGGANG_종류} />
        ) : ui.location === "ARCHIVE" ? (
          <InventoryArchive 
            archiveTab={ui.archiveTab} userRole={auth.userRole} 
            historyEvents={inventory.history} closingRecords={inventory.closing}
            clearHistory={inventory.clearHistory} setClosingDetail={(c) => ui.setModals((p:any)=>({...p, closingDetail:c}))}
            setDeleteMode={(m) => ui.setModals((p:any)=>({...p, deleteMode:m}))} setDeleteTarget={(t) => ui.setModals((p:any)=>({...p, delete:t}))}
          />
        ) : ui.location === "NOTICE" ? (
          <InventoryNotice 
            userRole={auth.userRole} noticeItems={inventory.notices}
            setDeleteMode={(m) => ui.setModals((p:any)=>({...p, deleteMode:m}))} setDeleteTarget={(t) => ui.setModals((p:any)=>({...p, delete:t}))}
          />
        ) : ui.location === "CLOSING" ? (
          null 
        ) : (
          <InventoryList 
            statusLocation={ui.location} items={inventory.items} 
            setInventoryItems={inventory.sets} urgentItems={inventory.urgent} 
            YANGGANG_TYPES={constants.YANGGANG_종류} SET_TYPES={constants.SET_종류}
            ensureAuthenticated={auth.ensureAuth}
            setEditTarget={(t) => ui.setModals((p:any)=>({...p, edit:t, editQty:t.quantity}))}
            setMoveTarget={(t) => ui.setModals((p:any)=>({...p, move:t, moveQty:t.quantity}))}
            setMoveQty={(q) => ui.setModals((p:any)=>({...p, moveQty:q}))}
            setDeleteMode={(m) => ui.setModals((p:any)=>({...p, deleteMode:m}))}
            setDeleteTarget={(t) => ui.setModals((p:any)=>({...p, delete:t}))}
            setShowMoveUrgentModal={(s) => ui.setModals((p:any)=>({...p, moveUrgent:s}))}
            setMoveUrgentTarget={(t) => ui.setModals((p:any)=>({...p, moveUrgentTarget:t}))}
          />
        )}

        <AuthModal 
          showAuthModal={auth.showModal} loginId={auth.userId} setLoginId={auth.setUserId} 
          loginPassword={auth.password} setLoginPassword={auth.setPassword} 
          isAuthLoading={auth.isLoading} signIn={auth.login}
        />

        <InputModal 
          showInputModal={ui.modalStates.input} setShowInputModal={(s) => ui.setModals((p:any)=>({...p, input:s}))}
          isBatchMode={ui.modalStates.batch} statusLocation={ui.location} urgentTab={ui.urgentTab} urgentItems={inventory.urgent}
          YANGGANG_TYPES={constants.YANGGANG_종류} SET_TYPES={constants.SET_종류}
          selectedProduct={workflow.entryProduct} setSelectedProduct={(p) => workflow.setEntry("entryProduct", p)}
          expiryDate={workflow.entryExpiry} setExpiryDate={(e) => workflow.setEntry("entryExpiry", e)}
          quantity={workflow.entryQty} setQuantity={(q) => workflow.setEntry("entryQty", q)}
          setMemo={workflow.entrySetMemo} setSetMemo={(m) => workflow.setEntry("entrySetMemo", m)}
          saveInventory={inventory.save} isSaving={ui.isSaving} 
          pendingList={workflow.pendingList} addToPending={workflow.addPending}
          setUrgentProcessTarget={(t) => ui.setModals((p:any)=>({...p, urgentProcess:t}))}
          setProcQty={() => {}} 
        />

        <EditModal 
          editTarget={ui.modalStates.edit} setEditTarget={(t) => ui.setModals((p:any)=>({...p, edit:t}))}
          editQty={ui.modalStates.editQty} setEditQty={(q) => ui.setModals((p:any)=>({...p, editQty:q}))} confirmEdit={inventory.confirmEdit}
          moveTarget={ui.modalStates.move} setMoveTarget={(t) => ui.setModals((p:any)=>({...p, move:t}))}
          moveQty={ui.modalStates.moveQty} setMoveQty={(q) => ui.setModals((p:any)=>({...p, moveQty:q}))} moveInventory={inventory.move}
          deleteTarget={ui.modalStates.delete} setDeleteTarget={(t) => ui.setModals((p:any)=>({...p, delete:t}))} execDelete={inventory.delete}
          showMoveUrgentModal={ui.modalStates.moveUrgent} setShowMoveUrgentModal={(s) => ui.setModals((p:any)=>({...p, moveUrgent:s}))}
          moveUrgentTarget={ui.modalStates.moveUrgentTarget} confirmMoveToUrgent={inventory.confirmMoveToUrgent}
        />

        <ClosingModal 
          closingItems={workflow.closingList} closingIndex={workflow.closingIndex} handleClosingNext={workflow.handleClosingStep} 
          setStatusLocation={ui.setLocation} closingDetail={ui.modalStates.closingDetail} setClosingDetail={(c) => ui.setModals((p:any)=>({...p, closingDetail:c}))}
          showNoticeInput={ui.modalStates.notice} setShowNoticeInput={(s) => ui.setModals((p:any)=>({...p, notice:s}))}
          noticeTitle={ui.modalStates.noticeTitle} setNoticeTitle={(t) => ui.setModals((p:any)=>({...p, noticeTitle:t}))}
          noticeContent={ui.modalStates.noticeContent} setNoticeContent={(c) => ui.setModals((p:any)=>({...p, noticeContent:c}))} saveNotice={inventory.saveNotice}
          urgentProcessTarget={ui.modalStates.urgentProcess} setUrgentProcessTarget={(t) => ui.setModals((p:any)=>({...p, urgentProcess:t}))}
          confirmUrgentProcess={inventory.confirmUrgentProcess}
        />

        {ui.toast && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-gray-800 text-white text-sm font-bold shadow-xl z-[900]">
            {ui.toast}
          </div>
        )}
      </div>
    </div>
  );
}