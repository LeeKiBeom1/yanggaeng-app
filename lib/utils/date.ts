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
   * 유통기한 상태에 따른 색상 코드를 반환합니다.
   */
  export const getExpiryStatusColor = (expiryDate: string): string => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days <= 1) return "bg-red-500 shadow-[0_0_5px_#ef4444]";
    if (days <= 14) return "bg-orange-500 shadow-[0_0_5px_#f97316]";
    return "bg-green-500 shadow-[0_0_5px_#22c55e]";
  };
  
  /**
   * 달력 생성을 위한 특정 월의 날짜 배열을 반환합니다.
   */
  export const getCalendarDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // 이전 달의 빈 칸
    for (let i = 0; i < firstDay; i++) days.push(null);
    // 현재 달의 날짜
    for (let i = 1; i <= lastDate; i++) days.push(i);
    
    return days;
  };