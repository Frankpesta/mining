import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getConvexClient } from "@/lib/convex/client";
import { api } from "@/convex/_generated/api";
import { TicketDetail } from "@/components/admin/ticket-detail";

export default async function AdminTicketDetailPage({
  params,
}: {
  params: { ticketId: string };
}) {
  const current = await getCurrentUser();
  if (!current || current.user.role !== "admin") {
    redirect("/dashboard");
  }

  const convex = getConvexClient();
  const ticket = await convex.query(api.tickets.getTicketWithReplies, {
    ticketId: params.ticketId as any,
  });

  if (!ticket) {
    redirect("/admin/tickets");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ticket Details</h1>
        <p className="text-sm text-muted-foreground">
          View and respond to support ticket.
        </p>
      </div>

      <TicketDetail ticket={ticket} adminId={current.user._id} />
    </div>
  );
}

