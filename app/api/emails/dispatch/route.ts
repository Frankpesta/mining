import { NextRequest, NextResponse } from "next/server";

import { verifyEmailDispatchSecret } from "@/lib/email/dispatch-secret";
import { handleEmailDispatch } from "@/lib/email/notifications";

export async function POST(request: NextRequest) {
  if (!verifyEmailDispatchSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const kind = typeof body.kind === "string" ? body.kind : "";
    const payload =
      body.payload && typeof body.payload === "object" && body.payload !== null
        ? (body.payload as Record<string, unknown>)
        : {};

    if (!kind) {
      return NextResponse.json({ error: "Missing kind" }, { status: 400 });
    }

    await handleEmailDispatch(kind, payload);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[email] Dispatch error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
