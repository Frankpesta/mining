import { NextRequest, NextResponse } from "next/server";
import { sendTicketStatusChangeEmail } from "@/lib/email/tickets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, ticketSubject, ticketId, status, userName } = body;

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

