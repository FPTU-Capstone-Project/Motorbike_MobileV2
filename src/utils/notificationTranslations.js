// Translation map for common English notification titles
export const titleTranslationMap = {
  'Tracking Started': 'Bắt đầu theo dõi',
  'tracking started': 'Bắt đầu theo dõi',
  'Ride Completed': 'Hoàn thành chuyến đi',
  'ride completed': 'Hoàn thành chuyến đi',
  'New shared ride request': 'Yêu cầu chuyến đi mới',
  'new shared ride request': 'Yêu cầu chuyến đi mới',
  'Passenger Pickup Started': 'Bắt đầu đón khách',
  'passenger pickup started': 'Bắt đầu đón khách',
  'Passenger Dropped Off': 'Đã trả khách',
  'passenger dropped off': 'Đã trả khách',
  "You've Been Paid": 'Bạn đã được thanh toán',
  "you've been paid": 'Bạn đã được thanh toán',
  'You\'ve Been Paid': 'Bạn đã được thanh toán',
  'Notification': 'Thông báo',
  'notification': 'Thông báo',
};

// Translation map for common English notification messages
export const messageTranslationMap = {
  'Tracking started - share your ride en route!': 'Đã bắt đầu theo dõi - chia sẻ chuyến đi của bạn trên đường!',
  'Your ride has been completed. Total earnings:': 'Chuyến đi của bạn đã hoàn thành. Tổng thu nhập:',
  'from': 'từ',
  'passenger(s)': 'hành khách',
  'passenger': 'hành khách',
  'You have successfully completed the ride for passenger': 'Bạn đã hoàn thành chuyến đi cho hành khách',
  'requested pickup at': 'yêu cầu đón tại',
  'You have started picking up passenger': 'Bạn đã bắt đầu đón hành khách',
  'Total earnings:': 'Tổng thu nhập:',
};

/**
 * Translate notification title from English to Vietnamese
 * @param {string} title - The notification title
 * @returns {string} Translated title
 */
export const translateTitle = (title) => {
  if (!title) return 'Thông báo';
  const trimmedTitle = title.trim();
  
  // Check exact match first
  if (titleTranslationMap[trimmedTitle]) {
    return titleTranslationMap[trimmedTitle];
  }
  
  // Check case-insensitive match
  const lowerTitle = trimmedTitle.toLowerCase();
  for (const [key, value] of Object.entries(titleTranslationMap)) {
    if (key.toLowerCase() === lowerTitle) {
      return value;
    }
  }
  
  // Handle partial matches and common patterns
  const lower = trimmedTitle.toLowerCase();
  
  if (lower.includes('passenger dropped off') || lower.includes('dropped off')) {
    return 'Đã trả khách';
  }
  if (lower.includes('been paid') || lower.includes('you\'ve been paid')) {
    return 'Bạn đã được thanh toán';
  }
  if (lower.includes('tracking started') || lower.includes('started tracking')) {
    return 'Bắt đầu theo dõi';
  }
  if (lower.includes('ride completed') || lower.includes('completed ride')) {
    return 'Hoàn thành chuyến đi';
  }
  if (lower.includes('pickup started') || lower.includes('started picking up')) {
    return 'Bắt đầu đón khách';
  }
  if (lower.includes('new ride request') || lower.includes('ride request')) {
    return 'Yêu cầu chuyến đi mới';
  }
  
  // Return original if no translation found
  return trimmedTitle;
};

/**
 * Translate notification message from English to Vietnamese
 * @param {string} message - The notification message
 * @returns {string} Translated message
 */
export const translateMessage = (message) => {
  if (!message) return null;
  
  let translatedMessage = message;
  
  // Handle specific patterns FIRST (before general replacements)
  
  // Helper function to format numbers consistently in Vietnamese format (9.000 VND style)
  // Ensures all amounts use the same format as the rest of the app
  const formatAmount = (amountStr) => {
    if (!amountStr && amountStr !== 0) return amountStr;
    
    // Convert to string first
    let str = amountStr.toString().trim();
    
    // Handle cases where amount might already have "VND" or other text
    // Extract just the number part
    const numberMatch = str.match(/[\d,]+(?:\.\d+)?/);
    if (!numberMatch) return amountStr;
    
    // Remove any existing formatting (commas, dots used as separators, spaces)
    // But preserve decimal point for parsing
    let cleanStr = numberMatch[0].replace(/[,]/g, ''); // Remove commas
    // Handle dots - if there are multiple dots, the last one is decimal, others are separators
    const parts = cleanStr.split('.');
    if (parts.length > 2) {
      // Multiple dots - all but last are separators
      cleanStr = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
    }
    
    const num = parseFloat(cleanStr);
    
    if (isNaN(num)) return amountStr;
    
    // Round to remove any decimals (VND doesn't use decimals)
    const roundedNum = Math.round(num);
    
    // Always use Vietnamese number format - same as rideService.formatCurrency
    // This ensures consistency: 9000 → "9.000", 9 → "9"
    return roundedNum.toLocaleString('vi-VN', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0,
      useGrouping: true 
    });
  };
  
  // "You received X VND for completing a ride."
  translatedMessage = translatedMessage.replace(
    /You received\s+([\d,.]+)\s*VND\s+for completing a ride\.?/gi,
    (match, amount) => `Bạn đã nhận được ${formatAmount(amount)} VND cho việc hoàn thành chuyến đi.`
  );
  
  // "You received X VND for completing a ride" (without period)
  translatedMessage = translatedMessage.replace(
    /You received\s+([\d,.]+)\s*VND\s+for completing a ride/gi,
    (match, amount) => `Bạn đã nhận được ${formatAmount(amount)} VND cho việc hoàn thành chuyến đi`
  );
  
  // "You have successfully completed the ride for hành khách [Name]" (mixed English/Vietnamese)
  // This must come before the passenger version to catch mixed cases first
  // Also handle "hành khách hành khách" double translation issue
  translatedMessage = translatedMessage.replace(
    /You have successfully completed the ride for\s+(?:hành khách\s+)?(.+?)(?:\.|$)/gi,
    (match, name) => {
      // Remove duplicate "hành khách" if it exists
      const cleanName = name.replace(/^hành khách\s+/i, '').trim();
      return `Bạn đã hoàn thành chuyến đi cho hành khách ${cleanName}`;
    }
  );
  
  // "You have successfully completed the ride for passenger [Name]"
  translatedMessage = translatedMessage.replace(
    /You have successfully completed the ride for passenger\s+(.+?)(?:\.|$)/gi,
    'Bạn đã hoàn thành chuyến đi cho hành khách $1'
  );
  
  // "You have started picking up hành khách [Name]" (mixed English/Vietnamese)
  // This must come before the passenger version to catch mixed cases first
  translatedMessage = translatedMessage.replace(
    /You have started picking up\s+(?:hành khách\s+)?(.+?)(?:\.|$)/gi,
    'Bạn đã bắt đầu đón hành khách $1'
  );
  
  // "You have started picking up passenger [Name]"
  translatedMessage = translatedMessage.replace(
    /You have started picking up passenger\s+(.+?)(?:\.|$)/gi,
    'Bạn đã bắt đầu đón hành khách $1'
  );
  
  // "Rider [Name] requested pickup at [Location]"
  translatedMessage = translatedMessage.replace(
    /Rider\s+(.+?)\s+requested pickup at\s+(.+)/gi,
    'Hành khách $1 yêu cầu đón tại $2'
  );
  
  // "Tracking started - share your ride en route!" (handle variations)
  translatedMessage = translatedMessage.replace(
    /Tracking started\s*[-–—]\s*share your ride en route!?/gi,
    'Đã bắt đầu theo dõi - chia sẻ chuyến đi của bạn trên đường!'
  );
  
  // "Total earnings: X VND from Y passenger(s)"
  translatedMessage = translatedMessage.replace(
    /Total earnings:\s*([\d,.]+)\s*VND\s*from\s*(\d+)\s*passenger\(s\)/gi,
    (match, amount, passengers) => `Tổng thu nhập: ${formatAmount(amount)} VND từ ${passengers} hành khách`
  );
  
  // "Your ride has been completed. Total earnings: X VND from Y passenger(s)." (MUST come first - most specific)
  translatedMessage = translatedMessage.replace(
    /Your ride has been completed\.\s*Total earnings:\s*([\d,.]+)\s*VND\s*from\s*(\d+)\s*passenger\(s\)\.?/gi,
    (match, amount, passengers) => `Chuyến đi của bạn đã hoàn thành. Tổng thu nhập: ${formatAmount(amount)} VND từ ${passengers} hành khách.`
  );
  
  // "Your ride has been completed. Tổng thu nhập: X VND từ Y hành khách." (mixed - already partially translated)
  // Also format the amount in this case - MUST come before the standalone pattern
  translatedMessage = translatedMessage.replace(
    /Your ride has been completed\.\s*Tổng thu nhập:\s*([\d,.]+)\s*VND\s*từ\s*(\d+)\s*hành khách\.?/gi,
    (match, amount, passengers) => `Chuyến đi của bạn đã hoàn thành. Tổng thu nhập: ${formatAmount(amount)} VND từ ${passengers} hành khách.`
  );
  
  // Fix amounts in ANY Vietnamese message with "Tổng thu nhập:" (catches all cases with excessive decimals)
  // This must come after the specific pattern above but before the standalone "Your ride has been completed"
  translatedMessage = translatedMessage.replace(
    /Tổng thu nhập:\s*([\d,.]+)\s*VND/gi,
    (match, amount) => `Tổng thu nhập: ${formatAmount(amount)} VND`
  );
  
  // "Your ride has been completed." (standalone - catch-all, must come last)
  translatedMessage = translatedMessage.replace(
    /Your ride has been completed\./gi,
    'Chuyến đi của bạn đã hoàn thành.'
  );
  
  // Fix duplicate "hành khách hành khách" issue
  translatedMessage = translatedMessage.replace(/hành khách\s+hành khách/gi, 'hành khách');
  
  // Replace common English phrases with Vietnamese (after specific patterns)
  for (const [english, vietnamese] of Object.entries(messageTranslationMap)) {
    // Case-insensitive replacement, but only if not already translated
    const regex = new RegExp(english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    translatedMessage = translatedMessage.replace(regex, vietnamese);
  }
  
  // Additional common phrases
  translatedMessage = translatedMessage.replace(/for completing a ride/gi, 'cho việc hoàn thành chuyến đi');
  translatedMessage = translatedMessage.replace(/completed a ride/gi, 'hoàn thành chuyến đi');
  translatedMessage = translatedMessage.replace(/share your ride/gi, 'chia sẻ chuyến đi của bạn');
  translatedMessage = translatedMessage.replace(/en route/gi, 'trên đường');
  
  // Final cleanup: replace standalone "passenger" that might have been missed
  // Only replace if it's not already part of "hành khách"
  translatedMessage = translatedMessage.replace(/\bpassenger\b/gi, (match, offset, string) => {
    // Check context to avoid double translation
    const context = string.substring(Math.max(0, offset - 10), Math.min(string.length, offset + match.length + 10));
    if (!context.includes('hành khách')) {
      return 'hành khách';
    }
    return match;
  });
  
  return translatedMessage;
};

