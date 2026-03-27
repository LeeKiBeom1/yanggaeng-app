"use client";

import { Notice } from "@/app/types/inventory";

interface InventoryNoticeProps {
  userRole: "ADMIN" | "STAFF";
  noticeItems: Notice[];
  setDeleteMode: (mode: string) => void;
  setDeleteTarget: (target: any) => void;
}

export default function InventoryNotice({
  userRole,
  noticeItems,
  setDeleteMode,
  setDeleteTarget,
}: InventoryNoticeProps) {
  return (
    <div className="w-full space-y-4 mb-12">
      {noticeItems.map((n) => (
        <div 
          key={n.id} 
          className="bg-white rounded-3xl border border-[#EFE9E1] p-6 shadow-sm relative group"
        >
          {/* 작성 날짜 */}
          <div className="text-[10px] font-bold text-[#A68966] mb-2">
            {new Date(n.created_at).toLocaleDateString()}
          </div>
          
          {/* 제목 */}
          <div className="text-lg font-bold text-[#5D2E2E] mb-3">
            {n.title}
          </div>
          
          {/* 내용 (줄바꿈 보존) */}
          <div className="text-sm text-[#3E2723] leading-relaxed whitespace-pre-wrap">
            {n.content}
          </div>

          {/* 관리자 전용 삭제 버튼 (마우스 오버 시 노출) */}
          {userRole === "ADMIN" && (
            <button 
              onClick={() => { 
                setDeleteMode("notice"); 
                setDeleteTarget(n); 
              }} 
              className="absolute top-6 right-6 text-[#DC3545] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          )}
        </div>
      ))}
      
      {noticeItems.length === 0 && (
        <div className="py-20 text-center text-sm text-[#A68966] italic">
          등록된 공지사항이 없습니다.
        </div>
      )}
    </div>
  );
}