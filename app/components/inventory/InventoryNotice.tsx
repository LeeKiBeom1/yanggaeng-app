"use client";

import { Notice } from "@/app/types/inventory";

interface InventoryNoticeProps {
  userRole: "ADMIN" | "STAFF";
  loginUser?: string; // 추가
  noticeItems: Notice[];
  setDeleteMode: (mode: string) => void;
  setDeleteTarget: (target: any) => void;
}

export default function InventoryNotice({
  userRole, loginUser, noticeItems, setDeleteMode, setDeleteTarget,
}: InventoryNoticeProps) {
  // [요구사항 4 반영] 관리자 전용 권한 체크 (ID 기반)
  const isAdmin = loginUser === "manager01" || loginUser === "god6332";

  return (
    <div className="w-full space-y-4 mb-12">
      {noticeItems.map((n) => (
        <div key={n.id} className="bg-white rounded-3xl border border-[#EFE9E1] p-6 shadow-sm relative group">
          {/* 작성 날짜 및 작성자 */}
          <div className="flex justify-between items-start mb-2">
            <div className="text-[10px] font-bold text-[#A68966]">
              {new Date(n.created_at).toLocaleDateString()}
            </div>
            {/* [요구사항 4 반영] 작성자 ID 노출 */}
            <div className="text-[9px] font-black text-[#5D2E2E] bg-[#F9F5F0] px-2 py-0.5 rounded-full border border-[#F5F0E9]">
              작성: {n.user_id || "관리자"}
            </div>
          </div>
          
          <div className="text-lg font-bold text-[#5D2E2E] mb-3">{n.title}</div>
          <div className="text-sm text-[#3E2723] leading-relaxed whitespace-pre-wrap">{n.content}</div>

          {/* [요구사항 4 반영] 특정 아이디의 관리자만 삭제 노출 */}
          {isAdmin && (
            <button 
              onClick={() => { setDeleteMode("notice"); setDeleteTarget(n); }} 
              className="absolute bottom-6 right-6 text-[#DC3545] font-bold opacity-0 group-hover:opacity-100 transition-opacity p-2"
            >
              삭제하기 ×
            </button>
          )}
        </div>
      ))}
      {noticeItems.length === 0 && <div className="py-24 text-center text-sm text-[#A68966] italic">공지사항이 없습니다.</div>}
    </div>
  );
}