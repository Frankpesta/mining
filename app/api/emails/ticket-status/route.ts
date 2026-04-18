import { NextRequest, NextResponse } from "next/server";

import { verifyEmailDispatchSecret } from "@/lib/email/dispatch-secret";
import { sendTicketStatusChangeEmail } from "@/lib/email/tickets";

export async function POST(request: NextRequest) {
  if (!verifyEmailDispatchSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { to, ticketSubject, ticketId, status, userName, alsoNotifyAdmins } =
      body;

    if (!to || !ticketSubject || !ticketId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    await sendTicketStatusChangeEmail({
      to,
      ticketSubject,
      ticketId,
      status,
      userName,
      alsoNotifyAdmins: Boolean(alsoNotifyAdmins),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending ticket status change email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
