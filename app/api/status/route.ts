// ============================================================
// SMARTNOTE — AI Status Check API Route
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { checkOllamaStatus } from '@/lib/ai/engine';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const ollamaUrl = url.searchParams.get('ollamaUrl') || 'http://localhost:11434';
  const geminiKey = url.searchParams.get('hasGeminiKey') === 'true';

  const ollama = await checkOllamaStatus(ollamaUrl);

  return NextResponse.json({
    ollama: {
      available: ollama.available,
      models: ollama.models,
      url: ollamaUrl,
    },
    gemini: {
      configured: geminiKey,
    },
  });
}
