# TL;Listen — Cost & Subscriptions Sheet

*Last updated: April 7, 2026*

## Monthly Subscriptions

| Service | Plan | Cost/month | What it does | Manage |
|---------|------|-----------|--------------|--------|
| Vercel | Pro | $20 | Hosting, deployment, 60s function timeout | [vercel.com/dashboard](https://vercel.com/dashboard) |
| ElevenLabs | Creator | $22 | Text-to-speech audio generation (30K chars/month) | [elevenlabs.io/app/settings](https://elevenlabs.io/app/settings) |
| **Total fixed** | | **$42/month** | | |

## Pay-as-you-go API Costs

| Service | Pricing | Estimated cost per item | Monthly cap | Manage |
|---------|---------|------------------------|-------------|--------|
| Anthropic (Claude API) | ~$3/M input tokens, ~$15/M output tokens (Sonnet) | ~$0.10–0.15 per article/video | $50/month (set by you) | [console.anthropic.com/settings/limits](https://console.anthropic.com/settings/limits) |
| ElevenLabs (included in Creator plan) | Included in $22/month plan | ~30K characters/month | Plan limit | See above |

## Cost Estimates by Usage

| Usage level | Articles/videos per day | Est. Anthropic cost/month | Total monthly cost |
|-------------|------------------------|---------------------------|-------------------|
| Light | 2–3 | ~$5–10 | ~$47–52 |
| Moderate | 5–10 | ~$15–30 | ~$57–72 |
| Heavy | 15–20 | ~$40–50 (hits cap) | ~$82–92 |

*Note: With BYOK (Bring Your Own Key), other users pay their own API costs. Only VIP password users consume your API quota.*

## Free Accounts (No Monthly Cost)

| Service | Purpose | Manage |
|---------|---------|--------|
| GitHub | Code repository (public repo: angelina-yang/distill-cast) | [github.com/angelina-yang/distill-cast](https://github.com/angelina-yang/distill-cast) |
| Buy Me a Coffee | Tip jar for supporters | [buymeacoffee.com/angelinayang](https://buymeacoffee.com/angelinayang) |
| Substack | Newsletter email collection (angelinayang.substack.com) | [angelinayang.substack.com/publish](https://angelinayang.substack.com/publish) |

## API Keys Location

| Key | Where it's stored | Environment variable name |
|-----|-------------------|--------------------------|
| Anthropic API Key | `.env.local` + Vercel env vars | `CLAUDE_API_KEY` |
| ElevenLabs API Key | `.env.local` + Vercel env vars | `ELEVENLABS_API_KEY` |
| ElevenLabs Voice ID | `.env.local` + Vercel env vars | `ELEVENLABS_VOICE_ID` |
| VIP Password | `.env.local` + Vercel env vars | `VIP_PASSWORD` |

## Cost Safeguards

1. **Anthropic monthly cap**: Set to $50/month at [console.anthropic.com/settings/limits](https://console.anthropic.com/settings/limits)
2. **ElevenLabs plan cap**: Creator plan has built-in character limit (30K chars/month)
3. **Vercel Pro**: Includes $20/month usage credit; overages are pay-as-you-go but unlikely for this scale
4. **BYOK model**: Public users bring their own API keys, so their usage doesn't cost you anything
5. **VIP password**: Only people you give the password to can use your server-side API keys
