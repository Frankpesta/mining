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
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const current = await getCurrentUser();
  if (!current || current.user.role !== "admin") {
    redirect("/dashboard");
  }

  const convex = getConvexClient();
  const ticketsData = await convex.query(api.tickets.getAllTickets, {
    status: params.status as
      | "open"
      | "in_progress"
      | "resolved"
      | "closed"
      | undefined,
  });

  // Properly type the tickets with user data
  const tickets: Ticket[] = ticketsData.map((ticket: {
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
  }) => {
    const userData = ticket.user as unknown as {
      _id: Id<"users">;
      email: string;
    } | null | undefined;
    
    return {
      ...ticket,
      user: userData && typeof userData === "object" && "_id" in userData
        ? {
            _id: userData._id,
            email: userData.email,
          }
        : null,
    };
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

