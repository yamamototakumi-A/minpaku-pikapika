// Japanese timezone (JST) utility functions for the cleaning company system
// JST = UTC+9 hours

/**
 * Get current time in Japanese Standard Time (JST)
 * @returns {Date} Current JST time
 */
function nowJst() {
  return new Date(Date.now() + (9 * 60 * 60 * 1000));
}

/**
 * Get current time in UTC
 * @returns {Date} Current UTC time
 */
function nowUtc() {
  return new Date();
}

/**
 * Convert any date to JST (UTC+9)
 * @param {Date|string} date - Date to convert
 * @returns {Date} JST date object
 */
function toJst(date) {
  if (!date) return date;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Date(dateObj.getTime() + (9 * 60 * 60 * 1000));
}

/**
 * Convert any date to UTC
 * @param {Date|string} date - Date to convert
 * @returns {Date} UTC date object
 */
function toUtc(date) {
  if (!date) return date;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Date(dateObj.getTime() - (9 * 60 * 60 * 1000));
}

/**
 * Format date in Japanese format (YYYY年MM月DD日 HH:mm)
 * @param {Date} date - Date to format
 * @returns {string} Formatted Japanese date string
 */
function formatJapaneseDate(date) {
  if (!date) return '';
  const jstDate = toJst(date);
  const year = jstDate.getFullYear();
  const month = String(jstDate.getMonth() + 1).padStart(2, '0');
  const day = String(jstDate.getDate()).padStart(2, '0');
  const hours = String(jstDate.getHours()).padStart(2, '0');
  const minutes = String(jstDate.getMinutes()).padStart(2, '0');
  
  return `${year}年${month}月${day}日 ${hours}:${minutes}`;
}

/**
 * Format date in Japanese short format (MM月DD日)
 * @param {Date} date - Date to format
 * @returns {string} Formatted Japanese short date string
 */
function formatJapaneseShortDate(date) {
  if (!date) return '';
  const jstDate = toJst(date);
  const month = String(jstDate.getMonth() + 1).padStart(2, '0');
  const day = String(jstDate.getDate()).padStart(2, '0');
  
  return `${month}月${day}日`;
}

/**
 * Get Japanese day of week
 * @param {Date} date - Date to get day of week for
 * @returns {string} Japanese day of week
 */
function getJapaneseDayOfWeek(date) {
  if (!date) return '';
  const jstDate = toJst(date);
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[jstDate.getDay()];
}

/**
 * Check if a date is today in JST
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is today in JST
 */
function isTodayJst(date) {
  if (!date) return false;
  const jstDate = toJst(date);
  const today = nowJst();
  
  return jstDate.getFullYear() === today.getFullYear() &&
         jstDate.getMonth() === today.getMonth() &&
         jstDate.getDate() === today.getDate();
}

module.exports = {
  nowJst,
  nowUtc,
  toJst,
  toUtc,
  formatJapaneseDate,
  formatJapaneseShortDate,
  getJapaneseDayOfWeek,
  isTodayJst
};
