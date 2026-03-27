"use client";

interface AuthModalProps {
  showAuthModal: boolean;
  loginId: string;
  setLoginId: (id: string) => void;
  loginPassword: string;
  setLoginPassword: (pw: string) => void;
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
    <div className="fixed inset-0 bg-black/60 z-[760] flex items-center justify-center p-6 backdrop-blur-sm">
      <div 
        className="bg-[#FDFBF7] w-full max-w-sm rounded-[32px] p-8 border border-[#EFE9E1] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl mb-2 text-center font-bold text-[#5D2E2E]">잠금 해제</h2>
        <p className="text-[11px] text-center text-[#A68966] font-bold mb-8">
          아이디와 비밀번호를 입력해주세요.
        </p>
        
        {/* 아이디 입력창 (텍스트 진하게 #3E2723) */}
        <input 
          type="text" 
          value={loginId} 
          onChange={(e) => setLoginId(e.target.value)} 
          placeholder="아이디" 
          className="w-full mb-3 p-4 border border-[#F5F0E9] rounded-2xl font-bold text-sm bg-white outline-none text-[#3E2723] placeholder:text-[#D1C4B5]" 
        />
        
        {/* 비밀번호 입력창 (텍스트 진하게 #3E2723) */}
        <input 
          type="password" 
          value={loginPassword} 
          onChange={(e) => setLoginPassword(e.target.value)} 
          placeholder="비밀번호" 
          className="w-full mb-8 p-4 border border-[#F5F0E9] rounded-2xl font-bold text-sm bg-white outline-none text-[#3E2723] placeholder:text-[#D1C4B5]" 
        />
        
        {/* 로그인 버튼 */}
        <button 
          onClick={signIn} 
          disabled={isAuthLoading} 
          className="w-full py-4 bg-[#5D2E2E] text-white rounded-2xl font-bold shadow-lg disabled:bg-[#D1C4B5] active:scale-[0.98] transition-all"
        >
          {isAuthLoading ? "로그인 중..." : "로그인"}
        </button>
      </div>
    </div>
  );
}