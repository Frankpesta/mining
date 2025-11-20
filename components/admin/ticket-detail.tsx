"use client";

import { useState } from "react";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Id } from "@/convex/_generated/dataModel";

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

export function TicketDetail({
  ticket,
  adminId,
}: {
  ticket: Ticket;
  adminId: Id<"users">;
}) {
  const convex = useConvex();
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleReply = async () => {
    if (!replyMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setSending(true);
    try {
      await convex.mutation(api.tickets.replyToTicket, {
        ticketId: ticket._id,
        userId: adminId,
        message: replyMessage,
        isAdminReply: true,
      });
      toast.success("Reply sent successfully");
      setReplyMessage("");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (
    newStatus: "open" | "in_progress" | "resolved" | "closed",
  ) => {
    setUpdatingStatus(true);
    try {
      await convex.mutation(api.tickets.updateTicketStatus, {
        ticketId: ticket._id,
        status: newStatus,
        assignedTo: newStatus === "in_progress" ? adminId : undefined,
      });
      toast.success("Ticket status updated");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to update ticket status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "open":
        return "default";
      case "in_progress":
        return "secondary";
      case "resolved":
        return "outline";
      case "closed":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/tickets">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tickets
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{ticket.subject}</CardTitle>
                  <CardDescription>
                    From {ticket.name} ({ticket.email})
                    {ticket.company && ` • ${ticket.company}`}
                  </CardDescription>
                </div>
                <Badge variant={getStatusBadgeVariant(ticket.status)}>
                  {ticket.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Message:</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {ticket.message}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  Created: {formatDate(ticket.createdAt)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Replies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ticket.replies.length === 0 ? (
                <p className="text-sm text-muted-foreground">No replies yet</p>
              ) : (
                ticket.replies.map((reply) => (
                  <div
                    key={reply._id}
                    className={`rounded-lg border p-4 ${
                      reply.isAdminReply ? "bg-muted/50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium">
                          {reply.user?.email || "Unknown"}
                          {reply.isAdminReply && (
                            <Badge variant="secondary" className="ml-2">
                              Admin
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(reply.createdAt)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reply</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Type your reply here..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={6}
              />
              <Button onClick={handleReply} disabled={sending || !replyMessage.trim()}>
                <Send className="mr-2 h-4 w-4" />
                {sending ? "Sending..." : "Send Reply"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Status</p>
                <Select
                  value={ticket.status}
                  onValueChange={(value) =>
                    handleStatusChange(
                      value as "open" | "in_progress" | "resolved" | "closed",
                    )
                  }
                  disabled={updatingStatus}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Priority</p>
                <Badge variant={ticket.priority === "high" ? "destructive" : "default"}>
                  {ticket.priority}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Created</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(ticket.createdAt)}
                </p>
              </div>
              {ticket.resolvedAt && (
                <div>
                  <p className="text-sm font-medium mb-2">Resolved</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(ticket.resolvedAt)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

