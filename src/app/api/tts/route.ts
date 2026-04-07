import { NextRequest, NextResponse } from "next/server";
import { textToSpeech } from "@/lib/tts";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const audioBuffer = await textToSpeech(text);

    const uint8 = new Uint8Array(audioBuffer);
    return new NextResponse(uint8, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "TTS failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
