"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import InventoryHeader from "./components/InventoryHeader";
import InventoryModals from "./components/InventoryModals";
import InventoryContent from "./components/InventoryContent";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const YANGGANG_종류 = ["팥", "고운앙금", "통팥", "밤", "호두", "견과", "대추", "쌍화", "밀크티", "라즈베리", "곶감", "녹차", "말차", "백앙금", "흑임자", "고구마", "단호박"];

export default function 재고관리페이지() {
  type 재고항목 = { id: string; product_name: string; quantity: number; location: "FLOOR" | "WAREHOUSE"; expiry_date: string; };
  type 임박항목 = { id: string; product_name: string; quantity: number; expiry_date: string; };

  const [items, setItems] = useState<재고항목[]>([]);
  const [현재위치, set현재위치] = useState<"FLOOR" | "WAREHOUSE" | "URGENT" | "TOTAL" | "HISTORY" | "CLOSING">("FLOOR"); 
  const [토스트메시지, set토스트메시지] = useState(""); 
  const [메뉴열림, set메뉴열림] = useState(false);
  const [잠금해제됨, set잠금해제됨] = useState(false);
  const [인증창보이기, set인증창보이기] = useState(false);
  const [아이디, set아이디] = useState("");
  const [비밀번호, set비밀번호] = useState("");
  const [인증중, set인증중] = useState(false);

  const [히스토리목록, set히스토리목록] = useState<any[]>([]);
  const [임박재고목록, set임박재고목록] = useState<임박항목[]>([]);
  
  const [삭제대상, set삭제대상] = useState<재고항목 | 임박항목 | null>(null);
  const [삭제모드, set삭제모드] = useState<"inventory" | "urgent">("inventory");
  const [수정대상, set수정대상] = useState<재고항목 | null>(null); 
  const [수정수량, set수정수량] = useState(0);
  const [이동대상, set이동대상] = useState<재고항목 | null>(null);
  const [이동수량, set이동수량] = useState(0);

  const [임박이동창보이기, set임박이동창보이기] = useState(false);
  const [임박이동대상, set임박이동대상] = useState<재고항목 | null>(null);

  const [입력창보이기, set입력창보이기] = useState(false);
  const [일괄입고모드, set일괄입고모드] = useState(false);
  const [선택품목들, set선택품목들] = useState<string[]>(["팥 양갱"]);
  const [입력수량, set입력수량] = useState(0);
  const [유통기한, set유통기한] = useState(new Date().toISOString().split('T')[0]);

  // 마감 재고 관련 상태
  const [마감대상목록, set마감대상목록] = useState<재고항목[]>([]);
  const [현재마감인덱스, set현재마감인덱스] = useState(0);

  const getLocationStock = (productName: string, location: "FLOOR" | "WAREHOUSE") => 
    items.filter(item => item.product_name === productName && item.location === location)
         .reduce((acc, cur) => acc + cur.quantity, 0);

  async function 재고가져오기() {
    const { data: inv } = await supabase.from("inventory").select("*").order("expiry_date", { ascending: true });
    if (inv) setItems(inv as 재고항목[]);
    
    const { data: hist } = await supabase.from("history").select("*").order("ts", { ascending: false }).limit(100);
    if (hist) set히스토리목록(hist);

    const { data: urg } = await supabase.from("urgent_inventory").select("*").order("expiry_date", { ascending: true });
    if (urg) set임박재고목록(urg as 임박항목[]);
  }

  useEffect(() => {
    재고가져오기();
    (async () => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        const data = await res.json();
        const ok = Boolean(data?.authenticated);
        set잠금해제됨(ok); set인증창보이기(!ok);
      } catch { set잠금해제됨(false); set인증창보이기(true); }
    })();
  }, []);

  // 마감 모드 진입 로직
  useEffect(() => {
    if (현재위치 === "CLOSING") {
      const hallItems = [...items].filter(i => i.location === "FLOOR").sort((a, b) => {
        if (a.expiry_date !== b.expiry_date) return a.expiry_date.localeCompare(b.expiry_date);
        return YANGGANG_종류.indexOf(a.product_name.replace(" 양갱", "")) - YANGGANG_종류.indexOf(b.product_name.replace(" 양갱", ""));
      });
      set마감대상목록(hallItems);
      set현재마감인덱스(0);
      if (hallItems.length === 0) {
        토스트알림("홀에 재고가 없습니다.");
        set현재위치("TOTAL");
      }
    }
  }, [현재위치]);

  function 날짜포맷(iso: string) { return String(iso).slice(5).replace("-", "/"); }
  function 장소포맷(loc: "FLOOR" | "WAREHOUSE") { return loc === "FLOOR" ? "홀" : "창고"; }
  function 남은일수계산(value: string) {
    const 끝 = new Date(value).setHours(0,0,0,0);
    const 오늘 = new Date().setHours(0,0,0,0);
    return Math.ceil((끝 - 오늘) / (1000 * 60 * 60 * 24));
  }

  function 토스트알림(msg: string) { set토스트메시지(msg); setTimeout(() => set토스트메시지(""), 2000); }
  function 인증확인() { if (잠금해제됨) return true; set인증창보이기(true); 토스트알림("로그인이 필요합니다."); return false; }

  async function 히스토리추가(event: any) {
    await supabase.from("history").insert([event]);
  }

  async function 로그인() {
    if (!아이디 || !비밀번호) { 토스트알림("정보를 입력해주세요."); return; }
    set인증중(true);
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: 아이디, password: 비밀번호 }) });
    set인증중(false);
    if (!res.ok) { 토스트알림("로그인 실패"); return; }
    set잠금해제됨(true); set인증창보이기(false); set아이디(""); set비밀번호(""); 토스트알림("로그인 성공");
  }

  async function 로그아웃() { await fetch("/api/auth/logout", { method: "POST" }); set잠금해제됨(false); set인증창보이기(true); 토스트알림("로그아웃 되었습니다."); }

  async function 재고저장() {
    if (!인증확인() || 입력수량 <= 0) return;
    
    if (현재위치 === "URGENT") {
      const 새항목 = { product_name: 선택품목들[0], quantity: 입력수량, expiry_date: 유통기한 };
      await supabase.from("urgent_inventory").insert([새항목]);
      토스트알림("✅ 임박 재고 저장 완료");
    } else {
      const 대상위치 = 현재위치 === "WAREHOUSE" ? "WAREHOUSE" : "FLOOR";
      for (const 품목 of 선택품목들) {
        const { data: 기존재고 } = await supabase.from("inventory").select("*").match({ location: 대상위치, product_name: 품목, expiry_date: 유통기한 }).maybeSingle();
        if (기존재고) { await supabase.from("inventory").update({ quantity: 기존재고.quantity + 입력수량 }).eq("id", 기존재고.id); }
        else { await supabase.from("inventory").insert([{ product_name: 품목, quantity: 입력수량, location: 대상위치, expiry_date: 유통기한 }]); }
        await 히스토리추가({ ts: Date.now(), kind: "IN", product_name: 품목, expiry_date: 유통기한, location: 대상위치, delta: 입력수량 });
      }
      토스트알림(`✅ ${선택품목들.length}건 저장 완료`);
    }
    set입력창보이기(false); set일괄입고모드(false); 재고가져오기();
  }

  async function 수정확정() {
    if (!인증확인() || !수정대상) return;
    const 이전 = Number(수정대상.quantity); const 이후 = Number(수정수량); const 변동 = 이후 - 이전;
    if (이후 <= 0) { await supabase.from("inventory").delete().eq("id", 수정대상.id); await 히스토리추가({ ts: Date.now(), kind: "OUT", product_name: 수정대상.product_name, expiry_date: 수정대상.expiry_date, location: 수정대상.location, delta: -이전 }); }
    else { await supabase.from("inventory").update({ quantity: 이후 }).eq("id", 수정대상.id); await 히스토리추가({ ts: Date.now(), kind: "EDIT", product_name: 수정대상.product_name, expiry_date: 수정대상.expiry_date, location: 수정대상.location, before: 이전, after: 이후, delta: 변동 }); }
    set수정대상(null); 토스트알림("📝 수정 완료"); 재고가져오기();
  }

  async function 재고이동() {
    if (!인증확인() || !이동대상 || 이동수량 <= 0) return;
    const 새위치 = 이동대상.location === "FLOOR" ? "WAREHOUSE" : "FLOOR";
    const { data: 기존재고 } = await supabase.from("inventory").select("*").match({ location: 새위치, product_name: 이동대상.product_name, expiry_date: 이동대상.expiry_date }).maybeSingle();
    if (기존재고) { await supabase.from("inventory").update({ quantity: 기존재고.quantity + 이동수량 }).eq("id", 기존재고.id); }
    else { await supabase.from("inventory").insert([{ product_name: 이동대상.product_name, quantity: 이동수량, location: 새위치, expiry_date: 이동대상.expiry_date }]); }
    if (이동수량 >= 이동대상.quantity) { await supabase.from("inventory").delete().eq("id", 이동대상.id); }
    else { await supabase.from("inventory").update({ quantity: 이동대상.quantity - 이동수량 }).eq("id", 이동대상.id); }
    await 히스토리추가({ ts: Date.now(), kind: "MOVE", product_name: 이동대상.product_name, expiry_date: 이동대상.expiry_date, from: 이동대상.location, to: 새위치, qty: 이동수량 });
    set이동대상(null); 토스트알림(`🚚 이동 완료`); 재고가져오기();
  }

  async function 임박재고이동확정() {
    if (!임박이동대상) return;
    await supabase.from("urgent_inventory").insert([{ product_name: 임박이동대상.product_name, quantity: 임박이동대상.quantity, expiry_date: 임박이동대상.expiry_date }]);
    await supabase.from("inventory").delete().eq("id", 임박이동대상.id);
    await 히스토리추가({ ts: Date.now(), kind: "MOVE", product_name: 임박이동대상.product_name, expiry_date: 임박이동대상.expiry_date, from: "FLOOR", to: "WAREHOUSE", qty: 임박이동대상.quantity });
    set임박이동창보이기(false); set임박이동대상(null); 토스트알림("⏰ 임박 재고 전송 완료"); 재고가져오기();
  }

  async function 삭제실행() {
    if (!인증확인() || !삭제대상) return;
    if (삭제모드 === "urgent") { await supabase.from("urgent_inventory").delete().eq("id", 삭제대상.id); }
    else { 
      const 대상 = 삭제대상 as 재고항목;
      await supabase.from("inventory").delete().eq("id", 대상.id); 
      await 히스토리추가({ ts: Date.now(), kind: "OUT", product_name: 대상.product_name, expiry_date: 대상.expiry_date, location: 대상.location, delta: -대상.quantity }); 
    }
    set삭제대상(null); 토스트알림("🗑️ 삭제 완료"); 재고가져오기();
  }

  async function 히스토리비우기() {
    await supabase.from("history").delete().neq("id", "0");
    토스트알림("🧹 히스토리 삭제 완료"); 재고가져오기();
  }

  return (
    <div className="w-full min-h-screen bg-[#FDFBF7] font-sans text-[#3E2723] overflow-x-hidden">
      <div className="p-2 sm:p-4 max-w-5xl mx-auto">
        <style jsx global>{`
          input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
          input[type=number] { -moz-appearance: textfield; }
          input, select, textarea { color: #3E2723; }
        `}</style>

        <InventoryHeader statusLocation={현재위치} setStatusLocation={set현재위치} setIsMenuOpen={set메뉴열림} isMenuOpen={메뉴열림} isUnlocked={잠금해제됨} signOut={로그아웃} setShowAuthModal={set인증창보이기} />

        <div className="flex justify-between items-end mb-4 px-1">
          {현재위치 !== "TOTAL" && 현재위치 !== "HISTORY" && 현재위치 !== "CLOSING" && (
            <div className="flex gap-2">
              <button onClick={() => { if (인증확인()) { set입력수량(현재위치 === "WAREHOUSE" ? 40 : 0); set선택품목들(["팥 양갱"]); set일괄입고모드(false); set입력창보이기(true); } }} className={`px-5 py-2.5 text-white rounded-xl text-xs font-bold shadow-md transition-all ${잠금해제됨 ? "bg-[#5D2E2E] active:scale-95" : "bg-[#D1C4B5] cursor-not-allowed"}`}>+ 재고 추가</button>
              {현재위치 === "WAREHOUSE" && (
                <button onClick={() => { if (인증확인()) { set입력수량(40); set선택품목들([]); set일괄입고모드(true); set입력창보이기(true); } }} className="px-5 py-2.5 bg-white border border-[#5D2E2E] text-[#5D2E2E] rounded-xl text-xs font-bold shadow-sm active:scale-95">📦 일괄 입고</button>
              )}
            </div>
          )}
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
            {현재위치 === "FLOOR" ? "홀" : 현재위치 === "WAREHOUSE" ? "창고" : 현재위치 === "URGENT" ? "임박" : 현재위치 === "HISTORY" ? "히스토리" : 현재위치 === "CLOSING" ? "마감" : "합계"}
          </span>
        </div>

        <InventoryContent 
          statusLocation={현재위치} historyEvents={히스토리목록} clearHistory={히스토리비우기} triggerToast={토스트알림} fmtDate={날짜포맷} fmtLoc={장소포맷} items={items} urgentItems={임박재고목록} YANGGANG_TYPES={YANGGANG_종류} 
          getLocationStock={getLocationStock} getDaysUntilExpiry={남은일수계산} URGENT_DAYS={14} ensureAuthenticated={인증확인} setEditTarget={set수정대상} setEditQty={set수정수량} setMoveTarget={set이동대상} setMoveQty={set이동수량} setDeleteMode={set삭제모드} setDeleteTarget={set삭제대상} 
          setShowMoveUrgentModal={set임박이동창보이기} setMoveUrgentTarget={set임박이동대상}
        />

        <InventoryModals 
          showInputModal={입력창보이기} setShowInputModal={set입력창보이기} isBatchMode={일괄입고모드} statusLocation={현재위치} YANGGANG_TYPES={YANGGANG_종류} selectedProducts={선택품목들} setSelectedProducts={set선택품목들} expiryDate={유통기한} setExpiryDate={set유통기한} quantity={입력수량} setQuantity={set입력수량} saveInventory={재고저장}
          showAuthModal={인증창보이기} loginId={아이디} setLoginId={set아이디} loginPassword={비밀번호} setLoginPassword={set비밀번호} isAuthLoading={인증중} signIn={로그인}
          editTarget={수정대상} setEditTarget={set수정대상} editQty={수정수량} setEditQty={set수정수량} confirmEdit={수정확정}
          moveTarget={이동대상} setMoveTarget={set이동대상} moveQty={이동수량} setMoveQty={set이동수량} moveInventory={재고이동}
          deleteTarget={삭제대상} setDeleteTarget={set삭제대상} setDeleteMode={set삭제모드} execDelete={삭제실행}
          showMoveUrgentModal={임박이동창보이기} setShowMoveUrgentModal={set임박이동창보이기} moveUrgentTarget={임박이동대상} confirmMoveToUrgent={임박재고이동확정}
          closingItems={마감대상목록} closingIndex={현재마감인덱스} setClosingIndex={set현재마감인덱스} setStatusLocation={set현재위치} triggerToast={토스트알림} refreshData={재고가져오기} addHistory={히스토리추가}
        />

        {토스트메시지 && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-gray-800 text-white text-sm font-bold shadow-xl animate-bounce z-[800]">{토스트메시지}</div>}
      </div>
    </div>
  );
}