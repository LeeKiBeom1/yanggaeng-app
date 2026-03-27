/**
 * 오늘 날짜를 "YYYY-MM-DD" 형식의 문자열로 반환합니다.
 */
export const getTodayStr = (): string => {
    return new Date().toISOString().split("T")[0];
  };
  
  /**
   * ISO 형식의 날짜 문자열(2023-10-25)을 "10/25" 형식으로 변환합니다.
   */
  export const fmtDate = (isoDate: string): string => {
    if (!isoDate) return "";
    return isoDate.slice(5).replace("-", "/");
  };
  
  /**
   * 유통기한까지 남은 일수를 계산합니다.
   * @param expiryDate "YYYY-MM-DD" 형식의 유통기한
   * @returns 남은 일수 (오늘 기준)
   */
  export const getDaysUntilExpiry = (expiryDate: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const target = new Date(expiryDate);
    target.setHours(0, 0, 0, 0);
    
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  /**
   * 재고가 '임박 재고(14일 이하)'인지 확인합니다.
   */
  export const isUrgent = (expiryDate: string): boolean => {
    const days = getDaysUntilExpiry(expiryDate);
    return days <= 14;
  };
  
  /**
   * 유통기한 상태에 따른 색상 코드를 반환합니다. (경고등 로직)
   * - 1일 이하: 빨간색
   * - 14일 이하: 주황색
   * - 그 외: 초록색
   */
  export const getExpiryStatusColor = (expiryDate: string): string => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days <= 1) return "bg-red-500 shadow-[0_0_5px_#ef4444]";
    if (days <= 14) return "bg-orange-500 shadow-[0_0_5px_#f97316]";
    return "bg-green-500 shadow-[0_0_5px_#22c55e]";
  };