import { NextRequest, NextResponse } from "next/server";

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

    if (password === validPassword) {
      return NextResponse.json({ valid: true });
    }

    return NextResponse.json({ valid: false, error: "Invalid password" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
