import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiting (resets on cold start, which is fine for serverless)
const recentRequests = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5; // max 5 registrations per IP per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  // Clean old entries
  for (const [key, timestamp] of recentRequests) {
    if (now - timestamp > RATE_LIMIT_WINDOW) recentRequests.delete(key);
  }
  const count = [...recentRequests.entries()].filter(
    ([key]) => key.startsWith(ip + ":")
  ).length;
  if (count >= MAX_REQUESTS) return true;
  recentRequests.set(`${ip}:${now}`, now);
  return false;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { name, email } = await req.json();
    if (!email || !email.includes("@") || email.length > 320) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    if (!name || typeof name !== "string" || name.length > 200) {
      return NextResponse.json({ error: "Valid name required" }, { status: 400 });
    }

    // Subscribe to Substack newsletter
    const substackRes = await fetch(
      "https://angelinayang.substack.com/api/v1/free",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          first_url: "https://tl-listen.vercel.app",
          first_referrer: "tl-listen",
        }),
      }
    );

    console.log(`[Register] ${name} <${email}> - Substack status: ${substackRes.status}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed";
    console.error(`[Register Error] ${message}`);
    return NextResponse.json({ success: true });
  }
}
