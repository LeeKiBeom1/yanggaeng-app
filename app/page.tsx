"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

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
      `}</style>

      <div className="flex items-center justify-between mb-6 max-w-md mx-auto gap-3">
        <div className="flex flex-1 gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
          {["FLOOR", "WAREHOUSE"].map((loc) => (
            <button key={loc} onClick={() => setStatusLocation(loc as any)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${statusLocation === loc ? "bg-[#333] text-white" : "text-gray-400 hover:bg-gray-50"}`}>
              {loc === "FLOOR" ? "홀" : "창고"}
            </button>
          ))}
        </div>
        <button onClick={() => setIsMenuOpen(true)} className="w-10 h-10 bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center gap-1 active:scale-95 shadow-sm">
          <div className="w-5 h-0.5 bg-[#333]"></div>
          <div className="w-5 h-0.5 bg-[#333]"></div>
          <div className="w-5 h-0.5 bg-[#333]"></div>
        </button>
      </div>

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

      {statusLocation === "HISTORY" ? (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-12">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="text-[11px] font-bold text-gray-600">히스토리 (+입고 / -차감 / 이동)</div>
            <div className="flex items-center gap-2">
              <div className="text-[10px] font-bold text-gray-400">{historyEvents.length}건</div>
              <button
                onClick={() => {
                  persistHistory([]);
                  triggerToast("🧹 히스토리 삭제 완료");
                }}
                className="px-2 py-1 rounded-lg bg-white border border-gray-200 text-[10px] font-bold text-gray-500 hover:bg-gray-50"
              >
                비우기
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {historyEvents.map((ev) => {
              const time = new Date(ev.ts);
              const timeLabel = `${String(time.getMonth() + 1).padStart(2, "0")}/${String(time.getDate()).padStart(2, "0")} ${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`;

              if (ev.kind === "MOVE") {
                return (
                  <div key={ev.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-10 shrink-0 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-7 rounded-xl bg-gray-50 border border-gray-200 font-bold text-[11px] text-gray-600">
                        이동
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-gray-800 truncate">{ev.product_name}</div>
                      <div className="text-[11px] font-bold text-gray-400">
                        {fmtDate(ev.expiry_date)} · {fmtLoc(ev.from)} → {fmtLoc(ev.to)} · {timeLabel}
                      </div>
                    </div>
                    <div className="font-bold text-sm text-gray-700">{ev.qty}개</div>
                  </div>
                );
              }

              const delta = ev.delta;
              const isPlus = delta > 0;
              const badgeText = isPlus ? "+" : "-";
              const badgeClass = isPlus ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-red-50 border-red-100 text-red-600";

              const sub =
                ev.kind === "EDIT"
                  ? `${fmtDate(ev.expiry_date)} · ${fmtLoc(ev.location)} · ${ev.before} → ${ev.after} · ${timeLabel}`
                  : `${fmtDate(ev.expiry_date)} · ${fmtLoc(ev.location)} · ${timeLabel}`;

              return (
                <div key={ev.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-10 shrink-0 text-center">
                    <span className={`inline-flex items-center justify-center w-10 h-7 rounded-xl border font-bold text-[12px] ${badgeClass}`}>
                      {badgeText}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-gray-800 truncate">{ev.product_name}</div>
                    <div className="text-[11px] font-bold text-gray-400">{sub}</div>
                  </div>
                  <div className={`font-bold text-sm ${isPlus ? "text-blue-600" : "text-red-600"}`}>
                    {isPlus ? `+${delta}` : `${delta}`}개
                  </div>
                </div>
              );
            })}

            {historyEvents.length === 0 && (
              <div className="px-6 py-10 text-center text-sm font-bold text-gray-400">아직 기록된 히스토리가 없습니다.</div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-12">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[#666] text-[11px] border-b border-gray-200 font-bold">
                <th className="py-3 border-r border-gray-100 w-24">품목</th>
                {statusLocation === "TOTAL" ? (
                  <>
                    <th className="py-3 px-6 border-r border-gray-100 min-w-[92px]">홀</th>
                    <th className="py-3 px-6 border-r border-gray-100 min-w-[92px]">창고</th>
                    <th className="py-3 px-6 bg-blue-50 text-blue-600 min-w-[92px]">총합</th>
                  </>
                ) : (
                  <th className="py-3 text-left pl-6 font-bold">{statusLocation === "URGENT" ? `임박 재고 (D-${URGENT_DAYS} 이내)` : "상세 수량"}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {YANGGANG_TYPES.map((name) => {
                const productName = `${name} 양갱`;
                if (statusLocation === "TOTAL") {
                  const floorQty = getLocationStock(productName, "FLOOR");
                  const warehouseQty = getLocationStock(productName, "WAREHOUSE");
                  const total = floorQty + warehouseQty;
                  return (
                    <tr key={name} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 border-r border-gray-100 font-bold text-[12px] bg-gray-50/30">{name}</td>
                      <td className="py-3 px-6 border-r border-gray-100 font-medium text-sm text-gray-600">{floorQty || "-"}</td>
                      <td className="py-3 px-6 border-r border-gray-100 font-medium text-sm text-gray-600">{warehouseQty || "-"}</td>
                      <td className="py-3 px-6 font-bold text-base text-blue-600 bg-blue-50/20">{total || "0"}</td>
                    </tr>
                  );
                }

                let filteredItems =
                  statusLocation === "URGENT"
                    ? urgentItems.filter((i) => i.product_name === productName)
                    : items.filter((i) => i.product_name === productName && i.location === statusLocation);

                if (statusLocation === "URGENT" && filteredItems.length === 0) return null;

                filteredItems = filteredItems.slice().sort((a, b) => String(a.expiry_date).localeCompare(String(b.expiry_date)));

                return (
                  <tr key={name} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 border-r border-gray-100 font-bold text-[12px] bg-gray-50/30">{name}</td>
                    <td className="py-3 px-4 text-left">
                      <div className="flex flex-col gap-2">
                        {filteredItems.map((item) => (
                          <div key={item.id} className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 min-w-full relative shadow-sm">
                            <div
                              onClick={() => {
                                if (statusLocation !== "URGENT") {
                                  if (!ensureAuthenticated()) return;
                                  const inventoryItem = item as InventoryItem;
                                  setEditTarget(inventoryItem);
                                  setEditQty(inventoryItem.quantity);
                                }
                              }}
                              className={`flex-1 font-bold text-sm ${statusLocation === "URGENT" ? "text-left" : "text-center cursor-pointer"} pr-14`}
                            >
                              {(() => {
                                const daysLeft = getDaysUntilExpiry(item.expiry_date);
                                const urgentTextClass =
                                  daysLeft <= 1
                                    ? "text-red-600"
                                    : daysLeft <= URGENT_DAYS
                                    ? "text-orange-500"
                                    : "text-gray-700";

                                return (
                                  <>
                                    <span className={urgentTextClass}>{item.expiry_date.slice(5).replace("-", "/")}</span>
                                    <span className="mx-2 opacity-30">-</span>
                                    <span className={urgentTextClass}>{item.quantity}개</span>
                                  </>
                                );
                              })()}
                            </div>
                            <div className="absolute right-1 flex gap-1">
                              {statusLocation !== "URGENT" && (
                                <button
                                  onClick={() => {
                                    if (!ensureAuthenticated()) return;
                                    const inventoryItem = item as InventoryItem;
                                    setMoveTarget(inventoryItem);
                                    setMoveQty(inventoryItem.quantity);
                                  }}
                                  className="p-1 hover:bg-gray-100 rounded text-blue-500 text-xs font-bold"
                                >
                                  🚚
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if (!ensureAuthenticated()) return;
                                  setDeleteMode(statusLocation === "URGENT" ? "urgent" : "inventory");
                                  setDeleteTarget(item);
                                }}
                                className="p-1 hover:bg-red-50 rounded text-red-500 text-lg font-bold leading-none"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isMenuOpen && (
        <div className="fixed inset-0 z-[750] bg-black/40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}>
          <div className="absolute top-4 right-4 w-56 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="text-[11px] font-bold text-gray-600">메뉴</div>
              <button className="text-gray-400 font-bold text-lg leading-none px-2" onClick={() => setIsMenuOpen(false)}>×</button>
            </div>
            <div className="p-2">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  if (isUnlocked) signOut();
                  else setShowAuthModal(true);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-50 font-bold text-sm text-gray-700"
              >
                {isUnlocked ? "로그아웃" : "로그인"}
              </button>
              <button
                onClick={() => {
                  setStatusLocation("TOTAL");
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-50 font-bold text-sm text-gray-700"
              >
                재고합계
              </button>
              <button
                onClick={() => {
                  setStatusLocation("URGENT");
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-50 font-bold text-sm text-gray-700"
              >
                임박 재고
              </button>
              <button
                onClick={() => {
                  setStatusLocation("HISTORY");
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-50 font-bold text-sm text-gray-700"
              >
                히스토리
              </button>
            </div>
          </div>
        </div>
      )}

      {showInputModal && (
        <div className="fixed inset-0 bg-black/50 z-[700] flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setShowInputModal(false)}>
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 border border-gray-200 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg mb-6 text-center font-bold text-blue-600">재고 추가</h2>
            {statusLocation === "URGENT" && (
              <p className="text-[11px] text-center text-red-500 font-bold -mt-3 mb-4">임박 재고는 유통기한 14일 이내만 추가할 수 있습니다.</p>
            )}
            <div className="grid grid-cols-4 gap-2 mb-6 max-h-40 overflow-y-auto p-1 border border-gray-100 rounded-lg text-center">
              {YANGGANG_TYPES.map(p => (
                <button key={p} onClick={() => setSelectedProduct(`${p} 양갱`)} className={`py-1.5 text-[10px] rounded-md border font-bold ${selectedProduct === `${p} 양갱` ? "bg-blue-600 text-white border-blue-600" : "bg-gray-50 text-gray-400 border-gray-100"}`}>{p}</button>
              ))}
            </div>
            <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full mb-4 p-3 border border-gray-200 rounded-xl font-bold text-center" />
            
            <div className="flex gap-2 mb-4">
              <button onClick={() => setQuantity(quantity + 10)} className="flex-1 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-500 hover:bg-gray-100">+10</button>
              <button onClick={() => setQuantity(quantity + 40)} className="flex-1 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-500 hover:bg-gray-100">+40</button>
              <button onClick={() => setQuantity(0)} className="flex-1 py-2 bg-red-50 border border-red-100 rounded-lg text-[10px] font-bold text-red-400 hover:bg-red-100">초기화</button>
            </div>

            <div className="flex items-center justify-center gap-6 mb-6">
              <button onClick={() => setQuantity(Math.max(0, quantity - 1))} className="w-10 h-10 border border-gray-200 rounded-full font-bold text-xl">-</button>
              <input type="number" value={quantity || ""} placeholder="0" onChange={(e) => setQuantity(parseInt(e.target.value) || 0)} className="w-16 text-center text-3xl font-bold bg-transparent focus:outline-none" />
              <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 border border-gray-200 rounded-full font-bold text-xl">+</button>
            </div>
            <div className="flex gap-2 text-center">
              <button onClick={() => setShowInputModal(false)} className="flex-1 py-3 text-gray-400 font-bold">취소</button>
              <button onClick={saveInventory} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">저장</button>
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 z-[760] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 border border-gray-200 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg mb-2 text-center font-bold text-blue-600">잠금 해제 로그인</h2>
            <p className="text-[11px] text-center text-gray-500 font-bold mb-5">아이디와 비밀번호를 입력해야 사용 가능합니다.</p>

            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="아이디"
              className="w-full mb-3 p-3 border border-gray-200 rounded-xl font-bold text-sm"
            />
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="비밀번호"
              className="w-full mb-5 p-3 border border-gray-200 rounded-xl font-bold text-sm"
            />

            <button onClick={signIn} disabled={isAuthLoading} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold disabled:bg-blue-300">
              {isAuthLoading ? "로그인 중..." : "로그인"}
            </button>
          </div>
        </div>
      )}

      {editTarget && (
        <div className="fixed inset-0 bg-black/50 z-[700] flex items-center justify-center p-6" onClick={() => setEditTarget(null)}>
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-2 text-blue-600">수량 수정</h3>
            <p className="text-xs text-gray-400 mb-6 font-bold">{editTarget.product_name} ({editTarget.expiry_date})</p>
            <div className="flex items-center justify-center gap-6 mb-8 text-center">
              <button onClick={() => setEditQty(Math.max(0, editQty - 1))} className="w-10 h-10 border border-gray-200 rounded-full font-bold text-xl">-</button>
              <input type="number" value={editQty} onChange={(e) => setEditQty(parseInt(e.target.value) || 0)} className="w-16 text-center text-3xl font-bold bg-transparent focus:outline-none" />
              <button onClick={() => setEditQty(editQty + 1)} className="w-10 h-10 border border-gray-200 rounded-full font-bold text-xl">+</button>
            </div>
            <button onClick={confirmEdit} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md">수정 완료</button>
          </div>
        </div>
      )}

      {moveTarget && (
        <div className="fixed inset-0 bg-black/50 z-[700] flex items-center justify-center p-6" onClick={() => setMoveTarget(null)}>
          <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-xl text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-4 text-blue-600">재고 이동 (홀 ↔ 창고)</h3>
            <div className="flex items-center justify-center gap-4 mb-6 text-center">
              <button onClick={() => setMoveQty(Math.max(1, moveQty - 1))} className="w-10 h-10 border border-gray-200 rounded-full font-bold">-</button>
              <span className="text-2xl font-bold">{moveQty}개</span>
              <button onClick={() => setMoveQty(Math.min(moveTarget.quantity, moveQty + 1))} className="w-10 h-10 border border-gray-200 rounded-full font-bold">+</button>
            </div>
            <button onClick={moveInventory} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">이동 확정</button>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-[700] flex items-center justify-center p-6" onClick={() => { setDeleteTarget(null); setDeleteMode("inventory"); }}>
          <div className="bg-white w-full max-w-xs rounded-2xl p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="font-bold text-lg mb-6">정말 삭제하시겠습니까?</p>
            <div className="flex gap-2 text-center">
              <button onClick={() => { setDeleteTarget(null); setDeleteMode("inventory"); }} className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold">취소</button>
              <button onClick={execDelete} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold">삭제</button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-gray-800 text-white text-sm font-bold shadow-xl animate-bounce z-[800]">
          {showToast}
        </div>
      )}
      <div className="fixed bottom-2 right-4 text-[9px] text-gray-300 font-bold uppercase tracking-widest">v1.2.1_stable</div>
    </div>
  );
}