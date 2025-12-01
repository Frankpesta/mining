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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { Eye, Plus } from "lucide-react";
import Link from "next/link";
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
};

export function UserTicketsList({
  tickets,
  userId,
}: {
  tickets: Ticket[];
  userId: Id<"users">;
}) {
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
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>My Tickets</CardTitle>
            <CardDescription>
              {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <Link href="/dashboard/tickets/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              New Ticket
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No tickets yet. Create your first ticket to get support.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket) => (
                      <TableRow key={ticket._id}>
                        <TableCell className="font-medium">{ticket.subject}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(ticket.status)}>
                            {ticket.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={ticket.priority === "high" ? "destructive" : "default"}
                          >
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(ticket.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Link href={`/dashboard/tickets/${ticket._id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="flex flex-col gap-4 md:hidden">
              {tickets.map((ticket) => (
                <div
                  key={ticket._id}
                  className="rounded-lg border border-border/60 bg-card p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{ticket.subject}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created {formatDate(ticket.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={getStatusBadgeVariant(ticket.status)}>
                      {ticket.status}
                    </Badge>
                    <Badge
                      variant={ticket.priority === "high" ? "destructive" : "default"}
                    >
                      {ticket.priority}
                    </Badge>
                  </div>
                  <div className="pt-2 border-t border-border/60">
                    <Link href={`/dashboard/tickets/${ticket._id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="mr-2 h-4 w-4" />
                        View Ticket
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

