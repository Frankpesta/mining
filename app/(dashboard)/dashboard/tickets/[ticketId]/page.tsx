import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getConvexClient } from "@/lib/convex/client";
import { api } from "@/convex/_generated/api";
import { UserTicketDetail } from "@/components/dashboard/user-ticket-detail";

export default async function UserTicketDetailPage({
  params,
}: {
  params: { ticketId: string };
}) {
  const current = await getCurrentUser();
  if (!current) {
    redirect("/auth/login");
  }

  const convex = getConvexClient();
  const ticket = await convex.query(api.tickets.getTicketWithReplies, {
    ticketId: params.ticketId as any,
  });

  if (!ticket || (ticket.userId && ticket.userId !== current.user._id)) {
    redirect("/dashboard/tickets");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ticket Details</h1>
        <p className="text-sm text-muted-foreground">
          View and reply to your support ticket.
        </p>
      </div>

      <UserTicketDetail ticket={ticket} userId={current.user._id} />
    </div>
  );
}

