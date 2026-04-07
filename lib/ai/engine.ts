// ============================================================
// SMARTNOTE — AI Abstraction Layer (Dual Mode: Gemini + Ollama)
// ============================================================

import { AIConfig, AIMode, AIResponse } from '@/lib/types';

const DEFAULT_OLLAMA_URL = 'http://localhost:11434';

// Complexity heuristic: count tokens roughly by words
function estimateComplexity(prompt: string): 'low' | 'medium' | 'high' {
  const words = prompt.split(/\s+/).length;
  if (words < 100) return 'low';
  if (words < 500) return 'medium';
  return 'high';
}

function decideRoute(complexity: 'low' | 'medium' | 'high'): AIMode {
  if (complexity === 'high') return 'cloud';
  return 'local';
}

// ----- Gemini Cloud -----
async function runGemini(
  prompt: string,
  config: AIConfig
): Promise<AIResponse> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  if (!config.geminiApiKey) throw new Error('Gemini API key not configured');

  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
    },
  });

  const response = result.response;
  const text = response.text();

  return {
    text,
    model: 'gemini-2.0-flash',
    tokensUsed: text.split(/\s+/).length,
  };
}

// ----- Ollama Local -----
async function runOllama(
  prompt: string,
  config: AIConfig
): Promise<AIResponse> {
  const baseUrl = config.ollamaBaseUrl || DEFAULT_OLLAMA_URL;
  const model = config.ollamaModel || 'qwen3:4b';

  // For qwen3 models, disable thinking to get faster responses
  const finalPrompt = model.startsWith('qwen3') ? `/no_think\n${prompt}` : prompt;

  const res = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt: finalPrompt,
      stream: false,
      options: {
        temperature: config.temperature,
        num_predict: config.maxTokens,
      },
    }),
    signal: AbortSignal.timeout(300000), // 5 min timeout for large prompts
  });

  if (!res.ok) {
    throw new Error(`Ollama error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();

  return {
    text: data.response,
    model,
    tokensUsed: data.eval_count,
  };
}

// ----- Check Ollama Availability -----
export async function checkOllamaStatus(
  baseUrl?: string
): Promise<{ available: boolean; models: string[] }> {
  try {
    const url = baseUrl || DEFAULT_OLLAMA_URL;
    const res = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { available: false, models: [] };
    const data = await res.json();
    const models = (data.models || []).map((m: { name: string }) => m.name);
    return { available: true, models };
  } catch {
    return { available: false, models: [] };
  }
}

// ----- Main AI Runner -----
export async function runAI(
  prompt: string,
  config: AIConfig
): Promise<AIResponse> {
  const mode = config.mode;

  if (mode === 'cloud') {
    try {
      return await runGemini(prompt, config);
    } catch (geminiErr) {
      // On rate limit or quota errors, fall back to Ollama if available
      const msg = geminiErr instanceof Error ? geminiErr.message : '';
      if (msg.includes('429') || msg.includes('quota') || msg.includes('rate') || msg.includes('Resource has been exhausted')) {
        console.warn('Gemini rate limited, falling back to Ollama...');
        try {
          return await runOllama(prompt, config);
        } catch {
          throw new Error('Gemini quota exceeded and Ollama is unavailable. Switch to Local mode in Settings, or wait a few minutes and try again.');
        }
      }
      throw geminiErr;
    }
  }

  if (mode === 'local') {
    return runOllama(prompt, config);
  }

  // Auto mode: try Ollama first (local), fall back to Gemini for high complexity
  const complexity = estimateComplexity(prompt);

  // Try Ollama first
  try {
    return await runOllama(prompt, config);
  } catch (ollamaErr) {
    // If Ollama fails and we have a Gemini key, try cloud
    if (config.geminiApiKey) {
      try {
        return await runGemini(prompt, config);
      } catch {
        // Both failed — throw original Ollama error as it's likely more relevant
        throw ollamaErr;
      }
    }
    throw ollamaErr;
  }
}

// ----- Structured AI Calls -----
export async function runAIJSON<T>(
  prompt: string,
  config: AIConfig
): Promise<T> {
  const wrappedPrompt = `${prompt}\n\nRespond ONLY with valid JSON. No markdown, no explanation, no code blocks. Just the JSON object.`;
  const response = await runAI(wrappedPrompt, config);

  // Extract JSON from response (handle code blocks)
  let jsonStr = response.text.trim();
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    // Try to find JSON in the response
    const start = jsonStr.indexOf('{');
    const end = jsonStr.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      return JSON.parse(jsonStr.slice(start, end + 1)) as T;
    }
    throw new Error('Failed to parse AI JSON response');
  }
}
