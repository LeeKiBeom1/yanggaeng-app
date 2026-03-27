"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const YANGGANG_종류 = ["팥", "고운앙금", "통팥", "밤", "호두", "견과", "대추", "쌍화", "라즈베리", "밀크티", "곶감", "녹차", "말차", "백앙금", "흑임자", "단호박", "고구마"];
const SET_종류 = ["4구 클래식", "4구 01", "6구 클래식", "6구 01", "6구 02", "6구 03", "12구 클래식", "12구 01", "12구 02", "12구 03", "한정 12구", "16구"];

export function useInventory() {
  // [공통 데이터 상태]
  const [data, setData] = useState({
    items: [] as any[], history: [] as any[], urgent: [] as any[], sets: [] as any[],
    notices: [] as any[], usage: [] as any[], disposal: [] as any[], closing: [] as any[]
  });

  // [UI 상태]
  const [uiState, setUiState] = useState({
    location: "FLOOR" as any, archiveTab: "HISTORY" as any, urgentTab: "STORAGE" as any,
    toast: "", isMenuOpen: false, isSaving: false
  });

  // [인증 상태]
  const [authForm, setAuthForm] = useState({ userId: "", password: "" });
  const [authInfo, setAuthInfo] = useState({
    isUnlocked: false, showModal: false, loginUser: "", userRole: "STAFF" as "ADMIN" | "STAFF", isLoading: false
  });

  // [모달/수정 상태]
  const [modals, setModals] = useState({
    input: false, batch: false, edit: null as any, editQty: 0, move: null as any, moveQty: 0,
    delete: null as any, deleteMode: "inventory", moveUrgent: false, moveUrgentTarget: null as any,
    notice: false, noticeTitle: "", noticeContent: "", urgentProcess: null as any
  });

  // [워크플로우 상태]
  const [flow, setFlow] = useState({
    closingList: [] as any[], closingIndex: 0, entryProduct: "팥 양갱", entryQty: 0,
    entryExpiry: new Date().toISOString().split('T')[0], entrySetMemo: "", pendingList: [] as any[]
  });

  // [유틸리티: 알림]
  const triggerToast = (msg: string) => {
    setUiState(p => ({ ...p, toast: msg }));
    setTimeout(() => setUiState(p => ({ ...p, toast: "" })), 2000);
  };

  // [데이터 새로고침 로직]
  const refreshData = useCallback(async () => {
    try {
      const [inv, hist, urg, sts, ntc, usg, dsp, cls] = await Promise.all([
        supabase.from("inventory").select("*").order("expiry_date", { ascending: true }),
        supabase.from("history").select("*").order("ts", { ascending: false }).limit(100),
        supabase.from("urgent_inventory").select("*").order("expiry_date", { ascending: true }),
        supabase.from("set_inventory").select("*").order("expiry_date", { ascending: true }),
        supabase.from("notices").select("*").order("created_at", { ascending: false }),
        supabase.from("urgent_usage").select("*").order("created_at", { ascending: false }),
        supabase.from("urgent_disposal").select("*").order("created_at", { ascending: false }),
        supabase.from("daily_closing").select("*").order("closing_date", { ascending: false }),
      ]);
      setData({
        items: inv.data || [], history: hist.data || [], urgent: urg.data || [], sets: sts.data || [],
        notices: ntc.data || [], usage: usg.data || [], disposal: dsp.data || [], closing: cls.data || []
      });
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    refreshData();
    (async () => {
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      if (session?.authenticated) {
        const id = document.cookie.split('; ').find(row => row.startsWith('yanggaeng_user_id='))?.split('=')[1] || "";
        setAuthInfo(p => ({ ...p, isUnlocked: true, loginUser: id, userRole: (id === "manager01" || id === "god6332") ? "ADMIN" : "STAFF" }));
      }
    })();
  }, [refreshData]);

  // --- [1. 권한 매니저 (Auth)] ---
  const auth = {
    ...authInfo,
    userId: authForm.userId,
    password: authForm.password,
    setUserId: (id: string) => setAuthForm(p => ({ ...p, userId: id })),
    setPassword: (pw: string) => setAuthForm(p => ({ ...p, password: pw })),
    openLogin: () => setAuthInfo(p => ({ ...p, showModal: true })),
    closeLogin: () => setAuthInfo(p => ({ ...p, showModal: false })),
    ensureAuth: () => {
      if (authInfo.isUnlocked) return true;
      setAuthInfo(p => ({ ...p, showModal: true }));
      triggerToast("로그인이 필요합니다.");
      return false;
    },
    login: async () => {
      setAuthInfo(p => ({ ...p, isLoading: true }));
      const res = await fetch("/api/auth/login", { 
        method: "POST", headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ id: authForm.userId, password: authForm.password }) 
      });
      setAuthInfo(p => ({ ...p, isLoading: false }));
      if (res.ok) {
        setAuthInfo(p => ({ ...p, isUnlocked: true, showModal: false, loginUser: authForm.userId, userRole: (authForm.userId === "manager01" || authForm.userId === "god6332") ? "ADMIN" : "STAFF" }));
        triggerToast("로그인 성공");
      } else triggerToast("로그인 실패");
    },
    logout: async () => { await fetch("/api/auth/logout", { method: "POST" }); location.reload(); }
  };

  // --- [2. 데이터 매니저 (Inventory)] ---
  const inventory = {
    ...data,
    refresh: refreshData, // <--- 오류 발생 지점 수정: refresh 속성 추가
    getLocationStock: (p: string, l: any) => data.items.filter(i => i.product_name === p && i.location === l).reduce((acc, cur) => acc + cur.quantity, 0),
    save: async () => {
      if (!auth.ensureAuth() || uiState.isSaving) return;
      setUiState(p => ({ ...p, isSaving: true }));
      try {
        if (modals.batch) {
          for (const item of flow.pendingList) {
            const { data: exist } = await supabase.from("inventory").select("*").match({ location: "WAREHOUSE", product_name: item.product_name, expiry_date: item.expiry_date }).maybeSingle();
            if (exist) await supabase.from("inventory").update({ quantity: exist.quantity + item.quantity }).eq("id", exist.id);
            else await supabase.from("inventory").insert([{ product_name: item.product_name, quantity: item.quantity, location: "WAREHOUSE", expiry_date: item.expiry_date }]);
            await supabase.from("history").insert([{ ts: Date.now(), kind: "IN", product_name: item.product_name, expiry_date: item.expiry_date, location: "WAREHOUSE", delta: item.quantity, user_id: auth.loginUser }]);
          }
          setFlow(p => ({ ...p, pendingList: [] }));
        } else if (uiState.location === "URGENT") {
          await supabase.from("urgent_inventory").insert([{ product_name: flow.entryProduct, quantity: flow.entryQty, expiry_date: flow.entryExpiry }]);
        } else if (uiState.location === "SET") {
          const { data: exist } = await supabase.from("set_inventory").select("*").match({ set_name: flow.entryProduct, expiry_date: flow.entryExpiry, color_data: flow.entrySetMemo }).maybeSingle();
          if (exist) await supabase.from("set_inventory").update({ quantity: exist.quantity + flow.entryQty }).eq("id", exist.id);
          else await supabase.from("set_inventory").insert([{ set_name: flow.entryProduct, quantity: flow.entryQty, expiry_date: flow.entryExpiry, color_data: flow.entrySetMemo }]);
        } else {
          const loc = uiState.location === "WAREHOUSE" ? "WAREHOUSE" : "FLOOR";
          const { data: exist } = await supabase.from("inventory").select("*").match({ location: loc, product_name: flow.entryProduct, expiry_date: flow.entryExpiry }).maybeSingle();
          if (exist) await supabase.from("inventory").update({ quantity: exist.quantity + flow.entryQty }).eq("id", exist.id);
          else await supabase.from("inventory").insert([{ product_name: flow.entryProduct, quantity: flow.entryQty, location: loc, expiry_date: flow.entryExpiry }]);
          if (loc === "WAREHOUSE") await supabase.from("history").insert([{ ts: Date.now(), kind: "IN", product_name: flow.entryProduct, expiry_date: flow.entryExpiry, location: "WAREHOUSE", delta: flow.entryQty, user_id: auth.loginUser }]);
        }
        triggerToast("✅ 저장 완료"); setModals(p => ({ ...p, input: false })); refreshData();
      } catch (e) { console.error(e); } finally { setUiState(p => ({ ...p, isSaving: false })); }
    },
    confirmEdit: async () => {
      if (!auth.ensureAuth() || !modals.edit) return;
      const table = uiState.location === "URGENT" ? "urgent_inventory" : "inventory";
      if (modals.editQty <= 0) {
        await supabase.from(table).delete().eq("id", modals.edit.id);
        if (modals.edit.location === "WAREHOUSE") await supabase.from("history").insert([{ ts: Date.now(), kind: "OUT", product_name: modals.edit.product_name, expiry_date: modals.edit.expiry_date, location: "WAREHOUSE", delta: -modals.edit.quantity, user_id: auth.loginUser }]);
      } else { await supabase.from(table).update({ quantity: modals.editQty }).eq("id", modals.edit.id); }
      setModals(p => ({ ...p, edit: null })); triggerToast("📝 수정 완료"); refreshData();
    },
    move: async () => {
      if (!auth.ensureAuth() || !modals.move) return;
      const 새위치 = modals.move.location === "FLOOR" ? "WAREHOUSE" : "FLOOR";
      const { data: exist } = await supabase.from("inventory").select("*").match({ location: 새위치, product_name: modals.move.product_name, expiry_date: modals.move.expiry_date }).maybeSingle();
      if (exist) await supabase.from("inventory").update({ quantity: exist.quantity + modals.moveQty }).eq("id", exist.id);
      else await supabase.from("inventory").insert([{ product_name: modals.move.product_name, quantity: modals.moveQty, location: 새위치, expiry_date: modals.move.expiry_date }]);
      if (modals.moveQty >= modals.move.quantity) await supabase.from("inventory").delete().eq("id", modals.move.id);
      else await supabase.from("inventory").update({ quantity: modals.move.quantity - modals.moveQty }).eq("id", modals.move.id);
      if (modals.move.location === "WAREHOUSE") await supabase.from("history").insert([{ ts: Date.now(), kind: "MOVE", product_name: modals.move.product_name, expiry_date: modals.move.expiry_date, location: "WAREHOUSE", delta: -modals.moveQty, user_id: auth.loginUser }]);
      setModals(p => ({ ...p, move: null })); triggerToast("🚚 이동 완료"); refreshData();
    },
    delete: async () => {
      if (!auth.ensureAuth() || !modals.delete) return;
      const t = modals.delete; const m = modals.deleteMode;
      if (m === "urgent") await supabase.from("urgent_inventory").delete().eq("id", t.id);
      else if (m === "usage") await supabase.from("urgent_usage").delete().eq("id", t.id);
      else if (m === "disposal") await supabase.from("urgent_disposal").delete().eq("id", t.id);
      else if (m === "set") await supabase.from("set_inventory").delete().eq("id", t.id);
      else if (m === "notice") await supabase.from("notices").delete().eq("id", t.id);
      else if (m === "daily") await supabase.from("daily_closing").delete().eq("id", t.id);
      else {
        await supabase.from("inventory").delete().eq("id", t.id);
        if (t.location === "WAREHOUSE") await supabase.from("history").insert([{ ts: Date.now(), kind: "OUT", product_name: t.product_name, expiry_date: t.expiry_date, location: "WAREHOUSE", delta: -t.quantity, user_id: auth.loginUser }]);
      }
      setModals(p => ({ ...p, delete: null })); triggerToast("🗑️ 삭제 완료"); refreshData();
    },
    confirmMoveToUrgent: async () => {
      if (!modals.moveUrgentTarget) return;
      await supabase.from("urgent_inventory").insert([{ product_name: modals.moveUrgentTarget.product_name, quantity: modals.moveUrgentTarget.quantity, expiry_date: modals.moveUrgentTarget.expiry_date }]);
      await supabase.from("inventory").delete().eq("id", modals.moveUrgentTarget.id);
      setModals(p => ({ ...p, moveUrgent: false, moveUrgentTarget: null })); triggerToast("⏰ 임박 전송"); refreshData();
    },
    saveNotice: async () => {
      if (auth.userRole !== "ADMIN" || !modals.noticeTitle) return;
      await supabase.from("notices").insert([{ title: modals.noticeTitle, content: modals.noticeContent }]);
      triggerToast("📢 공지 완료"); setModals(p => ({ ...p, notice: false, noticeTitle: "", noticeContent: "" })); refreshData();
    },
    confirmUrgentProcess: async (수량: number) => {
      if (!modals.urgentProcess || 수량 <= 0) return;
      const target = modals.urgentProcess; const table = uiState.urgentTab === "USAGE" ? "urgent_usage" : "urgent_disposal";
      if (target.quantity <= 수량) await supabase.from("urgent_inventory").delete().eq("id", target.id);
      else await supabase.from("urgent_inventory").update({ quantity: target.quantity - 수량 }).eq("id", target.id);
      await supabase.from(table).insert([{ product_name: target.product_name, quantity: 수량, expiry_date: target.expiry_date }]);
      triggerToast("✅ 등록 완료"); setModals(p => ({ ...p, urgentProcess: null })); refreshData();
    },
    clearHistory: async () => {
      if (auth.userRole !== "ADMIN") return;
      await supabase.from("history").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      triggerToast("🧹 기록 삭제 완료"); refreshData();
    }
  };

  // --- [3. 워크플로우 매니저 (Workflow)] ---
  const workflow = {
    ...flow,
    setEntry: (key: string, val: any) => setFlow(p => ({ ...p, [key]: val })),
    addPending: () => {
      if (flow.entryQty <= 0) { triggerToast("수량을 입력하세요."); return; }
      setFlow(p => ({ ...p, pendingList: [...p.pendingList, { product_name: p.entryProduct, quantity: p.entryQty, expiry_date: p.entryExpiry }], entryQty: 40 }));
    },
    startClosing: async () => {
      const 오늘 = new Date().toISOString().split('T')[0];
      const { data: exist } = await supabase.from("daily_closing").select("id").eq("closing_date", 오늘).maybeSingle();
      if (exist) { triggerToast("이미 오늘 마감을 완료하셨습니다."); return; }
      const hallItems = data.items.filter(i => i.location === "FLOOR").sort((a, b) => {
        const idxA = YANGGANG_종류.indexOf(a.product_name.replace(" 양갱", ""));
        const idxB = YANGGANG_종류.indexOf(b.product_name.replace(" 양갱", ""));
        return idxA !== idxB ? idxA - idxB : a.expiry_date.localeCompare(b.expiry_date);
      });
      if (hallItems.length === 0) { triggerToast("홀에 재고가 없습니다."); setUiState(p => ({ ...p, location: "TOTAL" })); }
      else { setFlow(p => ({ ...p, closingList: hallItems, closingIndex: 0 })); setUiState(p => ({ ...p, location: "CLOSING" })); }
    },
    saveClosing: async (snapshot: any) => {
      const 오늘 = new Date().toISOString().split('T')[0];
      await supabase.from("daily_closing").insert([{ closing_date: 오늘, stock_snapshot: snapshot, user_id: auth.loginUser }]);
      triggerToast("✅ 마감 기록 완료"); refreshData();
    }
  };

  // --- [4. UI 매니저 (UI)] ---
  const ui = {
    ...uiState,
    modalStates: modals,
    setModals: (m: any) => setModals(m),
    setLocation: (l: any) => setUiState(p => ({ ...p, location: l })),
    setArchiveTab: (t: any) => setUiState(p => ({ ...p, archiveTab: t })),
    setUrgentTab: (t: any) => setUiState(p => ({ ...p, urgentTab: t })),
    setIsMenuOpen: (o: any) => setUiState(p => ({ ...p, isMenuOpen: o })),
    triggerToast,
    openInput: (batch = false) => {
      if (!auth.ensureAuth()) return;
      setFlow(p => ({ ...p, entryQty: uiState.location === "WAREHOUSE" ? 40 : 0, entryProduct: uiState.location === "SET" ? "4구 클래식" : "팥 양갱", pendingList: [] }));
      setModals(p => ({ ...p, input: true, batch }));
    }
  };

  return { auth, inventory, workflow, ui, constants: { YANGGANG_종류, SET_종류 } };
}