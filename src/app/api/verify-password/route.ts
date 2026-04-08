import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

function safeCompare(a: string, b: string): boolean {
  // Pad to same length to avoid leaking length info
  const maxLen = Math.max(a.length, b.length);
  const bufA = Buffer.alloc(maxLen, 0);
  const bufB = Buffer.alloc(maxLen, 0);
  Buffer.from(a).copy(bufA);
  Buffer.from(b).copy(bufB);
  return a.length === b.length && timingSafeEqual(bufA, bufB);
}

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const validPassword = process.env.VIP_PASSWORD;

    if (!validPassword) {
      return NextResponse.json(
        { error: "VIP access not configured" },
        { status: 404 }
      );
    }

    if (typeof password !== "string") {
      return NextResponse.json({ valid: false, error: "Invalid password" }, { status: 401 });
    }

    if (safeCompare(password, validPassword)) {
      return NextResponse.json({ valid: true });
    }

    return NextResponse.json({ valid: false, error: "Invalid password" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
