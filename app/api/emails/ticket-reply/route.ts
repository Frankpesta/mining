import { NextRequest, NextResponse } from "next/server";

import { verifyEmailDispatchSecret } from "@/lib/email/dispatch-secret";
import { sendTicketReplyEmail } from "@/lib/email/tickets";

export async function POST(request: NextRequest) {
  if (!verifyEmailDispatchSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      to,
      ticketSubject,
      ticketId,
      replyMessage,
      isAdminReply,
      userName,
      alsoNotifyAdmins,
    } = body;

    if (!ticketSubject || !ticketId || !replyMessage) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    await sendTicketReplyEmail({
      to: typeof to === "string" ? to : "",
      ticketSubject,
      ticketId,
      replyMessage,
      isAdminReply: Boolean(isAdminReply),
      userName,
      alsoNotifyAdmins: Boolean(alsoNotifyAdmins),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending ticket reply email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
