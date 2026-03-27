import { createClient } from "@supabase/supabase-js";
import { 
  InventoryItem, HistoryEvent, SetInventory, 
  UrgentInventory, UrgentLog, Notice, DailyClosing 
} from "@/app/types/inventory";

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
 * [저장] 재고 등록 및 공지사항 등록 (user_id 포함)
 */
export const saveStock = async (params: {
  table: string;
  data: any;
  userId: string;
}) => {
  const { table, data, userId } = params;

  // 공지사항(notices) 테이블인 경우 중복 체크 없이 바로 삽입
  if (table === "notices") {
    return await supabase.from(table).insert([{ ...data, user_id: userId }]);
  }

  // 기존 재고 중복 확인 (상품명 + 유통기한)
  let query = supabase.from(table).select("*").match({
    [data.product_name ? "product_name" : "set_name"]: data.product_name || data.set_name,
    expiry_date: data.expiry_date,
  });

  if (table === "inventory") {
    query = query.eq("location", data.location);
  } else if (table === "set_inventory") {
    query = query.eq("color_data", data.color_data);
  }

  const { data: exist } = await query.maybeSingle();

  if (exist) {
    // 존재하면 수량 합산
    await supabase.from(table).update({ quantity: exist.quantity + data.quantity }).eq("id", exist.id);
  } else {
    // 없으면 새로 추가
    await supabase.from(table).insert([data]);
  }

  // 창고 입고 시 히스토리 기록
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
 * [수정] 수량 변경 (0 이하면 삭제)
 */
export const updateStockQty = async (table: string, id: string, qty: number) => {
  if (qty <= 0) {
    return await supabase.from(table).delete().eq("id", id);
  }
  return await supabase.from(table).update({ quantity: qty }).eq("id", id);
};

/**
 * [이동] 재고 위치 이동 및 히스토리 기록
 */
export const moveStock = async (item: InventoryItem, moveQty: number, userId: string) => {
  const targetLoc = item.location === "FLOOR" ? "WAREHOUSE" : "FLOOR";

  const { data: exist } = await supabase.from("inventory")
    .select("*")
    .match({ location: targetLoc, product_name: item.product_name, expiry_date: item.expiry_date })
    .maybeSingle();

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

  if (moveQty >= item.quantity) {
    await supabase.from("inventory").delete().eq("id", item.id);
  } else {
    await supabase.from("inventory").update({ quantity: item.quantity - moveQty }).eq("id", item.id);
  }

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
 * [삭제] 레코드 삭제
 */
export const deleteItem = async (table: string, id: string) => {
  return await supabase.from(table).delete().eq("id", id);
};

/**
 * [마감] 마감 기록 저장
 */
export const saveClosingRecord = async (closingData: any) => {
  return await supabase.from("daily_closing").insert([closingData]);
};