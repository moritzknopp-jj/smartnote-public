// ============================================================
// SMARTNOTE — File Ingestion Pipeline
// ============================================================

import { FileType } from '@/lib/types';

export function detectFileType(filename: string, mimeType?: string): FileType {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  if (ext === 'pdf' || mimeType === 'application/pdf') return 'pdf';
  if (ext === 'txt' || mimeType === 'text/plain') return 'txt';
  if (ext === 'zip' || mimeType === 'application/zip') return 'zip';
  if (ext === 'docx') return 'docx';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tiff'].includes(ext)) return 'image';

  if (mimeType?.startsWith('image/')) return 'image';
  if (mimeType?.startsWith('text/')) return 'txt';

  return 'unknown';
}

export function isUrl(input: string): boolean {
  try {
    const url = new URL(input.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isYoutubeUrl(input: string): boolean {
  return /(?:youtube\.com\/watch|youtu\.be\/|youtube\.com\/embed)/.test(input);
}

// Extract text from a PDF buffer (server-side only)
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(buffer);
  return data.text;
}

// Extract text from a plain text buffer
export function extractTextFromTXT(buffer: Buffer): string {
  return buffer.toString('utf-8');
}

// Extract text from a DOCX buffer
export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

// Extract text from an image using OCR (server-side only)
export async function extractTextFromImage(buffer: Buffer): Promise<string> {
  const Tesseract = await import('tesseract.js');
  const worker = await Tesseract.createWorker('eng');
  const { data } = await worker.recognize(buffer);
  await worker.terminate();
  return data.text;
}

// Extract files from a ZIP buffer
export async function extractFromZIP(
  buffer: Buffer
): Promise<{ name: string; buffer: Buffer }[]> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(buffer);
  const files: { name: string; buffer: Buffer }[] = [];

  for (const [name, entry] of Object.entries(zip.files)) {
    if (!entry.dir) {
      const content = await entry.async('nodebuffer');
      files.push({ name, buffer: content });
    }
  }

  return files;
}

// Scrape text from a URL
export async function extractTextFromURL(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SmartNote/1.0' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}`);

  const html = await res.text();
  const cheerio = await import('cheerio');
  const $ = cheerio.load(html);

  // Remove script/style/nav elements
  $('script, style, nav, header, footer, iframe, noscript').remove();

  // Extract text from main content areas
  const selectors = ['article', 'main', '.content', '#content', '.post', 'body'];
  for (const sel of selectors) {
    const el = $(sel);
    if (el.length && el.text().trim().length > 100) {
      return el.text().replace(/\s+/g, ' ').trim();
    }
  }

  return $('body').text().replace(/\s+/g, ' ').trim();
}

// Process any file buffer based on detected type
export async function processFile(
  buffer: Buffer,
  filename: string,
  mimeType?: string
): Promise<string> {
  const type = detectFileType(filename, mimeType);

  switch (type) {
    case 'pdf':
      return extractTextFromPDF(buffer);
    case 'txt':
      return extractTextFromTXT(buffer);
    case 'docx':
      return extractTextFromDOCX(buffer);
    case 'image':
      return extractTextFromImage(buffer);
    case 'zip': {
      const files = await extractFromZIP(buffer);
      const texts: string[] = [];
      for (const file of files) {
        try {
          const text = await processFile(file.buffer, file.name);
          if (text.trim()) texts.push(`--- ${file.name} ---\n${text}`);
        } catch {
          // Skip unprocessable files in zip
        }
      }
      return texts.join('\n\n');
    }
    default:
      // Try as text
      return extractTextFromTXT(buffer);
  }
}
