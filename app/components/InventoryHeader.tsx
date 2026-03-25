"use client";
export default function InventoryHeader({ statusLocation, setStatusLocation, setIsMenuOpen, isMenuOpen, isUnlocked, signOut, setShowAuthModal }: any) {
  return (
    <>
      <div className="flex items-center justify-between mb-8 max-w-md mx-auto gap-3">
        <div className="flex flex-1 gap-1 bg-white p-1.5 rounded-2xl border border-[#EFE9E1] shadow-sm h-[56px] items-center">
          {["FLOOR", "WAREHOUSE"].map((loc) => (
            <button key={loc} onClick={() => setStatusLocation(loc)} className={`flex-1 h-full rounded-xl text-sm font-bold transition-all min-w-[80px] ${statusLocation === loc ? "bg-[#5D2E2E] text-white shadow-md" : "text-[#A68966] hover:bg-[#FDFBF7]"}`}>
              {loc === "FLOOR" ? "홀" : "창고"}
            </button>
          ))}
        </div>
        <button onClick={() => setIsMenuOpen(true)} className="w-14 h-14 bg-white rounded-2xl border border-[#EFE9E1] flex flex-col items-center justify-center gap-1.5 active:scale-95 shadow-sm shrink-0">
          <div className="w-6 h-[2.5px] bg-[#3E2723] rounded-full"></div>
          <div className="w-6 h-[2.5px] bg-[#3E2723] rounded-full"></div>
        </button>
      </div>
      {isMenuOpen && (
        <div className="fixed inset-0 z-[750] bg-black/30 backdrop-blur-md" onClick={() => setIsMenuOpen(false)}>
          <div className="max-w-md mx-auto h-full relative pointer-events-none">
            <div className="absolute top-4 right-4 w-56 bg-[#FDFBF7]/90 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl overflow-hidden pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between"><div className="text-[12px] font-bold text-[#5D2E2E]">메뉴</div><button className="text-[#A68966] font-bold text-xl leading-none px-2" onClick={() => setIsMenuOpen(false)}>×</button></div>
              <div className="p-2">
                <button onClick={() => { setStatusLocation("TOTAL"); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-2xl hover:bg-black/5 font-bold text-[14px] text-[#3E2723]">재고 합계</button>
                <button onClick={() => { setStatusLocation("CLOSING"); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-2xl hover:bg-black/5 font-bold text-[14px] text-[#3E2723]">재고 마감하기</button>
                <button onClick={() => { setStatusLocation("URGENT"); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-2xl hover:bg-black/5 font-bold text-[14px] text-[#3E2723]">임박 재고</button>
                <button onClick={() => { setStatusLocation("SET"); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-2xl hover:bg-black/5 font-bold text-[14px] text-[#3E2723]">세트 재고</button>
                <button onClick={() => { setStatusLocation("NOTICE"); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-2xl hover:bg-black/5 font-bold text-[14px] text-[#3E2723]">공지사항</button>
                <button onClick={() => { setStatusLocation("HISTORY"); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-2xl hover:bg-black/5 font-bold text-[14px] text-[#3E2723]">입출고 기록</button>
                <div className="h-px bg-black/5 my-1" />
                <button onClick={() => { setIsMenuOpen(false); if (isUnlocked) signOut(); else setShowAuthModal(true); }} className="w-full text-left px-4 py-3 rounded-2xl hover:bg-black/5 font-bold text-[14px] text-[#DC3545]">{isUnlocked ? "로그아웃" : "로그인"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}