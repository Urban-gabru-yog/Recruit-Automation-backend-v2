// utils/phoneValidator.js - Backend phone normalization utility

/**
 * Normalize phone number by extracting just the digits
 * This helps detect duplicate numbers regardless of country code or formatting
 * @param {string} phone - Phone number to normalize
 * @returns {string} - Normalized phone number (digits only, without country code if Indian number)
 */
function normalizePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // If empty after cleaning, return empty
  if (!digitsOnly) {
    return '';
  }

  // Handle Indian phone numbers - extract the 10-digit mobile number
  // Indian mobile numbers are 10 digits and start with 6-9
  if (digitsOnly.length >= 10) {
    // Check for Indian country code patterns
    if (digitsOnly.startsWith('91') && digitsOnly.length === 12) {
      // +91XXXXXXXXXX format - extract last 10 digits
      const mobileNumber = digitsOnly.slice(2);
      if (mobileNumber.length === 10 && /^[6-9]/.test(mobileNumber)) {
        return mobileNumber;
      }
    } else if (digitsOnly.length === 10 && /^[6-9]/.test(digitsOnly)) {
      // Direct 10-digit Indian mobile number
      return digitsOnly;
    } else if (digitsOnly.length > 10) {
      // Try to extract last 10 digits if they form a valid Indian mobile number
      const last10 = digitsOnly.slice(-10);
      if (/^[6-9]/.test(last10)) {
        return last10;
      }
    }
  }

  // For non-Indian or unclear patterns, return the full digits
  // This ensures we still catch duplicates even for international numbers
  return digitsOnly;
}

/**
 * Basic phone number validation
 * @param {string} phone - Phone number to validate
 * @returns {object} - Validation result
 */
function validatePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') {
    return {
      isValid: false,
      error: 'Phone number is required',
      normalized: ''
    };
  }

  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length < 7) {
    return {
      isValid: false,
      error: 'Phone number too short',
      normalized: digitsOnly
    };
  }

  if (digitsOnly.length > 15) {
    return {
      isValid: false,
      error: 'Phone number too long',
      normalized: digitsOnly
    };
  }

  const normalized = normalizePhoneNumber(phone);
  
  return {
    isValid: true,
    error: null,
    normalized: normalized
  };
}

module.exports = { normalizePhoneNumber, validatePhoneNumber };
