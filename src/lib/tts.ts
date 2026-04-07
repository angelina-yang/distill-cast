import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

// Default English voice
const DEFAULT_EN_VOICE = "s3TPKV1kjDlVtZbl4Ksh"; // Adam

// Default multilingual voice — Rachel works well with eleven_multilingual_v2
// across all supported languages including Chinese, Japanese, Korean, etc.
const DEFAULT_MULTILINGUAL_VOICE = "21m00Tcm4TlvDq8ikWAM"; // Rachel

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

  // For English, use user's voice or default Adam
  // For other languages, use the language-specific default voice
  // (user's voice ID is ignored for non-English to ensure natural pronunciation)
  let voiceId: string;
  let modelId: string;

  if (language === "en") {
    voiceId = userVoiceId || process.env.ELEVENLABS_VOICE_ID || DEFAULT_EN_VOICE;
    modelId = "eleven_turbo_v2_5";
  } else {
    // For non-English, use multilingual model with Rachel (or user's voice)
    voiceId = userVoiceId || DEFAULT_MULTILINGUAL_VOICE;
    modelId = "eleven_multilingual_v2";
  }

  const response = await client.textToSpeech.convert(voiceId, {
    text,
    modelId,
  });

  const reader = response.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks);
}
