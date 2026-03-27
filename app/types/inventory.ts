// 재고 아이템의 기본 구조
export interface InventoryItem {
    id: string;
    product_name: string;   // 상품명 (예: 팥 양갱)
    quantity: number;       // 수량
    location: "FLOOR" | "WAREHOUSE"; // 위치 (홀 또는 창고)
    expiry_date: string;    // 유통기한
    created_at?: string;
  }
  
  // 입출고 기록(히스토리) 구조
  export interface HistoryEvent {
    id: string;
    ts: number;             // 타임스탬프
    kind: "IN" | "OUT" | "MOVE"; // 종류 (입고, 출고, 이동)
    product_name: string;
    expiry_date: string;
    location: string;
    delta: number;          // 변동 수량 (+ 또는 -)
    user_id: string;        // 작업자 아이디
  }
  
  // 세트 재고 구조
  export interface SetInventory {
    id: string;
    set_name: string;       // 세트 이름 (예: 4구 클래식)
    quantity: number;
    expiry_date: string;
    color_data?: "Red" | "Navy" | "Pink"; // 세트 구분 색상
  }
  
  // 임박 재고 구조
  export interface UrgentInventory {
    id: string;
    product_name: string;
    quantity: number;
    expiry_date: string;
  }
  
  // 임박 재고 사용/폐기 내역 구조
  export interface UrgentLog {
    id: string;
    product_name: string;
    quantity: number;
    expiry_date: string;
    created_at: string;
  }
  
  // 일마감 기록 구조
  export interface DailyClosing {
    id: string;
    closing_date: string;   // 마감 날짜 (YYYY-MM-DD)
    user_id: string;        // 마감 담당자
    stock_snapshot: {       // 마감 시점의 재고 현황 스냅샷
      product_name: string;
      floor: number;
      warehouse: number;
    }[];
  }
  
  // 공지사항 구조
  export interface Notice {
    id: string;
    title: string;
    content: string;
    created_at: string;
  }