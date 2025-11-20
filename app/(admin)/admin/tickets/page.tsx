import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getConvexClient } from "@/lib/convex/client";
import { api } from "@/convex/_generated/api";
import { TicketsManagement } from "@/components/admin/tickets-management";

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const current = await getCurrentUser();
  if (!current || current.user.role !== "admin") {
    redirect("/dashboard");
  }

  const convex = getConvexClient();
  const tickets = await convex.query(api.tickets.getAllTickets, {
    status: searchParams.status as
      | "open"
      | "in_progress"
      | "resolved"
      | "closed"
      | undefined,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Support Tickets</h1>
        <p className="text-sm text-muted-foreground">
          Manage and respond to customer support tickets.
        </p>
      </div>

      <TicketsManagement tickets={tickets} adminId={current.user._id} />
    </div>
  );
}

