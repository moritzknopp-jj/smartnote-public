// ============================================================
// SMARTNOTE — Analyze API Route (Knowledge Tree generation)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { runAIJSON } from '@/lib/ai/engine';
import { PROMPTS } from '@/lib/ai/prompts';
import { AIConfig, KnowledgeTree } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, config } = body as { text: string; config: AIConfig };

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: 'Not enough text to analyze. Upload a longer document.' },
        { status: 400 }
      );
    }

    if (config.mode === 'cloud' && !config.geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key required for cloud mode.' },
        { status: 400 }
      );
    }

    const prompt = PROMPTS.analyzeContent(text);
    const tree = await runAIJSON<KnowledgeTree>(prompt, config);

    return NextResponse.json({ tree });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    console.error('Analyze error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
