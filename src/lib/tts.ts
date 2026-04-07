import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

export async function textToSpeech(
  text: string,
  apiKey?: string,
  voiceId?: string
): Promise<Buffer> {
  const key = apiKey || process.env.ELEVENLABS_API_KEY;
  if (!key) {
    throw new Error("ElevenLabs API key is required. Please add it in Settings.");
  }

  const client = new ElevenLabsClient({ apiKey: key });
  const voice = voiceId || process.env.ELEVENLABS_VOICE_ID || "s3TPKV1kjDlVtZbl4Ksh";

  const response = await client.textToSpeech.convert(voice, {
    text,
    modelId: "eleven_turbo_v2_5",
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
