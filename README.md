# TL;Listen

**Turn articles and YouTube videos into audio briefings you can listen to on the go.**

Live at [tllisten.twosetai.com](https://tllisten.twosetai.com)

---

## Why I built this

I read a lot. Too much, probably. My browser tabs multiply like rabbits — long-form articles, YouTube explainers, research deep-dives. I'd save them "for later," but later never came. They just sat there, guilt-tripping me from the tab bar.

The thing is, I actually had time to consume this stuff — just not at my desk. I had time on walks, doing dishes, during my commute. What I needed wasn't another read-it-later app. I needed someone to *read it to me*.

So I built TL;Listen. Paste a link — article or YouTube video — and it distills the content into a concise spoken-word summary, then plays it back as an audio briefing. Like a personal podcast that's always about exactly what you're curious about today.

It's not a raw text-to-speech dump. The AI rewrites the content into natural, conversational language first — the kind of thing you'd actually want to listen to — then generates the audio. You can queue up multiple links and it plays through them like a playlist, with transitions between each piece.

I built this for myself, and I use it every day.

## How to use it

1. Go to [tllisten.twosetai.com](https://tllisten.twosetai.com)
2. Add your API keys (Claude and ElevenLabs)
3. Paste one or more links — articles or YouTube videos
4. Hit play. Listen to your briefing while you do other things.

You can also draft tweet or LinkedIn posts from any summary with one click.

## Tech stack

- **Next.js** and **React** (TypeScript)
- **Claude** (Anthropic) for summarization and post drafting
- **ElevenLabs** for text-to-speech
- **Tailwind CSS** for styling

Your API keys are stored locally in your browser and are never saved on our servers.

## Links

- [TL;Listen](https://tllisten.twosetai.com) — the app
- [TwoSetAI](https://twosetai.com) — our home
- [TwoSetAI Lab](https://twosetai.com/lab) — experiments and tools

---

Built by [TwoSetAI](https://twosetai.com)
