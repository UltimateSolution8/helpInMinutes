import { format, formatDistance, formatRelative, parseISO } from 'date-fns';

// Currency formatter
export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Date formatter
export const formatDate = (date, formatStr = 'MMM d, yyyy') => {
  if (!date) return '';
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, formatStr);
};

// Date time formatter
export const formatDateTime = (date, formatStr = 'MMM d, yyyy h:mm a') => {
  if (!date) return '';
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, formatStr);
};

// Relative time formatter (e.g., "2 hours ago")
export const formatRelativeTime = (date) => {
  if (!date) return '';
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return formatDistance(parsedDate, new Date(), { addSuffix: true });
};

// Relative date formatter (e.g., "Today", "Yesterday")
export const formatRelativeDate = (date) => {
  if (!date) return '';
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return formatRelative(parsedDate, new Date());
};

// Time formatter (e.g., "2:30 PM")
export const formatTime = (date, formatStr = 'h:mm a') => {
  if (!date) return '';
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, formatStr);
};

// Phone number formatter
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
};

// Rating formatter
export const formatRating = (rating, decimals = 1) => {
  if (!rating) return 'N/A';
  return parseFloat(rating).toFixed(decimals);
};

// Distance formatter (km)
export const formatDistance = (km) => {
  if (!km) return '0 km';
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
};

// Duration formatter (minutes)
export const formatDuration = (minutes) => {
  if (!minutes) return '0 min';
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${remainingMinutes} min`;
};

// Status formatter
export const formatStatus = (status) => {
  if (!status) return '';
  return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
};

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

// Capitalize first letter
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Format file size
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let size = bytes;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

// Format percentage
export const formatPercentage = (value, decimals = 0) => {
  if (!value && value !== 0) return '0%';
  return `${parseFloat(value).toFixed(decimals)}%`;
};

// Format task priority
export const formatPriority = (priority) => {
  const priorityMap = {
    LOW: { label: 'Low', color: '#4CAF50' },
    MEDIUM: { label: 'Medium', color: '#FFC107' },
    HIGH: { label: 'High', color: '#FF9800' },
    URGENT: { label: 'Urgent', color: '#F44336' },
  };
  return priorityMap[priority] || { label: priority, color: '#666' };
};

export default {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatRelativeDate,
  formatTime,
  formatPhoneNumber,
  formatRating,
  formatDistance,
  formatDuration,
  formatStatus,
  truncateText,
  capitalize,
  formatFileSize,
  formatPercentage,
  formatPriority,
};
