"use client";

interface AuthModalProps {
  showAuthModal: boolean;
  loginId: string;
  setLoginId: (val: string) => void;
  loginPassword: string;
  setLoginPassword: (val: string) => void;
  isAuthLoading: boolean;
  signIn: () => void;
}

export default function AuthModal({
  showAuthModal,
  loginId,
  setLoginId,
  loginPassword,
  setLoginPassword,
  isAuthLoading,
  signIn,
}: AuthModalProps) {
  if (!showAuthModal) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-[999] flex items-center justify-center p-6 backdrop-blur-md">
      {/* form 태그와 onSubmit 추가로 엔터 키 로그인 지원 */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          signIn();
        }}
        className="bg-[#FDFBF7] w-full max-w-sm rounded-[32px] p-10 border border-[#EFE9E1] shadow-2xl"
      >
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-black text-[#5D2E2E] tracking-tighter mb-2">금옥당</h2>
          <p className="text-xs text-[#A68966] font-bold">재고 관리를 위해 로그인하세요.</p>
        </div>
        
        <div className="space-y-3 mb-8">
          <input 
            type="text" 
            placeholder="아이디" 
            value={loginId} 
            onChange={(e) => setLoginId(e.target.value)}
            className="w-full p-4 bg-white border border-[#F5F0E9] rounded-2xl outline-none font-bold text-[#3E2723] focus:border-[#5D2E2E] transition-colors" 
          />
          <input 
            type="password" 
            placeholder="비밀번호" 
            value={loginPassword} 
            onChange={(e) => setLoginPassword(e.target.value)}
            className="w-full p-4 bg-white border border-[#F5F0E9] rounded-2xl outline-none font-bold text-[#3E2723] focus:border-[#5D2E2E] transition-colors" 
          />
        </div>
        
        <button 
          type="submit"
          disabled={isAuthLoading}
          className={`w-full py-5 rounded-2xl font-black text-white shadow-lg active:scale-95 transition-all ${
            isAuthLoading ? "bg-gray-400" : "bg-[#5D2E2E]"
          }`}
        >
          {isAuthLoading ? "확인 중..." : "시작하기"}
        </button>
      </form>
    </div>
  );
}