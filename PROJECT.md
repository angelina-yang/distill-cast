# TL;Listen — Project Documentation

*Last updated: April 7, 2026*

## What We Built

**TL;Listen** is a web application that turns articles and YouTube videos into podcast-style audio briefings. Users paste one or more links, the app extracts the content, uses AI to create a concise spoken-word summary, converts it to natural-sounding audio, and plays it back in a playlist — like a personal podcast built on demand.

The name is a play on "TL;DR" (too long; didn't read) — but for listening.

### Core Use Case

You're about to drive somewhere and have five articles and two YouTube videos you want to catch up on. You paste the links into TL;Listen, hit "Add to Playlist," and by the time you're in the car, your audio briefings are ready. They play back-to-back, and you can skip, pause, or replay any item.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16 (App Router) | Full-stack React framework with API routes |
| **Language** | TypeScript | Type safety across frontend and backend |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **AI Summarization** | Claude API (Anthropic, Sonnet model) | Distills content into spoken-word summaries |
| **Text-to-Speech** | ElevenLabs API | Converts text summaries into natural audio |
| **YouTube Extraction** | youtube-transcript (npm) | Fetches video transcripts without API key |
| **Article Extraction** | @extractus/article-extractor | Extracts article text from any URL |
| **Hosting** | Vercel (Pro plan) | Deployment, serverless functions, CDN |
| **Code Repository** | GitHub (public) | Version control at angelina-yang/distill-cast |
| **PWA** | manifest.json + Service Worker | Add-to-home-screen, app-like experience |

---

## Architecture & Data Flow

### Pipeline (per item)

```
User pastes URL
    |
    v
/api/extract — Detects YouTube vs article, extracts content/transcript
    |
    v
/api/summarize — Claude creates a spoken-word summary in chosen language
    |
    v
/api/tts — ElevenLabs converts summary text to MP3 audio
    |
    v
Browser stores audio as Blob URL, adds to playlist
    |
    v
Audio player auto-plays, auto-advances through playlist
```

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/extract` | POST | URL → title + content (YouTube transcript or article text) |
| `/api/summarize` | POST | Content → spoken-word summary via Claude |
| `/api/tts` | POST | Text → MP3 audio via ElevenLabs |
| `/api/register` | POST | Subscribes user email to Substack (if opted in) |
| `/api/verify-password` | POST | Validates VIP password for backdoor access |
| `/api/validate-keys` | POST | Tests API keys with real API calls before saving |

### File Structure

```
distill-cast/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, PWA registration
│   │   ├── page.tsx                # Main page (single-page app)
│   │   └── api/                    # 6 API routes (see above)
│   ├── components/
│   │   ├── header.tsx              # App header with settings, coffee link
│   │   ├── url-input.tsx           # Link input with deduplication
│   │   ├── sidebar-playlist.tsx    # Left sidebar: active + done items
│   │   ├── welcome-modal.tsx       # First-time user registration
│   │   ├── settings-modal.tsx      # API keys, language, VIP password
│   │   ├── sw-register.tsx         # Service worker registration
│   │   └── player/
│   │       ├── audio-player.tsx    # Bottom bar: play/pause, skip, progress
│   │       └── progress-bar.tsx    # Seekable progress bar
│   ├── hooks/
│   │   ├── use-processing.ts       # Pipeline orchestrator (extract→summarize→TTS)
│   │   ├── use-audio-player.ts     # Audio playback, auto-advance, done tracking
│   │   ├── use-api-keys.ts         # API key + language storage (localStorage)
│   │   └── use-user.ts             # User registration state (localStorage)
│   ├── lib/
│   │   ├── extract-youtube.ts      # YouTube transcript fetcher
│   │   ├── extract-article.ts      # Article content extractor
│   │   ├── url-utils.ts            # URL parsing and YouTube detection
│   │   ├── summarize.ts            # Claude API wrapper
│   │   ├── tts.ts                  # ElevenLabs API wrapper with voice switching
│   │   └── prompts.ts              # Claude prompt templates (multilingual)
│   └── types/
│       └── index.ts                # Shared TypeScript types
├── public/
│   ├── manifest.json               # PWA manifest
│   ├── sw.js                       # Service worker
│   └── icons/                      # PWA icons
├── .env.local                      # API keys (gitignored)
├── COSTS.md                        # Cost tracking sheet
└── PROJECT.md                      # This file
```

---

## Design & User Experience

### User Journey (New User)

1. **Welcome modal** — Enter name and email. Optional newsletter checkbox (GDPR-compliant: unchecked by default, separate from app access).
2. **Settings modal** (auto-opens) — Two paths:
   - **BYOK path**: Enter your own Anthropic + ElevenLabs API keys. Keys are validated on Save.
   - **VIP path**: Enter a VIP password to use the app owner's server-side keys.
3. **Choose language** — "What language do you want your briefings in?" (8 languages supported).
4. **Paste links** — URL input is always visible. Paste one or more links, one per line. Hit "Add to Playlist."
5. **Processing** — Sidebar shows real-time status per item (Extracting → Summarizing → Generating audio → Ready). Items process with concurrency of 2.
6. **Listen** — Hit "Play Briefing." Audio plays back-to-back with "Next up: [title]" transitions between items.
7. **Done tracking** — When an item finishes playing, it automatically moves to the "Done" section at the bottom of the sidebar. Click any done item to replay.
8. **Add more** — Paste more links anytime. They append to the playlist. Duplicates are detected and skipped.

### UI Layout

```
┌──────────────────────────────────────────────────┐
│  TL;Listen          [Clear All] [☕] [⚙️]        │  ← Header
├────────────┬─────────────────────────────────────┤
│            │                                     │
│  Playlist  │    URL Input (always visible)        │
│            │                                     │
│  1. Item   │    ┌─────────────────────────┐      │
│  2. Item   │    │ Now Playing / Summary    │      │
│  3. Item   │    │                         │      │
│            │    │ Full text summary shown  │      │
│  ─ Done ─  │    │ while audio plays       │      │
│  ✓ Item    │    └─────────────────────────┘      │
│  ✓ Item    │                                     │
├────────────┴─────────────────────────────────────┤
│  [⏮] [⏯] [⏭]  Title          ━━━━━━━━━  0:42  │  ← Player
└──────────────────────────────────────────────────┘
```

### Key UX Decisions

- **Progressive playback**: First item starts playing as soon as it's ready, while remaining items continue processing in the background.
- **No login system**: Registration is name + email stored in localStorage. No passwords, no accounts, no database.
- **BYOK model**: Users bring their own API keys. Keys never leave the browser except to make API calls through the server.
- **Auto-done**: Items move to "Done" automatically when audio finishes — no manual button needed.
- **Always-open input**: URL input is never locked. Add links while others are processing.
- **Deduplication**: Same URL won't be processed twice in one session.

---

## Multilingual Support

### 8 Languages Supported

English, Chinese (Mandarin), Spanish, Japanese, Korean, French, German, Portuguese

### How It Works

1. **Claude prompt** adapts to output in the selected language, regardless of input language (e.g., Chinese article → English summary, or English video → Chinese summary).
2. **ElevenLabs model** auto-switches:
   - English → `eleven_turbo_v2_5` (faster, English-optimized)
   - Other languages → `eleven_multilingual_v2` (supports 29 languages)
3. **Voice** auto-switches:
   - English → Adam (default) or user's custom voice
   - Other languages → Rachel (multilingual) or user's custom voice

---

## Safeguards

### Cost Protection

| Safeguard | Description |
|-----------|-------------|
| Anthropic monthly cap | Set to $50/month in Anthropic console |
| ElevenLabs plan limit | Creator plan has built-in 30K character/month cap |
| BYOK model | Public users pay their own API costs |
| VIP password | Only trusted people can use your server-side keys |
| Content truncation | Transcripts/articles truncated to 50K characters before summarization |
| Concurrency limit | Max 2 items processed simultaneously to avoid rate limits |

### Security

| Safeguard | Description |
|-----------|-------------|
| API keys in .env.local | Gitignored, never committed to public repo |
| Vercel env vars | Server-side only, never exposed to browser |
| User keys in localStorage | Stored in user's browser, sent via headers per-request, never logged |
| VIP password hashed comparison | Server-side only, env var never exposed |
| No database | No user data stored on server — everything is client-side |

### Privacy & Compliance

| Safeguard | Description |
|-----------|-------------|
| GDPR-compliant newsletter | Separate, unchecked opt-in checkbox. Not bundled with app access |
| No tracking | No analytics, no cookies (unless user opts into Vercel analytics) |
| Local-only storage | All user data (keys, preferences, registration) stored in browser localStorage |
| Privacy disclosure | Clear note: "Your API keys are stored locally in your browser and never saved on our servers" |

### Error Handling

| Scenario | Behavior |
|----------|----------|
| One URL fails | That item shows "Failed" with error message. Other items continue normally |
| API key invalid | Save button validates keys and shows specific error (Anthropic vs ElevenLabs) |
| TTS fails | Item marked as error, user can see written summary in main panel |
| Network error | Non-blocking — app continues working for other items |
| Duplicate URL | Detected and skipped with "Already in playlist" message |

---

## PWA (Progressive Web App)

- **manifest.json**: App name, icons, theme color, standalone display mode
- **Service worker**: Caches app shell for offline launch capability
- **Add to Home Screen**: Works on iOS (Safari) and Android (Chrome)
- **Standalone mode**: Opens without browser chrome when launched from home screen

---

## Future Roadmap (Not Built Yet)

| Feature | Description |
|---------|-------------|
| Voice Q&A | Ask follow-up questions about content by voice while driving |
| RSS podcast feed | Generate a private podcast feed for Apple Podcasts / Spotify / CarPlay |
| Daily briefing | Auto-fetch from saved sources each morning |
| Persistent storage | Database to save playlists across sessions |
| Custom app icon/logo | Branded PWA icon for home screen |
| Landing page | Marketing page for sharing the tool publicly |
