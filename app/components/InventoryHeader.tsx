"use client";

interface HeaderProps {
  statusLocation: string;
  setStatusLocation: (loc: any) => void;
  setIsMenuOpen: (open: boolean) => void;
  isMenuOpen: boolean;
  isUnlocked: boolean;
  signOut: () => void;
  setShowAuthModal: (show: boolean) => void;
}

export default function InventoryHeader({
  statusLocation,
  setStatusLocation,
  setIsMenuOpen,
  isMenuOpen,
  isUnlocked,
  signOut,
  setShowAuthModal,
}: HeaderProps) {
  return (
    <>
      <style jsx global>{`
        @keyframes menuShow {
          from { opacity: 0; transform: scale(0.95) translateY(-10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes backdropFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-menu {
          animation: menuShow 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-backdrop {
          animation: backdropFade 0.3s ease-out forwards;
        }
      `}</style>

      <div className="flex items-center justify-between mb-8 max-w-md mx-auto gap-3">
        <div className="flex flex-1 gap-1 bg-white p-1.5 rounded-2xl border border-[#EFE9E1] shadow-sm">
          {["FLOOR", "WAREHOUSE"].map((loc) => (
            <button
              key={loc}
              onClick={() => setStatusLocation(loc)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                statusLocation === loc ? "bg-[#5D2E2E] text-white shadow-md" : "text-[#A68966] hover:bg-[#FDFBF7]"
              }`}
            >
              {loc === "FLOOR" ? "홀" : "창고"}
            </button>
          ))}
        </div>
        <button
          onClick={() => setIsMenuOpen(true)}
          className="w-14 h-14 bg-white rounded-2xl border border-[#EFE9E1] flex flex-col items-center justify-center gap-1.5 active:scale-95 shadow-sm"
        >
          <div className="w-6 h-[2.5px] bg-[#3E2723] rounded-full"></div>
          <div className="w-6 h-[2.5px] bg-[#3E2723] rounded-full"></div>
        </button>
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[750] bg-black/30 backdrop-blur-md animate-backdrop" onClick={() => setIsMenuOpen(false)}>
          <div className="max-w-md mx-auto h-full relative pointer-events-none">
            <div 
              className="absolute top-4 right-4 w-56 bg-[#FDFBF7]/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl overflow-hidden pointer-events-auto origin-top-right animate-menu" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between">
                <div className="text-[12px] font-bold text-[#5D2E2E]">메뉴</div>
                <button className="text-[#A68966] font-bold text-xl leading-none px-2" onClick={() => setIsMenuOpen(false)}>×</button>
              </div>
              <div className="p-2">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (isUnlocked) signOut();
                    else setShowAuthModal(true);
                  }}
                  className="w-full text-left px-4 py-3 rounded-2xl hover:bg-black/5 font-bold text-[14px] text-[#3E2723] transition-colors"
                >
                  {isUnlocked ? "로그아웃" : "로그인"}
                </button>
                <button
                  onClick={() => { setStatusLocation("TOTAL"); setIsMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 rounded-2xl hover:bg-black/5 font-bold text-[14px] text-[#3E2723] transition-colors"
                >
                  재고합계
                </button>
                <button
                  onClick={() => { setStatusLocation("URGENT"); setIsMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 rounded-2xl hover:bg-black/5 font-bold text-[14px] text-[#3E2723] transition-colors"
                >
                  임박 재고
                </button>
                <button
                  onClick={() => { setStatusLocation("HISTORY"); setIsMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 rounded-2xl hover:bg-black/5 font-bold text-[14px] text-[#3E2723] transition-colors"
                >
                  히스토리
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}