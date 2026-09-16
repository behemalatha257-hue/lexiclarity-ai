/**
 * LexiClarity - Multi-Format Document Parser
 * Parses plain text, Markdown, RTF, and extracts clean text from Word (.docx) binary XML archives.
 */

class DocumentParser {
  /**
   * Main entry point to read and clean any uploaded file
   */
  static async parseFile(file) {
    if (!file) return '';

    const fileName = file.name.toLowerCase();

    // 1. If it's a Word document (.docx)
    if (fileName.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        return await this.extractDocxText(file);
      } catch (err) {
        console.warn('Docx extraction fallback:', err);
      }
    }

    // 2. Read as text with binary cleaning
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawContent = e.target.result;
        const cleaned = this.cleanRawText(rawContent);
        resolve(cleaned);
      };
      reader.onerror = () => resolve('');
      reader.readAsText(file);
    });
  }

  /**
   * Extracts text from .docx binary array buffer using mammoth or XML parsing
   */
  static async extractDocxText(file) {
    const arrayBuffer = await file.arrayBuffer();

    // If mammoth is available on window
    if (typeof window.mammoth !== 'undefined') {
      const result = await window.mammoth.extractRawText({ arrayBuffer });
      return result.value.trim();
    }

    // Client-side ZIP / XML extraction fallback
    return this.extractXmlFromZipBuffer(arrayBuffer);
  }

  /**
   * Parses raw ZIP buffer and extracts text inside word/document.xml <w:t> tags
   */
  static async extractXmlFromZipBuffer(buffer) {
    const uint8 = new Uint8Array(buffer);
    const textDecoder = new TextDecoder('utf-8', { fatal: false });
    const rawString = textDecoder.decode(uint8);

    // Check if it's a docx/zip archive
    if (rawString.includes('word/document.xml') || rawString.includes('<w:t')) {
      return this.extractWordXmlTags(rawString);
    }

    return this.cleanRawText(rawString);
  }

  /**
   * Extracts text from Word XML tags (<w:t>, <w:p>)
   */
  static extractWordXmlTags(xmlString) {
    // Extract all <w:t> or <w:t ...>content</w:t> text elements
    const matches = xmlString.match(/<w:t(?:\s+[^>]*)?>([\s\S]*?)<\/w:t>/gi);
    if (matches && matches.length > 0) {
      const textPieces = matches.map(tag => {
        return tag.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
      });

      // Join and clean into paragraphs
      let joined = textPieces.join(' ');
      joined = joined.replace(/\s{2,}/g, ' ').replace(/\n\s*\n/g, '\n\n').trim();
      if (joined.length > 20) {
        return joined;
      }
    }

    return this.cleanRawText(xmlString);
  }

  /**
   * Strips binary headers, PK!... signatures, [Content_Types].xml metadata, and non-printable control chars
   */
  static cleanRawText(text) {
    if (!text || typeof text !== 'string') return '';

    let cleaned = text;

    // 1. If binary docx was read as text, extract <w:t> or text runs
    if (cleaned.includes('[Content_Types].xml') || cleaned.startsWith('PK\x03\x04') || cleaned.includes('<w:document')) {
      const xmlExtracted = this.extractWordXmlTags(cleaned);
      if (xmlExtracted && xmlExtracted.length > 20) {
        return xmlExtracted;
      }
    }

    // 2. Remove PK header and binary nulls
    cleaned = cleaned.replace(/^PK[\s\S]*?\[Content_Types\]\.xml[\s\S]*?(?=[A-Z0-9]{3,})/i, '');
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');

    // 3. Normalize whitespace
    cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    return cleaned.trim();
  }
}

window.DocumentParser = DocumentParser;
