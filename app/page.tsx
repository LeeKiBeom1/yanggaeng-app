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
const SET_종류 = ["4구 클래식", "4구 01", "6구 클래식", "6구 01", "6구 02", "6구 03", "12구 클래식", "12구 01", "12구 02", "12구 03", "한정 12구", "16구"];

export default function 재고관리페이지() {
  type 재고항목 = { id: string; product_name: string; quantity: number; location: "FLOOR" | "WAREHOUSE"; expiry_date: string; };
  type 임박항목 = { id: string; product_name: string; quantity: number; expiry_date: string; };
  type 세트항목 = { id: string; set_name: string; quantity: number; expiry_date: string; color_data: string; };
  type 공지항목 = { id: string; title: string; content: string; created_at: string; };
  type 입고대기 = { product_name: string; quantity: number; expiry_date: string; };

  const [items, setItems] = useState<재고항목[]>([]);
  const [히스토리목록, set히스토리목록] = useState<any[]>([]);
  const [임박재고목록, set임박재고목록] = useState<임박항목[]>([]);
  const [세트재고목록, set세트재고목록] = useState<세트항목[]>([]);
  const [공지목록, set공지목록] = useState<공지항목[]>([]);
  
  const [현재위치, set현재위치] = useState<"FLOOR" | "WAREHOUSE" | "URGENT" | "SET" | "TOTAL" | "HISTORY" | "CLOSING" | "NOTICE">("FLOOR"); 
  const [토스트메시지, set토스트메시지] = useState(""); 
  const [메뉴열림, set메뉴열림] = useState(false);
  const [잠금해제됨, set잠금해제됨] = useState(false);
  const [인증창보이기, set인증창보이기] = useState(false);
  const [아이디, set아이디] = useState("");
  const [비밀번호, set비밀번호] = useState("");
  const [인증중, set인증중] = useState(false);
  const [저장중, set저장중] = useState(false);

  const [삭제대상, set삭제대상] = useState<any>(null);
  const [삭제모드, set삭제모드] = useState<"inventory" | "urgent" | "set" | "notice">("inventory");
  const [수정대상, set수정대상] = useState<재고항목 | null>(null); 
  const [수정수량, set수정수량] = useState(0);
  const [이동대상, set이동대상] = useState<재고항목 | null>(null);
  const [이동수량, set이동수량] = useState(0);

  const [임박이동창보이기, set임박이동창보이기] = useState(false);
  const [임박이동대상, set임박이동대상] = useState<재고항목 | null>(null);

  const [입력창보이기, set입력창보이기] = useState(false);
  const [일괄입고모드, set일괄입고모드] = useState(false);
  const [선택품목, set선택품목] = useState("팥 양갱");
  const [입력수량, set입력수량] = useState(0);
  const [유통기한, set유통기한] = useState(new Date().toISOString().split('T')[0]);
  const [세트색상, set세트색상] = useState("");
  const [입고대기목록, set입고대기목록] = useState<입고대기[]>([]);

  const [공지입력보이기, set공지입력보이기] = useState(false);
  const [공지제목, set공지제목] = useState("");
  const [공지내용, set공지내용] = useState("");

  const [마감대상목록, set마감대상목록] = useState<재고항목[]>([]);
  const [현재마감인덱스, set현재마감인덱스] = useState(0);

  const getLocationStock = (productName: string, location: "FLOOR" | "WAREHOUSE") => 
    items.filter(item => item.product_name === productName && item.location === location)
         .reduce((acc, cur) => acc + cur.quantity, 0);

  const 남은일수계산 = (d: string) => Math.ceil((new Date(d).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000);

  async function 재고가져오기() {
    try {
      const { data: inv } = await supabase.from("inventory").select("*").order("expiry_date", { ascending: true });
      if (inv) setItems(inv);
      const { data: hist } = await supabase.from("history").select("*").order("ts", { ascending: false }).limit(100);
      if (hist) set히스토리목록(hist);
      const { data: urg } = await supabase.from("urgent_inventory").select("*").order("expiry_date", { ascending: true });
      if (urg) set임박재고목록(urg);
      const { data: sets } = await supabase.from("set_inventory").select("*").order("expiry_date", { ascending: true });
      if (sets) set세트재고목록(sets);
      const { data: notices } = await supabase.from("notices").select("*").order("created_at", { ascending: false });
      if (notices) set공지목록(notices);
    } catch (e) { console.error(e); }
  }

  useEffect(() => {
    재고가져오기();
    (async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        const authenticated = Boolean(data?.authenticated);
        set잠금해제됨(authenticated);
        if (!authenticated) set인증창보이기(true);
      } catch { set인증창보이기(true); }
    })();
  }, []);

  useEffect(() => {
    if (현재위치 === "CLOSING") {
      const hallItems = [...items].filter(i => i.location === "FLOOR").sort((a, b) => {
        const indexA = YANGGANG_종류.indexOf(a.product_name.replace(" 양갱", ""));
        const indexB = YANGGANG_종류.indexOf(b.product_name.replace(" 양갱", ""));
        if (indexA !== indexB) return indexA - indexB;
        return a.expiry_date.localeCompare(b.expiry_date);
      });
      set마감대상목록(hallItems);
      set현재마감인덱스(0);
      if (hallItems.length === 0) { 토스트알림("홀에 재고가 없습니다."); set현재위치("TOTAL"); }
    }
  }, [현재위치, items]);

  function 토스트알림(msg: string) { set토스트메시지(msg); setTimeout(() => set토스트메시지(""), 2000); }
  function 인증확인() { if (잠금해제됨) return true; set인증창보이기(true); 토스트알림("로그인이 필요합니다."); return false; }

  async function 히스토리비우기() {
    await supabase.from("history").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    토스트알림("🧹 기록 삭제 완료"); 재고가져오기();
  }

  async function 로그인() {
    set인증중(true);
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: 아이디, password: 비밀번호 }) });
    set인증중(false);
    if (res.ok) { set잠금해제됨(true); set인증창보이기(false); 토스트알림("로그인 성공"); }
    else { 토스트알림("로그인 실패"); }
  }

  async function 로그아웃() { await fetch("/api/auth/logout", { method: "POST" }); set잠금해제됨(false); set인증창보이기(true); 토스트알림("로그아웃 되었습니다."); }

  async function 재고저장() {
    if (!인증확인() || 저장중) return;

    // 일괄 입고 모드일 때 대기 목록 처리
    if (일괄입고모드) {
      if (입고대기목록.length === 0) { 토스트알림("추가된 항목이 없습니다."); return; }
      set저장중(true);
      try {
        for (const 항목 of 입고대기목록) {
          const { data: 기존 } = await supabase.from("inventory").select("*").match({ location: "WAREHOUSE", product_name: 항목.product_name, expiry_date: 항목.expiry_date }).maybeSingle();
          if (기존) await supabase.from("inventory").update({ quantity: 기존.quantity + 항목.quantity }).eq("id", 기존.id);
          else await supabase.from("inventory").insert([{ product_name: 항목.product_name, quantity: 항목.quantity, location: "WAREHOUSE", expiry_date: 항목.expiry_date }]);
          await supabase.from("history").insert([{ ts: Date.now(), kind: "IN", product_name: 항목.product_name, expiry_date: 항목.expiry_date, location: "WAREHOUSE", delta: 항목.quantity }]);
        }
        토스트알림(`✅ ${입고대기목록.length}건 저장 완료`);
        set입고대기목록([]); set입력창보이기(false); set일괄입고모드(false);
      } catch (e) { console.error(e); } finally { set저장중(false); 재고가져오기(); }
      return;
    }

    // 일반 재고 추가 처리
    if (입력수량 <= 0) { 토스트알림("수량을 입력해주세요."); return; }
    set저장중(true);
    try {
      if (현재위치 === "URGENT") {
        if (남은일수계산(유통기한) > 14) { 토스트알림("올바르지 않은 유통기한입니다."); set저장중(false); return; }
        await supabase.from("urgent_inventory").insert([{ product_name: 선택품목, quantity: 입력수량, expiry_date: 유통기한 }]);
      } else if (현재위치 === "SET") {
        const { data: 기존 } = await supabase.from("set_inventory").select("*").match({ set_name: 선택품목, expiry_date: 유통기한, color_data: 세트색상 }).maybeSingle();
        if (기존) await supabase.from("set_inventory").update({ quantity: 기존.quantity + 입력수량 }).eq("id", 기존.id);
        else await supabase.from("set_inventory").insert([{ set_name: 선택품목, quantity: 입력수량, expiry_date: 유통기한, color_data: 세트색상 }]);
      } else {
        const 대상위치 = 현재위치 === "WAREHOUSE" ? "WAREHOUSE" : "FLOOR";
        const { data: 기존 } = await supabase.from("inventory").select("*").match({ location: 대상위치, product_name: 선택품목, expiry_date: 유통기한 }).maybeSingle();
        if (기존) await supabase.from("inventory").update({ quantity: 기존.quantity + 입력수량 }).eq("id", 기존.id);
        else await supabase.from("inventory").insert([{ product_name: 선택품목, quantity: 입력수량, location: 대상위치, expiry_date: 유통기한 }]);
        if (대상위치 === "WAREHOUSE") {
          await supabase.from("history").insert([{ ts: Date.now(), kind: "IN", product_name: 선택품목, expiry_date: 유통기한, location: "WAREHOUSE", delta: 입력수량 }]);
        }
      }
      토스트알림("✅ 저장 완료"); set입력창보이기(false); 재고가져오기();
    } catch (e) { console.error(e); } finally { set저장중(false); }
  }

  async function 공지저장() {
    if (!인증확인() || !공지제목) return;
    await supabase.from("notices").insert([{ title: 공지제목, content: 공지내용 }]);
    토스트알림("📢 공지 등록 완료"); set공지입력보이기(false); set공지제목(""); set공지내용(""); 재고가져오기();
  }

  async function 수정확정() {
    if (!인증확인() || !수정대상) return;
    const 이전 = 수정대상.quantity; const 이후 = 수정수량;
    if (이후 <= 0) {
      await supabase.from("inventory").delete().eq("id", 수정대상.id);
      if (수정대상.location === "WAREHOUSE") {
        await supabase.from("history").insert([{ ts: Date.now(), kind: "OUT", product_name: 수정대상.product_name, expiry_date: 수정대상.expiry_date, location: "WAREHOUSE", delta: -이전 }]);
      }
    } else { await supabase.from("inventory").update({ quantity: 이후 }).eq("id", 수정대상.id); }
    set수정대상(null); 토스트알림("📝 수정 완료"); 재고가져오기();
  }

  async function 재고이동() {
    if (!인증확인() || !이동대상 || 이동수량 <= 0) return;
    const 새위치 = 이동대상.location === "FLOOR" ? "WAREHOUSE" : "FLOOR";
    const { data: 기존 } = await supabase.from("inventory").select("*").match({ location: 새위치, product_name: 이동대상.product_name, expiry_date: 이동대상.expiry_date }).maybeSingle();
    if (기존) await supabase.from("inventory").update({ quantity: 기존.quantity + 이동수량 }).eq("id", 기존.id);
    else await supabase.from("inventory").insert([{ product_name: 이동대상.product_name, quantity: 이동수량, location: 새위치, expiry_date: 이동대상.expiry_date }]);
    if (이동수량 >= 이동대상.quantity) await supabase.from("inventory").delete().eq("id", 이동대상.id);
    else await supabase.from("inventory").update({ quantity: 이동대상.quantity - 이동수량 }).eq("id", 이동대상.id);
    
    if (이동대상.location === "WAREHOUSE") {
      await supabase.from("history").insert([{ ts: Date.now(), kind: "MOVE", product_name: 이동대상.product_name, expiry_date: 이동대상.expiry_date, location: "WAREHOUSE", delta: -이동수량 }]);
    }
    set이동대상(null); 토스트알림("🚚 이동 완료"); 재고가져오기();
  }

  async function 임박재고이동확정() {
    if (!임박이동대상) return;
    if (남은일수계산(임박이동대상.expiry_date) > 14) { 토스트알림("올바르지 않은 유통기한입니다."); set임박이동창보이기(false); return; }
    await supabase.from("urgent_inventory").insert([{ product_name: 임박이동대상.product_name, quantity: 임박이동대상.quantity, expiry_date: 임박이동대상.expiry_date }]);
    await supabase.from("inventory").delete().eq("id", 임박이동대상.id);
    set임박이동창보이기(false); set임박이동대상(null); 토스트알림("⏰ 임박 재고 전송"); 재고가져오기();
  }

  async function 삭제실행() {
    if (!인증확인() || !삭제대상) return;
    if (삭제모드 === "urgent") { await supabase.from("urgent_inventory").delete().eq("id", 삭제대상.id); }
    else if (삭제모드 === "set") { await supabase.from("set_inventory").delete().eq("id", 삭제대상.id); }
    else if (삭제모드 === "notice") { await supabase.from("notices").delete().eq("id", 삭제대상.id); }
    else {
      const 대상 = 삭제대상 as 재고항목;
      await supabase.from("inventory").delete().eq("id", 대상.id);
      if (대상.location === "WAREHOUSE") {
        await supabase.from("history").insert([{ ts: Date.now(), kind: "OUT", product_name: 대상.product_name, expiry_date: 대상.expiry_date, location: "WAREHOUSE", delta: -대상.quantity }]);
      }
    }
    set삭제대상(null); 토스트알림("🗑️ 삭제 완료"); 재고가져오기();
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
        <div className="flex justify-between items-end mb-4 px-1 h-[42px]">
          {현재위치 !== "TOTAL" && 현재위치 !== "HISTORY" && 현재위치 !== "CLOSING" && 현재위치 !== "NOTICE" && (
            <div className="flex gap-2 h-full items-center">
              <button onClick={() => { if (인증확인()) { set입력수량(현재위치 === "WAREHOUSE" ? 40 : 0); set선택품목(현재위치 === "SET" ? "4구 클래식" : "팥 양갱"); set일괄입고모드(false); set입고대기목록([]); set입력창보이기(true); } }} className="h-full px-5 bg-[#5D2E2E] text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all">+ 재고 추가</button>
              {현재위치 === "WAREHOUSE" && (
                <button onClick={() => { if (인증확인()) { set입력수량(40); set선택품목("팥 양갱"); set일괄입고모드(true); set입고대기목록([]); set입력창보이기(true); } }} className="h-full px-5 bg-white border border-[#5D2E2E] text-[#5D2E2E] rounded-xl text-xs font-bold shadow-sm active:scale-95">📦 일괄 입고</button>
              )}
            </div>
          )}
          {현재위치 === "NOTICE" && (
            <button onClick={() => { if (인증확인()) set공지입력보이기(true); }} className="h-full px-5 bg-[#5D2E2E] text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all">+ 공지 작성</button>
          )}
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter leading-none mb-1">
            {현재위치 === "FLOOR" ? "홀" : 현재위치 === "WAREHOUSE" ? "창고" : 현재위치 === "URGENT" ? "임박" : 현재위치 === "SET" ? "세트" : 현재위치 === "HISTORY" ? "입출고 기록" : 현재위치 === "CLOSING" ? "재고 마감" : 현재위치 === "NOTICE" ? "공지사항" : "합계"}
          </span>
        </div>
        <InventoryContent 
          statusLocation={현재위치} historyEvents={히스토리목록} clearHistory={히스토리비우기} items={items} urgentItems={임박재고목록} setInventoryItems={세트재고목록} noticeItems={공지목록} YANGGANG_TYPES={YANGGANG_종류} SET_TYPES={SET_종류}
          getLocationStock={getLocationStock} getDaysUntilExpiry={남은일수계산} URGENT_DAYS={14} ensureAuthenticated={인증확인} setEditTarget={set수정대상} setEditQty={set수정수량} setMoveTarget={set이동대상} setMoveQty={set이동수량} setDeleteMode={set삭제모드} setDeleteTarget={set삭제대상} 
          setShowMoveUrgentModal={set임박이동창보이기} setMoveUrgentTarget={set임박이동대상} fmtDate={(iso:any)=>iso.slice(5).replace("-","/")}
        />
        <InventoryModals 
          showInputModal={입력창보이기} setShowInputModal={set입력창보이기} isBatchMode={일괄입고모드} statusLocation={현재위치} YANGGANG_TYPES={YANGGANG_종류} SET_TYPES={SET_종류} selectedProduct={선택품목} setSelectedProduct={set선택품목} expiryDate={유통기한} setExpiryDate={set유통기한} quantity={입력수량} setQuantity={set입력수량} setMemo={세트색상} setSetMemo={set세트색상} saveInventory={재고저장} isSaving={저장중}
          showAuthModal={인증창보이기} loginId={아이디} setLoginId={set아이디} loginPassword={비밀번호} setLoginPassword={set비밀번호} isAuthLoading={인증중} signIn={로그인}
          editTarget={수정대상} setEditTarget={set수정대상} editQty={수정수량} setEditQty={set수정수량} confirmEdit={수정확정}
          moveTarget={이동대상} setMoveTarget={set이동대상} moveQty={이동수량} setMoveQty={set이동수량} moveInventory={재고이동}
          deleteTarget={삭제대상} setDeleteTarget={set삭제대상} setDeleteMode={set삭제모드} execDelete={삭제실행}
          showMoveUrgentModal={임박이동창보이기} setShowMoveUrgentModal={set임박이동창보이기} moveUrgentTarget={임박이동대상} confirmMoveToUrgent={임박재고이동확정}
          closingItems={마감대상목록} closingIndex={현재마감인덱스} setClosingIndex={set현재마감인덱스} setStatusLocation={set현재위치} triggerToast={토스트알림} refreshData={재고가져오기} 
          showNoticeInput={공지입력보이기} setShowNoticeInput={set공지입력보이기} noticeTitle={공지제목} setNoticeTitle={set공지제목} noticeContent={공지내용} setNoticeContent={set공지내용} saveNotice={공지저장}
          pendingList={입고대기목록} setPendingList={set입고대기목록}
        />
        {토스트메시지 && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-gray-800 text-white text-sm font-bold shadow-xl z-[900]">{토스트메시지}</div>}
      </div>
    </div>
  );
}