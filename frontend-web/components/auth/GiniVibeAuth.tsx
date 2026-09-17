"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Eye, EyeOff, Loader2, Sparkles, Moon, ArrowRight, Bot, 
  X, Check, Radio, Globe, Compass, LogOut, ArrowLeft,
  User as UserIcon, ShieldCheck
} from "lucide-react";
import { useAuth } from "@/app/core/providers/AuthProvider";
import { AuthService } from "@/app/(auth)";

// ---------------------------------------------------------------------------
// Types & Props
// ---------------------------------------------------------------------------

export interface GiniVibeAuthProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialMode?: "login" | "register";
}

// ---------------------------------------------------------------------------
// Static Starfield & Constellation Data
// ---------------------------------------------------------------------------

const STARS = Array.from({ length: 48 }).map((_, i) => {
  const seed = i * 137.5;
  return {
    id: i,
    x: (seed * 3.7) % 100,
    y: (seed * 5.3) % 100,
    r: 0.6 + ((i * 7) % 5) * 0.25,
    delay: (i % 10) * 0.5,
    dur: 3.2 + (i % 5) * 0.8,
  };
});

const AMBIENT_CONSTELLATION_LINES = [
  { d: "M 80 120 L 140 90 L 210 140", delay: 0 },
  { d: "M 460 460 L 510 410 L 550 450", delay: 2.2 },
  { d: "M 100 460 L 150 490 L 120 530", delay: 4.4 },
  { d: "M 420 100 L 480 80 L 530 130", delay: 3.1 },
];

const BACK_PARTICLES = [
  { top: "14%", left: "64%", size: 5, dur: 9 },
  { top: "76%", left: "20%", size: 4, dur: 11 },
  { top: "46%", left: "88%", size: 6, dur: 8 },
  { top: "8%", left: "14%", size: 4, dur: 10 },
  { top: "86%", left: "58%", size: 5, dur: 12 },
];

const FRONT_PARTICLES = [
  { top: "22%", left: "44%", size: 3.5, dur: 6 },
  { top: "62%", left: "16%", size: 3, dur: 7 },
  { top: "38%", left: "82%", size: 3.5, dur: 6.5 },
  { top: "80%", left: "76%", size: 4, dur: 8 },
];

// Ecosystem moment badges illustrating living community vibrancy (non-dating)
const ECOSYSTEM_CARDS = [
  { icon: Sparkles, label: "PERSONALITY", value: "ENFP · Visionary", top: "5%", left: "34%", dur: 7.2, delay: 0 },
  { icon: Compass, label: "COSMIC VIBE", value: "Harmonically Aligned", top: "82%", left: "6%", dur: 8.4, delay: 1.2 },
  { icon: Globe, label: "LIVE AUDIO ROOM", value: "Cosmic Tech & Philosophy", top: "68%", left: "80%", dur: 7.6, delay: 0.6 },
  { icon: Bot, label: "GINI AI STUDIO", value: "Evolving AI Companions", top: "14%", left: "82%", dur: 9.0, delay: 1.8 },
];

// Stylized human avatar nodes representing diverse human identities & cosmic vibes
const AVATAR_A = { 
  id: "a", 
  top: 28, 
  left: 20, 
  tag: "VISIONARY", 
  title: "ENFP · Intuitive Explorer", 
  tone: "violet",
  auraColor: "#b6ff2e"
};

const AVATAR_B = { 
  id: "b", 
  top: 64, 
  left: 76, 
  tag: "SHARED PASSION", 
  title: "Ambient Design & Sound", 
  tone: "gold",
  auraColor: "#f8e7c9"
};

// Avatar C represents discovery / new members in sign up
const AVATAR_C = { 
  id: "c", 
  top: 22, 
  left: 64, 
  tag: "NEW PRESENCE", 
  title: "Synthesizer & Architect", 
  tone: "cyan",
  auraColor: "#d9f873"
};

// Avatar D appears in sign up as "Your Vibe Forming"
const AVATAR_D = {
  id: "d",
  top: 74,
  left: 24,
  tag: "YOUR VIBE",
  title: "Awaiting Your Spark",
  tone: "emerald",
  auraColor: "#a3e635"
};

// Core Orbiting Particles around the Vibe Nexus
const CORE_PARTICLES = Array.from({ length: 10 }).map((_, i) => {
  const angle = (i / 10) * Math.PI * 2;
  const radius = 64;
  return { 
    id: i, 
    x: 300 + Math.cos(angle) * radius, 
    y: 300 + Math.sin(angle) * radius, 
    delay: i * 0.35 
  };
});

// Meaningful autonomous discovery pulse notifications
const DISCOVERY_MOMENTS = [
  { tag: "COSMIC VIBE", title: "Harmonic Synastry Discovered" },
  { tag: "SHARED INTEREST", title: "Ambient Music + Philosophy" },
  { tag: "NEW CONNECTION", title: "Someone resonated with your chart" },
  { tag: "LIVE AUDIO ROOM", title: "Drop-in stage just opened" },
];

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------

const COPY = {
  login: {
    eyebrow: "WELCOME BACK",
    headingLine1: "Welcome back to",
    headingLine2: "GiniVibe",
    sub: "Your people. Your vibe. Your universe.",
    submit: "Sign In",
    dividerLabel: "or continue with email",
    switchPrompt: "New to GiniVibe?",
    switchAction: "Create your vibe",
    tagline: "Find your people. Discover your vibe.",
  },
  register: {
    eyebrow: "CREATE YOUR VIBE",
    headingLine1: "Create your",
    headingLine2: "GiniVibe",
    sub: "Discover people, ideas and connections that feel like you.",
    submit: "Create your vibe",
    dividerLabel: "or continue with email",
    switchPrompt: "Already part of GiniVibe?",
    switchAction: "Sign in",
    tagline: "A universe of people, finding where they fit.",
  },
};

// ---------------------------------------------------------------------------
// Hooks & Utilities
// ---------------------------------------------------------------------------

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function dist(x1: number, y1: number, x2: number, y2: number) {
  return Math.hypot(x1 - x2, y1 - y2);
}

function influenceAt(proximity: { x: number; y: number; active: boolean }, cx: number, cy: number, radius: number) {
  if (!proximity.active) return 0;
  const d = dist(proximity.x, proximity.y, cx, cy);
  return Math.max(0, 1 - d / radius);
}

// ---------------------------------------------------------------------------
// Social Provider Marks (Google, X, Instagram) - NO GITHUB
// ---------------------------------------------------------------------------

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.4 16 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.6 3 24 3 16.3 3 9.7 7.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 45c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 36.6 26.8 37.5 24 37.5c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.6 40.6 16.3 45 24 45z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 2.9-3 5.3-5.6 6.9l6.3 5.3C39.9 37.1 44 31 44 24c0-1.4-.1-2.7-.4-3.5z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

const PROVIDERS = [
  { id: "google", label: "Google", Icon: GoogleIcon },
  { id: "x", label: "X / Twitter", Icon: XIcon },
  { id: "instagram", label: "Instagram", Icon: InstagramIcon },
];

// ---------------------------------------------------------------------------
// Interactive Stylized Human Avatar Node
// ---------------------------------------------------------------------------

interface AvatarProps {
  avatar: {
    id: string;
    top: number;
    left: number;
    tag: string;
    title: string;
    tone: string;
    auraColor: string;
  };
  influence: number;
  forming?: boolean;
  activePulse?: boolean;
}

function AvatarNode({ avatar, influence, forming, activePulse }: AvatarProps) {
  const isNear = influence > 0.22 || activePulse;
  const ringScale = 1 + influence * 0.18 + (activePulse ? 0.12 : 0);
  const ringOpacity = Math.min(1, 0.4 + influence * 0.6 + (activePulse ? 0.4 : 0));
  const labelOpacity = isNear ? 1 : 0;

  return (
    <div
      className={`gv-avatar gv-avatar-${avatar.tone}${forming ? " gv-avatar-forming" : ""}${isNear ? " gv-avatar-active" : ""}`}
      style={{ top: `${avatar.top}%`, left: `${avatar.left}%` }}
      aria-hidden="true"
    >
      {/* Outer Breathing Aura */}
      <div 
        className="gv-avatar-ring" 
        style={{ 
          transform: `scale(${ringScale})`, 
          opacity: ringOpacity,
          boxShadow: isNear ? `0 0 22px ${avatar.auraColor}66` : undefined 
        }} 
      />

      {/* Orbiting Satellite Star */}
      <div className="gv-avatar-satellite-track">
        <span className="gv-avatar-satellite" />
      </div>

      {/* Inner Cosmic Silhouette Core */}
      <div className="gv-avatar-core">
        <div className="gv-avatar-glow-inner" />
        <svg viewBox="0 0 40 40" className="gv-avatar-silhouette">
          <circle cx="20" cy="14" r="6.5" />
          <path d="M7 34 C7 23.5 13.5 20 20 20 C26.5 20 33 23.5 33 34 Z" />
        </svg>
      </div>

      {/* Floating Personality Presence Badge */}
      <div
        className="gv-avatar-label"
        style={{ 
          opacity: labelOpacity, 
          transform: `translateX(${labelOpacity > 0 ? 0 : -8}px) scale(${0.96 + labelOpacity * 0.04})` 
        }}
      >
        <span className="gv-avatar-label-tag">{avatar.tag}</span>
        <span className="gv-avatar-label-title">{avatar.title}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Left Side: Living Cosmic Constellation & Vibe Core
// ---------------------------------------------------------------------------

interface CosmicSceneProps {
  mode: "login" | "register";
  reducedMotion: boolean;
  pageParallax: { x: number; y: number };
  transitioning: boolean;
}

function CosmicScene({ mode, reducedMotion, pageParallax, transitioning }: CosmicSceneProps) {
  const isRegister = mode === "register";
  const sceneRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [proximity, setProximity] = useState({ x: 50, y: 50, active: false });
  const [pulseActive, setPulseActive] = useState(false);
  const [discoveryIndex, setDiscoveryIndex] = useState(0);

  // Autonomous Connection Discovery Pulse every 9.5 seconds
  useEffect(() => {
    if (reducedMotion) return;
    const interval = setInterval(() => {
      setPulseActive(true);
      setDiscoveryIndex((prev) => (prev + 1) % DISCOVERY_MOMENTS.length);
      const timer = setTimeout(() => {
        setPulseActive(false);
      }, 4200);
      return () => clearTimeout(timer);
    }, 9500);

    return () => clearInterval(interval);
  }, [reducedMotion]);

  const handleSceneMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reducedMotion || !sceneRef.current) return;
      const rect = sceneRef.current.getBoundingClientRect();
      const xPct = ((e.clientX - rect.left) / rect.width) * 100;
      const yPct = ((e.clientY - rect.top) / rect.height) * 100;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setProximity({ x: xPct, y: yPct, active: true }));
    },
    [reducedMotion]
  );

  const handleSceneLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setProximity((p) => ({ ...p, active: false }));
  }, []);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const infA = influenceAt(proximity, AVATAR_A.left, AVATAR_A.top, 25);
  const infB = influenceAt(proximity, AVATAR_B.left, AVATAR_B.top, 25);
  const infC = isRegister ? influenceAt(proximity, AVATAR_C.left, AVATAR_C.top, 25) : 0;
  const infD = isRegister ? influenceAt(proximity, AVATAR_D.left, AVATAR_D.top, 25) : 0;
  const centerInfl = influenceAt(proximity, 50, 50, 30);
  const coreInfl = Math.max(infA * 0.5, infB * 0.5, infC * 0.5, infD * 0.5, centerInfl) + (pulseActive ? 0.35 : 0);

  const layerStyle = (mult: number) =>
    reducedMotion ? undefined : { transform: `translate3d(${pageParallax.x * mult}px, ${pageParallax.y * mult}px, 0)` };

  const currentMoment = DISCOVERY_MOMENTS[discoveryIndex];

  return (
    <div className={`gv-cosmic-entrance${transitioning ? " gv-cosmic-transitioning" : ""}`}>
      <div className="gv-cosmic-scene" ref={sceneRef} onMouseMove={handleSceneMove} onMouseLeave={handleSceneLeave}>
        
        {/* Background Depth Particle Layer */}
        <div className="gv-particle-layer" style={layerStyle(0.3)}>
          {BACK_PARTICLES.map((p, i) => (
            <span
              key={i}
              className="gv-dot gv-dot-back"
              style={{ top: p.top, left: p.left, width: p.size, height: p.size, animationDuration: `${p.dur}s` }}
            />
          ))}
        </div>

        {/* Midground SVG Constellations & Vibe Nexus */}
        <div className="gv-cosmic-mid" style={layerStyle(1)}>
          <svg viewBox="0 0 600 600" className="gv-cosmic-svg" aria-hidden="true">
            <defs>
              <radialGradient id="vibeOrbGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f8e7c9" stopOpacity="0.95" />
                <stop offset="35%" stopColor="#b6ff2e" stopOpacity="0.55" />
                <stop offset="70%" stopColor="#4d7c0f" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#4d7c0f" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="vibeCoreGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f8e7c9" />
                <stop offset="35%" stopColor="#f8e7c9" />
                <stop offset="75%" stopColor="#b6ff2e" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#b6ff2e" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="connGradA" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#b6ff2e" />
                <stop offset="50%" stopColor="#f8e7c9" />
                <stop offset="100%" stopColor="#d9f873" />
              </linearGradient>
            </defs>

            {/* Living Starfield */}
            {STARS.map((s) => (
              <circle
                key={s.id}
                cx={(s.x / 100) * 600}
                cy={(s.y / 100) * 600}
                r={s.r}
                fill="#f8e7c9"
                className="gv-star"
                style={{ animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s` }}
              />
            ))}

            {/* Subtle Ambient Geometries */}
            {AMBIENT_CONSTELLATION_LINES.map((l, i) => (
              <path key={i} d={l.d} className="gv-ambient-line" style={{ animationDelay: `${l.delay}s` }} />
            ))}

            {/* Human Constellation Connection Splines */}
            <path
              d="M120 168 Q210 240 300 300"
              className={`gv-connection-line${infA > 0.22 || pulseActive ? " gv-connection-active" : ""}`}
              style={{ animationDelay: "0s" }}
            />
            <path
              d="M456 384 Q390 340 300 300"
              className={`gv-connection-line${infB > 0.22 || pulseActive ? " gv-connection-active" : ""}`}
              style={{ animationDelay: "2.8s" }}
            />
            <path 
              d="M120 168 Q290 260 456 384" 
              className={`gv-connection-line gv-connection-line-slow${pulseActive ? " gv-connection-active" : ""}`} 
              style={{ animationDelay: "5.5s" }} 
            />

            {/* Register Mode Emergent Splines */}
            {isRegister && (
              <>
                <path
                  d="M384 132 Q340 210 300 300"
                  className={`gv-connection-line gv-connection-line-c${infC > 0.22 ? " gv-connection-active" : ""}`}
                  style={{ animationDelay: "1.2s" }}
                />
                <path
                  d="M144 444 Q220 370 300 300"
                  className={`gv-connection-line gv-connection-line-d${infD > 0.22 ? " gv-connection-active" : ""}`}
                  style={{ animationDelay: "2.2s" }}
                />
              </>
            )}

            {/* Sacred Orbitals around Vibe Core */}
            <circle cx="300" cy="300" r="148" className="gv-ring gv-ring-1" />
            <circle cx="300" cy="300" r="196" className="gv-ring gv-ring-2" />

            {/* Central Vibe Core Nexus */}
            <g 
              style={{ 
                filter: `brightness(${1 + coreInfl * 0.4}) drop-shadow(0 0 ${12 + coreInfl * 18}px rgba(182, 255, 46, 0.6))`, 
                transform: `scale(${1 + coreInfl * 0.05})`, 
                transformOrigin: "300px 300px",
                transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), filter 0.4s ease"
              }}
            >
              <circle cx="300" cy="300" r="134" fill="url(#vibeOrbGlow)" className="gv-orb-halo" />
              
              <g className="gv-core-particle-ring">
                {CORE_PARTICLES.map((p) => (
                  <circle
                    key={p.id}
                    cx={p.x}
                    cy={p.y}
                    r={p.id % 2 === 0 ? "2.6" : "2"}
                    className="gv-core-particle"
                    fill={p.id % 2 === 0 ? "#d9f873" : "#b6ff2e"}
                    style={{ animationDelay: `${p.delay}s` }}
                  />
                ))}
              </g>

              <circle cx="300" cy="300" r="46" fill="url(#vibeCoreGlow)" className="gv-orb-core" />
            </g>
          </svg>
        </div>

        {/* Foreground Particle Layer */}
        <div className="gv-particle-layer" style={layerStyle(1.6)}>
          {FRONT_PARTICLES.map((p, i) => (
            <span
              key={i}
              className="gv-dot gv-dot-front"
              style={{ top: p.top, left: p.left, width: p.size, height: p.size, animationDuration: `${p.dur}s` }}
            />
          ))}
        </div>

        {/* Foreground Interactive Avatars & Living Social Artifacts */}
        <div className="gv-html-layer" style={layerStyle(1.2)}>
          <AvatarNode avatar={AVATAR_A} influence={infA} activePulse={pulseActive} />
          <AvatarNode avatar={AVATAR_B} influence={infB} activePulse={pulseActive} />
          {isRegister && <AvatarNode avatar={AVATAR_C} influence={infC} forming />}
          {isRegister && <AvatarNode avatar={AVATAR_D} influence={infD} forming />}

          {/* Autonomous Connection Discovery Banner */}
          <div className={`gv-moment-banner${pulseActive ? " gv-moment-active" : ""}`}>
            <div className="gv-moment-pill">
              <span className="gv-moment-dot" />
              <div className="gv-moment-info">
                <span className="gv-moment-tag">{currentMoment.tag}</span>
                <span className="gv-moment-title">{currentMoment.title}</span>
              </div>
            </div>
          </div>

          {/* Ambient Ecosystem Moments */}
          {ECOSYSTEM_CARDS.map((c, i) => {
            const Icon = c.icon;
            return (
              <div
                key={i}
                className="gv-eco-card"
                style={{ top: c.top, left: c.left, animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s` }}
              >
                <Icon size={12} strokeWidth={2.2} className="gv-eco-icon" />
                <div className="gv-eco-text">
                  <span className="gv-eco-label">{c.label}</span>
                  <span className="gv-eco-value">{c.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main GiniVibe Cosmic Auth Component
// ---------------------------------------------------------------------------

export default function GiniVibeAuth({ isOpen = true, onClose, initialMode = "login" }: GiniVibeAuthProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [transitioning, setTransitioning] = useState(false);
  
  // Real Form State
  const [values, setValues] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirm: ""
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [submitError, setSubmitError] = useState("");
  const [expiredNotice, setExpiredNotice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [socialToast, setSocialToast] = useState("");
  const [pageParallax, setPageParallax] = useState({ x: 0, y: 0 });

  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const router = useRouter();
  const { user, setUser, logout } = useAuth();
  const copy = COPY[mode];

  // Sync mode if initialMode prop changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Explain forced logouts (dead/rotated token auto-cleared by the API layer).
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('expired=1')) {
      setExpiredNotice(true);
      router.replace('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lock body scroll when rendered as a modal overlay
  useEffect(() => {
    if (!onClose) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [onClose]);

  // Handle ESC key to dismiss modal
  useEffect(() => {
    if (!onClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Parallax tracking
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reducedMotion || !rootRef.current) return;
      const rect = rootRef.current.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      setPageParallax({ x: relX * 14, y: relY * 14 });
    },
    [reducedMotion]
  );

  const switchMode = (next: "login" | "register") => {
    if (next === mode || transitioning) return;
    setTransitioning(true);
    setSubmitError("");
    setErrors({});
    setTimeout(() => {
      setMode(next);
      setTimeout(() => setTransitioning(false), 20);
    }, 240);
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setValues((prev) => ({ ...prev, [field]: v }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Social Provider Feedback (NO FAKE OAUTH - Clean Coming Soon Interaction)
  const handleSocialClick = (providerLabel: string) => {
    setSocialToast(`${providerLabel} authentication is coming soon in our upcoming release.`);
    setTimeout(() => setSocialToast(""), 4200);
  };

  // Strict Validation
  const validate = () => {
    const next: Record<string, string | undefined> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (mode === "register") {
      const cleanUsername = values.username.trim();
      if (!cleanUsername) {
        next.username = "Choose a unique username";
      } else if (cleanUsername.length < 8) {
        next.username = "Username must be at least 8 characters";
      }
    }

    if (!values.email.trim()) {
      next.email = "Enter your email or username";
    } else if (mode === "register" && !emailRegex.test(values.email.trim())) {
      next.email = "Enter a valid email address";
    }

    if (!values.password) {
      next.password = "Enter your password";
    } else if (mode === "register" && values.password.length < 8) {
      next.password = "Password must be at least 8 characters";
    }

    if (mode === "register" && values.confirm !== values.password) {
      next.confirm = "Passwords do not match";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // Production Auth Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setExpiredNotice(false);

    if (!validate()) return;
    setLoading(true);

    try {
      if (mode === "login") {
        // Authenticate with real AuthService
        const loggedUser = await AuthService.login(values.email.trim(), values.password);
        setUser(loggedUser);
        if (onClose) onClose();
        router.push("/home");
      } else {
        // Multi-field Registration with backend schema alignment
        const nameParts = values.name ? values.name.trim().split(" ") : [values.username.trim()];
        const firstName = nameParts[0] || values.username.trim();
        const lastName = nameParts.slice(1).join(" ") || "";

        const registeredUser = await AuthService.register({
          username: values.username.trim().toLowerCase(),
          email: values.email.trim().toLowerCase(),
          password: values.password,
          firstName,
          lastName,
        });

        setUser(registeredUser);
        if (onClose) onClose();
        router.push("/home");
      }
    } catch (err: any) {
      // Production error handling - no fake offline session bypass
      const isNetworkError = err?.message?.includes("Failed to fetch") || err?.name === "TypeError";
      setSubmitError(
        isNetworkError 
          ? "Unable to connect to the authentication server (http://localhost:3001). Please verify the backend service is running."
          : (err.message || (mode === "login" ? "Invalid email or password" : "Could not create your account. Please try again."))
      );
    } finally {
      setLoading(false);
    }
  };

  // If user is already authenticated and opened modal, show minimal authenticated session
  const renderAuthenticatedSession = () => (
    <div className="gv-active-session">
      <div className="gv-session-badge">
        <Sparkles size={14} className="text-indigo-400" />
        <span>Active Cosmic Session</span>
      </div>

      <div className="gv-session-user">
        <div className="gv-session-avatar">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name || "User"} className="h-full w-full object-cover rounded-full" />
          ) : (
            <UserIcon size={24} className="text-indigo-300" />
          )}
        </div>
        <div className="gv-session-details">
          <h2 className="gv-session-name">{user?.name || (user as any)?.username || user?.email?.split('@')[0] || "Cosmic Traveler"}</h2>
          <p className="gv-session-email">{user?.email || "Signed in"}</p>
        </div>
      </div>

      <p className="gv-session-note">
        You are already signed into your GiniVibe universe. Enter your personal dashboard or sign out.
      </p>

      <div className="gv-session-actions">
        <button
          type="button"
          onClick={() => {
            if (onClose) onClose();
            router.push("/home");
          }}
          className="gv-submit"
        >
          <span>Continue to GiniVibe</span>
          <ArrowRight size={16} />
        </button>

        <button
          type="button"
          onClick={async () => {
            await logout();
          }}
          className="gv-signout-btn"
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div 
      ref={rootRef} 
      className={`gv-root gv-mode-${mode}${reducedMotion ? " gv-reduced-motion" : ""}${onClose ? " gv-is-modal" : ""}`} 
      onMouseMove={handleMouseMove}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&display=swap');

        .gv-root {
          --gv-bg-0: #101216; 
          --gv-bg-1: #16181d; 
          --gv-bg-2: #23262f;
          --gv-violet: #b6ff2e; 
          --gv-cyan: #d9f873; 
          --gv-gold: #f8e7c9;
          --gv-emerald: #a3e635;
          --gv-text-0: #f8e7c9; 
          --gv-text-1: #d9cfae; 
          --gv-text-2: #a8acb8;
          --gv-border: rgba(255, 255, 255, 0.08); 
          --gv-border-hover: rgba(182, 255, 46, 0.45);
          --gv-danger: #d97757; 
          --gv-radius: 28px; 
          --gv-energy: 1;
          --gv-font-display: 'Bricolage Grotesque', system-ui, sans-serif;
          --gv-font-body: 'Bricolage Grotesque', system-ui, sans-serif;
          position: relative; 
          min-height: 100vh; 
          width: 100%; 
          overflow-x: hidden;
          background: radial-gradient(ellipse 120% 90% at 20% 0%, #242a14 0%, var(--gv-bg-1) 48%, var(--gv-bg-0) 100%);
          font-family: var(--gv-font-body); 
          color: var(--gv-text-0);
          animation: gv-fade-in .4s ease-out;
        }

        .gv-is-modal {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(22, 24, 29, 0.88);
          backdrop-filter: blur(20px);
          overflow-y: auto;
        }

        .gv-root * { box-sizing: border-box; }
        .gv-mode-register { --gv-energy: 0.85; }
        @keyframes gv-fade-in { from { opacity: 0; } to { opacity: 1; } }

        /* Top Bar Controls */
        .gv-top-bar {
          position: absolute;
          top: 24px;
          left: 32px;
          right: 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 20;
          pointer-events: auto;
        }
        .gv-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: var(--gv-text-1);
          background: rgba(248, 231, 201, 0.05);
          border: 1px solid var(--gv-border);
          padding: 8px 16px;
          border-radius: 9999px;
          backdrop-filter: blur(8px);
          transition: all 0.2s ease;
          text-decoration: none;
        }
        .gv-back-btn:hover {
          color: #f8e7c9;
          background: rgba(248, 231, 201, 0.08);
          border-color: rgba(182, 255, 46, 0.4);
          transform: translateX(-2px);
        }
        .gv-close-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--gv-border);
          color: var(--gv-text-1);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .gv-close-btn:hover {
          background: rgba(248, 231, 201, 0.12);
          color: #f8e7c9;
          transform: rotate(90deg);
        }

        /* Ambient Cosmic Background */
        .gv-ambient { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
        .gv-ambient::before, .gv-ambient::after { content: ''; position: absolute; border-radius: 50%; filter: blur(95px); opacity: .32; }
        .gv-ambient::before { width: 560px; height: 560px; top: -160px; left: -140px; background: radial-gradient(circle, var(--gv-violet) 0%, transparent 70%); animation: gv-drift-a 26s ease-in-out infinite; }
        .gv-ambient::after { width: 480px; height: 480px; bottom: -160px; right: -120px; background: radial-gradient(circle, var(--gv-cyan) 0%, transparent 70%); opacity: .2; animation: gv-drift-b 30s ease-in-out infinite; }
        @keyframes gv-drift-a { 0%,100%{transform:translate(0,0)} 50%{transform:translate(45px,35px)} }
        @keyframes gv-drift-b { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-35px,-45px)} }

        .gv-layout { 
          position: relative; 
          z-index: 1; 
          min-height: 100vh; 
          width: 100%;
          display: grid; 
          grid-template-columns: 1.15fr 1fr; 
        }
        @media (max-width: 960px) { 
          .gv-layout { grid-template-columns: 1fr; } 
        }

        /* ---------- Left Visual Panel ---------- */
        .gv-visual-panel { 
          position: relative; 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: center; 
          padding: 50px 36px; 
          min-height: 380px; 
          overflow: hidden; 
        }
        @media (max-width: 960px) { 
          .gv-visual-panel { padding: 40px 20px 10px; min-height: 280px; } 
        }

        .gv-cosmic-entrance { width: min(560px, 94%); opacity: 0; transform: scale(.96); animation: gv-cosmic-rise .8s cubic-bezier(.16, 1, 0.3, 1) .1s forwards; }
        @media (max-width: 960px) { .gv-cosmic-entrance { width: min(340px, 86%); } }
        @keyframes gv-cosmic-rise { to { opacity: 1; transform: scale(1); } }
        .gv-cosmic-transitioning { opacity: .78; transition: opacity .24s ease; }

        .gv-cosmic-scene { position: relative; width: 100%; aspect-ratio: 1/1; }
        .gv-cosmic-mid, .gv-particle-layer, .gv-html-layer { position: absolute; inset: 0; transition: transform .22s ease-out; }
        .gv-cosmic-svg { width: 100%; height: 100%; overflow: visible; }

        .gv-dot { position: absolute; border-radius: 50%; animation-name: gv-drift-dot; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
        .gv-dot-back { background: radial-gradient(circle, rgba(182, 255, 46, .55), transparent 70%); filter: blur(2.5px); opacity: .45; }
        .gv-dot-front { background: radial-gradient(circle, rgba(232,193,119,.85), transparent 70%); filter: blur(.8px); opacity: .65; }
        @keyframes gv-drift-dot { 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-10px) } }

        .gv-star { animation: gv-twinkle 4.2s ease-in-out infinite; transform-origin: center; }
        @keyframes gv-twinkle { 0%,100%{opacity:.2} 50%{opacity:1} }

        .gv-ambient-line { fill: none; stroke: var(--gv-violet); stroke-width: 1; stroke-opacity: .45; stroke-linecap: round; stroke-dasharray: 220; stroke-dashoffset: 220; animation: gv-draw calc(8.5s * var(--gv-energy)) ease-in-out infinite; }
        @keyframes gv-draw { 0%{stroke-dashoffset:220; opacity:0;} 25%{stroke-dashoffset:0; opacity:.65;} 55%{stroke-dashoffset:0; opacity:.65;} 80%{opacity:0;} 100%{stroke-dashoffset:220; opacity:0;} }

        .gv-connection-line { fill: none; stroke: url(#connGradA); stroke-width: 1.5; stroke-linecap: round; stroke-dasharray: 360; stroke-dashoffset: 360; opacity: 0; animation: gv-connect calc(9.5s * var(--gv-energy)) ease-in-out infinite; transition: filter .24s ease, stroke-width .24s ease; }
        .gv-connection-line-slow { animation-duration: calc(14s * var(--gv-energy)); stroke-width: 1.2; }
        .gv-connection-line-c { animation-name: gv-connect-c; }
        .gv-connection-line-d { animation-name: gv-connect-d; }
        .gv-connection-active { stroke-width: 2.6; filter: drop-shadow(0 0 8px rgba(182, 255, 46, .85)); opacity: .9 !important; stroke-dashoffset: 0 !important; }
        @keyframes gv-connect { 0%{stroke-dashoffset:360; opacity:0;} 28%{stroke-dashoffset:0; opacity:.85;} 55%{stroke-dashoffset:0; opacity:.65;} 80%{opacity:0;} 100%{stroke-dashoffset:360; opacity:0;} }
        @keyframes gv-connect-c { 0%{stroke-dashoffset:360; opacity:0;} 32%{stroke-dashoffset:80; opacity:.6;} 55%{stroke-dashoffset:30; opacity:.45;} 82%{opacity:0;} 100%{stroke-dashoffset:360; opacity:0;} }
        @keyframes gv-connect-d { 0%{stroke-dashoffset:360; opacity:0;} 35%{stroke-dashoffset:60; opacity:.65;} 58%{stroke-dashoffset:20; opacity:.5;} 85%{opacity:0;} 100%{stroke-dashoffset:360; opacity:0;} }

        .gv-ring { fill: none; stroke: rgba(182, 255, 46, .16); stroke-width: 1; transform-origin: 300px 300px; }
        .gv-ring-1 { animation: gv-rotate 55s linear infinite; stroke-dasharray: 2 10; }
        .gv-ring-2 { animation: gv-rotate-rev 85s linear infinite; stroke-dasharray: 1 8; }
        @keyframes gv-rotate { to { transform: rotate(360deg); } }
        @keyframes gv-rotate-rev { to { transform: rotate(-360deg); } }

        .gv-orb-halo { transform-origin: 300px 300px; animation: gv-pulse 5.2s ease-in-out infinite; }
        .gv-orb-core { transform-origin: 300px 300px; animation: gv-pulse-core 5.2s ease-in-out infinite; }
        @keyframes gv-pulse { 0%,100%{transform:scale(1); opacity:.92} 50%{transform:scale(1.08); opacity:1} }
        @keyframes gv-pulse-core { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }

        .gv-core-particle-ring { transform-origin: 300px 300px; animation: gv-rotate calc(36s * var(--gv-energy)) linear infinite; }
        .gv-core-particle { animation: gv-twinkle 3.6s ease-in-out infinite; transform-origin: center; }

        /* ---------- Stylized Human Avatars ---------- */
        .gv-avatar { position: absolute; width: 68px; height: 68px; margin: -34px; transform-origin: center; pointer-events: none; }
        @media (max-width: 960px) { .gv-avatar { width: 48px; height: 48px; margin: -24px; } }
        .gv-avatar-ring { position: absolute; inset: -9px; border-radius: 50%; border: 1.5px solid rgba(182, 255, 46, .35); animation: gv-breathe 4.8s ease-in-out infinite; transition: transform .22s ease-out, opacity .22s ease-out, box-shadow .22s ease-out; }
        .gv-avatar-violet .gv-avatar-ring { border-color: rgba(182, 255, 46, .45); }
        .gv-avatar-gold .gv-avatar-ring { border-color: rgba(255,138,122,.45); }
        .gv-avatar-cyan .gv-avatar-ring { border-color: rgba(77,163,255,.45); }
        .gv-avatar-emerald .gv-avatar-ring { border-color: rgba(255,107,94,.45); }
        @keyframes gv-breathe { 0%,100%{ transform:scale(1); opacity:.6 } 50%{ transform:scale(1.08); opacity:1 } }
        
        .gv-avatar-forming .gv-avatar-ring { border-style: dashed; animation: gv-form-pulse calc(3.8s * var(--gv-energy)) ease-in-out infinite; }
        @keyframes gv-form-pulse { 0%,100%{ transform:scale(.94); opacity:.3 } 50%{ transform:scale(1.12); opacity:.75 } }

        .gv-avatar-satellite-track { position: absolute; inset: -14px; border-radius: 50%; animation: gv-rotate 16s linear infinite; pointer-events: none; }
        .gv-avatar-satellite { position: absolute; top: 0; left: 50%; width: 4px; height: 4px; border-radius: 50%; background: #f8e7c9; box-shadow: 0 0 6px #f8e7c9; }

        .gv-avatar-core { position: relative; width: 100%; height: 100%; border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,.45); transition: box-shadow .25s ease; }
        .gv-avatar-violet .gv-avatar-core { background: radial-gradient(circle at 35% 30%, #eaffb0, #4d7c0f 75%); }
        .gv-avatar-gold .gv-avatar-core { background: radial-gradient(circle at 35% 30%, #f8e7c9, #8a6d2f 75%); }
        .gv-avatar-cyan .gv-avatar-core { background: radial-gradient(circle at 35% 30%, #f4ffd6, #557a1f 75%); }
        .gv-avatar-emerald .gv-avatar-core { background: radial-gradient(circle at 35% 30%, #d9f873, #3f6212 75%); }
        .gv-avatar-forming .gv-avatar-core { opacity: .88; }
        .gv-avatar-active .gv-avatar-core { box-shadow: 0 0 0 3px rgba(248,231,201,.15), 0 12px 30px rgba(182,255,46,.5); }
        .gv-avatar-silhouette { width: 64%; height: 64%; fill: rgba(248,231,201,.92); filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4)); }

        .gv-avatar-label {
          position: absolute; top: -8px; left: calc(100% + 14px); white-space: nowrap;
          display: flex; flex-direction: column; padding: 7px 11px; border-radius: 12px;
          background: rgba(14, 13, 30, 0.88); border: 1px solid var(--gv-border); backdrop-filter: blur(8px);
          pointer-events: none; transition: opacity .18s ease-out, transform .18s ease-out;
          box-shadow: 0 8px 20px rgba(0,0,0,0.35);
        }
        .gv-avatar-label-tag { font-size: 9px; letter-spacing: .08em; font-weight: 700; color: var(--gv-cyan); }
        .gv-avatar-label-title { font-size: 12px; font-weight: 700; color: var(--gv-text-0); margin-top: 1px; }
        @media (max-width: 960px) { .gv-avatar-label { display: none; } }

        /* Autonomous Discovery Moment Banner */
        .gv-moment-banner {
          position: absolute;
          bottom: 12%;
          left: 50%;
          transform: translateX(-50%) translateY(14px);
          opacity: 0;
          pointer-events: none;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .gv-moment-active {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        .gv-moment-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          border-radius: 9999px;
          background: rgba(18, 16, 38, 0.85);
          border: 1px solid rgba(182, 255, 46, 0.35);
          backdrop-filter: blur(12px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(182, 255, 46, 0.25);
        }
        .gv-moment-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--gv-cyan);
          box-shadow: 0 0 8px var(--gv-cyan);
          animation: gv-twinkle 1.8s ease-in-out infinite;
        }
        .gv-moment-info { display: flex; flex-direction: column; line-height: 1.2; }
        .gv-moment-tag { font-size: 9.5px; letter-spacing: .06em; font-weight: 700; color: var(--gv-gold); }
        .gv-moment-title { font-size: 12px; font-weight: 700; color: #f8e7c9; }

        /* Ecosystem Artifact Cards */
        .gv-eco-card { 
          position: absolute; 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          padding: 8px 12px; 
          border-radius: 12px; 
          background: rgba(16, 15, 36, 0.65); 
          border: 1px solid var(--gv-border); 
          backdrop-filter: blur(8px); 
          box-shadow: 0 8px 22px rgba(0,0,0,.35); 
          animation-name: gv-float; 
          animation-timing-function: ease-in-out; 
          animation-iteration-count: infinite; 
          opacity: .92; 
          max-width: 180px; 
        }
        @media (max-width: 960px) { .gv-eco-card { display: none; } }
        @keyframes gv-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .gv-eco-icon { color: var(--gv-gold); flex-shrink: 0; }
        .gv-eco-text { display: flex; flex-direction: column; line-height: 1.2; min-width: 0; }
        .gv-eco-label { font-size: 9px; letter-spacing: .06em; color: var(--gv-text-2); font-weight: 600; }
        .gv-eco-value { font-size: 11.5px; font-weight: 700; color: var(--gv-text-0); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .gv-visual-copy { position: relative; text-align: center; margin-top: 24px; max-width: 380px; }
        .gv-logo { display: inline-flex; align-items: center; gap: 6px; font-family: var(--gv-font-display); font-size: 22px; font-weight: 600; color: var(--gv-text-0); margin-bottom: 8px; opacity: 0; animation: gv-rise .7s ease-out .25s forwards; }
        .gv-logo-accent { color: var(--gv-violet); }
        .gv-visual-tagline { font-family: var(--gv-font-display); font-weight: 340; font-size: 18px; line-height: 1.4; color: var(--gv-text-1); opacity: 0; animation: gv-rise .7s ease-out .35s forwards; }

        /* ---------- Right Form Panel ---------- */
        .gv-form-panel { 
          position: relative; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          padding: 64px 28px 48px; 
        }
        @media (max-width: 960px) { 
          .gv-form-panel { padding: 24px 20px 54px; } 
        }

        .gv-form-card {
          position: relative; 
          width: 100%; 
          max-width: 440px;
          background: linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.01)), rgba(9, 9, 22, 0.72);
          border: 1px solid rgba(255, 255, 255, 0.08); 
          border-radius: var(--gv-radius);
          padding: 38px 36px; 
          backdrop-filter: blur(16px);
          box-shadow: 0 32px 64px -20px rgba(0, 0, 0, 0.6), 0 10px 24px rgba(0, 0, 0, 0.35);
          transition: opacity .24s ease, transform .24s ease;
        }
        .gv-form-card::before {
          content: ''; position: absolute; inset: 0; border-radius: inherit; padding: 1px;
          background: linear-gradient(160deg, rgba(255,255,255,.18), rgba(255,255,255,0) 45%);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
        }
        .gv-form-card[data-transitioning="true"] { opacity: 0; transform: translateY(6px) scale(.99); }
        .gv-form-card[data-transitioning="false"] { opacity: 1; transform: translateY(0) scale(1); }

        .gv-eyebrow { font-size: 11px; letter-spacing: .15em; font-weight: 800; color: var(--gv-cyan); opacity: 0; animation: gv-rise .6s ease-out .4s forwards; }
        .gv-heading { display: flex; flex-direction: column; gap: 2px; margin: 12px 0 8px; opacity: 0; animation: gv-rise .6s ease-out .46s forwards; }
        .gv-heading-line1 { font-family: var(--gv-font-body); font-weight: 500; font-size: 15px; color: var(--gv-text-1); }
        .gv-heading-line2 { font-family: var(--gv-font-display); font-weight: 600; font-size: 32px; line-height: 1.1; color: var(--gv-text-0); }
        .gv-subtext { font-size: 14px; color: var(--gv-text-1); margin: 0 0 20px; line-height: 1.5; opacity: 0; animation: gv-rise .6s ease-out .52s forwards; }
        @keyframes gv-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        /* Social Provider Row (Google, X, Instagram) */
        .gv-provider-row { display: flex; gap: 12px; justify-content: center; margin: 0 0 6px; opacity: 0; animation: gv-rise .6s ease-out .58s forwards; }
        .gv-provider-btn { 
          flex: 1; 
          max-width: 90px;
          height: 46px; 
          border-radius: 14px; 
          border: 1px solid rgba(255, 255, 255, 0.09); 
          background: rgba(248, 231, 201, 0.04); 
          color: var(--gv-text-1); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          cursor: pointer; 
          transition: all .2s cubic-bezier(0.16, 1, 0.3, 1); 
        }
        .gv-provider-btn:hover { 
          transform: translateY(-2px); 
          background: rgba(248, 231, 201, 0.08); 
          border-color: rgba(182, 255, 46, 0.35); 
          box-shadow: 0 10px 24px rgba(182, 255, 46, 0.2); 
          color: #f8e7c9; 
        }
        .gv-provider-btn:active { transform: translateY(0) scale(.98); }
        .gv-provider-btn:focus-visible { outline: 2px solid var(--gv-cyan); outline-offset: 3px; }

        .gv-social-toast {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
          padding: 8px 12px;
          border-radius: 10px;
          background: rgba(182, 255, 46, 0.12);
          border: 1px solid rgba(182, 255, 46, 0.28);
          font-size: 12px;
          color: #d9cfae;
          animation: gv-fade-in 0.25s ease-out;
        }

        .gv-divider { display: flex; align-items: center; gap: 12px; margin: 18px 0 6px; opacity: 0; animation: gv-rise .6s ease-out .64s forwards; }
        .gv-divider-line { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,.14), transparent); }
        .gv-divider-text { font-size: 11.5px; color: var(--gv-text-2); letter-spacing: .03em; white-space: nowrap; }

        .gv-form { display: flex; flex-direction: column; gap: 15px; margin-top: 14px; opacity: 0; animation: gv-rise .6s ease-out .7s forwards; }
        .gv-field { display: flex; flex-direction: column; gap: 6px; }
        .gv-label { font-size: 12px; font-weight: 600; color: var(--gv-text-1); }
        .gv-input-wrap { display: flex; align-items: center; border: 1px solid var(--gv-border); border-radius: 13px; background: rgba(255,255,255,.02); transition: all .2s ease; }
        .gv-input-wrap:hover { border-color: rgba(255,255,255,.18); }
        .gv-input-wrap:focus-within { border-color: var(--gv-border-hover); box-shadow: 0 0 0 3px rgba(182,255,46,.15), 0 0 18px rgba(182,255,46,.12); background: rgba(182,255,46,.04); }
        .gv-input-wrap-error { border-color: var(--gv-danger); }
        .gv-input-wrap-error:focus-within { box-shadow: 0 0 0 3px rgba(255,123,138,.16); }
        .gv-input { flex: 1; min-width: 0; background: transparent; border: none; outline: none; padding: 12px 14px; font-size: 14px; color: var(--gv-text-0); font-family: var(--gv-font-body); }
        .gv-input::placeholder { color: var(--gv-text-2); }
        .gv-eye-btn { background: none; border: none; padding: 0 14px; color: var(--gv-text-2); cursor: pointer; display: flex; align-items: center; transition: color .2s ease; }
        .gv-eye-btn:hover { color: var(--gv-text-1); }
        .gv-field-error { font-size: 12px; color: var(--gv-danger); display: flex; align-items: center; gap: 4px; animation: gv-shake .3s ease; }
        @keyframes gv-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }

        .gv-row-between { display: flex; justify-content: flex-end; margin-top: -6px; }
        .gv-forgot { font-size: 12px; color: var(--gv-text-2); background: none; border: none; cursor: pointer; padding: 0; transition: color .2s ease; }
        .gv-forgot:hover { color: var(--gv-violet); }

        .gv-submit-error { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--gv-danger); background: rgba(217,119,87,.08); border: 1px solid rgba(217,119,87,.25); border-radius: 10px; padding: 10px 12px; animation: gv-shake .3s ease; }

        .gv-submit { 
          position: relative; 
          margin-top: 6px; 
          padding: 13px 20px; 
          border: none; 
          border-radius: 14px; 
          font-family: var(--gv-font-body); 
          font-weight: 700; 
          font-size: 14.5px; 
          color: #080714; 
          background: linear-gradient(120deg, var(--gv-gold), var(--gv-violet) 55%, var(--gv-cyan)); 
          background-size: 200% 100%; 
          background-position: 0% 0%; 
          cursor: pointer; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          gap: 8px; 
          transition: transform .18s ease, box-shadow .18s ease, background-position .5s ease; 
          box-shadow: 0 10px 28px rgba(182, 255, 46, .25); 
        }
        .gv-submit:hover:not(:disabled) { transform: translateY(-1px); background-position: 100% 0%; box-shadow: 0 14px 34px rgba(182, 255, 46, .35); }
        .gv-submit:active:not(:disabled) { transform: translateY(0) scale(.98); }
        .gv-submit:disabled { opacity: .75; cursor: progress; }
        .gv-submit:focus-visible { outline: 2px solid var(--gv-cyan); outline-offset: 3px; }
        .gv-spin { animation: gv-spin .9s linear infinite; }
        @keyframes gv-spin { to { transform: rotate(360deg); } }

        .gv-switch { margin-top: 22px; text-align: center; font-size: 13px; color: var(--gv-text-2); opacity: 0; animation: gv-rise .6s ease-out .76s forwards; }
        .gv-switch-btn { background: none; border: none; padding: 0; margin-left: 6px; cursor: pointer; color: var(--gv-violet); font-weight: 700; font-size: 13px; font-family: var(--gv-font-body); transition: color .2s ease; }
        .gv-switch-btn:hover { color: var(--gv-cyan); }
        .gv-switch-btn:focus-visible, .gv-eye-btn:focus-visible, .gv-forgot:focus-visible { outline: 2px solid var(--gv-cyan); outline-offset: 2px; border-radius: 4px; }

        /* ---------- Authenticated Session State (No double login) ---------- */
        .gv-active-session {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .gv-session-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 9999px;
          background: rgba(182, 255, 46, 0.12);
          border: 1px solid rgba(182, 255, 46, 0.3);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--gv-violet);
          align-self: flex-start;
        }
        .gv-session-user {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          border-radius: 18px;
          background: rgba(248, 231, 201, 0.05);
          border: 1px solid var(--gv-border);
        }
        .gv-session-avatar {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--gv-violet), var(--gv-cyan));
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(182, 255, 46, 0.3);
        }
        .gv-session-details {
          display: flex;
          flex-direction: column;
        }
        .gv-session-name {
          font-size: 17px;
          font-weight: 700;
          color: #f8e7c9;
          margin: 0;
        }
        .gv-session-email {
          font-size: 13px;
          color: var(--gv-text-1);
          margin: 2px 0 0;
        }
        .gv-session-note {
          font-size: 13.5px;
          color: var(--gv-text-2);
          line-height: 1.5;
          margin: 4px 0 10px;
        }
        .gv-session-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .gv-signout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 18px;
          border-radius: 14px;
          background: rgba(248, 231, 201, 0.05);
          border: 1px solid var(--gv-border);
          color: var(--gv-text-1);
          font-weight: 600;
          font-size: 13.5px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .gv-signout-btn:hover {
          background: rgba(255, 123, 138, 0.12);
          border-color: rgba(255, 123, 138, 0.35);
          color: var(--gv-danger);
        }

        /* ---------- Reduced Motion Mode ---------- */
        .gv-reduced-motion .gv-star, .gv-reduced-motion .gv-ambient-line, .gv-reduced-motion .gv-connection-line,
        .gv-reduced-motion .gv-ring-1, .gv-reduced-motion .gv-ring-2, .gv-reduced-motion .gv-orb-halo,
        .gv-reduced-motion .gv-orb-core, .gv-reduced-motion .gv-core-particle-ring, .gv-reduced-motion .gv-core-particle,
        .gv-reduced-motion .gv-eco-card, .gv-reduced-motion .gv-dot, .gv-reduced-motion .gv-avatar-ring,
        .gv-reduced-motion .gv-ambient::before, .gv-reduced-motion .gv-ambient::after, .gv-reduced-motion .gv-root {
          animation: none !important;
        }
        .gv-reduced-motion .gv-connection-line { opacity: .45; stroke-dashoffset: 0; }
        .gv-reduced-motion .gv-ambient-line { opacity: .35; stroke-dashoffset: 0; }
        .gv-reduced-motion .gv-cosmic-entrance, .gv-reduced-motion .gv-logo, .gv-reduced-motion .gv-visual-tagline,
        .gv-reduced-motion .gv-eyebrow, .gv-reduced-motion .gv-heading, .gv-reduced-motion .gv-subtext,
        .gv-reduced-motion .gv-provider-row, .gv-reduced-motion .gv-divider, .gv-reduced-motion .gv-form,
        .gv-reduced-motion .gv-switch {
          animation: none !important; opacity: 1 !important; transform: none !important;
        }
        .gv-reduced-motion .gv-form-card { transition: none; }
      `}</style>

      {/* Top Bar: Back Link or Close Button */}
      <div className="gv-top-bar">
        {!onClose ? (
          <Link href="/" className="gv-back-btn">
            <ArrowLeft size={15} />
            <span>Back to GiniVibe</span>
          </Link>
        ) : (
          <span />
        )}

        {onClose && (
          <button 
            type="button" 
            onClick={onClose} 
            className="gv-close-btn"
            aria-label="Close authentication modal"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="gv-ambient" />

      <div className="gv-layout">
        {/* Left Side: Living Cosmic Constellation Scene */}
        <div className="gv-visual-panel">
          <CosmicScene 
            mode={mode} 
            reducedMotion={reducedMotion} 
            pageParallax={pageParallax} 
            transitioning={transitioning} 
          />
          <div className="gv-visual-copy">
            <div className="gv-logo">
              <span>Gini</span><span className="gv-logo-accent">Vibe</span>
            </div>
            <p className="gv-visual-tagline">{copy.tagline}</p>
          </div>
        </div>

        {/* Right Side: Clean, Accessible Production Form Card */}
        <div className="gv-form-panel">
          <div className="gv-form-card" data-transitioning={transitioning}>
            {user ? (
              renderAuthenticatedSession()
            ) : (
              <>
                <div className="gv-eyebrow">{copy.eyebrow}</div>
                <h1 className="gv-heading">
                  <span className="gv-heading-line1">{copy.headingLine1}</span>
                  <span className="gv-heading-line2">{copy.headingLine2}</span>
                </h1>
                <p className="gv-subtext">{copy.sub}</p>

                {/* Social Provider Buttons (Google, X, Instagram) - FUTURE OAUTH READY */}
                <div className="gv-provider-row">
                  {PROVIDERS.map((p) => {
                    const Icon = p.Icon;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className="gv-provider-btn"
                        onClick={() => handleSocialClick(p.label)}
                        aria-label={`${mode === "login" ? "Sign in" : "Sign up"} with ${p.label}`}
                        title={`${p.label} (Coming Soon)`}
                      >
                        <Icon />
                      </button>
                    );
                  })}
                </div>

                {socialToast && (
                  <div className="gv-social-toast" role="status">
                    <Sparkles size={14} className="text-indigo-400 shrink-0" />
                    <span>{socialToast}</span>
                  </div>
                )}

                <div className="gv-divider">
                  <span className="gv-divider-line" />
                  <span className="gv-divider-text">{copy.dividerLabel}</span>
                  <span className="gv-divider-line" />
                </div>

                <form className="gv-form" onSubmit={handleSubmit} noValidate>
                  {mode === "register" && (
                    <>
                      <div className="gv-field">
                        <label htmlFor="gv-name" className="gv-label">Full Name (optional)</label>
                        <div className="gv-input-wrap">
                          <input
                            id="gv-name"
                            type="text"
                            value={values.name}
                            onChange={update("name")}
                            placeholder="Alex Morgan"
                            autoComplete="name"
                            className="gv-input"
                          />
                        </div>
                      </div>

                      <div className="gv-field">
                        <label htmlFor="gv-username" className="gv-label">Username</label>
                        <div className={`gv-input-wrap${errors.username ? " gv-input-wrap-error" : ""}`}>
                          <input
                            id="gv-username"
                            type="text"
                            value={values.username}
                            onChange={update("username")}
                            placeholder="Minimum 8 characters"
                            autoComplete="username"
                            className="gv-input"
                            required
                          />
                        </div>
                        {errors.username && (
                          <div className="gv-field-error" role="alert">{errors.username}</div>
                        )}
                      </div>
                    </>
                  )}

                  <div className="gv-field">
                    <label htmlFor="gv-email" className="gv-label">
                      {mode === "login" ? "Email or Username" : "Email Address"}
                    </label>
                    <div className={`gv-input-wrap${errors.email ? " gv-input-wrap-error" : ""}`}>
                      <input
                        id="gv-email"
                        type={mode === "login" ? "text" : "email"}
                        value={values.email}
                        onChange={update("email")}
                        placeholder={mode === "login" ? "you@example.com or username" : "you@example.com"}
                        autoComplete={mode === "login" ? "username" : "email"}
                        className="gv-input"
                        required
                      />
                    </div>
                    {errors.email && (
                      <div className="gv-field-error" role="alert">{errors.email}</div>
                    )}
                  </div>

                  <div className="gv-field">
                    <label htmlFor="gv-password" className="gv-label">Password</label>
                    <div className={`gv-input-wrap${errors.password ? " gv-input-wrap-error" : ""}`}>
                      <input
                        id="gv-password"
                        type={showPassword ? "text" : "password"}
                        value={values.password}
                        onChange={update("password")}
                        placeholder="••••••••"
                        autoComplete={mode === "login" ? "current-password" : "new-password"}
                        className="gv-input"
                        required
                      />
                      <button
                        type="button"
                        className="gv-eye-btn"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && (
                      <div className="gv-field-error" role="alert">{errors.password}</div>
                    )}
                  </div>

                  {mode === "register" && (
                    <div className="gv-field">
                      <label htmlFor="gv-confirm" className="gv-label">Confirm Password</label>
                      <div className={`gv-input-wrap${errors.confirm ? " gv-input-wrap-error" : ""}`}>
                        <input
                          id="gv-confirm"
                          type={showPassword ? "text" : "password"}
                          value={values.confirm}
                          onChange={update("confirm")}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          className="gv-input"
                          required
                        />
                      </div>
                      {errors.confirm && (
                        <div className="gv-field-error" role="alert">{errors.confirm}</div>
                      )}
                    </div>
                  )}

                  {mode === "login" && (
                    <div className="gv-row-between">
                      <button 
                        type="button" 
                        className="gv-forgot"
                        onClick={() => setSocialToast("Password recovery will be sent to your registered email.")}
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {submitError && (
                    <div className="gv-submit-error" role="alert">
                      ⚠ {submitError}
                    </div>
                  )}
                  {expiredNotice && !submitError && (
                    <div className="gv-submit-error" role="status" style={{ borderColor: 'var(--color-accent)' }}>
                      Your session expired. Please sign in again.
                    </div>
                  )}

                  <button type="submit" className="gv-submit" disabled={loading}>
                    {loading ? (
                      <Loader2 size={18} className="gv-spin" />
                    ) : (
                      <>
                        <span>{copy.submit}</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>

                <div className="gv-switch">
                  <span>{copy.switchPrompt}</span>
                  <button 
                    type="button" 
                    className="gv-switch-btn" 
                    onClick={() => switchMode(mode === "login" ? "register" : "login")}
                  >
                    {copy.switchAction}
                  </button>
                </div>

                <div className="gv-switch" style={{ marginTop: 8 }}>
                  <span>Are you a business?</span>
                  <Link href="/enterprise" className="gv-switch-btn">
                    Enterprise login / sign up
                  </Link>
                </div>
                {mode === "register" && (
                  <div className="gv-switch" style={{ marginTop: 4 }}>
                    <span>Want personalized matching?</span>
                    <Link href="/register" className="gv-switch-btn">
                      Sign up with interests
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
