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

export function UserTicketDetail({
  ticket,
  userId,
}: {
  ticket: Ticket;
  userId: Id<"users">;
}) {
  const convex = useConvex();
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleReply = async () => {
    if (!replyMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setSending(true);
    try {
      await convex.mutation(api.tickets.replyToTicket, {
        ticketId: ticket._id,
        userId,
        message: replyMessage,
        isAdminReply: false,
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
        <Link href="/dashboard/tickets">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tickets
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{ticket.subject}</CardTitle>
                <CardDescription>
                  Ticket #{ticket._id} • Created {formatDate(ticket.createdAt)}
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
                <p className="text-sm font-medium mb-2">Your Message:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {ticket.message}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
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
                        {reply.isAdminReply ? "Support Team" : "You"}
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

        {ticket.status !== "closed" && (
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
        )}
      </div>
    </div>
  );
}

