"use client";

import { useState, useEffect, useCallback } from "react";
import * as service from "@/lib/supabase/service";
import * as dateUtils from "@/lib/utils/date";
import { 
  InventoryItem, HistoryEvent, SetInventory, 
  UrgentInventory, UrgentLog, Notice, DailyClosing 
} from "@/app/types/inventory";

// 상수 정의
const YANGGANG_종류 = ["팥", "고운앙금", "통팥", "밤", "호두", "견과", "대추", "쌍화", "라즈베리", "밀크티", "곶감", "녹차", "말차", "백앙금", "흑임자", "단호박", "고구마"];
const SET_종류 = ["4구 클래식", "4구 01", "6구 클래식", "6구 01", "6구 02", "6구 03", "12구 클래식", "12구 01", "12구 02", "12구 03", "한정 12구", "16구"];

export function useInventory() {
  // 1. 데이터 상태
  const [data, setData] = useState({
    items: [] as InventoryItem[],
    history: [] as HistoryEvent[],
    urgent: [] as UrgentInventory[],
    sets: [] as SetInventory[],
    notices: [] as Notice[],
    usage: [] as UrgentLog[],
    disposal: [] as UrgentLog[],
    closing: [] as DailyClosing[]
  });

  // 2. UI 상태
  const [uiState, setUiState] = useState({
    location: "FLOOR" as any,
    archiveTab: "HISTORY" as "HISTORY" | "DAILY",
    urgentTab: "STORAGE" as "STORAGE" | "USAGE" | "DISPOSAL",
    toast: "",
    isMenuOpen: false,
    isSaving: false
  });

  // 3. 인증 상태
  const [authForm, setAuthForm] = useState({ userId: "", password: "" });
  const [authInfo, setAuthInfo] = useState({
    isUnlocked: false,
    showModal: false,
    loginUser: "",
    userRole: "STAFF" as "ADMIN" | "STAFF",
    isLoading: false
  });

  // 4. 모달 상태
  const [modals, setModals] = useState({
    input: false,
    batch: false,
    edit: null as any,
    editQty: 0,
    move: null as any,
    moveQty: 0,
    delete: null as any,
    deleteMode: "inventory",
    moveUrgent: false,
    moveUrgentTarget: null as any,
    notice: false,
    noticeTitle: "",
    noticeContent: "",
    urgentProcess: null as any,
    closingDetail: null as any
  });

  // 5. 작업 흐름 상태 (마감, 입고 등)
  const [flow, setFlow] = useState({
    closingList: [] as any[],
    closingIndex: 0,
    entryProduct: "팥 양갱",
    entryQty: 0,
    entryExpiry: dateUtils.getTodayStr(),
    entrySetMemo: "Red",
    pendingList: [] as any[]
  });

  // 토스트 알림 제어
  const triggerToast = (msg: string) => {
    setUiState(p => ({ ...p, toast: msg }));
    setTimeout(() => setUiState(p => ({ ...p, toast: "" })), 2000);
  };

  // 전체 데이터 새로고침
  const refreshData = useCallback(async () => {
    try {
      const allData = await service.fetchAllInventoryData();
      setData(allData);
    } catch (e) {
      console.error("데이터 로드 실패:", e);
    }
  }, []);

  // 초기 세션 확인
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      if (session?.authenticated) {
        const id = document.cookie.split('; ').find(row => row.startsWith('yanggaeng_user_id='))?.split('=')[1] || "";
        setAuthInfo(p => ({ 
          ...p, 
          isUnlocked: true, 
          loginUser: id, 
          userRole: (id === "manager01" || id === "god6332") ? "ADMIN" : "STAFF" 
        }));
        refreshData();
      } else {
        setAuthInfo(p => ({ ...p, showModal: true }));
      }
    })();
  }, [refreshData]);

  // --- [권한 매니저] ---
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
        setAuthInfo(p => ({ 
          ...p, 
          isUnlocked: true, 
          showModal: false, 
          loginUser: authForm.userId, 
          userRole: (authForm.userId === "manager01" || authForm.userId === "god6332") ? "ADMIN" : "STAFF" 
        }));
        triggerToast("로그인 성공");
        refreshData();
      } else triggerToast("로그인 실패");
    },
    logout: async () => { 
      await fetch("/api/auth/logout", { method: "POST" }); 
      location.reload(); 
    }
  };

  // --- [재고 매니저] ---
  const inventory = {
    ...data,
    refresh: refreshData,
    save: async () => {
      if (!auth.ensureAuth() || uiState.isSaving) return;

      if (uiState.location === "URGENT") {
        const diff = dateUtils.getDaysUntilExpiry(flow.entryExpiry);
        if (diff > 14) { triggerToast("14일 이내 재고만 등록 가능합니다."); return; }
      }

      setUiState(p => ({ ...p, isSaving: true }));
      try {
        if (modals.batch) {
          for (const item of flow.pendingList) {
            await service.saveStock({
              table: "inventory",
              data: { ...item, location: "WAREHOUSE" },
              userId: auth.loginUser
            });
          }
          setFlow(p => ({ ...p, pendingList: [] }));
        } else {
          let table: any = "inventory";
          let saveData: any = { 
            product_name: flow.entryProduct, 
            quantity: flow.entryQty, 
            expiry_date: flow.entryExpiry 
          };

          if (uiState.location === "URGENT") table = "urgent_inventory";
          else if (uiState.location === "SET") {
            table = "set_inventory";
            saveData = { set_name: flow.entryProduct, quantity: flow.entryQty, expiry_date: flow.entryExpiry, color_data: flow.entrySetMemo };
          } else {
            saveData.location = uiState.location === "WAREHOUSE" ? "WAREHOUSE" : "FLOOR";
          }

          await service.saveStock({ table, data: saveData, userId: auth.loginUser });
        }
        triggerToast("✅ 저장 완료");
        setModals(p => ({ ...p, input: false }));
        refreshData();
      } catch (e) { console.error(e); } finally { setUiState(p => ({ ...p, isSaving: false })); }
    },
    confirmEdit: async () => {
      if (!auth.ensureAuth() || !modals.edit) return;
      const table = uiState.location === "URGENT" ? "urgent_inventory" : "inventory";
      await service.updateStockQty(table, modals.edit.id, modals.editQty);
      setModals(p => ({ ...p, edit: null }));
      triggerToast("📝 수정 완료");
      refreshData();
    },
    move: async () => {
      if (!auth.ensureAuth() || !modals.move) return;
      await service.moveStock(modals.move, modals.moveQty, auth.loginUser);
      setModals(p => ({ ...p, move: null }));
      triggerToast("🚚 이동 완료");
      refreshData();
    },
    delete: async () => {
      if (!auth.ensureAuth() || !modals.delete) return;
      const tableMap: any = {
        urgent: "urgent_inventory", usage: "urgent_usage", disposal: "urgent_disposal",
        set: "set_inventory", notice: "notices", daily: "daily_closing", inventory: "inventory"
      };
      await service.deleteItem(tableMap[modals.deleteMode] || "inventory", modals.delete.id);
      setModals(p => ({ ...p, delete: null }));
      triggerToast("🗑️ 삭제 완료");
      refreshData();
    },
    confirmMoveToUrgent: async () => {
      if (!modals.moveUrgentTarget) return;
      await service.saveStock({
        table: "urgent_inventory",
        data: { 
          product_name: modals.moveUrgentTarget.product_name, 
          quantity: modals.moveUrgentTarget.quantity, 
          expiry_date: modals.moveUrgentTarget.expiry_date 
        },
        userId: auth.loginUser
      });
      await service.deleteItem("inventory", modals.moveUrgentTarget.id);
      setModals(p => ({ ...p, moveUrgent: false, moveUrgentTarget: null }));
      triggerToast("⏰ 임박 전송");
      refreshData();
    },
    saveNotice: async () => {
      if (auth.userRole !== "ADMIN" || !modals.noticeTitle) return;
      await service.saveStock({
        table: "notices" as any,
        data: { title: modals.noticeTitle, content: modals.noticeContent },
        userId: auth.loginUser
      });
      triggerToast("📢 공지 완료");
      setModals(p => ({ ...p, notice: false, noticeTitle: "", noticeContent: "" }));
      refreshData();
    },
    confirmUrgentProcess: async (수량: number) => {
      if (!modals.urgentProcess || 수량 <= 0) return;
      const target = modals.urgentProcess;
      const table = uiState.urgentTab === "USAGE" ? "urgent_usage" : "urgent_disposal";
      
      await service.updateStockQty("urgent_inventory", target.id, target.quantity - 수량);
      await service.saveStock({
        table: table as any,
        data: { product_name: target.product_name, quantity: 수량, expiry_date: target.expiry_date },
        userId: auth.loginUser
      });
      triggerToast("✅ 등록 완료");
      setModals(p => ({ ...p, urgentProcess: null }));
      refreshData();
    },
    clearHistory: async () => {
      if (auth.userRole !== "ADMIN") return;
      await service.deleteItem("history", "00000000-0000-0000-0000-000000000000"); 
      triggerToast("🧹 기록 삭제 시도");
      refreshData();
    }
  };

  // --- [워크플로우 매니저] ---
  const workflow = {
    ...flow,
    setEntry: (key: string, val: any) => setFlow(p => ({ ...p, [key]: val })),
    addPending: () => {
      if (flow.entryQty <= 0) { triggerToast("수량을 입력하세요."); return; }
      setFlow(p => ({ 
        ...p, 
        pendingList: [...p.pendingList, { product_name: p.entryProduct, quantity: p.entryQty, expiry_date: p.entryExpiry }], 
        entryQty: 40 
      }));
    },
    startClosing: async () => {
      const 오늘 = dateUtils.getTodayStr();
      
      // [수정] 이미 훅이 가지고 있는 data.closing 상태를 사용하여 오늘 마감 여부 체크
      if (data.closing.some(c => c.closing_date === 오늘)) {
        triggerToast("오늘 마감은 완료되었습니다.");
        return;
      }
      
      const hallItems = data.items.filter(i => i.location === "FLOOR").sort((a, b) => {
        const idxA = YANGGANG_종류.indexOf(a.product_name.replace(" 양갱", ""));
        const idxB = YANGGANG_종류.indexOf(b.product_name.replace(" 양갱", ""));
        return idxA !== idxB ? idxA - idxB : a.expiry_date.localeCompare(b.expiry_date);
      });

      if (hallItems.length === 0) { 
        triggerToast("홀에 재고가 없습니다."); 
        setUiState(p => ({ ...p, location: "TOTAL" })); 
      } else { 
        setFlow(p => ({ ...p, closingList: hallItems, closingIndex: 0 })); 
        setUiState(p => ({ ...p, location: "CLOSING" })); 
      }
    },
    saveClosing: async () => {
      const 오늘 = dateUtils.getTodayStr();
      const snapshot = YANGGANG_종류.map(name => ({
        product_name: `${name} 양갱`,
        floor: data.items.filter(i => i.product_name === `${name} 양갱` && i.location === "FLOOR").reduce((a,c)=>a+c.quantity, 0),
        warehouse: data.items.filter(i => i.product_name === `${name} 양갱` && i.location === "WAREHOUSE").reduce((a,c)=>a+c.quantity, 0)
      }));
      await service.saveClosingRecord({ closing_date: 오늘, stock_snapshot: snapshot, user_id: auth.loginUser });
      triggerToast("✅ 마감 기록 완료");
      refreshData();
    }
  };

  // --- [UI 매니저] ---
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
      setFlow(p => ({ 
        ...p, 
        entryQty: uiState.location === "WAREHOUSE" ? 40 : 0, 
        entryProduct: uiState.location === "SET" ? "4구 클래식" : "팥 양갱", 
        pendingList: [] 
      }));
      setModals(p => ({ ...p, input: true, batch }));
    }
  };

  return { auth, inventory, workflow, ui, constants: { YANGGANG_종류, SET_종류 } };
}