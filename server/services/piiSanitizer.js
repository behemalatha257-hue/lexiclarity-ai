/**
 * LexiGuard - Privacy & PII Sanitization Service
 * Client and Server compatible PII detection, redaction, and risk profiling
 */

class PiiSanitizer {
  static PATTERNS = {
    ssn: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g,
    creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b|\b\d{15,16}\b/g,
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g,
    phone: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    dob: /\b(?:DOB|Date of Birth|birth date)[\s:]+(?:\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|[A-Za-z]+\s+\d{1,2},\s*\d{4})\b/gi,
    ipAddress: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    usAddress: /\b\d+\s+[A-Za-z0-9\s,.'-]{4,40}\s+(?:Avenue|Ave|Street|St|Road|Rd|Boulevard|Blvd|Drive|Dr|Court|Ct|Lane|Ln|Way|Highway|Hwy|Suite|Ste|Apt|Unit)\b/gi,
    bankAccount: /\b(?:Account|Routing|IBAN)[\s#:]+([A-Z0-9-]{8,24})\b/gi,
    passport: /\b[A-Z]{1,2}[0-9]{7,9}\b/g
  };

  /**
   * Scans text and replaces PII with tagged replacement tokens.
   * Returns sanitized text, entity statistics, and token mapping.
   */
  static sanitize(text) {
    if (!text || typeof text !== 'string') {
      return {
        sanitizedText: '',
        piiDetectedCount: 0,
        detectedTypes: {},
        redactionMap: [],
        privacyScore: 100
      };
    }

    let sanitized = text;
    const detectedTypes = {};
    const redactionMap = [];
    let counter = 1;

    // 1. Sanitize standard regex patterns
    for (const [type, regex] of Object.entries(this.PATTERNS)) {
      sanitized = sanitized.replace(regex, (match) => {
        detectedTypes[type] = (detectedTypes[type] || 0) + 1;
        const placeholder = `[REDACTED_${type.toUpperCase()}_${counter++}]`;
        redactionMap.push({
          placeholder,
          type,
          originalLength: match.length,
          preview: match.length > 4 ? `${match.slice(0, 2)}***${match.slice(-2)}` : '***'
        });
        return placeholder;
      });
    }

    // 2. Named Entity heuristics for parties/individuals (e.g. "John Doe", "Jane Smith, Tenant")
    const partyPattern = /(?:Tenant|Landlord|Client|Contractor|Employee|Employer|Borrower|Lender|Consultant|Disclosing Party|Receiving Party)[\s:]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/g;
    sanitized = sanitized.replace(partyPattern, (match, name) => {
      detectedTypes.partyName = (detectedTypes.partyName || 0) + 1;
      const placeholder = `[REDACTED_NAME_${counter++}]`;
      redactionMap.push({
        placeholder,
        type: 'partyName',
        originalLength: name.length,
        preview: `${name[0]}***`
      });
      return match.replace(name, placeholder);
    });

    const totalDetected = Object.values(detectedTypes).reduce((a, b) => a + b, 0);

    // Calculate Privacy Risk: Higher count of raw sensitive data = higher raw privacy exposure
    // Privacy Score (100 = safe/sanitized, lower = high sensitive exposure)
    let rawExposure = 0;
    if (detectedTypes.ssn) rawExposure += detectedTypes.ssn * 30;
    if (detectedTypes.creditCard || detectedTypes.bankAccount) rawExposure += 25;
    if (detectedTypes.email || detectedTypes.phone) rawExposure += 10;
    if (detectedTypes.usAddress) rawExposure += 15;
    if (detectedTypes.partyName) rawExposure += 5;

    const privacyScore = Math.max(10, Math.min(100, 100 - rawExposure));

    return {
      sanitizedText: sanitized,
      piiDetectedCount: totalDetected,
      detectedTypes,
      redactionMap,
      privacyScore,
      isClean: totalDetected === 0
    };
  }

  /**
   * Replaces placeholders back with original values if user requests unmasking
   */
  static restore(sanitizedText, redactionMap, originalMap = {}) {
    let restored = sanitizedText;
    for (const item of redactionMap) {
      if (originalMap[item.placeholder]) {
        restored = restored.replace(item.placeholder, originalMap[item.placeholder]);
      }
    }
    return restored;
  }
}

module.exports = PiiSanitizer;
