import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getConvexClient } from "@/lib/convex/client";
import { api } from "@/convex/_generated/api";
import { UserTicketDetail } from "@/components/dashboard/user-ticket-detail";
import type { Id, Doc } from "@/convex/_generated/dataModel";

type TicketReply = {
  _id: Id<"ticketReplies">;
  ticketId: Id<"tickets">;
  userId: Id<"users">;
  message: string;
  isAdminReply: boolean;
  createdAt: number;
  user?: {
    _id: Id<"users">;
    email: string;
    role: "user" | "admin";
  } | null;
};

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
  replies: TicketReply[];
};

export default async function UserTicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const current = await getCurrentUser();
  if (!current) {
    redirect("/auth/login");
  }

  const { ticketId } = await params;
  const convex = getConvexClient();
  const ticketData = await convex.query(api.tickets.getTicketWithReplies, {
    ticketId: ticketId as Id<"tickets">,
  });

  if (!ticketData || (ticketData.userId && ticketData.userId !== current.user._id)) {
    redirect("/dashboard/tickets");
  }

  // Properly type the ticket with user data
  const ticket: Ticket = {
    ...ticketData,
    replies: ticketData.replies.map((reply: Doc<"ticketReplies"> & { user?: { _id: Id<"users">; email: string; role: "user" | "admin" } | null }) => {
      const userData = reply.user as unknown as {
        _id: Id<"users">;
        email: string;
        role: "user" | "admin";
      } | null | undefined;
      
      return {
        ...reply,
        user: userData && typeof userData === "object" && "_id" in userData
          ? {
              _id: userData._id,
              email: userData.email,
              role: userData.role,
            }
          : null,
      };
    }),
  };

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

