import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const app = express();
const port = process.env.PORT || 3004;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Constants for API. OPENROUTER_* is canonical here; LIGHTNING_* is accepted
// as a fallback since the run guide documents those names.
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.LIGHTNING_API_KEY;
const OPENROUTER_API_URL =
  process.env.OPENROUTER_API_URL ||
  process.env.LIGHTNING_API_URL ||
  'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || process.env.LIGHTNING_MODEL;

const JWT_SECRET = process.env.JWT_SECRET || 'ginivibe_super_secret_jwt_key_2026';

// ---- Plan limits -----------------------------------------------------------
// Free: 8k rolling context, 3 bots, last 5 chats.
// Premium: 32k rolling context, 10 bots, last 25 chats.
const FREE_CONTEXT_TOKENS = 8000;
const PREMIUM_CONTEXT_TOKENS = 32000;
const FREE_MAX_BOTS = 3;
const PREMIUM_MAX_BOTS = 10;
const FREE_MAX_CHATS = 5;
const PREMIUM_MAX_CHATS = 25;
const CHARS_PER_TOKEN = 4;

const ADMIN_KEY = process.env.GINI_ADMIN_KEY || 'ginivibe-admin-dev';
if (!process.env.GINI_ADMIN_KEY) {
  console.warn('[gini_ai] GINI_ADMIN_KEY not set — using dev default. Set it in production.');
}

// Best-effort user resolution: a verifiable Ginivibe JWT scopes chat sessions
// to that user; missing/invalid tokens keep the legacy anonymous behavior.
const optionalUserId = (req: express.Request): string | null => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(header.slice(7).trim(), JWT_SECRET) as jwt.JwtPayload;
    return typeof decoded.id === 'string' && decoded.id ? decoded.id : null;
  } catch {
    return null;
  }
};

const estimateTokens = (chars: number) => Math.ceil(chars / CHARS_PER_TOKEN);

interface PlanQuota {
  userId: string | null;
  isPremium: boolean;
  contextLimit: number;
  maxBots: number;
  maxChats: number;
}

async function getQuota(userId: string | null): Promise<PlanQuota> {
  if (!userId) {
    return { userId, isPremium: false, contextLimit: FREE_CONTEXT_TOKENS, maxBots: FREE_MAX_BOTS, maxChats: FREE_MAX_CHATS };
  }
  const row = await prisma.userQuota.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
  return row.isPremium
    ? { userId, isPremium: true, contextLimit: PREMIUM_CONTEXT_TOKENS, maxBots: PREMIUM_MAX_BOTS, maxChats: PREMIUM_MAX_CHATS }
    : { userId, isPremium: false, contextLimit: FREE_CONTEXT_TOKENS, maxBots: FREE_MAX_BOTS, maxChats: FREE_MAX_CHATS };
}

// Legacy seed characters (creatorId null) are public. New characters are
// public only when visibility === 'global'; 'private' means owner-only.
const isPublicChar = (c: { visibility: string; creatorId: string | null }) =>
  c.visibility === 'global' || c.creatorId === null;

const canSeeChar = (c: { visibility: string; creatorId: string | null }, userId: string | null) =>
  isPublicChar(c) || (!!userId && c.creatorId === userId);

const canEditChar = (c: { creatorId: string | null }, userId: string | null) =>
  !!userId && !!c.creatorId && c.creatorId === userId;

const mapChar = (c: any, userId: string | null) => ({
  ...c,
  uid: c.id,
  imagePath: c.avatarUrl,
  isPublic: isPublicChar(c),
  mine: canEditChar(c, userId),
  canEdit: canEditChar(c, userId),
});

// Keep only the user's most recent chats (free: 5, premium: 25).
async function pruneOldSessions(userId: string, maxChats: number, exceptSessionId?: string) {
  const sessions = await prisma.chatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  });
  const others = exceptSessionId ? sessions.filter((s) => s.id !== exceptSessionId) : sessions;
  const drop = others.slice(maxChats - (exceptSessionId ? 1 : 0));
  if (drop.length === 0) return;
  const ids = drop.map((s) => s.id);
  await prisma.message.deleteMany({ where: { chatSessionId: { in: ids } } });
  await prisma.chatSession.deleteMany({ where: { id: { in: ids } } });
}

app.get('/api/gini_ai/avatars', (req, res) => {
  const avatarsDir = path.join(__dirname, '../public/avatars');
  fs.readdir(avatarsDir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Failed to read avatars' });
    const avatars = files.filter(f => f.endsWith('.png') || f.endsWith('.jpg')).map(f => `/avatars/${f}`);
    res.json(avatars);
  });
});

// ---- Quota / plan ----------------------------------------------------------
app.get('/api/gini_ai/quota', async (req, res) => {
  try {
    const userId = optionalUserId(req);
    const quota = await getQuota(userId);
    const [botsUsed, chatsUsed] = userId
      ? await Promise.all([
          prisma.character.count({ where: { creatorId: userId } }),
          prisma.chatSession.count({ where: { userId } }),
        ])
      : [0, 0];
    res.json({ ...quota, botsUsed, chatsUsed });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch quota' });
  }
});

// Flip a user to premium (admin only — needs x-admin-key header).
app.post('/api/gini_ai/quota/upgrade', async (req, res) => {
  try {
    if (req.headers['x-admin-key'] !== ADMIN_KEY) {
      return res.status(403).json({ error: 'Admin key required' });
    }
    const { userId, isPremium } = req.body as { userId?: string; isPremium?: boolean };
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const row = await prisma.userQuota.upsert({
      where: { userId },
      update: { isPremium: !!isPremium },
      create: { userId, isPremium: !!isPremium },
    });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

app.post('/api/gini_ai/characters', async (req, res) => {
  try {
    const userId = optionalUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Login required to create a character', code: 'AUTH_REQUIRED' });
    }
    const quota = await getQuota(userId);
    const owned = await prisma.character.count({ where: { creatorId: userId } });
    if (owned >= quota.maxBots) {
      return res.status(403).json({
        error: quota.isPremium
          ? `You already have ${quota.maxBots} bots — delete one to make a new bot.`
          : `Free plan allows ${quota.maxBots} bots. Delete one or upgrade to Premium for ${PREMIUM_MAX_BOTS}.`,
        code: 'BOT_LIMIT',
        isPremium: quota.isPremium,
        maxBots: quota.maxBots,
      });
    }

    const { name, description, greeting, avatar, tags, gender, visibility, personality, scenario } = req.body;

    // Auto-generate system prompt if it doesn't exist
    const systemPrompt = req.body.systemPrompt || `You are ${name}. ${personality || ''} ${scenario ? `Scenario: ${scenario}` : ''}`;

    const character = await prisma.character.create({
      data: {
        name,
        description,
        greeting,
        systemPrompt,
        avatarUrl: avatar || req.body.avatarUrl || '',
        tags: tags || '',
        gender: gender || 'Female',
        visibility: visibility || 'private',
        creatorId: userId,
        personality,
        scenario
      }
    });
    // Return mapped to what CrushChat expects
    res.json(mapChar(character, userId));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create character' });
  }
});

app.put('/api/gini_ai/characters/:id', async (req, res) => {
  try {
    const userId = optionalUserId(req);
    const { id } = req.params;
    const character = await prisma.character.findUnique({ where: { id } });
    if (!character) return res.status(404).json({ error: 'Character not found' });
    if (!canEditChar(character, userId)) {
      return res.status(403).json({ error: 'Only the creator can edit this character', code: 'FORBIDDEN' });
    }
    const { name, description, greeting, avatar, avatarUrl, tags, gender, visibility, personality, scenario, systemPrompt } = req.body;
    const updated = await prisma.character.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(greeting !== undefined ? { greeting } : {}),
        ...(systemPrompt !== undefined ? { systemPrompt } : {}),
        ...(avatarUrl !== undefined || avatar !== undefined ? { avatarUrl: avatarUrl ?? avatar } : {}),
        ...(tags !== undefined ? { tags } : {}),
        ...(gender !== undefined ? { gender } : {}),
        ...(visibility !== undefined ? { visibility } : {}),
        ...(personality !== undefined ? { personality } : {}),
        ...(scenario !== undefined ? { scenario } : {}),
      },
    });
    res.json(mapChar(updated, userId));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update character' });
  }
});

app.get('/api/gini_ai/characters', async (req, res) => {
  try {
    const userId = optionalUserId(req);
    const { search, tags, page = '1', limit = '60', mine, sort } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 60, 100);

    if (mine === '1' || mine === 'true') {
      if (!userId) return res.status(401).json({ error: 'Login required', code: 'AUTH_REQUIRED' });
    }

    const filters: any[] = [];
    if (search) {
      filters.push({ name: { contains: search as string } });
    }
    if (tags) {
      const tagList = (tags as string).split(',');
      // Simple contains logic for tags
      filters.push({ AND: tagList.map(t => ({ tags: { contains: t } })) });
    }
    if (mine === '1' || mine === 'true') {
      filters.push({ creatorId: userId });
    } else if (userId) {
      filters.push({ OR: [{ visibility: 'global' }, { creatorId: null }, { creatorId: userId }] });
    } else {
      filters.push({ OR: [{ visibility: 'global' }, { creatorId: null }] });
    }

    const where: any = filters.length > 0 ? { AND: filters } : {};
    const orderBy: any =
      sort === 'popular' ? { messageCount: 'desc' }
      : sort === 'name' ? { name: 'asc' }
      : { createdAt: 'desc' };

    const total = await prisma.character.count({ where });
    const characters = await prisma.character.findMany({
      where,
      orderBy,
      skip: (pageNum - 1) * limitNum,
      take: limitNum
    });

    const mapped = characters.map(c => mapChar(c, userId));

    res.json({ data: mapped, total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch characters' });
  }
});

app.get('/api/gini_ai/characters/:id', async (req, res) => {
  try {
    const userId = optionalUserId(req);
    const { id } = req.params;
    const character = await prisma.character.findUnique({ where: { id } });
    if (!character) return res.status(404).json({ error: 'Character not found' });
    if (!canSeeChar(character, userId)) {
      return res.status(403).json({ error: 'This character is private', code: 'FORBIDDEN' });
    }
    res.json(mapChar(character, userId));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch character' });
  }
});

app.delete('/api/gini_ai/characters/:id', async (req, res) => {
  try {
    const userId = optionalUserId(req);
    const { id } = req.params;
    const character = await prisma.character.findUnique({ where: { id } });
    if (!character) return res.status(404).json({ error: 'Character not found' });
    if (!canEditChar(character, userId)) {
      return res.status(403).json({ error: 'Only the creator can delete this character', code: 'FORBIDDEN' });
    }
    await prisma.message.deleteMany({ where: { session: { characterId: id } } });
    await prisma.chatSession.deleteMany({ where: { characterId: id } });
    await prisma.character.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete character' });
  }
});

app.get('/api/gini_ai/chat/:characterId/latest', async (req, res) => {
  try {
    const { characterId } = req.params;
    const userId = optionalUserId(req);
    const quota = await getQuota(userId);
    const character = await prisma.character.findUnique({ where: { id: characterId } });
    if (!character) return res.status(404).json({ error: 'Character not found' });
    if (!canSeeChar(character, userId)) {
      return res.status(403).json({ error: 'This character is private', code: 'FORBIDDEN' });
    }
    const session = await prisma.chatSession.findFirst({
      where: userId ? { characterId, userId } : { characterId, userId: null },
      orderBy: { updatedAt: 'desc' },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });
    if (!session) return res.json(null);
    const totalChars = session.messages.reduce((n, m) => n + m.content.length, 0);
    const used = estimateTokens(totalChars);
    res.json({
      ...session,
      context: {
        used,
        limit: quota.contextLimit,
        isPremium: quota.isPremium,
        truncated: used > quota.contextLimit,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

app.post('/api/gini_ai/chat/:characterId', async (req, res) => {
  try {
    const { characterId } = req.params;
    const { message, sessionId } = req.body;
    const userId = optionalUserId(req);
    const quota = await getQuota(userId);

    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message must be a non-empty string' });
    }
    if (!OPENROUTER_API_KEY || !OPENROUTER_MODEL) {
      return res.status(503).json({ error: 'AI chat is not configured on the server' });
    }

    const character = await prisma.character.findUnique({ where: { id: characterId } });
    if (!character) return res.status(404).json({ error: 'Character not found' });
    if (!canSeeChar(character, userId)) {
      return res.status(403).json({ error: 'This character is private', code: 'FORBIDDEN' });
    }

    let chatSessionId = sessionId;
    if (!chatSessionId) {
      const newSession = await prisma.chatSession.create({ data: { characterId, userId } });
      chatSessionId = newSession.id;
    } else {
      // A session id must belong to this character (and to this user, when known).
      const existing = await prisma.chatSession.findUnique({ where: { id: chatSessionId } });
      if (!existing || existing.characterId !== characterId) {
        return res.status(400).json({ error: 'Session does not belong to this character' });
      }
      if (userId && existing.userId && existing.userId !== userId) {
        return res.status(403).json({ error: 'Session belongs to another user' });
      }
      // Claim anonymous sessions and refresh recency for /latest ordering.
      await prisma.chatSession.update({
        where: { id: chatSessionId },
        data: { ...(userId && !existing.userId ? { userId } : {}), updatedAt: new Date() },
      });
    }

    // Enforce the saved-chats cap (free: last 5, premium: last 25).
    if (userId) {
      await pruneOldSessions(userId, quota.maxChats, chatSessionId);
    }

    // Save user message
    await prisma.message.create({
      data: { chatSessionId, role: 'user', content: message }
    });

    // Fetch history (last 50 messages)
    const history = await prisma.message.findMany({
      where: { chatSessionId },
      take: 50,
      orderBy: { createdAt: 'desc' }
    });

    // Reverse to chronological order
    const chronologicalHistory = history.reverse();

    // Prepare messages for LLM
    let llmMessages: { role: string, content: string }[] = [];
    const sysPrompt = { role: 'system', content: character.systemPrompt + "\n\nUser is chatting with you. Stay strictly in character." };

    // Rolling window: newest messages that fit this plan's context budget.
    // Anything older falls out — the character may "forget" it.
    let totalChars = sysPrompt.content.length;
    let includedHistory = [];
    let forgotten = 0;

    for (let i = chronologicalHistory.length - 1; i >= 0; i--) {
      const msg = chronologicalHistory[i];
      if (totalChars + msg.content.length < quota.contextLimit * CHARS_PER_TOKEN) {
        includedHistory.unshift(msg);
        totalChars += msg.content.length;
      } else {
        forgotten = i + 1; // count of oldest messages left out
        break;
      }
    }

    llmMessages = [
      sysPrompt,
      ...includedHistory.map(m => ({ role: m.role, content: m.content }))
    ];

    const contextInfo = {
      used: estimateTokens(totalChars),
      limit: quota.contextLimit,
      isPremium: quota.isPremium,
      truncated: forgotten > 0,
    };

    // Call OpenRouter API
    let apiRes: Response;
    try {
      apiRes = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: llmMessages,
          max_tokens: 2000,
          temperature: 0.8
        })
      });
    } catch (networkError) {
      console.error('LLM network error:', networkError);
      return res.status(502).json({ error: 'AI service is unreachable right now', context: contextInfo });
    }

    if (!apiRes.ok) {
      const errTxt = await apiRes.text();
      console.error("LLM Error:", errTxt);
      return res.status(502).json({ error: 'AI service returned an error', context: contextInfo });
    }

    const aiData = await apiRes.json() as { choices?: Array<{ message?: { content?: string } }> };
    const aiResponse = aiData?.choices?.[0]?.message?.content?.trim();
    if (!aiResponse) {
      return res.status(502).json({ error: 'AI returned an empty response', context: contextInfo });
    }

    // Save AI message
    const savedAiMsg = await prisma.message.create({
      data: { chatSessionId, role: 'assistant', content: aiResponse }
    });
    await prisma.character.update({
      where: { id: characterId },
      data: { messageCount: { increment: 1 } },
    });

    res.json({
      sessionId: chatSessionId,
      message: savedAiMsg,
      context: contextInfo,
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Chat endpoint failed' });
  }
});

// Create initial index file
app.listen(port as number, '0.0.0.0', () => {
  console.log(`Gini_AI Microservice running on port ${port}`);
});

// Keep event loop alive for Node 24 + tsx bug
setInterval(() => {}, 1000 * 60 * 60);
