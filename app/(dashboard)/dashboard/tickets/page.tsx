import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getConvexClient } from "@/lib/convex/client";
import { api } from "@/convex/_generated/api";
import { UserTicketsList } from "@/components/dashboard/user-tickets-list";

export default async function UserTicketsPage() {
  const current = await getCurrentUser();
  if (!current) {
    redirect("/auth/login");
  }

  const convex = getConvexClient();
  const tickets = await convex.query(api.tickets.getUserTickets, {
    userId: current.user._id,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Support Tickets</h1>
        <p className="text-sm text-muted-foreground">
          View and manage your support tickets.
        </p>
      </div>

      <UserTicketsList tickets={tickets} userId={current.user._id} />
    </div>
  );
}

