"use client";

interface InventoryHeaderProps {
  statusLocation: string;
  setStatusLocation: (loc: any) => void;
  archiveTab: string;
  setArchiveTab: (tab: any) => void;
  urgentTab: string;
  setUrgentTab: (tab: any) => void;
  setIsMenuOpen: (open: boolean) => void;
  isMenuOpen: boolean;
  isUnlocked: boolean;
  signOut: () => void;
  checkClosing: () => void;
  setShowAuthModal: (show: boolean) => void;
}

export default function InventoryHeader({
  statusLocation,
  setStatusLocation,
  archiveTab,
  setArchiveTab,
  urgentTab,
  setUrgentTab,
  setIsMenuOpen,
  isMenuOpen,
  isUnlocked,
  signOut,
  checkClosing,
  setShowAuthModal,
}: InventoryHeaderProps) {
  return (
    <>
      {/* 상단 로고 및 메인 탭 영역 */}
      <div className="flex items-center justify-between mb-8 gap-3">
        <button 
          onClick={() => setStatusLocation("FLOOR")} 
          className="text-[22px] font-black text-[#5D2E2E] tracking-tighter shrink-0 px-2 active:scale-95 transition-transform"
        >
          금옥당
        </button>
        
        <div className="flex flex-1 gap-1 bg-white p-1.5 rounded-2xl border border-[#EFE9E1] shadow-sm h-[56px] items-center">
          {statusLocation === "ARCHIVE" ? (
            /* 기록 보관소 탭 */
            ["HISTORY", "DAILY"].map((tab) => (
              <button 
                key={tab} 
                onClick={() => setArchiveTab(tab)} 
                className={`flex-1 h-full rounded-xl text-xs font-bold transition-all ${archiveTab === tab ? "bg-[#5D2E2E] text-white shadow-md" : "text-[#A68966]"}`}
              >
                {tab === "HISTORY" ? "입출고 기록" : "일마감 기록"}
              </button>
            ))
          ) : statusLocation === "URGENT" ? (
            /* 임박 재고 탭 */
            ["STORAGE", "USAGE", "DISPOSAL"].map((tab) => (
              <button 
                key={tab} 
                onClick={() => setUrgentTab(tab)} 
                className={`flex-1 h-full rounded-xl text-[10.5px] font-bold transition-all ${urgentTab === tab ? "bg-[#5D2E2E] text-white shadow-md" : "text-[#A68966]"}`}
              >
                {tab === "STORAGE" ? "보관 재고" : tab === "USAGE" ? "사용 내역" : "폐기 내역"}
              </button>
            ))
          ) : (
            /* 일반(홀/창고) 탭 */
            ["FLOOR", "WAREHOUSE"].map((loc) => (
              <button 
                key={loc} 
                onClick={() => setStatusLocation(loc)} 
                className={`flex-1 h-full rounded-xl text-sm font-bold transition-all ${statusLocation === loc ? "bg-[#5D2E2E] text-white shadow-md" : "text-[#A68966]"}`}
              >
                {loc === "FLOOR" ? "홀" : "창고"}
              </button>
            ))
          )}
        </div>

        {/* 햄버거 메뉴 버튼 */}
        <button 
          onClick={() => setIsMenuOpen(true)} 
          className="w-14 h-14 bg-white rounded-2xl border border-[#EFE9E1] flex flex-col items-center justify-center gap-1.5 active:scale-95 shadow-sm shrink-0"
        >
          <div className="w-6 h-[2.5px] bg-[#3E2723] rounded-full"></div>
          <div className="w-6 h-[2.5px] bg-[#3E2723] rounded-full"></div>
        </button>
      </div>

      {/* 사이드 메뉴 드롭다운 */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[750] bg-black/30 backdrop-blur-md" onClick={() => setIsMenuOpen(false)}>
          <div className="max-w-md mx-auto h-full relative pointer-events-none">
            <div 
              className="absolute top-4 right-4 w-56 bg-[#FDFBF7]/90 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl overflow-hidden pointer-events-auto" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between">
                <div className="text-[12px] font-bold text-[#5D2E2E]">메뉴</div>
                <button className="text-[#A68966] font-bold text-xl leading-none px-2" onClick={() => setIsMenuOpen(false)}>×</button>
              </div>
              <div className="p-2 flex flex-col gap-1">
                {[
                  { id: "TOTAL", label: "재고 합계" },
                  { id: "CLOSING_ACTION", label: "재고 마감하기", action: checkClosing },
                  { id: "URGENT", label: "임박 재고" },
                  { id: "SET", label: "세트 재고" },
                  { id: "NOTICE", label: "공지사항" },
                  { id: "ARCHIVE", label: "기록 보관소" }
                ].map((item) => (
                  <button 
                    key={item.id} 
                    onClick={() => { 
                      if (item.action) item.action(); 
                      else setStatusLocation(item.id); 
                      setIsMenuOpen(false); 
                    }} 
                    className="w-full text-left px-4 py-3 rounded-2xl hover:bg-black/5 font-bold text-[14px] text-[#3E2723]"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="h-px bg-black/5 my-1" />
                <button 
                  onClick={() => { 
                    setIsMenuOpen(false); 
                    if (isUnlocked) signOut(); 
                    else setShowAuthModal(true); 
                  }} 
                  className={`w-full text-left px-4 py-3 rounded-2xl hover:bg-black/5 font-bold text-[14px] ${isUnlocked ? "text-[#DC3545]" : "text-[#198754]"}`}
                >
                  {isUnlocked ? "로그아웃" : "로그인"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}