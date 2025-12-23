/**
 * Date utility functions for Vietnam timezone (UTC+7)
 * Backend API returns dates in Vietnam/Ho Chi Minh timezone
 */

const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';
const VIETNAM_OFFSET = 7 * 60; // UTC+7 in minutes

/**
 * Parse a date string from backend API
 * Backend sends dates in Vietnam timezone (UTC+7)
 * @param {string|Date} dateValue - Date string or Date object from backend
 * @returns {Date|null} Parsed date object
 */
export const parseBackendDate = (dateValue) => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;

  try {
    let dateString = typeof dateValue === 'string' ? dateValue.trim() : String(dateValue);
    
    // If date string ends with 'Z', backend sends Vietnam timezone marked as UTC
    // Example: Backend sends "2025-12-23T03:25:00Z" meaning 3:25 AM Vietnam time
    // JavaScript parses "Z" as UTC, so it becomes 3:25 AM UTC = 10:25 AM Vietnam time (wrong!)
    // To fix: We need to create a Date object that represents 3:25 AM Vietnam time
    // Strategy: Remove 'Z', treat the time as Vietnam time, and create Date accordingly
    // We'll use the timezone-aware parsing by appending +07:00
    if (dateString.endsWith('Z')) {
      // Remove 'Z' and append Vietnam timezone offset
      const vnTimeString = dateString.slice(0, -1) + '+07:00';
      const date = new Date(vnTimeString);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // If date string has timezone offset (e.g., +07:00), parse normally
    if (dateString.includes('+') || (dateString.includes('-') && dateString.match(/\d{2}:\d{2}$/))) {
      return new Date(dateString);
    }
    
    // If date string is ISO format without timezone, assume Vietnam timezone
    // Format: "2025-12-23T10:00:00" means 10:00 Vietnam time
    if (dateString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      // Append Vietnam timezone offset
      const date = new Date(dateString + '+07:00');
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Try parsing as-is
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.warn('parseBackendDate error:', error, dateValue);
    return null;
  }
};

/**
 * Format date to Vietnam locale string
 * @param {string|Date} dateValue - Date from backend
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateValue, options = {}) => {
  const date = parseBackendDate(dateValue);
  if (!date) return '';

  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options,
  };

  // parseBackendDate already adjusted the time, so we format as-is
  return date.toLocaleDateString('vi-VN', defaultOptions);
};

/**
 * Format time to Vietnam locale string
 * @param {string|Date} dateValue - Date from backend
 * @param {Object} options - Formatting options
 * @returns {string} Formatted time string
 */
export const formatTime = (dateValue, options = {}) => {
  const date = parseBackendDate(dateValue);
  if (!date) return '';

  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options,
  };

  // parseBackendDate already adjusted the time, so we format as-is
  // The Date object represents the correct Vietnam time
  return date.toLocaleTimeString('vi-VN', defaultOptions);
};

/**
 * Format date and time to Vietnam locale string
 * @param {string|Date} dateValue - Date from backend
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date-time string
 */
export const formatDateTime = (dateValue, options = {}) => {
  const date = parseBackendDate(dateValue);
  if (!date) return '';

  const dateOptions = options.dateOptions || {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };

  const timeOptions = options.timeOptions || {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };

  // parseBackendDate already adjusted the time, so we format as-is
  const dateStr = date.toLocaleDateString('vi-VN', dateOptions);
  const timeStr = date.toLocaleTimeString('vi-VN', timeOptions);

  return options.separator ? `${dateStr}${options.separator}${timeStr}` : `${dateStr} ${timeStr}`;
};

/**
 * Format date-time in compact format (HH:mm DD/MM/YYYY)
 * @param {string|Date} dateValue - Date from backend
 * @returns {string} Formatted string
 */
export const formatDateTimeCompact = (dateValue) => {
  const date = parseBackendDate(dateValue);
  if (!date) return '';

  // parseBackendDate already adjusted the time, so we format as-is
  const time = date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const dateStr = date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return `${time} ${dateStr}`;
};

/**
 * Format date-time for list display (relative or absolute)
 * @param {string|Date} dateValue - Date from backend
 * @returns {string} Formatted string
 */
export const formatDateTimeForList = (dateValue) => {
  const date = parseBackendDate(dateValue);
  if (!date) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Relative time for recent dates
  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;

  // Absolute time for older dates
  return formatDateTimeCompact(date);
};

/**
 * Format time ago (relative time)
 * @param {string|Date} dateValue - Date from backend
 * @returns {string} Formatted string
 */
export const formatTimeAgo = (dateValue) => {
  const date = parseBackendDate(dateValue);
  if (!date) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  if (diffWeeks < 4) return `${diffWeeks} tuần trước`;
  if (diffMonths < 12) return `${diffMonths} tháng trước`;

  return formatDate(date);
};

/**
 * Get current date in Vietnam timezone
 * @returns {Date} Current date adjusted for Vietnam timezone
 */
export const getCurrentVietnamDate = () => {
  const now = new Date();
  // Get UTC time
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  // Convert to Vietnam time (UTC+7)
  return new Date(utc + (VIETNAM_OFFSET * 60000));
};

/**
 * Format date for backend API (send in Vietnam timezone)
 * @param {Date} date - Date object
 * @returns {string} ISO string in Vietnam timezone format
 */
export const formatDateForBackend = (date) => {
  if (!date) return null;
  
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return null;

  // Format as ISO string but ensure it represents Vietnam time
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  // Return in format: YYYY-MM-DDTHH:mm:ss (without Z, backend will interpret as Vietnam time)
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

export default {
  parseBackendDate,
  formatDate,
  formatTime,
  formatDateTime,
  formatDateTimeCompact,
  formatDateTimeForList,
  formatTimeAgo,
  getCurrentVietnamDate,
  formatDateForBackend,
};

