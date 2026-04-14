import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

// Default English voice
const DEFAULT_EN_VOICE = "s3TPKV1kjDlVtZbl4Ksh"; // Adam

// Default multilingual voice — Rachel works well with eleven_multilingual_v2
// across all supported languages including Chinese, Japanese, Korean, etc.
const DEFAULT_MULTILINGUAL_VOICE = "21m00Tcm4TlvDq8ikWAM"; // Rachel

// ElevenLabs has a ~5000 character limit per TTS request.
// For full-read mode, articles can be much longer, so we split into chunks.
const MAX_CHUNK_CHARS = 4500;

function splitIntoChunks(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }

    // Find the last sentence boundary before maxLen
    const slice = remaining.slice(0, maxLen);
    let splitAt = -1;
    for (const sep of [". ", "! ", "? ", ".\n", "!\n", "?\n", "\n\n"]) {
      const idx = slice.lastIndexOf(sep);
      if (idx > splitAt) splitAt = idx + sep.length;
    }

    // Fallback: split at last space
    if (splitAt <= 0) {
      splitAt = slice.lastIndexOf(" ");
    }
    // Last resort: hard cut
    if (splitAt <= 0) {
      splitAt = maxLen;
    }

    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }

  return chunks;
}

async function convertChunk(
  client: ElevenLabsClient,
  voiceId: string,
  modelId: string,
  text: string
): Promise<Buffer> {
  const response = await client.textToSpeech.convert(voiceId, {
    text,
    modelId,
  });

  const reader = response.getReader();
  const parts: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) parts.push(value);
  }
  return Buffer.concat(parts);
}

export async function textToSpeech(
  text: string,
  apiKey?: string,
  userVoiceId?: string,
  language: string = "en"
): Promise<Buffer> {
  const key = apiKey || process.env.ELEVENLABS_API_KEY;
  if (!key) {
    throw new Error("ElevenLabs API key is required. Please add it in Settings.");
  }

  const client = new ElevenLabsClient({ apiKey: key });

  let voiceId: string;
  let modelId: string;

  if (language === "en") {
    voiceId = userVoiceId || process.env.ELEVENLABS_VOICE_ID || DEFAULT_EN_VOICE;
    modelId = "eleven_turbo_v2_5";
  } else {
    voiceId = userVoiceId || DEFAULT_MULTILINGUAL_VOICE;
    modelId = "eleven_multilingual_v2";
  }

  const chunks = splitIntoChunks(text, MAX_CHUNK_CHARS);

  if (chunks.length === 1) {
    return convertChunk(client, voiceId, modelId, chunks[0]);
  }

  // Process chunks sequentially to maintain order
  const audioBuffers: Buffer[] = [];
  for (const chunk of chunks) {
    const buf = await convertChunk(client, voiceId, modelId, chunk);
    audioBuffers.push(buf);
  }
  return Buffer.concat(audioBuffers);
}
