/**
 * LexiClarity - Multi-Format Document Parser
 * Parses plain text, Markdown, RTF, Word (.docx) via Mammoth, and PDF documents via PDF.js.
 */

class DocumentParser {
  /**
   * Main entry point to read and extract clean text from any uploaded file
   */
  static async parseFile(file) {
    if (!file) return '';

    const fileName = file.name.toLowerCase();

    // 1. PDF Documents (.pdf)
    if (fileName.endsWith('.pdf') || file.type === 'application/pdf') {
      return await this.extractPdfText(file);
    }

    // 2. Word Documents (.docx)
    if (fileName.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        return await this.extractDocxText(file);
      } catch (err) {
        console.warn('Docx extraction warning:', err);
        throw new Error('Could not parse Word document. Please ensure it is a standard .docx file or copy-paste the text.');
      }
    }

    // 3. Plain text, markdown, rtf, csv, json
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawContent = e.target.result;
        try {
          const cleaned = this.cleanRawText(rawContent);
          if (!cleaned || cleaned.length < 15) {
            reject(new Error('Document is empty or contains unreadable characters. Please copy and paste text directly.'));
          } else {
            resolve(cleaned);
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file from disk.'));
      reader.readAsText(file);
    });
  }

  /**
   * Extracts text from PDF using PDF.js
   */
  static async extractPdfText(file) {
    if (typeof window.pdfjsLib === 'undefined') {
      throw new Error('PDF reader engine is still initializing. Please wait 2 seconds or paste the contract text directly.');
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      const pageTexts = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageString = textContent.items
          .map(item => item.str)
          .join(' ')
          .replace(/\s{2,}/g, ' ');
        if (pageString.trim()) {
          pageTexts.push(`--- Page ${i} ---\n${pageString.trim()}`);
        }
      }

      const fullText = pageTexts.join('\n\n').trim();
      if (!fullText || fullText.length < 20) {
        throw new Error('PDF appears to be a scanned image or empty. Please copy and paste the contract text directly.');
      }

      return fullText;
    } catch (err) {
      console.warn('PDF extraction failed:', err);
      throw new Error(`PDF text extraction error: ${err.message || 'Please paste text directly.'}`);
    }
  }

  /**
   * Extracts text from .docx binary array buffer using mammoth
   */
  static async extractDocxText(file) {
    const arrayBuffer = await file.arrayBuffer();

    if (typeof window.mammoth !== 'undefined') {
      const result = await window.mammoth.extractRawText({ arrayBuffer });
      const extracted = (result.value || '').trim();
      if (extracted.length > 20) {
        return extracted;
      }
    }

    throw new Error('Word (.docx) extractor could not find readable paragraphs. Please paste the agreement text directly.');
  }

  /**
   * Strips binary headers, PK!... signatures, [Content_Types].xml metadata, and non-printable control chars
   */
  static cleanRawText(text) {
    if (!text || typeof text !== 'string') return '';

    // Check if raw binary PDF was read as text
    if (text.startsWith('%PDF-') || (text.includes('/Filter') && text.includes('/FlateDecode'))) {
      throw new Error('Binary PDF detected. Please upload using the file picker so the PDF text engine can parse it, or paste text directly.');
    }

    // Check if raw binary ZIP was read as text
    if (text.startsWith('PK\x03\x04') && text.includes('[Content_Types].xml')) {
      throw new Error('Raw archive detected. Please ensure you upload a readable .docx or paste contract text directly.');
    }

    let cleaned = text;

    // Remove null control characters
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');

    // Normalize line breaks & whitespace
    cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    return cleaned.trim();
  }
}

window.DocumentParser = DocumentParser;
