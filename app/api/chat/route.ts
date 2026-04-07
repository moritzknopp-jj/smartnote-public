// ============================================================
// SMARTNOTE — Chat API Route
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { runAI } from '@/lib/ai/engine';
import { AIConfig } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, context, config } = body as {
      message: string;
      context?: string;
      config: AIConfig;
    };

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Validate AI config
    if (config.mode === 'cloud' && !config.geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is required for cloud mode. Go to Settings to configure it.' },
        { status: 400 }
      );
    }

    let prompt = message;
    if (context) {
      prompt = `You are an intelligent study assistant. Use the following document context to answer the question.

DOCUMENT CONTEXT:
"""
${context}
"""

USER QUESTION: ${message}

Provide a clear, helpful, and accurate response.`;
    }

    const response = await runAI(prompt, config);

    return NextResponse.json({
      response: response.text,
      model: response.model,
      tokensUsed: response.tokensUsed,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Chat request failed';
    console.error('Chat error:', message);

    // Provide user-friendly errors
    if (message.includes('Ollama')) {
      return NextResponse.json(
        { error: 'Cannot connect to Ollama. Make sure Ollama is running locally (ollama serve).' },
        { status: 503 }
      );
    }
    if (message.includes('API key')) {
      return NextResponse.json(
        { error: 'Invalid or missing API key. Check your settings.' },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
