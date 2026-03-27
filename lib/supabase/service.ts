import { createClient } from "@supabase/supabase-js";
import { 
  InventoryItem, HistoryEvent, SetInventory, 
  UrgentInventory, UrgentLog, Notice, DailyClosing 
} from "@/app/types/inventory";

// Supabase 클라이언트 설정
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * [조회] 모든 테이블의 데이터를 한 번에 가져옵니다.
 */
export const fetchAllInventoryData = async () => {
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

  return {
    items: (inv.data as InventoryItem[]) || [],
    history: (hist.data as HistoryEvent[]) || [],
    urgent: (urg.data as UrgentInventory[]) || [],
    sets: (sts.data as SetInventory[]) || [],
    notices: (ntc.data as Notice[]) || [],
    usage: (usg.data as UrgentLog[]) || [],
    disposal: (dsp.data as UrgentLog[]) || [],
    closing: (cls.data as DailyClosing[]) || [],
  };
};

/**
 * [저장] 새로운 재고를 등록하거나 기존 재고 수량을 추가합니다.
 */
export const saveStock = async (params: {
  table: "inventory" | "urgent_inventory" | "set_inventory";
  data: any;
  userId: string;
}) => {
  const { table, data, userId } = params;

  // 1. 기존에 동일한 유통기한의 품목이 있는지 확인 (중복 방지)
  let query = supabase.from(table).select("*").match({
    product_name: data.product_name || data.set_name,
    expiry_date: data.expiry_date,
  });

  if (table === "inventory") {
    query = query.eq("location", data.location);
  } else if (table === "set_inventory") {
    query = query.eq("color_data", data.color_data);
  }

  const { data: exist } = await query.maybeSingle();

  // 2. 존재하면 수량 더하기(Update), 없으면 새로 만들기(Insert)
  if (exist) {
    await supabase.from(table).update({ quantity: exist.quantity + data.quantity }).eq("id", exist.id);
  } else {
    await supabase.from(table).insert([data]);
  }

  // 3. 창고 입고일 경우에만 히스토리 기록
  if (table === "inventory" && data.location === "WAREHOUSE") {
    await supabase.from("history").insert([{
      ts: Date.now(),
      kind: "IN",
      product_name: data.product_name,
      expiry_date: data.expiry_date,
      location: "WAREHOUSE",
      delta: data.quantity,
      user_id: userId
    }]);
  }
};

/**
 * [수정] 특정 항목의 수량을 직접 수정합니다.
 */
export const updateStockQty = async (table: string, id: string, qty: number) => {
  if (qty <= 0) {
    return await supabase.from(table).delete().eq("id", id);
  }
  return await supabase.from(table).update({ quantity: qty }).eq("id", id);
};

/**
 * [이동] 창고 재고를 홀로 이동시킵니다.
 */
export const moveStock = async (item: InventoryItem, moveQty: number, userId: string) => {
  const targetLoc = item.location === "FLOOR" ? "WAREHOUSE" : "FLOOR";

  // 1. 목적지(홀)에 동일 유통기한 품목 있는지 확인
  const { data: exist } = await supabase.from("inventory")
    .select("*")
    .match({ location: targetLoc, product_name: item.product_name, expiry_date: item.expiry_date })
    .maybeSingle();

  // 2. 목적지 수량 증가
  if (exist) {
    await supabase.from("inventory").update({ quantity: exist.quantity + moveQty }).eq("id", exist.id);
  } else {
    await supabase.from("inventory").insert([{
      product_name: item.product_name,
      quantity: moveQty,
      location: targetLoc,
      expiry_date: item.expiry_date
    }]);
  }

  // 3. 원본(창고) 수량 감소 또는 삭제
  if (moveQty >= item.quantity) {
    await supabase.from("inventory").delete().eq("id", item.id);
  } else {
    await supabase.from("inventory").update({ quantity: item.quantity - moveQty }).eq("id", item.id);
  }

  // 4. 창고에서 나가는 이동일 경우 히스토리 기록
  if (item.location === "WAREHOUSE") {
    await supabase.from("history").insert([{
      ts: Date.now(),
      kind: "MOVE",
      product_name: item.product_name,
      expiry_date: item.expiry_date,
      location: "WAREHOUSE",
      delta: -moveQty,
      user_id: userId
    }]);
  }
};

/**
 * [삭제] 특정 항목을 테이블에서 삭제합니다.
 */
export const deleteItem = async (table: string, id: string) => {
  return await supabase.from(table).delete().eq("id", id);
};

/**
 * [마감] 일마감 데이터를 저장합니다.
 */
export const saveClosingRecord = async (closingData: any) => {
  return await supabase.from("daily_closing").insert([closingData]);
};