const http = require('http');

const BASE = 'http://localhost:3000';

function request(method, path, body, timeout = 120000) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: { 'Content-Type': 'application/json' },
      timeout,
    };
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    const req = http.request(opts, (res) => {
      let b = '';
      res.on('data', (c) => (b += c));
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    if (data) req.write(data);
    req.end();
  });
}

const aiConfig = {
  mode: 'local',
  ollamaBaseUrl: 'http://localhost:11434',
  ollamaModel: 'qwen3:4b',
  temperature: 0.7,
  maxTokens: 4096,
};

const sampleText =
  'The United States has three branches of government. ' +
  'The legislative branch is Congress, which makes laws. ' +
  'The executive branch is led by the President, who enforces laws. ' +
  'The judicial branch is the Supreme Court, which interprets laws. ' +
  'This system of checks and balances prevents any one branch from becoming too powerful. ' +
  'Congress consists of the Senate with 100 members and the House of Representatives with 435 members.';

async function run() {
  let pass = 0, fail = 0;
  const t0 = Date.now();

  function log(ok, label, detail) {
    if (ok) { pass++; console.log(`  PASS  ${label} ${detail || ''}`); }
    else { fail++; console.log(`  FAIL  ${label} ${detail || ''}`); }
  }

  console.log('=== SMARTNOTE STRESS TEST ===\n');

  // ---- PAGE TESTS ----
  console.log('--- Pages ---');
  const pages = ['/', '/upload', '/chat', '/mindmap', '/notes', '/quiz', '/flashcards', '/settings'];
  for (const p of pages) {
    try {
      const r = await request('GET', p, null, 30000);
      log(r.status === 200, p, `=> ${r.status} (${r.body.length} bytes)`);
    } catch (e) {
      log(false, p, e.message);
    }
  }

  // ---- API TESTS ----
  console.log('\n--- API Endpoints ---');

  // /api/status
  try {
    const r = await request('GET', '/api/status');
    const d = JSON.parse(r.body);
    log(r.status === 200 && d.ollama, '/api/status',
      `Ollama: ${d.ollama.available}, Models: ${(d.ollama.models || []).join(', ')}`);
  } catch (e) { log(false, '/api/status', e.message); }

  // /api/upload (text)
  try {
    const r = await request('POST', '/api/upload', { text: sampleText });
    log(r.status === 200, '/api/upload (text)', `=> ${r.status} ${r.body.substring(0, 80)}`);
  } catch (e) { log(false, '/api/upload (text)', e.message); }

  // /api/projects GET
  try {
    const r = await request('GET', '/api/projects');
    log(r.status === 200, '/api/projects GET', `=> ${r.status}`);
  } catch (e) { log(false, '/api/projects GET', e.message); }

  // ---- AI-POWERED API TESTS ----
  console.log('\n--- AI-Powered Endpoints (may take a while) ---');

  // /api/chat
  try {
    console.log('  ...testing /api/chat');
    const r = await request('POST', '/api/chat', {
      message: 'What are the three branches of government?',
      context: sampleText,
      config: aiConfig,
    }, 180000);
    const d = r.status === 200 ? JSON.parse(r.body) : {};
    log(r.status === 200 && d.response, '/api/chat',
      `=> ${r.status} response: "${(d.response || '').substring(0, 80)}..."`);
  } catch (e) { log(false, '/api/chat', e.message); }

  // /api/analyze
  try {
    console.log('  ...testing /api/analyze');
    const r = await request('POST', '/api/analyze', {
      text: sampleText,
      config: aiConfig,
    }, 180000);
    const d = r.status === 200 ? JSON.parse(r.body) : {};
    log(r.status === 200 && d.tree, '/api/analyze',
      `=> ${r.status} topics: ${d.tree ? (d.tree.topics || []).length : 'N/A'}`);
  } catch (e) { log(false, '/api/analyze', e.message); }

  // /api/quiz
  try {
    console.log('  ...testing /api/quiz');
    const r = await request('POST', '/api/quiz', {
      text: sampleText,
      config: aiConfig,
    }, 180000);
    const d = r.status === 200 ? JSON.parse(r.body) : {};
    log(r.status === 200 && d.quiz, '/api/quiz',
      `=> ${r.status} questions: ${d.quiz ? (d.quiz.questions || []).length : 'N/A'}`);
  } catch (e) { log(false, '/api/quiz', e.message); }

  // /api/flashcards
  try {
    console.log('  ...testing /api/flashcards');
    const r = await request('POST', '/api/flashcards', {
      text: sampleText,
      config: aiConfig,
    }, 180000);
    const d = r.status === 200 ? JSON.parse(r.body) : {};
    log(r.status === 200 && d.flashcards, '/api/flashcards',
      `=> ${r.status} cards: ${d.flashcards ? d.flashcards.length : 'N/A'}`);
  } catch (e) { log(false, '/api/flashcards', e.message); }

  // ---- ERROR HANDLING TESTS ----
  console.log('\n--- Error Handling ---');

  // Analyze with too-short text
  try {
    const r = await request('POST', '/api/analyze', { text: 'short', config: aiConfig });
    log(r.status === 400, '/api/analyze (short text)', `=> ${r.status}`);
  } catch (e) { log(false, '/api/analyze (short text)', e.message); }

  // Chat without message
  try {
    const r = await request('POST', '/api/chat', { config: aiConfig });
    log(r.status === 400, '/api/chat (no message)', `=> ${r.status}`);
  } catch (e) { log(false, '/api/chat (no message)', e.message); }

  // 404 page
  try {
    const r = await request('GET', '/nonexistent-page');
    log(r.status === 404, '/nonexistent-page', `=> ${r.status}`);
  } catch (e) { log(false, '/nonexistent-page', e.message); }

  // ---- SUMMARY ----
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n=== RESULTS: ${pass} passed, ${fail} failed (${elapsed}s) ===`);
  process.exit(fail > 0 ? 1 : 0);
}

run().catch((e) => { console.error('Fatal:', e); process.exit(1); });
