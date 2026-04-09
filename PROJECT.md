# TL;Listen — Project Documentation

*Last updated: April 8, 2026*

## What We Built

**TL;Listen** is a web application that turns articles and YouTube videos into podcast-style audio briefings. Users paste one or more links, the app extracts the content, uses AI to create a concise spoken-word summary, converts it to natural-sounding audio, and plays it back in a playlist — like a personal podcast built on demand.

The name is a play on "TL;DR" (too long; didn't read) — but for listening.

**Live at**: [tllisten.twosetai.com](https://tllisten.twosetai.com)

### Core Use Case

You're about to drive somewhere and have five articles and two YouTube videos you want to catch up on. You paste the links into TL;Listen, hit "Add to Playlist," and by the time you're in the car, your audio briefings are ready. They play back-to-back, and you can skip, pause, or replay any item.

---

## Tech Stack

There is **no traditional backend** — no database, no server, no user accounts. The app is a static frontend with serverless API routes that pass through to external APIs. All user data lives in the browser (localStorage). The only server-side persistence is a Google Sheet that logs signups (write-only — the app never reads from it).

### Frontend

| Technology | Purpose |
|-----------|---------|
| **Next.js 16 (App Router)** | Full-stack React framework with serverless API routes |
| **TypeScript** | Type safety across frontend and API routes |
| **Tailwind CSS + CSS Custom Properties** | Utility-first CSS framework with a semantic theme variable system for dark/light mode |
| **PWA (manifest.json + Service Worker)** | Add-to-home-screen, app-like experience |

### External APIs (the real workhorses)

| API | Purpose | Auth |
|-----|---------|------|
| **Claude API (Anthropic, Sonnet)** | Distills content into spoken-word summaries | BYOK or server-side key |
| **ElevenLabs API** | Converts text summaries into natural-sounding audio | BYOK or server-side key |
| **Supadata API** | Fetches YouTube video transcripts reliably from any IP | Server-side key (free tier: 100/month) |
| **@extractus/article-extractor** | Extracts article text from any URL | None (npm package, runs server-side) |

### Infrastructure

| Technology | Purpose |
|-----------|---------|
| **Vercel (Pro plan)** | Hosting, serverless functions (API routes), CDN, auto-deploy from GitHub. Custom domain: `tllisten.twosetai.com` (CNAME via Namecheap DNS) |
| **GitHub** | Version control (angelina-yang/distill-cast) |
| **Google Sheets + Apps Script** | Write-only signup log (name, email, newsletter opt-in). Not a database — the app never reads from it |

### Data Storage

| What | Where | How |
|------|-------|-----|
| API keys, language, theme, draft instructions | Browser localStorage | Never sent to server except as request headers for API calls |
| User registration (name, email) | Browser localStorage | Also logged to Google Sheet on signup |
| Audio files | Browser memory (Blob URLs) | Generated per session, not persisted |
| Playlist state | React state (in-memory) | Lost on page refresh |

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
| `/api/draft-post` | POST | Summary → tweet or LinkedIn post draft via Claude |
| `/api/validate-keys` | POST | Tests API keys with real API calls before saving |

### File Structure

```
distill-cast/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, PWA registration
│   │   ├── page.tsx                # Main page (single-page app)
│   │   └── api/                    # 7 API routes (see above)
│   ├── components/
│   │   ├── header.tsx              # App header with logo, theme toggle, play button, settings
│   │   ├── url-input.tsx           # Link input with deduplication
│   │   ├── sidebar-playlist.tsx    # Left sidebar: active + done items
│   │   ├── welcome-modal.tsx       # First-time user registration
│   │   ├── settings-modal.tsx      # API keys, language, VIP password
│   │   ├── draft-modal.tsx         # Tweet/LinkedIn post drafting with instructions
│   │   ├── sw-register.tsx         # Service worker registration
│   │   └── player/
│   │       ├── audio-player.tsx    # Bottom bar: play/pause, skip, progress
│   │       └── progress-bar.tsx    # Seekable progress bar
│   ├── hooks/
│   │   ├── use-processing.ts       # Pipeline orchestrator (extract→summarize→TTS)
│   │   ├── use-audio-player.ts     # Audio playback, auto-advance, done tracking
│   │   ├── use-api-keys.ts         # API key + language storage (localStorage)
│   │   ├── use-user.ts             # User registration state (localStorage)
│   │   ├── use-theme.ts            # Dark/light theme toggle (localStorage)
│   │   └── use-draft-instructions.ts # Persistent tweet/LinkedIn style prefs
│   ├── lib/
│   │   ├── extract-youtube.ts      # YouTube transcript fetcher
│   │   ├── extract-article.ts      # Article content extractor
│   │   ├── url-utils.ts            # URL parsing and YouTube detection
│   │   ├── summarize.ts            # Claude API wrapper
│   │   ├── tts.ts                  # ElevenLabs API wrapper with voice switching
│   │   └── prompts.ts              # Claude prompt templates (summarize + social drafts)
│   └── types/
│       └── index.ts                # Shared TypeScript types
├── public/
│   ├── manifest.json               # PWA manifest
│   ├── sw.js                       # Service worker
│   └── icons/                      # PWA icons
├── scripts/
│   └── check-usage.ts              # Automated Anthropic + ElevenLabs spend tracker
├── .env.local                      # API keys (gitignored)
├── COSTS.md                        # Cost tracking sheet
└── PROJECT.md                      # This file
```

---

## Features

### Content Ingestion

| Feature | Description |
|---------|-------------|
| **Article extraction** | Paste any article URL and the app extracts the full text, stripping ads, navbars, and clutter. Uses `@extractus/article-extractor` server-side. Works on most public articles; paywalled content (e.g., NYTimes) is blocked by the publisher. |
| **YouTube transcript extraction** | Paste a YouTube URL and the app fetches the video's transcript via the Supadata API. Works for any video with captions (auto-generated or manual). No YouTube API key required on the user's side. |
| **Multi-link batch input** | Paste multiple URLs at once (one per line) and they all get added to the playlist. Process up to 2 items concurrently. |
| **Duplicate detection** | If you paste a URL that's already in the playlist, it's silently skipped. No wasted API calls. |

### AI Processing

| Feature | Description |
|---------|-------------|
| **AI-powered summarization** | Claude (Sonnet) reads the full content and generates a spoken-word summary — not bullet points, but a natural narration as if a podcast host were explaining it. Summaries are concise but comprehensive. |
| **Multilingual output** | Summarize in any of 8 languages (English, Chinese, Spanish, Japanese, Korean, French, German, Portuguese) regardless of the source language. An English article can become a Chinese audio briefing, or vice versa. |
| **Content truncation** | Long transcripts/articles are truncated to 50K characters before sending to Claude, balancing thoroughness with cost and timeout constraints. |
| **"Next up" transitions** | When playing multiple items back-to-back, Claude generates a short spoken transition ("Next up: [title]") between items so the playlist flows like a real podcast. |

### Audio Playback

| Feature | Description |
|---------|-------------|
| **Text-to-speech** | ElevenLabs converts summaries into natural-sounding audio. Auto-selects the right model and voice based on language (English uses `eleven_turbo_v2_5` for speed; other languages use `eleven_multilingual_v2`). |
| **Full player controls** | Play/pause, next/previous track, 10-second forward/backward skip, replay (restart current item), and a seekable progress bar. All standard podcast player functionality. |
| **Auto-advance playlist** | When one item finishes, the next ready item starts automatically. If the next item is still processing, the player waits and auto-plays when it's ready. |
| **Progressive playback** | The first item starts playing as soon as it's ready, while remaining items continue processing in the background. No waiting for the whole batch. |
| **Auto-done tracking** | Items automatically move to a "Done" section in the sidebar when their audio finishes playing. Click any done item to replay it. |

### Mobile & Responsive Design

| Feature | Description |
|---------|-------------|
| **Responsive layout** | Desktop: sidebar + main content side by side. Mobile: full-width content with slide-in overlay drawer for the playlist. |
| **Playlist toggle** | A persistent playlist icon in the header lets you show/hide the sidebar on both mobile and desktop. On mobile it opens an overlay drawer with backdrop; on desktop it toggles sidebar visibility. |
| **Header play button** | When your briefing is ready, a pulsing violet play button appears in the header bar — visible on any screen size. Solves the problem of the main "Play Briefing" button being scrolled off-screen on mobile. |
| **Touch-friendly controls** | Action buttons (mark done, remove) are always visible on mobile instead of requiring hover. Tap targets are sized for fingers, not cursors. |
| **Compact mobile player** | The bottom audio player bar uses tighter spacing and smaller text on mobile to avoid overflow. |

### Summary Highlighting

| Feature | Description |
|---------|-------------|
| **Live sentence tracking** | While audio plays, the summary text highlights the estimated current sentence. Already-read sentences dim. Gives you a visual sense of where you are in the briefing if you're reading along on your computer. |
| **Theme-adaptive colors** | Dark mode uses a yellow highlight (high contrast on black). Light mode uses a purple highlight (high contrast on white). The highlight color was specifically chosen for readability in each mode. |
| **Proportional estimation** | Since we don't have word-level timestamps from ElevenLabs, highlighting is estimated by mapping playback progress to sentence position by character count. Not perfectly synced, but surprisingly useful. |

### Social Post Drafting

| Feature | Description |
|---------|-------------|
| **One-click tweet drafting** | After listening to (or reading) a summary, click the X (Twitter) icon button below the summary card. Claude generates a tweet-length post (max 280 characters) based on the summary content. The draft appears in a modal with a character counter, copy button, and regenerate button. |
| **One-click LinkedIn drafting** | Same flow, different format. Click the LinkedIn icon button and Claude generates a professional LinkedIn post (100-300 words) with a hook opening, short paragraphs, engagement-driving question at the end, and 3-5 hashtags. |
| **Persistent style instructions** | Each platform (tweet and LinkedIn) has its own style instructions field. Users type their preferences once (e.g., "Casual tone, always tag @TwoSetAI, end with a hot take" for tweets, or "Professional but warm, mention my company, use data points" for LinkedIn). Instructions are saved in localStorage and automatically applied to every future draft. No need to re-type preferences for each post. |
| **Collapsible instructions editor** | The instructions panel is collapsible to keep the modal clean. When collapsed, it shows a preview of the saved instructions ("Using: 'Casual tone, tag @TwoSetAI...'"). Click to expand and edit. A "Save" button persists changes. |
| **Regenerate** | Not happy with the draft? Click "Regenerate" to get a fresh version. If you tweaked the instructions, the new draft uses the updated instructions. |
| **Character count** | For tweets, the modal shows a live character count (e.g., "247/280 characters"). The count turns red if the draft exceeds 280 characters. |
| **Platform-specific prompts** | Claude receives different system prompts per platform. Tweet prompts enforce the 280-character limit, punchy tone, and minimal hashtags. LinkedIn prompts encourage hook-driven openings, short paragraphs with line breaks, and a closing CTA or question. User style instructions are injected into the system prompt so they take priority over defaults. |
| **Same API key path** | Uses the same Claude API key (BYOK or VIP) as summarization. No new keys needed. The draft call is lightweight (summary text is already short), so it costs a fraction of a cent per generation. |
| **Standalone module** | The entire feature is self-contained across 3 new files (`draft-modal.tsx`, `use-draft-instructions.ts`, `/api/draft-post/route.ts`) plus prompt additions. It can be removed without affecting any other feature — true Lego-piece architecture. |

#### How it works (technical flow)

```
User clicks [Tweet] or [LinkedIn] button below summary
    |
    v
DraftModal opens → sends POST to /api/draft-post with:
  - platform ("tweet" or "linkedin")
  - summary text (already generated)
  - title of the article/video
  - user's style instructions (from localStorage, if any)
    |
    v
/api/draft-post → builds platform-specific Claude prompt:
  - System prompt: platform rules + user instructions
  - User message: "Here is the summary of [title]... Write a [tweet/LinkedIn post]"
  - Model: Claude Sonnet, max_tokens: 1024
    |
    v
Claude generates draft → returned to modal
    |
    v
User reviews → Copy to clipboard / Regenerate / Edit instructions
```

### Theming & Branding

| Feature | Description |
|---------|-------------|
| **Dark/Light mode** | Full dark and light theme support. Dark mode is the default. Toggle via a sun/moon icon in the header. Preference is saved in localStorage across sessions. |
| **CSS custom property system** | All colors are defined as semantic CSS variables (`--bg-primary`, `--text-primary`, `--accent`, `--highlight-bg`, etc.) in `:root` (light) and `.dark` (dark) selectors. Components reference these variables instead of hardcoded Tailwind color classes, making theme switching a single class toggle on `<html>`. |
| **Smooth transitions** | Background and text colors transition with `200ms ease` when switching themes, avoiding a jarring flash. |
| **Headphones logo** | A purple rounded-square icon with a headphones SVG serves as the app logo. Appears in the header next to "TL;Listen" and prominently in the welcome modal. Audio-themed, simple, recognizable. |
| **Sidebar gradient** | The playlist sidebar uses a subtle gradient background (purple-tinted in dark mode, lavender-tinted in light mode) instead of a flat color, adding visual depth. |
| **Numbered item badges** | Playlist items show their position number in a small purple circle badge instead of plain text, adding polish to the sidebar. |

### User Management & Access

| Feature | Description |
|---------|-------------|
| **BYOK (Bring Your Own Keys)** | Users enter their own Anthropic and ElevenLabs API keys. Keys are validated with real API calls before saving. Users pay their own API costs. |
| **VIP backdoor** | A password-protected mode that uses the app owner's server-side API keys. For trusted testers and friends. Timing-safe password comparison to prevent attacks. |
| **API key validation** | On save, the app makes test calls to both Anthropic and ElevenLabs APIs. If either key is invalid, it tells you which one and doesn't save. |
| **Language preference** | Choose your preferred briefing language once in settings. Remembered across sessions via localStorage. |

### PWA & Installation

| Feature | Description |
|---------|-------------|
| **Progressive Web App** | Full PWA with manifest and service worker. Can be installed to home screen on iOS and Android. Opens in standalone mode (no browser chrome). |
| **Offline shell** | Service worker caches the app shell so the app launches instantly even with poor connectivity. (API calls still need network.) |

### Data & Privacy

| Feature | Description |
|---------|-------------|
| **No backend database** | All user data (keys, preferences, registration) lives in the browser's localStorage. Nothing stored on the server. |
| **Signup logging** | Name and email are write-only logged to a Google Sheet for the app owner's records. The app never reads from the sheet. |
| **Honest privacy disclosure** | The app clearly explains that API keys transit through the server to make API calls but are never stored, logged, or shared. |
| **GDPR-compliant newsletter** | Newsletter opt-in is a separate, unchecked-by-default checkbox. Not bundled with app access. |

### Developer & Operations

| Feature | Description |
|---------|-------------|
| **Automated usage tracking** | A `scripts/check-usage.ts` script fetches spending from the Anthropic Admin API and ElevenLabs API, then appends results to `COSTS.md`. Can be run manually or scheduled. |
| **Debug logging** | API routes log key diagnostic info (VIP vs BYOK mode, content length, error messages) to Vercel function logs for troubleshooting production issues. |
| **XSS sanitization** | Article content is deeply sanitized server-side (HTML stripped, entities decoded, `javascript:` URIs removed) before being passed to Claude or displayed in the UI. |

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

**Desktop:**
```
┌───────────────────────────────────────────────────────┐
│  [☰] [🎧] TL;Listen    [▶ Play] [Clear All] [☀/🌙] [☕] [⚙️]│  ← Header
├────────────┬─────────────────────────────────────┤
│            │                                     │
│  Playlist  │    URL Input (always visible)        │
│            │                                     │
│  1. Item   │    ┌─────────────────────────┐      │
│  2. Item   │    │ Now Playing / Summary    │      │
│  3. Item   │    │ highlighted sentence     │      │
│            │    │ dimmed past sentences    │      │
│  ─ Done ─  │    │ upcoming sentences      │      │
│  ✓ Item    │    └─────────────────────────┘      │
│  ✓ Item    │                                     │
├────────────┴─────────────────────────────────────┤
│  [⏮][◁10] [⏯] [10▷][⏭][↺]  Title  ━━━━  0:42  │  ← Player
└──────────────────────────────────────────────────┘
```

**Mobile:**
```
┌────────────────────────┐
│ [☰] [🎧] TL;Listen [▶] [☀] [☕] [⚙️]│  ← Compact header
├────────────────────────┤
│                        │
│  URL Input             │
│                        │
│  ┌──────────────────┐  │
│  │ Summary with     │  │
│  │ live highlighting │  │
│  └──────────────────┘  │
│                        │
├────────────────────────┤
│ [◁10] [⏯] [10▷] 0:42  │  ← Compact player
└────────────────────────┘

Tap [☰] → slide-in overlay:
┌─────────┬──────────────┐
│Playlist │              │
│         │  (backdrop)  │
│ 1. Item │              │
│ 2. Item │              │
└─────────┴──────────────┘
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
| VIP password timing-safe comparison | Uses `crypto.timingSafeEqual` to prevent timing attacks. Server-side only, env var never exposed |
| No database | No user data stored on server — everything is client-side |
| XSS sanitization | Article content is deeply sanitized server-side: HTML tags stripped, HTML entities decoded, `javascript:` URIs removed, event handler attributes removed. Title is also sanitized. React's default JSX escaping provides a second layer of protection on the client |
| Rate limiting on /api/register | Max 5 requests per IP per minute to prevent email subscription abuse. Input length validation on name (200 chars) and email (320 chars) |

### Security Audit (April 7, 2026)

The following vulnerabilities were identified and fixed:

| Issue | Risk | Fix Applied |
|-------|------|-------------|
| **XSS via article content** | Extracted article HTML could contain malicious scripts. If rendered unsanitized, could steal API keys from localStorage. | Deep server-side sanitization in `extract-article.ts`: strips HTML tags, decodes entities, removes `javascript:` URIs and `on*=` event handlers. React JSX escaping provides client-side protection. No `dangerouslySetInnerHTML` used anywhere. |
| **VIP password timing attack** | Original `===` string comparison leaks password length via response timing differences. | Replaced with `crypto.timingSafeEqual` wrapped in a `safeCompare` function that pads both inputs to equal length. |
| **Email registration spam** | `/api/register` had no rate limiting. Attacker could spam-subscribe arbitrary emails to Substack. | Added IP-based rate limiting (5 requests/IP/minute) and input validation (email max 320 chars, name max 200 chars). |
| **API key transit disclosure** | Privacy note said keys are "stored locally and never saved on our servers" — but keys do transit through the server via request headers for API calls. | Updated privacy disclosure to honestly state: "your keys are sent to our server to make API calls on your behalf — they pass through our server but are never stored, logged, or shared." |
| **localStorage XSS exposure** | API keys in localStorage are vulnerable if any XSS exists. | Mitigated by the XSS sanitization above. No external HTML is ever rendered raw. All user-generated content goes through React's JSX escaping. |

### Privacy & Compliance

| Safeguard | Description |
|-----------|-------------|
| GDPR-compliant newsletter | Separate, unchecked opt-in checkbox. Not bundled with app access |
| No tracking | No analytics, no cookies (unless user opts into Vercel analytics) |
| Local-only storage | All user data (keys, preferences, registration) stored in browser localStorage |
| Privacy disclosure | Honest note: "Your API keys are stored locally in your browser. When you generate a briefing, your keys are sent to our server to make API calls on your behalf — they pass through our server but are never stored, logged, or shared." |

### Error Handling

| Scenario | Behavior |
|----------|----------|
| One URL fails | That item shows "Failed" with error message. Other items continue normally |
| API key invalid | Save button validates keys and shows specific error (Anthropic vs ElevenLabs) |
| TTS fails | Item marked as error, user can see written summary in main panel |
| Network error | Non-blocking — app continues working for other items |
| Duplicate URL | Detected and skipped with "Already in playlist" message |

---

## User Data Collection

### Google Sheets Integration

All user signups are logged to a Google Sheet via Google Apps Script webhook.

| Column | Description |
|--------|-------------|
| Timestamp | ISO 8601 timestamp of signup |
| Name | User's name from welcome modal |
| Email | User's email from welcome modal |
| Newsletter | "Yes" or "No" — whether user opted into TwoSetAI newsletter |
| Source | Always "tl-listen" — useful if multiple apps share the same sheet |

**How it works:**
1. User fills out welcome modal → clicks "Get Started"
2. `/api/register` sends name, email, newsletter consent to Google Apps Script webhook
3. Apps Script appends a row to the Google Sheet
4. If newsletter=true, also attempts Substack subscribe (may not work — use Sheet CSV import instead)

**Setup:**
- Google Sheet: linked via `GOOGLE_SHEET_WEBHOOK` env var (in `.env.local` and Vercel)
- Apps Script: deployed as web app, "Execute as: Me", "Who has access: Anyone"
- GDPR: newsletter opt-in is separate, unchecked by default. All signups recorded regardless for app usage tracking.

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
| Branded PWA icon | Replace generic headphones icon with custom-designed app icon for home screen |
| TwoSetAI Lab landing page | `twosetai.com/lab/` showcasing all tools, with `twosetai.com/lab/tllisten/` as a marketing page linking to `tllisten.twosetai.com`. Hybrid approach: Astro site handles landing pages, subdomain serves the app |

---

## Appendix: Problems Encountered & Fixes

A log of every significant bug, blocker, and debugging adventure encountered while building TL;Listen.

### 1. ANTHROPIC_API_KEY Collision

**Problem**: Claude Code (the CLI tool) sets `ANTHROPIC_API_KEY` as an empty string in the shell environment, which overrides the value in `.env.local`. The Claude API calls were failing with authentication errors even though the key was correctly set in the env file.

**Fix**: Renamed the env var from `ANTHROPIC_API_KEY` to `CLAUDE_API_KEY` throughout the codebase to avoid the collision.

### 2. Buffer Type Error in TTS Route

**Problem**: The ElevenLabs SDK returned audio data as a `Buffer`, but passing `Buffer` directly to `new NextResponse(buffer)` caused a TypeScript error — `Buffer` is not assignable to `BodyInit`.

**Fix**: Converted to `new Uint8Array(audioBuffer)` before passing to the response constructor.

### 3. ReadableStream Async Iterator

**Problem**: The ElevenLabs response doesn't support `for await...of` iteration, which is the typical way to consume a ReadableStream in Node.js.

**Fix**: Replaced with `response.getReader()` and a `while` loop using `reader.read()`.

### 4. VIP Password Special Characters

**Problem**: The VIP password `T9$vQ2!mL8@rZ5#pX7` contained a `$` character, which dotenv interpreted as a shell variable reference, resulting in partial password values.

**Fix**: Escaped the dollar sign with a backslash in `.env.local`: `"T9\$vQ2!mL8@rZ5#pX7"`.

### 5. Audio Replay Loop

**Problem**: After the playlist finished playing, the auto-play effect would re-trigger `playItem` on the first item, creating an infinite replay loop.

**Fix**: Added a `finished` state flag and an `autoPlayedRef` Set to track which items have been auto-played, preventing re-triggering.

### 6. URL Input Re-Processing Old Links

**Problem**: After submitting URLs, the old text stayed in the textarea. Submitting again would re-process previously submitted URLs.

**Fix**: Clear the textarea after submit. Added deduplication check against existing playlist URLs before processing.

### 7. Dev Server Wrong Directory

**Problem**: The dev server was started from the wrong working directory, causing `.env.local` to not be loaded. API calls failed silently.

**Fix**: Ensured `cd` to the `distill-cast/` project directory before running `npm run dev`.

### 8. Google Sheets Webhook — Three Separate Issues

**Problem 1**: The `SPREADSHEET_ID` placeholder in the Google Apps Script was never replaced with the actual sheet ID.

**Problem 2**: Google Apps Script returns a 302 redirect on POST requests. The redirect converted the POST to a GET, losing the request body. The webhook received empty data.

**Problem 3**: The `GOOGLE_SHEET_WEBHOOK` env var was set locally but not deployed to Vercel.

**Fixes**: (1) Replaced `SPREADSHEET_ID` with actual sheet ID `1XpVAkhfirri4IUi9MA93H0Byetk8GHdIRRPgZEdYXH0`. (2) Changed the fetch call to use `redirect: "follow"` and handle the redirect manually, preserving the POST body. (3) Added env var to Vercel dashboard.

### 9. YouTube Transcript Extraction on Vercel — The Big One

**Problem**: The `youtube-transcript` npm package scrapes YouTube's watch page to extract transcripts. This worked perfectly in local development but failed on Vercel production. YouTube detects Vercel's datacenter IPs and returns "Sign in to confirm you're not a bot" for every request.

**What we tried (all failed from Vercel):**

| Attempt | Approach | Result |
|---------|----------|--------|
| 1 | `youtube-transcript` npm package | Blocked — YouTube returns bot detection page |
| 2 | Custom innertube API (WEB client) | `LOGIN_REQUIRED` — "Sign in to confirm you're not a bot" |
| 3 | Innertube with MWEB client | Same `LOGIN_REQUIRED` response |
| 4 | Innertube with TVHTML5_SIMPLY_EMBEDDED client | Same `LOGIN_REQUIRED` response |
| 5 | Fetching watch page with browser-like headers + CONSENT cookie | YouTube still detected datacenter IP |
| 6 | Invidious API (open-source YouTube proxy) | Most instances disabled their APIs; only 1 had API enabled, and it was down |
| 7 | Piped API (another YouTube proxy) | Most instances dead (ECONNREFUSED, expired certs). One worked (`api.piped.private.coffee`) but was unreliable — failed on next attempt |
| 8 | Piped caption URL returned VTT format | TTML parser got "WEBVTT" header text instead of actual transcript. Claude received "WEBVTT" as the content and was confused |

**Final fix**: Switched to **Supadata API** (supadata.ai) — a dedicated YouTube transcript API that launched November 2025. It handles YouTube's bot detection on their end. Simple REST API: pass a video URL, get transcript JSON back. Free tier: 100 requests/month. Added `SUPADATA_API_KEY` env var to `.env.local` and Vercel.

**Lesson learned**: YouTube aggressively blocks transcript scraping from datacenter IPs. No amount of header spoofing, client-type switching, or cookie manipulation works. You need either a residential proxy or a dedicated API service.

### 10. Piped TTML vs VTT Format Mismatch

**Problem**: When the Piped API briefly worked, the caption URL returned VTT (WebVTT) format instead of the expected TTML. Our TTML parser found zero matches, but the raw text "WEBVTT" was passed through as the transcript content. Claude API received "WEBVTT" as the article text and responded with "I only see WEBVTT which is just a file format header."

**Fix**: Added multi-format caption parsing (JSON3, TTML, VTT) with fallback chain. Ultimately made moot by switching to Supadata.

### 11. Player Stuck When Clicking Play During Processing

**Problem**: If the user clicked the play button while an item was still in "summarizing" or "generating-audio" status, the `playItem` function would exit early (it checks `item.status !== "ready"`). But the UI showed a "playing" state, and the player appeared stuck — no audio playing, no progress, no way to unstick it.

**Fix**: Disabled the play button, seek bar, and skip controls while the current item is still processing. Added visible status labels ("Extracting...", "Summarizing...", "Generating audio...") in the player bar. Controls only become active once audio is ready.

### 12. Progress Bar Hard to Click

**Problem**: The progress bar was only 6px tall (`h-1.5`), making it very difficult to click on for seeking.

**Fix**: Added padding around the clickable area (`py-2`) so the click target is much larger while the visual bar remains thin. Also clamped seek values to valid range to prevent seeking past the end.

### 13. Missing Player Controls

**Problem**: The player only had play/pause and track skip (prev/next). No way to scrub within a track, replay, or skip forward/backward by a few seconds — basic podcast player functionality.

**Fix**: Added 10-second forward/backward skip buttons, a replay button (restart current item from beginning), and seekable progress bar (click anywhere on the timeline to jump to that timestamp).

### 14. Vercel 504 Timeout on Summarize

**Problem**: Long articles (50K characters) caused the Claude summarize call to exceed the default 60-second Vercel function timeout, returning a 504 Gateway Timeout. This affected both VIP and BYOK users.

**Fix**: Increased `maxDuration` from 60 to 300 seconds on the `/api/summarize` route. Vercel Pro plan supports up to 300s for serverless functions.

### 15. Mobile Layout Broken — Sidebar Overlapping Content

**Problem**: On mobile phones, the sidebar playlist and main content area rendered side-by-side in a `flex` row, causing the sidebar to squish the main content to an unreadable width. Text was truncated, the URL input was barely visible, and the "Play Briefing" button was off-screen.

**Fix**: Complete responsive redesign. Desktop keeps the side-by-side layout. Mobile hides the sidebar and replaces it with a slide-in overlay drawer (triggered by a playlist icon in the header). The drawer has a semi-transparent backdrop — tap outside to close. Added `animate-slide-in` CSS keyframe for smooth drawer animation. Main content uses full width on mobile.

### 16. Play Button Not Visible on Mobile

**Problem**: After adding items and waiting for processing to finish, users on mobile couldn't find the "Play Briefing" button. It was rendered in the main content area below the URL input, but on small screens it was scrolled below the fold — users didn't know their audio was ready.

**Fix**: Added a pulsing violet play button directly in the header bar. It appears whenever audio is ready but nothing has started playing. Visible on any screen size without scrolling. On mobile it shows just the triangle icon; on desktop it shows "Play" text too. Disappears once playback starts.

### 17. Hover-Dependent Actions Unusable on Mobile

**Problem**: The "mark as done" (checkmark) and "remove" (X) action buttons on playlist items only appeared on hover (`hidden group-hover:flex`). On touchscreens, there's no hover — these buttons were completely inaccessible.

**Fix**: Changed to `flex md:hidden md:group-hover:flex` — action buttons are always visible on mobile, hover-to-reveal on desktop. Also increased tap target size from `p-1` to `p-1.5` and added `active:` color states for touch feedback.

### 18. Summary Text Hard to Follow During Playback

**Problem**: While audio was playing, the summary text was static — just a block of text. If you were reading along on your computer while listening, there was no way to know which part of the summary was currently being spoken.

**Fix**: Added live sentence highlighting. The summary is split into sentences, and the estimated current sentence is highlighted with a violet background (`bg-violet-500/20`). Already-spoken sentences dim to gray (`text-zinc-400`). Position is estimated proportionally: `(currentTime / duration)` mapped against cumulative character counts. Not perfectly synced (would need word-level timestamps from ElevenLabs for that), but gives a useful visual anchor.

### 19. Friend's 500 Error on Summarize (Unresolved)

**Problem**: A friend testing the app got a 500 error on `/api/summarize` using the VIP passcode. The Anthropic API returned an error in 102ms. The friend said he "just created" his API keys, but he was using VIP mode (server-side keys). Spend was only $0.71 of $50.00 limit — not a billing issue.

**Status**: Added debug logging (VIP vs BYOK mode, content length, error details) to the summarize route. Waiting for next reproduction attempt to diagnose. May have been a transient Anthropic API issue.

### 20. Paywalled Articles Can't Be Extracted

**Problem**: A friend tried to process a New York Times article. The `@extractus/article-extractor` package fetches the URL server-side, but NYTimes returns a paywall page with minimal content. The extracted text was empty or just the headline.

**Status**: Known limitation — documented but not fixed. Article extraction only works on publicly accessible content. Paywalled sites (NYTimes, WSJ, Bloomberg, etc.) block server-side fetching. Potential future solutions: browser extension that extracts from the user's authenticated session, or reader-mode preprocessing.

### 21. Purple Highlight Invisible on Dark Background

**Problem**: The sentence highlighting during playback used a purple/violet translucent background (`bg-violet-500/20`). On the black background of dark mode, this was nearly invisible — users couldn't see which sentence was being highlighted.

**Fix**: Switched to a **theme-adaptive highlight color system**. Dark mode now uses yellow highlight (`rgba(250, 204, 21, 0.25)`) with yellow text — high contrast on black. Light mode uses purple highlight (`rgba(124, 58, 237, 0.15)`) with deep purple text — high contrast on white. Colors are defined as CSS custom properties (`--highlight-bg`, `--highlight-text`) that swap automatically with the theme.

### 22. Hardcoded Dark Theme Made Light Mode Impossible

**Problem**: Every component used hardcoded Tailwind classes like `bg-black`, `bg-zinc-900`, `text-white`, `border-zinc-800`, etc. Adding a light mode would have required adding `dark:` prefixes to every single class in every component — hundreds of changes with high risk of inconsistency.

**Fix**: Replaced all hardcoded color classes with CSS custom properties. Defined ~25 semantic color tokens (`--bg-primary`, `--bg-surface`, `--bg-elevated`, `--text-primary`, `--text-secondary`, `--text-muted`, `--border-primary`, `--accent`, etc.) with values for both `:root`/`.light` and `.dark` selectors. Components now use inline `style` attributes referencing these variables. Theme switching is a single class toggle on `<html>` — all colors update instantly via CSS cascade. This touched 11 files but resulted in a clean, maintainable theme system.

### 23. Theme Flash on Page Load

**Problem**: With CSS-variable-based theming, there's a risk of FOUC (flash of unstyled content) — the page briefly shows the wrong theme before JavaScript loads and applies the stored preference.

**Fix**: Set `class="dark"` directly on the `<html>` element in `layout.tsx` (server-rendered). Since dark is the default and most common choice, most users see no flash. The `useTheme` hook then runs on mount, reads localStorage, and updates the class if the user prefers light mode. The 200ms CSS transition on background/color makes any switch feel intentional rather than glitchy.
