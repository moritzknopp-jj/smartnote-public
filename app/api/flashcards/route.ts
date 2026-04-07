// ============================================================
// SMARTNOTE — Flashcard Generation API Route
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { runAIJSON } from '@/lib/ai/engine';
import { PROMPTS } from '@/lib/ai/prompts';
import { AIConfig } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, content, count, config } = body as {
      topic: string;
      content: string;
      count?: number;
      config: AIConfig;
    };

    if (!content || content.trim().length < 30) {
      return NextResponse.json(
        { error: 'Not enough content to generate flashcards.' },
        { status: 400 }
      );
    }

    const prompt = PROMPTS.generateFlashcards(topic || 'General', content, count || 10);
    const raw = await runAIJSON<Array<{ id: string; front: string; back: string; difficulty: string }>>(prompt, config);

    const flashcards = (Array.isArray(raw) ? raw : []).map((f) => ({
      ...f,
      difficulty: (['easy', 'medium', 'hard'].includes(f.difficulty) ? f.difficulty : 'medium') as 'easy' | 'medium' | 'hard',
      topicId: undefined,
      nextReview: undefined,
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
    }));

    return NextResponse.json({ flashcards });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Flashcard generation failed';
    console.error('Flashcard error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
