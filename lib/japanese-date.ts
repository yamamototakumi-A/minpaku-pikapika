// Japanese date and timezone utilities for the frontend

/**
 * Convert UTC timestamp to JST (UTC+9)
 * @param date - Date to convert
 * @returns JST date object
 */
export function utcToJst(date: Date | string | null): Date | null {
  if (!date) return null;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Date(dateObj.getTime() + (9 * 60 * 60 * 1000));
}

/**
 * Format date in Japanese format (YYYY年MM月DD日 HH:mm)
 * @param date - Date to format
 * @returns Formatted Japanese date string
 */
export function formatJapaneseDate(date: Date | string | null): string {
  if (!date) return '';
  const jstDate = utcToJst(date);
  if (!jstDate) return '';
  
  const year = jstDate.getFullYear();
  const month = String(jstDate.getMonth() + 1).padStart(2, '0');
  const day = String(jstDate.getDate()).padStart(2, '0');
  const hours = String(jstDate.getHours()).padStart(2, '0');
  const minutes = String(jstDate.getMinutes()).padStart(2, '0');
  
  return `${year}年${month}月${day}日 ${hours}:${minutes}`;
}

/**
 * Format date in Japanese short format (MM月DD日)
 * @param date - Date to format
 * @returns Formatted Japanese short date string
 */
export function formatJapaneseShortDate(date: Date | string | null): string {
  if (!date) return '';
  const jstDate = utcToJst(date);
  if (!jstDate) return '';
  
  const month = String(jstDate.getMonth() + 1).padStart(2, '0');
  const day = String(jstDate.getDate()).padStart(2, '0');
  
  return `${month}月${day}日`;
}

/**
 * Get Japanese day of week
 * @param date - Date to get day of week for
 * @returns Japanese day of week
 */
export function getJapaneseDayOfWeek(date: Date | string | null): string {
  if (!date) return '';
  const jstDate = utcToJst(date);
  if (!jstDate) return '';
  
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[jstDate.getDay()];
}

/**
 * Check if a date is today in JST
 * @param date - Date to check
 * @returns True if date is today in JST
 */
export function isTodayJst(date: Date | string | null): boolean {
  if (!date) return false;
  const jstDate = utcToJst(date);
  if (!jstDate) return false;
  
  const today = new Date(Date.now() + (9 * 60 * 60 * 1000));
  
  return jstDate.getFullYear() === today.getFullYear() &&
         jstDate.getMonth() === today.getMonth() &&
         jstDate.getDate() === today.getDate();
}

/**
 * Get relative time in Japanese (e.g., "3時間前", "昨日", "先週")
 * @param date - Date to get relative time for
 * @returns Japanese relative time string
 */
export function getRelativeTimeJapanese(date: Date | string | null): string {
  if (!date) return '';
  const jstDate = utcToJst(date);
  if (!jstDate) return '';
  
  const now = new Date(Date.now() + (9 * 60 * 60 * 1000));
  const diffMs = now.getTime() - jstDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) return '今';
  if (diffMinutes < 60) return `${diffMinutes}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays === 1) return '昨日';
  if (diffDays === 2) return '一昨日';
  if (diffDays < 7) return `${diffDays}日前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}ヶ月前`;
  return `${Math.floor(diffDays / 365)}年前`;
}

/**
 * Format time in Japanese format (HH:mm)
 * @param date - Date to format
 * @returns Formatted Japanese time string
 */
export function formatJapaneseTime(date: Date | string | null): string {
  if (!date) return '';
  const jstDate = utcToJst(date);
  if (!jstDate) return '';
  
  const hours = String(jstDate.getHours()).padStart(2, '0');
  const minutes = String(jstDate.getMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
}
