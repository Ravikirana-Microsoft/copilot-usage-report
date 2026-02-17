/**
 * Format a number with thousand separators
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

/**
 * Format a number as a percentage
 */
export const formatPercentage = (num: number, decimals: number = 1): string => {
  return `${num.toFixed(decimals)}%`;
};

/**
 * Format a large number with K/M/B suffixes
 */
export const formatCompactNumber = (num: number): string => {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
};

/**
 * Format a date string to locale date
 */
export const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

/**
 * Format a date string to locale date and time
 */
export const formatDateTime = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

/**
 * Format timestamp from filename format (2026-01-23_12-12-10) to readable
 */
export const formatTimestamp = (timestamp: string): string => {
  try {
    // Convert 2026-01-23_12-12-10 to 2026-01-23 12:12:10
    const [datePart, timePart] = timestamp.split('_');
    if (timePart) {
      const timeFormatted = timePart.replace(/-/g, ':');
      return `${datePart} ${timeFormatted}`;
    }
    return datePart;
  } catch {
    return timestamp;
  }
};

/**
 * Truncate string with ellipsis
 */
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)}...`;
};

/**
 * Truncate commit hash
 */
export const truncateHash = (hash: string, length: number = 7): string => {
  return hash.slice(0, length);
};

/**
 * Format file extension for display
 */
export const formatExtension = (ext: string): string => {
  if (!ext || ext === 'other') return 'Other';
  return ext.startsWith('.') ? ext : `.${ext}`;
};

/**
 * Format author name (remove email if present)
 */
export const formatAuthorName = (author: string): string => {
  // Remove email portion if present: "Name <email>" -> "Name"
  const match = author.match(/^([^<]+)/);
  return match ? match[1].trim() : author;
};

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export const getRelativeTime = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    
    return formatDate(dateStr);
  } catch {
    return dateStr;
  }
};
