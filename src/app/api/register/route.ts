import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    // Subscribe to Substack newsletter
    // Substack's public subscribe API endpoint
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

    // Log registration (in production, you'd store this in a database)
    console.log(`[Register] ${name} <${email}> - Substack status: ${substackRes.status}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed";
    console.error(`[Register Error] ${message}`);
    // Don't block the user even if Substack fails
    return NextResponse.json({ success: true });
  }
}
