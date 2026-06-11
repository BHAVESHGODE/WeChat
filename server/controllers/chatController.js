const axios = require('axios');
const ChatThread = require('../models/ChatThread');
const ChatMessage = require('../models/ChatMessage');
const Gist = require('../models/Gist');
const { getAIResponse, getNvidiaCompletion } = require('../services/aiService');

const GH_API = 'https://api.github.com';
const GH_GRAPHQL = 'https://api.github.com/graphql';

function ghAuth() {
  const token = process.env.GITHUB_PAT;
  if (!token) throw new Error('GITHUB_PAT not configured');
  return { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json', 'User-Agent': 'WeGift/1.0' } };
}

function graphQLAuth() {
  const token = process.env.GITHUB_PAT;
  if (!token) throw new Error('GITHUB_PAT not configured');
  return { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'WeGift/1.0' } };
}

function parseRepo(repo) {
  const parts = repo.split('/');
  if (parts.length < 2) throw new Error('Invalid repo format. Use owner/repo');
  return { owner: parts[0], repo: parts.slice(1).join('/') };
}

async function listDiscussions(req, res) {
  try {
    const { repo, state, page = 1, perPage = 20 } = req.query;
    if (!repo) return res.status(400).json({ error: 'repo query param required (owner/repo)' });
    const { owner, repo: repoName } = parseRepo(repo);

    const params = { page: parseInt(page), per_page: Math.min(parseInt(perPage), 100), state: state || 'open' };
    const { data } = await axios.get(`${GH_API}/repos/${owner}/${repoName}/discussions`, { ...ghAuth(), params, timeout: 15000 });

    const threads = data.map((d) => ({
      ghNodeId: d.node_id,
      ghNumber: d.number,
      type: 'discussion',
      title: d.title,
      body: d.body || '',
      author: d.user?.login || 'unknown',
      repo,
      labels: d.labels?.map((l) => l.name) || [],
      state: d.state,
      lastActivity: d.updated_at,
      participants: [d.user?.login],
      createdAt: d.created_at,
    }));

    for (const t of threads) {
      await ChatThread.findOneAndUpdate({ ghNodeId: t.ghNodeId }, t, { upsert: true, new: true });
    }

    res.json({ data: threads, page: parseInt(page) });
  } catch (err) {
    console.error('List discussions error:', err.message);
    res.status(500).json({ error: err.response?.data?.message || 'Failed to fetch discussions' });
  }
}

async function listIssues(req, res) {
  try {
    const { repo, state, page = 1, perPage = 20 } = req.query;
    if (!repo) return res.status(400).json({ error: 'repo query param required (owner/repo)' });
    const { owner, repo: repoName } = parseRepo(repo);

    const params = { page: parseInt(page), per_page: Math.min(parseInt(perPage), 100), state: state || 'open', sort: 'updated', direction: 'desc' };
    const { data } = await axios.get(`${GH_API}/repos/${owner}/${repoName}/issues`, { ...ghAuth(), params, timeout: 15000 });

    const threads = data.map((d) => ({
      ghNodeId: d.node_id,
      ghNumber: d.number,
      type: 'issue',
      title: d.title,
      body: d.body || '',
      author: d.user?.login || 'unknown',
      repo,
      labels: d.labels?.map((l) => l.name) || [],
      state: d.state,
      lastActivity: d.updated_at,
      participants: [d.user?.login],
      createdAt: d.created_at,
    }));

    for (const t of threads) {
      await ChatThread.findOneAndUpdate({ ghNodeId: t.ghNodeId }, t, { upsert: true, new: true });
    }

    res.json({ data: threads, page: parseInt(page) });
  } catch (err) {
    console.error('List issues error:', err.message);
    res.status(500).json({ error: err.response?.data?.message || 'Failed to fetch issues' });
  }
}

async function getThreadMessages(req, res) {
  try {
    const { repo, number, type = 'issue' } = req.query;
    if (!repo || !number) return res.status(400).json({ error: 'repo and number required' });
    const { owner, repo: repoName } = parseRepo(repo);

    let endpoint;
    if (type === 'discussion') {
      endpoint = `/repos/${owner}/${repoName}/discussions/${number}/comments`;
    } else {
      endpoint = `/repos/${owner}/${repoName}/issues/${number}/comments`;
    }

    const { data } = await axios.get(`${GH_API}${endpoint}`, {
      ...ghAuth(),
      params: { per_page: 100, sort: 'created', direction: 'asc' },
      timeout: 15000,
    });

    const messages = (Array.isArray(data) ? data : []).map((c) => ({
      ghCommentId: String(c.id),
      ghNodeId: c.node_id,
      author: c.user?.login || 'unknown',
      authorAvatar: c.user?.avatar_url,
      body: c.body || '',
      bodyHtml: c.body_html || '',
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));

    res.json({ data: messages, total: messages.length });
  } catch (err) {
    console.error('Get thread messages error:', err.message);
    res.status(500).json({ error: err.response?.data?.message || 'Failed to fetch comments' });
  }
}

async function addReply(req, res) {
  try {
    const { repo, number, body, type = 'issue' } = req.body;
    if (!repo || !number || !body) return res.status(400).json({ error: 'repo, number, and body required' });
    const { owner, repo: repoName } = parseRepo(repo);

    let endpoint;
    if (type === 'discussion') {
      endpoint = `/repos/${owner}/${repoName}/discussions/${number}/comments`;
    } else {
      endpoint = `/repos/${owner}/${repoName}/issues/${number}/comments`;
    }

    const { data } = await axios.post(`${GH_API}${endpoint}`, { body }, { ...ghAuth(), timeout: 15000 });

    const message = {
      ghCommentId: String(data.id),
      ghNodeId: data.node_id,
      author: data.user?.login || 'unknown',
      authorAvatar: data.user?.avatar_url,
      body: data.body || '',
      bodyHtml: data.body_html || '',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    res.json({ data: message });
  } catch (err) {
    console.error('Add reply error:', err.message);
    res.status(500).json({ error: err.response?.data?.message || 'Failed to add comment' });
  }
}

async function createGist(req, res) {
  try {
    const { description, files, public: isPublic, threadId, messageId } = req.body;
    if (!files || Object.keys(files).length === 0) return res.status(400).json({ error: 'At least one file required' });

    const gistPayload = { description: description || 'Shared via WeGift Chat', public: isPublic !== false, files: {} };
    for (const [filename, content] of Object.entries(files)) {
      gistPayload.files[filename] = { content };
    }

    const { data } = await axios.post(`${GH_API}/gists`, gistPayload, { ...ghAuth(), timeout: 15000 });

    const gist = await Gist.create({
      ghGistId: data.id,
      author: data.owner?.login || 'unknown',
      description: data.description,
      files: Object.entries(data.files).map(([name, f]) => ({
        filename: name,
        language: f.language || null,
        content: f.content || '',
        rawUrl: f.raw_url,
      })),
      htmlUrl: data.html_url,
      public: data.public,
      threadId,
      messageId,
    });

    res.json({ data: gist });
  } catch (err) {
    console.error('Create gist error:', err.message);
    res.status(500).json({ error: err.response?.data?.message || 'Failed to create gist' });
  }
}

async function graphQLQuery(req, res) {
  try {
    const { query, variables } = req.body;
    if (!query) return res.status(400).json({ error: 'GraphQL query required' });

    const { data } = await axios.post(GH_GRAPHQL, { query, variables }, { ...graphQLAuth(), timeout: 15000 });
    res.json({ data: data.data });
  } catch (err) {
    console.error('GraphQL error:', err.message);
    res.status(500).json({ error: err.response?.data?.message || 'GraphQL query failed' });
  }
}

async function getLocalThreads(req, res) {
  try {
    const { type, repo, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (repo) filter.repo = repo;

    const threads = await ChatThread.find(filter)
      .sort({ isPinned: -1, lastActivity: -1, updatedAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    const total = await ChatThread.countDocuments(filter);
    res.json({ data: threads, total, page: parseInt(page) });
  } catch (err) {
    console.error('Get local threads error:', err.message);
    res.status(500).json({ error: 'Failed to get threads' });
  }
}

async function getLocalMessages(req, res) {
  try {
    const { threadId, page = 1, limit = 50 } = req.query;
    if (!threadId) return res.status(400).json({ error: 'threadId required' });

    const messages = await ChatMessage.find({ threadId })
      .sort({ createdAt: 1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    res.json({ data: messages, total: messages.length, page: parseInt(page) });
  } catch (err) {
    console.error('Get local messages error:', err.message);
    res.status(500).json({ error: 'Failed to get messages' });
  }
}

async function toggleFavorite(req, res) {
  try {
    const { threadId } = req.body;
    if (!threadId) return res.status(400).json({ error: 'threadId required' });

    const thread = await ChatThread.findById(threadId);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    thread.isFavorite = !thread.isFavorite;
    await thread.save();
    res.json({ data: thread });
  } catch (err) {
    console.error('Toggle favorite error:', err.message);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
}

async function togglePin(req, res) {
  try {
    const { threadId } = req.body;
    if (!threadId) return res.status(400).json({ error: 'threadId required' });

    const thread = await ChatThread.findById(threadId);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    thread.isPinned = !thread.isPinned;
    await thread.save();
    res.json({ data: thread });
  } catch (err) {
    console.error('Toggle pin error:', err.message);
    res.status(500).json({ error: 'Failed to toggle pin' });
  }
}

async function aiChat(req, res) {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });

    const messages = [...history.map((m) => ({ role: m.role || 'user', content: m.content })), { role: 'user', content: message }];
    const response = await getAIResponse(messages);

    res.json({ data: { role: 'assistant', content: response.text, provider: response.provider } });
  } catch (err) {
    console.error('AI chat error:', err.message);
    res.status(500).json({ error: 'AI chat failed' });
  }
}

async function aiChatDirect(req, res) {
  try {
    const { message, history = [], systemPrompt, enableThinking = false, provider } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });

    const sp = systemPrompt
      ? { role: 'system', content: systemPrompt }
      : { role: 'system', content: 'You are a helpful AI assistant. Respond naturally and concisely.' };

    const messages = [...(history || []), { role: 'user', content: message }];
    const response = await getAIResponse(messages, { enableThinking, preferredProvider: provider });

    res.json({ data: { role: 'assistant', content: response.text, provider: response.provider } });
  } catch (err) {
    console.error('AI chat direct error:', err.message);
    res.status(500).json({ error: 'AI chat failed' });
  }
}

async function nvidiaTasks(req, res) {
  try {
    const { task, content, context } = req.body;
    if (!task || !content) return res.status(400).json({ error: 'task and content required' });

    let systemPrompt;
    let messages;

    switch (task) {
      case 'summarize':
        systemPrompt = { role: 'system', content: 'Summarize the following text concisely in 2-3 sentences. Capture the key points only.' };
        messages = [{ role: 'user', content: content }];
        break;
      case 'embed':
        systemPrompt = { role: 'system', content: 'Generate a concise semantic embedding description for the given text. Output only the embedding descriptor.' };
        messages = [{ role: 'user', content: content }];
        break;
      case 'explain':
        systemPrompt = { role: 'system', content: 'Explain the following code or concept clearly and simply. Assume the reader is familiar with programming basics.' };
        messages = [{ role: 'user', content: content }];
        break;
      case 'analyze':
        systemPrompt = { role: 'system', content: 'Analyze the following text. Provide key insights, sentiment, and main themes.' };
        messages = [{ role: 'user', content: content }];
        break;
      case 'chat':
        systemPrompt = { role: 'system', content: 'You are a helpful AI assistant powered by NVIDIA.' };
        const ctx = context ? [{ role: 'system', content: `Context:\n${context}` }] : [];
        messages = [...ctx, { role: 'user', content }];
        break;
      default:
        return res.status(400).json({ error: `Unknown task: ${task}. Supported: summarize, embed, explain, analyze, chat` });
    }

    const text = await getNvidiaCompletion(messages, { systemPrompt, maxTokens: 2048, temperature: 0.3 });

    if (!text) return res.status(503).json({ error: 'NVIDIA service unavailable' });

    res.json({ data: { result: text, task, provider: 'nvapi' } });
  } catch (err) {
    console.error('NVIDIA task error:', err.message);
    res.status(500).json({ error: 'NVIDIA task failed' });
  }
}

module.exports = {
  listDiscussions,
  listIssues,
  getThreadMessages,
  addReply,
  createGist,
  graphQLQuery,
  getLocalThreads,
  getLocalMessages,
  toggleFavorite,
  togglePin,
  aiChat,
  aiChatDirect,
  nvidiaTasks,
};
