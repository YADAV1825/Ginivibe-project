"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, SendHorizonal } from "lucide-react";
import styles from '../../roleplay.module.css';
import { StorageService } from '@/lib/storage';

const GINI_API_URL = process.env.NEXT_PUBLIC_GINI_API_URL ?? 'http://localhost:3004/api/gini_ai';
const TOKEN_KEY = 'ginivibe_auth_token';

const authHeaders = (json = false): Record<string, string> => {
  const headers: Record<string, string> = {};
  if (json) headers['Content-Type'] = 'application/json';
  const token = StorageService.getItem(TOKEN_KEY);
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

interface GiniCharacter {
  id: string;
  name: string;
  greeting: string;
  imagePath: string;
}

interface ChatMessage {
  id?: string;
  role: string;
  content: string;
}

interface ContextInfo {
  used: number;
  limit: number;
  isPremium: boolean;
  truncated: boolean;
}

function ContextRing({ context }: { context: ContextInfo }) {
  const pct = Math.min(1, context.used / Math.max(1, context.limit));
  const r = 16;
  const c = 2 * Math.PI * r;
  const color = pct >= 0.9 ? '#f87171' : pct >= 0.7 ? '#fbbf24' : '#4ade80';
  return (
    <span className={styles.contextRing} title={`Memory ${context.used.toLocaleString()} / ${context.limit.toLocaleString()} tokens`}>
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(35,38,47,0.14)" strokeWidth="4" />
        <circle
          cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeLinecap="round" strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)} transform="rotate(-90 22 22)"
        />
      </svg>
      <span className={styles.contextPct}>{Math.round(pct * 100)}%</span>
    </span>
  );
}

export default function ChatPage() {
  const params = useParams();
  const id = params.id as string;
  const [character, setCharacter] = useState<GiniCharacter | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<ContextInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const jumpedOnce = useRef(false);

  // Landing-style white card for this section only.
  useEffect(() => {
    const card = document.querySelector('.app-container');
    card?.classList.add('gv-gini-white');
    return () => card?.classList.remove('gv-gini-white');
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Land on the messages, not the top: reset the page scroll, then jump to
  // the bottom once layout settles (images/transition shift things around).
  useEffect(() => {
    if (!booting && !jumpedOnce.current) {
      jumpedOnce.current = true;
      document.querySelector('.main-content')?.scrollTo({ top: 0, behavior: 'auto' });
      requestAnimationFrame(() => {
        window.setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ block: 'end', behavior: 'auto' });
        }, 80);
      });
    }
  }, [booting]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ block: 'end', behavior: 'auto' });
  };

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      setBooting(true);
      setError(null);
      try {
        // Character detail (single fetch, not list-and-find).
        const charRes = await fetch(`${GINI_API_URL}/characters/${id}`, {
          headers: authHeaders(),
        });
        if (charRes.status === 404) {
          if (!cancelled) {
            setError('This character no longer exists.');
            setBooting(false);
          }
          return;
        }
        if (charRes.status === 403) {
          if (!cancelled) {
            setError('This character is private. Only its creator can chat with it.');
            setBooting(false);
          }
          return;
        }
        if (!charRes.ok) throw new Error(`Could not load character (${charRes.status})`);
        const char = await charRes.json();

        // Seed the context ring from the plan quota so it shows even on a
        // fresh chat; the latest session overrides it below when present.
        let initialContext: ContextInfo | null = null;
        try {
          const quotaRes = await fetch(`${GINI_API_URL}/quota`, {
            headers: authHeaders(),
          });
          if (quotaRes.ok) {
            const q = await quotaRes.json();
            initialContext = {
              used: 0,
              limit: q.contextLimit ?? 8000,
              isPremium: !!q.isPremium,
              truncated: false,
            };
          }
        } catch {
          // Ring stays hidden if quota is unreachable.
        }

        // Resume the latest session for this user (if any).
        let initialMessages: ChatMessage[] = [{ role: 'assistant', content: char.greeting }];
        let resumedSession: string | null = null;
        try {
          const latestRes = await fetch(`${GINI_API_URL}/chat/${char.id}/latest`, {
            headers: authHeaders(),
          });
          if (latestRes.ok) {
            const latest = await latestRes.json();
            if (latest && Array.isArray(latest.messages) && latest.messages.length > 0) {
              resumedSession = latest.id;
              initialMessages = latest.messages;
              if (latest.context) initialContext = latest.context;
            }
          }
        } catch {
          // Resume is best-effort; a fresh session still works.
        }

        if (!cancelled) {
          setCharacter(char);
          setSessionId(resumedSession);
          setMessages(initialMessages);
          setContext(initialContext);
          setBooting(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load chat. Is the Gini AI service running?');
          setBooting(false);
        }
      }
    };

    const timer = window.setTimeout(() => void boot(), 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [id]);

  const sendMessage = async () => {
    if (!input.trim() || !character || loading) return;
    const userMsg = input.trim();
    setInput("");
    setError(null);
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch(`${GINI_API_URL}/chat/${character.id}`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({ message: userMsg, sessionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Chat failed (${res.status})`);
      }
      if (data.sessionId) setSessionId(data.sessionId);
      if (data.context) setContext(data.context);
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
      } else {
        throw new Error('The AI returned an empty response. Please try again.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send message";
      setError(message);
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry — ${message}` }]);
    } finally {
      setLoading(false);
    }
  };

  if (booting) {
    return (
      <div className={styles.pageShell}>
        <div className={styles.content}>
          <p className={styles.loadingText}>Loading character...</p>
        </div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className={styles.pageShell}>
        <div className={styles.content} style={{ maxWidth: '48rem', zIndex: 10, textAlign: 'center' }}>
          <Link href="/gini_ai" className={styles.backLink} style={{ marginBottom: '1rem', display: 'inline-flex' }}>
            <ArrowLeft style={{ marginRight: '0.5rem', width: '1rem', height: '1rem' }} />
            Back to Explore
          </Link>
          <p className={styles.loadingText}>{error ?? 'This character could not be loaded.'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Link href="/gini_ai" className={`${styles.backLink} ${styles.backFloat}`}>
        <ArrowLeft style={{ marginRight: '0.5rem', width: '1rem', height: '1rem' }} />
        Back
      </Link>
      <div className={styles.pageShell}>
      <div className={`${styles.content} ${styles.chatFill}`} style={{ zIndex: 10 }}>
        <div className={styles.chatHeader}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={character.imagePath} alt={character.name} className={styles.chatAvatar} onLoad={scrollToBottom} />
          <div>
            <h2 className={styles.chatName}>{character.name}</h2>
          </div>
          <span className={styles.chatHeaderSpacer} />
          {context && <ContextRing context={context} />}
          <button
            className={styles.newChatBtn}
            onClick={() => {
              setSessionId(null);
              setMessages([{ role: 'assistant', content: character.greeting }]);
              setContext(null);
              setError(null);
            }}
            title="Start a fresh chat"
          >
            New chat
          </button>
        </div>

        {context?.truncated && (
          <p className={styles.contextWarning}>
            Memory is full ({context.used.toLocaleString()}/{context.limit.toLocaleString()} tokens) — {character.name} may
            forget earlier things.
            {!context.isPremium && ' Upgrade to Premium for 4x longer memory.'}
          </p>
        )}

        {error && (
          <p style={{ color: '#f87171', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>{error}</p>
        )}

        <div className={`${styles.messagesList} ${styles.messagesGrow}`}>
          {messages.map((m, i) => (
            <div key={m.id ?? i} className={m.role === 'user' ? styles.msgUserWrap : styles.msgAiWrap}>
              <div className={m.role === 'user' ? styles.msgUser : styles.msgAi}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className={styles.msgAiWrap}>
              <div className={styles.msgAi}>typing...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputArea}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
            placeholder={`Message ${character.name}...`}
            className={styles.chatInput}
            disabled={loading}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()} className={styles.sendButton} aria-label="Send message">
            <SendHorizonal size={20} />
          </button>
        </div>
      </div>
      </div>
    </>
  );
}
