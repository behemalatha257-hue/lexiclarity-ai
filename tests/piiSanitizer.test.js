const PiiSanitizer = require('../server/services/piiSanitizer');

describe('LexiGuard PII Sanitizer', () => {
  test('should redact Social Security Numbers, emails, phone numbers, and addresses', () => {
    const rawText = `Tenant John Doe, SSN: 123-45-6789, Phone: (555) 234-5678, Email: john.doe@example.com, residing at 742 Evergreen Terrace, Springfield, OR.`;
    const result = PiiSanitizer.sanitize(rawText);

    expect(result.piiDetectedCount).toBeGreaterThanOrEqual(3);
    expect(result.sanitizedText).not.toContain('123-45-6789');
    expect(result.sanitizedText).not.toContain('john.doe@example.com');
    expect(result.sanitizedText).not.toContain('(555) 234-5678');
    expect(result.sanitizedText).toContain('[REDACTED_SSN_');
    expect(result.isClean).toBe(false);
    expect(result.privacyScore).toBeLessThan(100);
  });

  test('should mark clean text with zero PII as 100% privacy score', () => {
    const cleanText = `This Agreement shall commence on October 1, 2024, and end on September 30, 2025. Mutual obligations apply.`;
    const result = PiiSanitizer.sanitize(cleanText);

    expect(result.piiDetectedCount).toBe(0);
    expect(result.isClean).toBe(true);
    expect(result.privacyScore).toBe(100);
    expect(result.sanitizedText).toBe(cleanText);
  });

  test('should handle empty or null input gracefully', () => {
    const resultNull = PiiSanitizer.sanitize(null);
    expect(resultNull.sanitizedText).toBe('');
    expect(resultNull.piiDetectedCount).toBe(0);

    const resultEmpty = PiiSanitizer.sanitize('');
    expect(resultEmpty.sanitizedText).toBe('');
  });
});
