# ✨ GiniVibe-Project

> **A production-grade, full-stack social media universe — Web + Android + iOS from a single monorepo.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Expo](https://img.shields.io/badge/Expo-57-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![WebRTC](https://img.shields.io/badge/WebRTC-Live_Video-333333)](https://webrtc.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](./frontend-app/LICENSE)

**GiniVibe-Project** is not a demo, not a tutorial clone, and not a Figma mockup with a login button.
It is a **real, working, production-grade social media platform** with a live feed, real-time chat,
online/offline events, group rooms, AI characters, astrology insights, and intelligent matching —
served through **two first-class clients**:

| Client | Stack | Runs on |
|---|---|---|
| 🌐 **Web app** (fully responsive, mobile-friendly) | Next.js 16 App Router, React 19, Tailwind CSS 4 | Desktop + mobile browsers |
| 📱 **Native mobile app** | Expo 57 + React Native + expo-router | Android + iOS (+ web via Expo) |

One backend family. One PostgreSQL source of truth. Two polished frontends. Zero shortcuts.

> 📌 **Repo note:** this public showcase repo is called **`Ginivibe-project`**
> (a separate private `Ginivibe` repo also exists — this one is the public face).

---

## 🎬 Demo Video — click to watch

<!-- OPTION B (active right now): video file committed to this repo.
     GitHub renders this player inline. Just press ▶. -->
<video src="./recording_20260915_14-09-15.mp4" controls="controls" muted="muted" playsinline="playsinline" style="max-width: 100%; border-radius: 12px;"></video>

> 👆 **Click ▶ above to play the demo directly on GitHub.**
> File: [`recording_20260915_14-09-15.mp4`](./recording_20260915_14-09-15.mp4)
> (Not the Android-specific video — this is the main product walkthrough.)

<details>
<summary><b>🎥 How is this video embedded? (3 options — click to expand)</b></summary>

<br>

**Option A — YouTube (recommended for virality + fast page loads) ⭐**
1. Upload the mp4 to YouTube as **Unlisted** (or Public).
2. Take a thumbnail/screenshot, save it as `demo-thumbnail.png` in the repo root.
3. Replace the `<video>` block above with:
```markdown
[![▶ Watch the GiniVibe Demo](demo-thumbnail.png)](https://www.youtube.com/watch?v=YOUR_VIDEO_ID)
```
Visitors click the image → YouTube opens. Whole README stays lightning-fast.

**Option B — Video committed to this repo (what you see right now) ✅**
- The mp4 (`~43 MB`) is pushed to git alongside the code.
- The `<video src="./recording_20260915_14-09-15.mp4" controls>` tag renders a native,
  **click-to-play player directly on the GitHub page** — no external site needed.
- Works because the file is under GitHub's 100 MB hard limit (`git check-ignore` confirms
  `*.mp4` is *not* git-ignored here).
- Trade-off: every `git clone` downloads those ~43 MB. Totally fine for a small demo video,
  but if you add more videos later, switch to Option A or Git LFS.

**Option C — External URL (Cloudinary / S3 / Drive)**
```html
<video src="https://YOUR-CDN-URL/demo.mp4" controls style="max-width:100%"></video>
```
Same clickable player, zero repo bloat. (Google Drive preview links do *not* embed well — prefer YouTube or a CDN.)

> **TL;DR:** keep Option B while the video is small. When you want reach, upload to YouTube
> and swap in the clickable-thumbnail snippet from Option A.

</details>

---

## 🚀 What is GiniVibe?

GiniVibe is a **social discovery + community + live interaction platform**. Think Instagram's feed,
WhatsApp-grade messaging ambition, Meetup's events, Discord's rooms, Character.AI's personalities,
and Co–Star-style self-insight — **fused into one cohesive universe** with a signature
glassmorphism design system shared across web and mobile.

People come to GiniVibe to:

- 👀 **Watch what others share** — a rich multimedia feed
- 💬 **Message anyone** — private 1:1 chat with requests, presence & typing-speed realtime
- 📅 **Host & join events** — online *and* offline
- 🔮 **Understand themselves** — astrology as personality insight, *never* future prediction
- 🤖 **Chat with AI characters** — and create their own
- 🏠 **Hang out in Rooms** — group text / voice / video spaces
- 💘 **Meet the right people** — personalized, astrology-aware, and AI natural-language matching

---

## 🏆 Why this is genuinely *production-grade*

Anyone can scaffold a to-do app. GiniVibe is engineered like software that has to survive real users:

- 🧱 **Service-oriented monorepo** — a core monolithic API (identity, feed, chat, presence)
  plus focused microservices (events, matching, rooms, Gini AI, astrology, enterprise ads),
  each independently runnable on its own port.
- 🗄️ **PostgreSQL as the source of truth** — Prisma-managed schemas, relations, composite keys
  (e.g. one like per user per post), unique constraints (one RSVP per user per event),
  and Docker Compose for one-command local databases.
- 🔐 **Real auth & tenancy** — JWT auth with middleware guards, role separation
  (consumer / enterprise tenant / super-admin), tenant-isolated queries so Org A can
  *never* touch Org B's campaigns, plus an immutable admin audit log.
- ⚡ **Two realtime pipelines** — Socket.io for global presence & call ringing, and a
  zero-DB pure-`ws` WebRTC signaling server for ultra-low-latency peer-to-peer video.
- 🛡️ **Abuse thinking built in** — rate-limited search APIs, deduplicated view counting
  (`@@unique([postId, viewerKey])` + `IntersectionObserver`), allowlist search projections,
  LDAP-style layered request lifecycle (router → guard → controller → service → Prisma).
- 💰 **Monetization from day one** — a native Enterprise Ad Network (campaign lifecycle
  `DRAFT → PENDING_REVIEW → ACTIVE`, ad decision API, impression/click telemetry)
  injected natively into the social feed.
- 🧪 **Tested & documented like a team owns it** — seed scripts for demo data,
  E2E testing guides, per-service READMEs, and a full `ARCHITECTURE.md` with onboarding path.
- 🎨 **One design language everywhere** — glassmorphism cards, fluid Reanimated/Motion
  micro-animations, Lucide icons, and safe-area-aware mobile layouts.

---

## ✨ Feature tour

### 👀 1. Feed — *watch what others share*
The beating heart of GiniVibe. Text updates, HD images, streaming video, and community-tagged
posts in one chronological stream — with tabs for **All / Images / Videos / Communities**,
optimistic likes, threaded inline comments (add / edit / delete with ownership rules),
native Web Share integration, deduplicated view counts, a `+ Create Post` modal
(text vs. media upload via Azure Blob), and **native sponsored cards** woven in after the
first post via the Enterprise Ad Server.

### 💬 2. Messages — *message anyone, privately*
Real-time 1:1 chat with Instagram-style **message requests** (pending / accept),
live **online presence**, conversation search (lexical + typo-tolerant + semantic hybrid
over an allowlist projection — never private fields), pagination, and mute support.
> 🔒 **Honest note:** full client-side **end-to-end encryption (E2EE)** is on the roadmap —
> transport is secured today; the README will claim E2EE only once keys never leave devices.
> Check `backend/monolithic/src/features/chat/` for the current implementation.

### 📅 3. Events — *host & join, online and offline*
A complete discovery → creation → RSVP loop (~3,000 lines across DB + API + UI):
- **🟢 Online events** — meeting URL + platform (Google Meet, Zoom, …), join-from-anywhere.
- **📍 Offline events** — venue + location, show-up-in-person energy.
- Live / Future / Ended status computed at query time (never stale), capacity limits,
  `INTERESTED / GOING / DECLINED` RSVPs with duplicate protection, organizer profiles,
  attendee lists, and personal hubs (*My Organized* / *My Attending*).

### 🔮 4. Astrology — *know yourself, not your "future"*
GiniVibe astrology is **self-knowledge, not fortune-telling**: what suits your personality,
what each house says about you, and where success awaits you. No "you will meet a stranger
on Tuesday" predictions — just premium natal-style insight that feeds matching and profiles.

### 🤖 5. Gini AI — *chat with characters, or create your own*
A dedicated AI microservice + Roleplay surfaces where users chat with AI personalities
and **author their own characters** (persona, greeting, backstory) for others to discover.
Markdown-rendered replies, character galleries, and persistent conversation threads.

### 🏠 6. Rooms — *group spaces for many, not just two*
Discord-style rooms for group **text, voice & video**: create a room, invite people,
talk together live. Backed by a dedicated rooms service plus the WebRTC/LiveKit realtime layer.

### 💘 7. Matching — *personalized, astrological, and now AI-powered*
- **Personalized matching** — interest / intent / compatibility signals.
- **Astrology matching** — synastry-style fit from personality profiles.
- **Custom filters** — age, city, interests, languages, and more.
- 🆕 **AI-based matching (the upgrade in progress):** the old UI label says
  *"mood-based matching"* — that is being replaced by **natural-language AI search**.
  Just type what you want in plain words:
  > *"I want to connect with a founder in Delhi"*
  …and the secure AI search engine (lexical + semantic hybrid, intent interpreter,
  privacy-filtered, rate-limited — see `backend/monolithic/src/features/search/`)
  finds the right people. No dropdown gymnastics. Just ask.

---

## 📱💻 One platform, every screen — Web *and* Native

This is the part most projects fake. GiniVibe ships **both**, from this repo:

### 🌐 Web — responsive by design, not by accident
- **Next.js 16 (App Router) + React 19 + Tailwind CSS 4** in `frontend-web/`.
- Route-group architecture — `(auth)`, `(dashboard)`, `(admin-portal)`, `enterprise-dashboard`
  — so consumer, B2B, and admin surfaces stay strictly separated.
- Fully **responsive down to phones**: fluid grids, adaptive sidebar → bottom-nav patterns,
  `object-fit: contain` media capped at viewport-friendly heights, touch-sized action bars.
- Zustand-powered global presence store keeps the whole dashboard alive over one socket.

### 📱 Mobile — real Android & iOS apps, not a wrapped website
- **Expo 57 + React Native + expo-router** in `frontend-app/` — file-based navigation
  (`(auth)`, `(tabs)`, `chat/`, `events/`, `rooms/`) mirroring the web information architecture.
- **Run it on Android *and* iOS today**: `npm run android` / `npm run ios` / scan the QR in Expo Go.
- Native-grade craft: Reanimated 60 fps transitions, BlurView glassmorphism, Skia + Lottie
  illustrations, `expo-image` / `expo-video` / `expo-image-picker`, haptics, safe-area contexts,
  async-storage persisted sessions.
- Same backend, same JWT, same realtime — **feature parity** across feed, messages, events,
  rooms, astrology, matching, and AI chat.

> **Bragging rights, earned:** most student/startup repos ship *either* a website *or* an app.
> GiniVibe ships a responsive web dashboard **plus** installable Android & iOS clients
> against one unified API family. That's a product, not a project. 🚀

---

## 🗂️ Repository map (folders only)

High-level only — each service has its own README with file-level detail:

```
Ginivibe-project/
├── android/                ← native Android shell / build artifacts
├── backend/
│   ├── monolithic/         ← core API: auth, feed, chat, presence, search (port 3001)
│   └── microservices/
│       ├── astrology/      ← personality-insight engine (port 3006)
│       ├── enterprise/     ← B2B ads, billing, admin control plane (port 3005)
│       ├── events-service/ ← events CRUD + RSVP service (port 3002)
│       ├── Gini_AI/        ← AI characters + roleplay brains (port 3004)
│       ├── live-matching/  ← WebRTC signaling, zero-DB ultra-low-latency (port 8080)
│       ├── non-live-matching/ ← offline / algorithmic matching (port 3003)
│       └── rooms-service/  ← group text / voice / video rooms (port 3007)
├── db/                     ← Docker Compose, backup + restore scripts
├── frontend-app/           ← Expo React Native app — Android + iOS (port 8081)
│   └── src/
│       ├── app/            ← expo-router routes: (auth), (tabs), chat, events, rooms
│       ├── components/
│       ├── constants/
│       ├── features/
│       └── hooks/
├── frontend-web/           ← Next.js responsive dashboard (port 3000)
│   ├── app/                ← (auth), (dashboard), (admin-portal), enterprise-dashboard
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── microservices/
│   ├── public/
│   ├── registry/
│   ├── styles/
│   └── types/
├── images/                 ← static showcase assets
└── sidebar/                ← shared sidebar design references
```

Deep dives: [`ARCHITECTURE.md`](./ARCHITECTURE.md) ·
[`FEED_SYSTEM.md`](./FEED_SYSTEM.md) ·
[`EVENTS_IMPLEMENTATION_COMPLETE.md`](./EVENTS_IMPLEMENTATION_COMPLETE.md) ·
[`LIVE_MATCHING.md`](./LIVE_MATCHING.md) ·
[`NON_LIVE_MATCHING.md`](./NON_LIVE_MATCHING.md) ·
[`ADS_SYSTEM.md`](./ADS_SYSTEM.md) ·
[`ADMIN_CONTROL_PLANE.md`](./ADMIN_CONTROL_PLANE.md) ·
[`ENTERPRISE.md`](./ENTERPRISE.md)

---

## 🧰 Tech stack

| Layer | Choices |
|---|---|
| Web | Next.js 16, React 19, Tailwind CSS 4, Motion, Zustand, socket.io-client, LiveKit client |
| Mobile | Expo 57, React Native 0.86, expo-router, Reanimated, Skia, Lottie, Blur, AsyncStorage |
| Backend | Node.js 20+, Express 5, Socket.io, `ws`, Zod validation, modular services |
| Data | PostgreSQL 16 (Docker), Prisma ORM, OpenSearch-ready hybrid search scaffolding |
| Realtime | WebRTC P2P video + `ws` signaling; Socket.io presence; LiveKit client surfaces |
| Media | Azure Blob uploads, expo-image / expo-video pipelines |
| Infra | Docker Compose (local DB), per-service `npm run dev`, EAS-ready mobile builds |

---

## ⚡ Run it locally (10 terminals, ~10 minutes)

### 0. Prerequisites
- Node.js 18+ (20+ recommended) · Docker · Git
- Android Studio emulator **or** Xcode simulator **or** the Expo Go app on your phone

### 1. Database
```bash
cd db
docker compose up -d
cd ../backend/monolithic
npx prisma db push
```

### 2. Backends (one terminal each)
```bash
# Core API — auth, feed, chat, presence, search (3001)
cd backend/monolithic && npm install && npm run dev

# Events (3002) · Non-live matching (3003) · Gini AI (3004)
cd backend/microservices/events-service && npm install && npm run dev
cd backend/microservices/non-live-matching && npm install && npm run dev
cd backend/microservices/Gini_AI && npm install && npm run dev

# Enterprise ads + admin (3005) · Astrology (3006) · Rooms (3007)
cd backend/microservices/enterprise && npm install && npm run dev
cd backend/microservices/astrology && npm install && npm run dev
cd backend/microservices/rooms-service && npm install && npm run dev

# Live-matching WebRTC signaling (8080)
cd backend/microservices/live-matching && npm install && npm run dev
```

### 3. Frontends
```bash
# 🌐 Web dashboard (3000) — try resizing to phone width, it's fully responsive
cd frontend-web && npm install && npm run dev
# → http://localhost:3000

# 📱 Mobile (8081) — Android / iOS / Expo Go
cd frontend-app && npm install && npx expo start
# press `a` (Android) · `i` (iOS) · or scan the QR with Expo Go
```

> ⚠️ Never commit secrets. Copy each service's `.env.example` → `.env` and fill in
> `DATABASE_URL` + `JWT_SECRET` locally. Mobile must use your LAN IP
> (`EXPO_PUBLIC_API_URL=http://192.168.x.x:3001`), not `localhost`.

### 4. Seed demo content (optional, recommended)
```bash
cd backend/monolithic
npx tsx src/seed_feed.ts   # creators, communities, posts, media
```

---

## 🗺️ Roadmap

- [ ] 🗣️ **AI natural-language matching GA** — *"connect me with a founder in Delhi"* (replacing the mood-based UI label)
- [ ] 🔒 **True E2EE messaging** — device-held keys, verifiable by users
- [ ] 🔔 Push + in-app notifications (events, requests, rooms)
- [ ] 🗺️ Maps for offline events · 📅 iCalendar export · 📊 organizer analytics
- [ ] 📦 Kafka/Redis Streams for ad telemetry at 500+ QPS · Redis-backed presence for horizontal scale
- [ ] ⚙️ Native `react-native-webrtc` bindings (today: WebView bridge for V1 speed)

---

## 🤝 Contributing

1. Never push straight to `main` — branch off (`feat/…`, `fix/…`), open a PR, get a review.
2. Keep diffs scoped: one feature, one service, one PR.
3. Read [`ARCHITECTURE.md`](./ARCHITECTURE.md) → *"Where Do I Make This Change?"* before touching shared code.

## 📄 License

See [`frontend-app/LICENSE`](./frontend-app/LICENSE). All rights reserved unless stated otherwise in a service directory.

---

<p align="center">
  <b>Built with obsession. Designed with glass. Shipped for web, Android & iOS. 💜</b><br>
  ⭐ Star <b>Ginivibe-project</b> if you believe social can be beautiful <i>and</i> engineered.
</p>
