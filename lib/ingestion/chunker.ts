// ============================================================
// SMARTNOTE — Text Chunking Utility
// ============================================================

import { TextChunk } from '@/lib/types';
import { v4 as uuid } from 'uuid';

const AVG_CHARS_PER_TOKEN = 4;
const MIN_CHUNK_TOKENS = 300;
const MAX_CHUNK_TOKENS = 800;
const OVERLAP_TOKENS = 50;

export function chunkText(
  text: string,
  documentId: string,
  source: string
): TextChunk[] {
  const minChars = MIN_CHUNK_TOKENS * AVG_CHARS_PER_TOKEN;
  const maxChars = MAX_CHUNK_TOKENS * AVG_CHARS_PER_TOKEN;
  const overlapChars = OVERLAP_TOKENS * AVG_CHARS_PER_TOKEN;

  const cleanedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (cleanedText.length <= maxChars) {
    return [
      {
        id: uuid(),
        text: cleanedText,
        index: 0,
        metadata: { documentId, source },
      },
    ];
  }

  const chunks: TextChunk[] = [];
  let pos = 0;
  let index = 0;

  while (pos < cleanedText.length) {
    let end = pos + maxChars;

    if (end >= cleanedText.length) {
      end = cleanedText.length;
    } else {
      // Try to break at paragraph boundary
      const paragraphBreak = cleanedText.lastIndexOf('\n\n', end);
      if (paragraphBreak > pos + minChars) {
        end = paragraphBreak;
      } else {
        // Try sentence boundary
        const sentenceBreak = cleanedText.lastIndexOf('. ', end);
        if (sentenceBreak > pos + minChars) {
          end = sentenceBreak + 1;
        }
      }
    }

    chunks.push({
      id: uuid(),
      text: cleanedText.slice(pos, end).trim(),
      index,
      metadata: { documentId, source },
    });

    pos = end - overlapChars;
    if (pos < 0) pos = 0;
    if (end === cleanedText.length) break;
    index++;
  }

  return chunks;
}
