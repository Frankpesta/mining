import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getConvexClient } from "@/lib/convex/client";
import { api } from "@/convex/_generated/api";
import { TicketsManagement } from "@/components/admin/tickets-management";
import type { Id } from "@/convex/_generated/dataModel";

type Ticket = {
  _id: Id<"tickets">;
  userId?: Id<"users">;
  email: string;
  name: string;
  subject: string;
  message: string;
  company?: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  assignedTo?: Id<"users">;
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
  user?: {
    _id: Id<"users">;
    email: string;
  } | null;
};

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
  const ticketsData = await convex.query(api.tickets.getAllTickets, {
    status: searchParams.status as
      | "open"
      | "in_progress"
      | "resolved"
      | "closed"
      | undefined,
  });

  // Properly type the tickets with user data
  const tickets: Ticket[] = ticketsData.map((ticket) => ({
    ...ticket,
    user: ticket.user
      ? {
          _id: ticket.user._id as Id<"users">,
          email: ticket.user.email as string,
        }
      : null,
  }));

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

