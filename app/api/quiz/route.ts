// ============================================================
// SMARTNOTE — Quiz Generation API Route
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { runAIJSON } from '@/lib/ai/engine';
import { PROMPTS } from '@/lib/ai/prompts';
import { AIConfig, QuizQuestion } from '@/lib/types';

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
        { error: 'Not enough content to generate quiz.' },
        { status: 400 }
      );
    }

    const prompt = PROMPTS.generateQuiz(topic || 'General', content, count || 5);
    const questions = await runAIJSON<QuizQuestion[]>(prompt, config);

    return NextResponse.json({
      quiz: {
        id: Date.now().toString(36),
        title: `Quiz: ${topic || 'General'}`,
        createdAt: new Date().toISOString(),
        questions: Array.isArray(questions) ? questions : [],
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Quiz generation failed';
    console.error('Quiz error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
