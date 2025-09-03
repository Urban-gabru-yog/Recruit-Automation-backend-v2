// utils/emailValidator.js
const validDomains = new Set([
  // Popular email providers
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com',
  'icloud.com', 'me.com', 'aol.com', 'protonmail.com', 'zoho.com',
  'yandex.com', 'mail.com', 'gmx.com', 'fastmail.com', 'tutanota.com',
  
  // Indian email providers
  'rediffmail.com', 'sify.com', 'in.com', 'yahoo.in', 'gmail.in',
  
  // Educational domains
  'edu', 'ac.in', 'edu.in', 'iisc.ac.in', 'iitb.ac.in', 'iitd.ac.in',
  'iitk.ac.in', 'iitm.ac.in', 'iitr.ac.in', 'bits-pilani.ac.in',
  
  // Corporate domains (add more as needed)
  'microsoft.com', 'google.com', 'amazon.com', 'apple.com', 'facebook.com',
  'linkedin.com', 'twitter.com', 'instagram.com', 'netflix.com', 'uber.com',
  'flipkart.com', 'paytm.com', 'ola.com', 'zomato.com', 'swiggy.com',
  'myntra.com', 'bigbasket.com', 'grofers.com', 'urbancompany.com',
  
  // Government domains
  'gov.in', 'nic.in', 'mil.in',
  
  // Other legitimate domains
  'co.in', 'org.in', 'net.in', 'info', 'biz', 'name', 'org', 'net', 'co'
]);

// Common typos that should be caught
const commonTypos = {
  'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'yahoo.con': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'yahoocom': 'yahoo.com',
  'outlook.con': 'outlook.com',
  'outlook.co': 'outlook.com',
  'hotmail.con': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'live.con': 'live.com',
  'live.co': 'live.com'
};

// Valid top-level domains
const validTLDs = new Set([
  'com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'co', 'info', 'biz', 'name',
  'in', 'uk', 'ca', 'au', 'de', 'fr', 'jp', 'cn', 'br', 'mx', 'ru', 'za'
]);

// ✅ Blocked placeholder/fake domains
const blockedDomains = new Set([
  'email.com', 'example.com', 'sample.com', 'mail.com', 'test.com',
  'example.org', 'sample.org', 'test.org', 'email.org',
  'example.net', 'sample.net', 'test.net', 'email.net',
  'example.in', 'sample.in', 'test.in', 'email.in',
  'demo.com', 'demo.org', 'demo.net', 'fake.com', 'fake.org',
  'placeholder.com', 'temporary.com', 'temp.com', 'dummy.com',
  'invalid.com', 'invalid.org', 'invalid.net', 'noemail.com'
]);

/**
 * Comprehensive email validation
 * @param {string} email - Email address to validate
 * @returns {object} - Validation result with isValid, error, and suggestion
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      error: 'Email is required',
      suggestion: null
    };
  }

  const trimmedEmail = email.toLowerCase().trim();

  // ✅ Strict email validation - prevents consecutive special characters
  const emailRegex = /^(?!.*[_.-]{2,})[a-zA-Z0-9]+([_.-]?[a-zA-Z0-9]+)*@[a-zA-Z0-9-]+(?:\.[a-zA-Z]{2,})+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address (e.g., you@example.com)',
      suggestion: null
    };
  }

  const [localPart, domain] = trimmedEmail.split('@');

  // ✅ Check for blocked placeholder/fake domains
  if (blockedDomains.has(domain)) {
    return {
      isValid: false,
      error: 'Please use your real email address, not a placeholder or example email',
      suggestion: 'Use a genuine email from Gmail, Yahoo, Outlook, or your company/school'
    };
  }

  // Check for common typos first
  if (commonTypos[domain]) {
    return {
      isValid: false,
      error: 'Invalid email domain',
      suggestion: `Did you mean ${localPart}@${commonTypos[domain]}?`
    };
  }

  // Extract TLD
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];

  // Check if TLD is valid
  if (!validTLDs.has(tld)) {
    return {
      isValid: false,
      error: 'Invalid email domain extension',
      suggestion: 'Please use a valid email domain like .com, .org, .net, .edu, .in, etc.'
    };
  }

  // Check if domain is in our whitelist or has valid structure
  const isKnownDomain = validDomains.has(domain);
  const hasValidStructure = domainParts.length >= 2 && domainParts.every(part => part.length > 0);

  // For unknown domains, apply stricter validation
  if (!isKnownDomain) {
    // Check if it's a subdomain of a known domain
    const isSubdomainOfKnown = domainParts.length > 2 && 
      validDomains.has(domainParts.slice(-2).join('.'));

    // Check if it looks like a corporate domain (at least 3 characters before TLD)
    const looksLikeCorporate = domainParts.length === 2 && 
      domainParts[0].length >= 3 && 
      validTLDs.has(tld);

    if (!isSubdomainOfKnown && !looksLikeCorporate) {
      return {
        isValid: false,
        error: 'Please use a valid email address from a recognized email provider',
        suggestion: 'Try using Gmail, Yahoo, Outlook, or your company/educational email'
      };
    }
  }

  // Additional security checks
  if (localPart.length < 1 || localPart.length > 64) {
    return {
      isValid: false,
      error: 'Invalid email format',
      suggestion: null
    };
  }

  // Check for suspicious patterns
  if (localPart.includes('..') || domain.includes('..')) {
    return {
      isValid: false,
      error: 'Invalid email format',
      suggestion: null
    };
  }

  return {
    isValid: true,
    error: null,
    suggestion: null
  };
}

module.exports = { validateEmail };
