const NVAPI_KEY = process.env.NVAPI_KEY || '';
const AI_CHAT_MODEL = process.env.AI_CHAT_MODEL || 'meta/llama-3.1-8b-instruct';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const OPENCODE_API_KEY = process.env.OPENCODE_API_KEY || '';
const OPENCODE_MODEL = process.env.OPENCODE_MODEL || 'deepseek-v4-flash-free';

const fallbackResponses = [
  "Hey! I'm here. What's on your mind?",
  "Tell me more about that — I'm listening.",
  "That's interesting! How does that make you feel?",
  "I get what you mean. Been there too.",
  "Oh really? That's wild. Tell me more.",
  "Haha, I feel that. What happened next?",
  "Honestly? Same. You're not alone on that one.",
  "I hear you. That's a lot to deal with.",
  "No way! That's actually pretty cool.",
  "I feel you. Want to talk it out?",
];

const safeSpaceFallback = [
  "I'm here with you, and you are completely safe. Take a slow breath.",
  "You are worthy of love, care, and understanding — exactly as you are right now.",
  "Thank you for trusting me with this. It takes so much courage to be vulnerable.",
  "Your feelings are valid. Every single one.",
  "You are not alone in this. I'm right here beside you.",
  "Breathe with me. In… and out. You've survived every difficult day so far.",
  "It's okay to not be okay. There's no pressure to feel better right now.",
  "You matter. Not because of what you do, but because of who you are.",
  "Let's take this one moment at a time.",
  "I'm proud of you for reaching out. That is one of the bravest things.",
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function callNvidia(systemPrompt, messages, { maxTokens = 2048, temperature = 0.7, enableThinking = false, reasoningEffort = 'high' } = {}) {
  if (!NVAPI_KEY) return null;
  try {
    const body = {
      model: AI_CHAT_MODEL,
      messages: [systemPrompt, ...messages],
      max_tokens: enableThinking ? 16384 : maxTokens,
      temperature,
      top_p: 0.95,
    };
    if (enableThinking) {
      body.extra_body = { chat_template_kwargs: { thinking: true, reasoning_effort: reasoningEffort } };
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), enableThinking ? 180000 : 60000);
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${NVAPI_KEY}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) { const e = await res.text(); console.error('Nvidia error:', res.status, e); return null; }
    const data = await res.json();
    const msg = data.choices?.[0]?.message;
    const reasoning = msg?.reasoning || msg?.reasoning_content || null;
    const content = msg?.content?.trim();
    if (reasoning) console.log('Nvidia reasoning:', reasoning.slice(0, 200));
    return content || null;
  } catch (err) {
    return null;
  }
}

async function callGemini(systemPrompt, messages) {
  if (!GEMINI_API_KEY) return null;
  try {
    const contents = [];
    for (const msg of [systemPrompt, ...messages]) {
      contents.push({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] });
    }
    const body = { contents };
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) }
    );
    if (!res.ok) { const e = await res.text(); console.error('Gemini error:', res.status, e); return null; }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch (err) {
    return null;
  }
}

async function callOpenCode(systemPrompt, messages) {
  if (!OPENCODE_API_KEY) return null;
  try {
    const body = {
      model: OPENCODE_MODEL,
      messages: [systemPrompt, ...messages],
      max_tokens: 4096,
      temperature: 0.7,
    };
    const res = await fetch('https://opencode.ai/zen/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENCODE_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000),
    });
    if (!res.ok) { const e = await res.text(); console.error('OpenCode error:', res.status, e); return null; }
    const data = await res.json();
    const msg = data.choices?.[0]?.message;
    const content = msg?.content?.trim();
    if (content) return content;
    const reasoning = msg?.reasoning_content || msg?.reasoning || null;
    if (reasoning) console.log('OpenCode reasoning-only response:', reasoning.slice(0, 100));
    return reasoning || null;
  } catch (err) {
    return null;
  }
}

async function getAIResponse(messages, { enableThinking = false, preferredProvider = null } = {}) {
  const systemPrompt = {
    role: 'system',
    content: `Talk like a real human friend — casual, warm, and real. Use contractions, slang sometimes, and a bit of humor. Keep replies 1-3 sentences. Ask questions back. Be genuine, not polished. Never sound like a therapist or a robot.`,
  };

  const providersToTry = [];
  if (preferredProvider) {
    providersToTry.push(preferredProvider);
  }
  // Default search order: nvapi (working primary), opencode, gemini
  ['nvapi', 'opencode', 'gemini'].forEach(p => {
    if (!providersToTry.includes(p)) {
      providersToTry.push(p);
    }
  });

  for (const provider of providersToTry) {
    try {
      let text = null;
      if (provider === 'nvapi') {
        text = await callNvidia(systemPrompt, messages, { enableThinking });
      } else if (provider === 'gemini') {
        text = await callGemini(systemPrompt, messages);
      } else if (provider === 'opencode') {
        text = await callOpenCode(systemPrompt, messages);
      }

      if (text) {
        console.log(`[AI Response] Resolved using provider: ${provider} (${text.length} chars)`);
        return { text, provider };
      }
    } catch (err) {
      console.error(`Provider ${provider} failed:`, err.message);
    }
  }

  // Fallback to random hardcoded response if everything failed
  console.log('[AI Response] All providers failed. Using fallback.');
  return { text: pickRandom(fallbackResponses), provider: 'fallback' };
}

async function callAIWithProvider(_, messages, options = {}) {
  return getAIResponse(messages, options);
}

async function getNvidiaCompletion(messages, options = {}) {
  const { systemPrompt, maxTokens = 2048, temperature = 0.5, enableThinking = false } = options;
  const sp = systemPrompt || { role: 'system', content: 'You are a helpful assistant.' };
  return callNvidia(sp, messages, { maxTokens, temperature, enableThinking });
}

async function getSafeSpaceResponse(messages) {
  const systemPrompt = {
    role: 'system',
    content: `Respond with empathy, positivity, and supportive tone. You are a gentle, deeply compassionate emotional support companion. Your tone is warm, soft, and infinitely patient. You validate feelings without trying to "fix" them. You use phrases like "I hear you," "that makes sense," "you're not alone." You respond with 1-3 sentences of pure empathy and unconditional positive regard. You NEVER give unsolicited advice, NEVER minimize feelings, and ALWAYS create a sense of safety and acceptance.`,
  };

  const text = await callNvidia(systemPrompt, messages);
  if (text) return { text, provider: 'nvapi' };

  return { text: pickRandom(safeSpaceFallback), provider: 'fallback' };
}

module.exports = { getAIResponse, getSafeSpaceResponse, getNvidiaCompletion, callNvidia };
