// ============================================================
// SMARTNOTE — Upload API Route
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { processFile } from '@/lib/ingestion/processor';
import { chunkText } from '@/lib/ingestion/chunker';
import { v4 as uuid } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const urlInput = formData.get('url') as string | null;

    let text = '';
    let filename = 'unknown';

    if (file) {
      filename = file.name;
      const buffer = Buffer.from(await file.arrayBuffer());
      text = await processFile(buffer, filename, file.type);
    } else if (urlInput) {
      filename = urlInput;
      const { extractTextFromURL } = await import('@/lib/ingestion/processor');
      text = await extractTextFromURL(urlInput);
    } else {
      return NextResponse.json({ error: 'No file or URL provided' }, { status: 400 });
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not extract any text from the file' },
        { status: 422 }
      );
    }

    const documentId = uuid();
    const chunks = chunkText(text, documentId, filename);

    return NextResponse.json({
      documentId,
      filename,
      text,
      chunkCount: chunks.length,
      preview: text.slice(0, 500),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    console.error('Upload error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
