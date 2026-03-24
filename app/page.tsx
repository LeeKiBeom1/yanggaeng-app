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

// 요청에 따라 '백앙금'과 '흑임자' 순서를 변경했습니다.
const YANGGANG_TYPES = ["팥", "고운앙금", "통팥", "밤", "호두", "견과", "대추", "쌍화", "밀크티", "라즈베리", "곶감", "녹차", "말차", "백앙금", "흑임자", "고구마", "단호박"];

export default function InventoryPage() {
  type InventoryItem = {
    id: string;
    product_name: string;
    quantity: number;
    location: "FLOOR" | "WAREHOUSE";
    expiry_date: string;
  };
  type UrgentItem = {
    id: string;
    product_name: string;
    quantity: number;
    expiry_date: string;
  };

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [statusLocation, setStatusLocation] = useState<"FLOOR" | "WAREHOUSE" | "URGENT" | "TOTAL" | "HISTORY">("FLOOR"); 
  const [showToast, setShowToast] = useState(""); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  type HistoryEvent =
    | {
        id: string;
        ts: number;
        kind: "IN";
        product_name: string;
        expiry_date: string;
        location: "FLOOR" | "WAREHOUSE";
        delta: number;
      }
    | {
        id: string;
        ts: number;
        kind: "OUT";
        product_name: string;
        expiry_date: string;
        location: "FLOOR" | "WAREHOUSE";
        delta: number;
      }
    | {
        id: string;
        ts: number;
        kind: "EDIT";
        product_name: string;
        expiry_date: string;
        location: "FLOOR" | "WAREHOUSE";
        before: number;
        after: number;
        delta: number;
      }
    | {
        id: string;
        ts: number;
        kind: "MOVE";
        product_name: string;
        expiry_date: string;
        from: "FLOOR" | "WAREHOUSE";
        to: "FLOOR" | "WAREHOUSE";
        qty: number;
      };

  const HISTORY_STORAGE_KEY = "yanggaeng_history_v1";
  const URGENT_STORAGE_KEY = "yanggaeng_urgent_v1";
  const [historyEvents, setHistoryEvents] = useState<HistoryEvent[]>([]);
  const [urgentItems, setUrgentItems] = useState<UrgentItem[]>([]);
  
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | UrgentItem | null>(null);
  const [deleteMode, setDeleteMode] = useState<"inventory" | "urgent">("inventory");
  const [editTarget, setEditTarget] = useState<InventoryItem | null>(null); 
  const [editQty, setEditQty] = useState(0);
  const [moveTarget, setMoveTarget] = useState<InventoryItem | null>(null);
  const [moveQty, setMoveQty] = useState(0);

  const [showInputModal, setShowInputModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("팥 양갱");
  const [quantity, setQuantity] = useState(0);
  const [expiryDate, setExpiryDate] = useState(new Date().toISOString().split('T')[0]);

  async function fetchInventory() {
    const { data, error } = await supabase.from("inventory").select("*").order("expiry_date", { ascending: true });
    if (error) {
      triggerToast("재고 조회 중 오류가 발생했습니다.");
      return;
    }
    if (data) setItems(data as InventoryItem[]);
  }
  useEffect(() => {
    fetchInventory();
    (async () => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        const data = await res.json();
        const ok = Boolean(data?.authenticated);
        setIsUnlocked(ok);
        setShowAuthModal(!ok);
      } catch {
        setIsUnlocked(false);
        setShowAuthModal(true);
      }
    })();
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setHistoryEvents(parsed as HistoryEvent[]);
      }
    } catch {
      // ignore corrupted local history
    }
    try {
      const rawUrgent = localStorage.getItem(URGENT_STORAGE_KEY);
      if (rawUrgent) {
        const parsedUrgent = JSON.parse(rawUrgent);
        if (Array.isArray(parsedUrgent)) setUrgentItems(parsedUrgent as UrgentItem[]);
      }
    } catch {
      // ignore corrupted urgent data
    }
  }, []);

  function persistHistory(next: HistoryEvent[]) {
    setHistoryEvents(next);
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage failures
    }
  }

  function appendHistory(event: HistoryEvent) {
    const next = [event, ...historyEvents].slice(0, 500);
    persistHistory(next);
  }

  function persistUrgent(next: UrgentItem[]) {
    setUrgentItems(next);
    try {
      localStorage.setItem(URGENT_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage failures
    }
  }

  function fmtLoc(loc: "FLOOR" | "WAREHOUSE") {
    return loc === "FLOOR" ? "홀" : "창고";
  }

  function fmtDate(iso: string) {
    return String(iso).slice(5).replace("-", "/");
  }

  function getDaysUntilExpiry(value: string) {
    const end = new Date(value).getTime();
    const now = new Date().getTime();
    return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  }

  function triggerToast(msg: string) {
    setShowToast(msg);
    setTimeout(() => setShowToast(""), 2000);
  }

  function ensureAuthenticated() {
    if (isUnlocked) return true;
    setShowAuthModal(true);
    triggerToast("로그인 후 재고 수정이 가능합니다.");
    return false;
  }

  async function signIn() {
    if (!loginId || !loginPassword) {
      triggerToast("아이디와 비밀번호를 입력해주세요.");
      return;
    }
    setIsAuthLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: loginId, password: loginPassword }),
    });
    setIsAuthLoading(false);
    if (!res.ok) {
      triggerToast("로그인 실패: 아이디/비밀번호를 확인해주세요.");
      return;
    }
    setIsUnlocked(true);
    setShowAuthModal(false);
    setLoginId("");
    setLoginPassword("");
    triggerToast("로그인 성공");
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsUnlocked(false);
    setShowAuthModal(true);
    triggerToast("로그아웃 되었습니다.");
  }

  async function saveInventory() {
    if (!ensureAuthenticated()) return;
    if (quantity <= 0) return;
    if (statusLocation === "URGENT") {
      const days = getDaysUntilExpiry(expiryDate);
      if (days < 0 || days > URGENT_DAYS) {
        triggerToast("올바르지 않은 유통기한입니다.");
        return;
      }
      const nextUrgent: UrgentItem[] = [
        {
          id: crypto.randomUUID(),
          product_name: selectedProduct,
          quantity,
          expiry_date: expiryDate,
        },
        ...urgentItems,
      ].slice(0, 1000);
      persistUrgent(nextUrgent);
      triggerToast("✅ 임박 재고 저장 완료");
      setQuantity(0);
      setShowInputModal(false);
      return;
    }
    const targetLoc: "FLOOR" | "WAREHOUSE" = statusLocation === "WAREHOUSE" ? "WAREHOUSE" : "FLOOR";

    const { data: existing, error: selectError } = await supabase
      .from("inventory")
      .select("*")
      .match({ location: targetLoc, product_name: selectedProduct, expiry_date: expiryDate })
      .maybeSingle();

    if (selectError) {
      triggerToast("저장 중 오류가 발생했습니다.");
      return;
    }

    let saveError: Error | null = null;
    if (existing) {
      const { error } = await supabase.from("inventory").update({ quantity: existing.quantity + quantity }).eq("id", existing.id);
      saveError = error;
    } else {
      const { error } = await supabase.from("inventory").insert([{ product_name: selectedProduct, quantity, location: targetLoc, expiry_date: expiryDate }]);
      saveError = error;
    }
    if (saveError) {
      triggerToast("저장 중 오류가 발생했습니다.");
      return;
    }
    appendHistory({
      id: crypto.randomUUID(),
      ts: Date.now(),
      kind: "IN",
      product_name: selectedProduct,
      expiry_date: expiryDate,
      location: targetLoc,
      delta: quantity,
    });
    triggerToast("✅ 저장 완료");
    setQuantity(0); setShowInputModal(false); fetchInventory();
  }

  async function confirmEdit() {
    if (!ensureAuthenticated()) return;
    if (!editTarget) return;
    const before = Number(editTarget.quantity) || 0;
    const after = Number(editQty) || 0;
    const delta = after - before;
    if (after <= 0) {
      const { error } = await supabase.from("inventory").delete().eq("id", editTarget.id);
      if (error) {
        triggerToast("수정 중 오류가 발생했습니다.");
        return;
      }
      appendHistory({
        id: crypto.randomUUID(),
        ts: Date.now(),
        kind: "OUT",
        product_name: editTarget.product_name,
        expiry_date: editTarget.expiry_date,
        location: editTarget.location,
        delta: -before,
      });
    } else {
      const { error } = await supabase.from("inventory").update({ quantity: after }).eq("id", editTarget.id);
      if (error) {
        triggerToast("수정 중 오류가 발생했습니다.");
        return;
      }
      appendHistory({
        id: crypto.randomUUID(),
        ts: Date.now(),
        kind: "EDIT",
        product_name: editTarget.product_name,
        expiry_date: editTarget.expiry_date,
        location: editTarget.location,
        before,
        after,
        delta,
      });
    }
    setEditTarget(null); triggerToast("📝 수정 완료"); fetchInventory();
  }

  async function moveInventory() {
    if (!ensureAuthenticated()) return;
    if (!moveTarget || moveQty <= 0) return;
    const newLoc = moveTarget.location === "FLOOR" ? "WAREHOUSE" : "FLOOR";
    const { data: existing, error: selectError } = await supabase
      .from("inventory")
      .select("*")
      .match({ location: newLoc, product_name: moveTarget.product_name, expiry_date: moveTarget.expiry_date })
      .maybeSingle();
    if (selectError) {
      triggerToast("이동 중 오류가 발생했습니다.");
      return;
    }
    if (existing) {
      const { error } = await supabase.from("inventory").update({ quantity: existing.quantity + moveQty }).eq("id", existing.id);
      if (error) {
        triggerToast("이동 중 오류가 발생했습니다.");
        return;
      }
    } else {
      const { error } = await supabase
        .from("inventory")
        .insert([{ product_name: moveTarget.product_name, quantity: moveQty, location: newLoc, expiry_date: moveTarget.expiry_date }]);
      if (error) {
        triggerToast("이동 중 오류가 발생했습니다.");
        return;
      }
    }
    if (moveQty >= moveTarget.quantity) {
      const { error } = await supabase.from("inventory").delete().eq("id", moveTarget.id);
      if (error) {
        triggerToast("이동 중 오류가 발생했습니다.");
        return;
      }
    } else {
      const { error } = await supabase.from("inventory").update({ quantity: moveTarget.quantity - moveQty }).eq("id", moveTarget.id);
      if (error) {
        triggerToast("이동 중 오류가 발생했습니다.");
        return;
      }
    }
    appendHistory({
      id: crypto.randomUUID(),
      ts: Date.now(),
      kind: "MOVE",
      product_name: moveTarget.product_name,
      expiry_date: moveTarget.expiry_date,
      from: moveTarget.location,
      to: newLoc,
      qty: moveQty,
    });
    setMoveTarget(null); triggerToast(`🚚 이동 완료`); fetchInventory();
  }

  async function execDelete() {
    if (!ensureAuthenticated()) return;
    if (!deleteTarget) return;
    if (deleteMode === "urgent") {
      const nextUrgent = urgentItems.filter((i) => i.id !== deleteTarget.id);
      persistUrgent(nextUrgent);
      setDeleteTarget(null);
      triggerToast("🗑️ 임박 재고 삭제 완료");
      return;
    }
    const inventoryTarget = deleteTarget as InventoryItem;
    const { error } = await supabase.from("inventory").delete().eq("id", inventoryTarget.id);
    if (error) {
      triggerToast("삭제 중 오류가 발생했습니다.");
      return;
    }
    appendHistory({
      id: crypto.randomUUID(),
      ts: Date.now(),
      kind: "OUT",
      product_name: inventoryTarget.product_name,
      expiry_date: inventoryTarget.expiry_date,
      location: inventoryTarget.location,
      delta: -(Number(inventoryTarget.quantity) || 0),
    });
    setDeleteTarget(null);
    setDeleteMode("inventory");
    triggerToast("🗑️ 삭제 완료");
    fetchInventory();
  }

  const getLocationStock = (productName: string, location: "FLOOR" | "WAREHOUSE") => {
    return items.filter(item => item.product_name === productName && item.location === location).reduce((acc, cur) => acc + cur.quantity, 0);
  };

  const URGENT_DAYS = 14;

  return (
    <div className="p-4 max-w-5xl mx-auto bg-[#F8F9FA] min-h-screen font-sans text-[#333]">
      <style jsx global>{`
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }

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

<InventoryHeader 
  statusLocation={statusLocation}
  setStatusLocation={setStatusLocation}
  setIsMenuOpen={setIsMenuOpen}
  isMenuOpen={isMenuOpen}
  isUnlocked={isUnlocked}
  signOut={signOut}
  setShowAuthModal={setShowAuthModal}
/>

      <div className="flex justify-between items-end mb-4 px-1">
        {statusLocation !== "TOTAL" && statusLocation !== "HISTORY" && (
          <button
            onClick={() => {
              if (!ensureAuthenticated()) return;
              setShowInputModal(true);
            }}
            className={`px-5 py-2.5 text-white rounded-xl text-xs font-bold shadow-md transition-all ${isUnlocked ? "bg-blue-600 active:scale-95" : "bg-blue-300 cursor-not-allowed"}`}
          >
            + 재고 추가
          </button>
        )}
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
          {statusLocation === "FLOOR" ? "홀" : statusLocation === "WAREHOUSE" ? "창고" : statusLocation === "URGENT" ? "임박" : statusLocation === "HISTORY" ? "히스토리" : "합계"}
        </span>
      </div>

      <InventoryContent 
  statusLocation={statusLocation}
  historyEvents={historyEvents}
  persistHistory={persistHistory}
  triggerToast={triggerToast}
  fmtDate={fmtDate}
  fmtLoc={fmtLoc}
  items={items}
  urgentItems={urgentItems}
  YANGGANG_TYPES={YANGGANG_TYPES}
  getLocationStock={getLocationStock}
  getDaysUntilExpiry={getDaysUntilExpiry}
  URGENT_DAYS={URGENT_DAYS}
  ensureAuthenticated={ensureAuthenticated}
  setEditTarget={setEditTarget}
  setEditQty={setEditQty}
  setMoveTarget={setMoveTarget}
  setMoveQty={setMoveQty}
  setDeleteMode={setDeleteMode}
  setDeleteTarget={setDeleteTarget}
/>

      

<InventoryModals 
  showInputModal={showInputModal}
  setShowInputModal={setShowInputModal}
  statusLocation={statusLocation}
  YANGGANG_TYPES={YANGGANG_TYPES}
  selectedProduct={selectedProduct}
  setSelectedProduct={setSelectedProduct}
  expiryDate={expiryDate}
  setExpiryDate={setExpiryDate}
  quantity={quantity}
  setQuantity={setQuantity}
  saveInventory={saveInventory}
  showAuthModal={showAuthModal}
  loginId={loginId}
  setLoginId={setLoginId}
  loginPassword={loginPassword}
  setLoginPassword={setLoginPassword}
  isAuthLoading={isAuthLoading}
  signIn={signIn}
  editTarget={editTarget}
  setEditTarget={setEditTarget}
  editQty={editQty}
  setEditQty={setEditQty}
  confirmEdit={confirmEdit}
  moveTarget={moveTarget}
  setMoveTarget={setMoveTarget}
  moveQty={moveQty}
  setMoveQty={setMoveQty}
  moveInventory={moveInventory}
  deleteTarget={deleteTarget}
  setDeleteTarget={setDeleteTarget}
  setDeleteMode={setDeleteMode}
  execDelete={execDelete}
/>

      {showToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-gray-800 text-white text-sm font-bold shadow-xl animate-bounce z-[800]">
          {showToast}
        </div>
      )}
      <div className="fixed bottom-2 right-4 text-[9px] text-gray-300 font-bold uppercase tracking-widest">v1.2.1_stable</div>
    </div>
  );
}