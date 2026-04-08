import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";

function safeCompare(a: string, b: string): boolean {
  const maxLen = Math.max(a.length, b.length);
  const bufA = Buffer.alloc(maxLen, 0);
  const bufB = Buffer.alloc(maxLen, 0);
  Buffer.from(a).copy(bufA);
  Buffer.from(b).copy(bufB);
  return a.length === b.length && timingSafeEqual(bufA, bufB);
}

// Strict rate limit: 5 attempts per IP per 5 minutes
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);

    if (isRateLimited(`vip:${ip}`, MAX_ATTEMPTS, WINDOW_MS)) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again in a few minutes." },
        { status: 429 }
      );
    }

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
