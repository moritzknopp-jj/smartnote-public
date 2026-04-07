// ============================================================
// SMARTNOTE — Ollama Model Pull API Route (streaming progress)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { model, ollamaUrl } = await req.json();

    if (!model) {
      return NextResponse.json({ error: 'Model name is required' }, { status: 400 });
    }

    const baseUrl = ollamaUrl || 'http://localhost:11434';

    const res = await fetch(`${baseUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model, stream: true }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Ollama pull failed: ${text}` },
        { status: res.status }
      );
    }

    // Stream the progress lines back to the client as SSE-style newline-delimited JSON
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (line.trim()) {
                controller.enqueue(encoder.encode(line + '\n'));
              }
            }
          }
          if (buffer.trim()) {
            controller.enqueue(encoder.encode(buffer + '\n'));
          }
        } catch (err) {
          controller.enqueue(
            encoder.encode(JSON.stringify({ error: String(err) }) + '\n')
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Pull failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
