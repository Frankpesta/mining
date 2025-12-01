"use client";

import { useState, useTransition } from "react";
import { Search, Shield, ShieldOff, UserX, UserCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toggleUserSuspension, updateUserRole } from "@/app/(admin)/admin/users/actions";
import type { Id } from "@/convex/_generated/dataModel";

type User = {
  _id: string;
  email: string;
  role: "user" | "admin";
  isSuspended: boolean;
  platformBalance: {
    ETH: number;
    USDT: number;
    USDC: number;
  };
  createdAt: number;
};

type UserManagementTableProps = {
  initialUsers: User[];
};

export function UserManagementTable({ initialUsers }: UserManagementTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleToggleSuspension = (userId: string, currentStatus: boolean) => {
    startTransition(async () => {
      try {
        await toggleUserSuspension(userId);
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, isSuspended: !currentStatus } : u)),
        );
        toast.success(`User ${currentStatus ? "unsuspended" : "suspended"} successfully`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update user status");
      }
    });
  };

  const handleRoleChange = (userId: string, newRole: "user" | "admin") => {
    startTransition(async () => {
      try {
        await updateUserRole(userId, newRole);
        setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
        toast.success(`User role updated to ${newRole}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update user role");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {searchQuery ? "No users found matching your search." : "No users found."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const totalBalance =
                  user.platformBalance.ETH + user.platformBalance.USDT + user.platformBalance.USDC;
                return (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          user.role === "admin"
                            ? "bg-purple-500/10 text-purple-500"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>{formatCurrency(totalBalance)}</TableCell>
                    <TableCell>
                      {user.isSuspended ? (
                        <span className="inline-flex rounded-full bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive">
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-500">
                          Active
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(user._id, user.role === "admin" ? "user" : "admin")}
                          >
                            {user.role === "admin" ? (
                              <>
                                <ShieldOff className="mr-2 h-4 w-4" />
                                Remove admin
                              </>
                            ) : (
                              <>
                                <Shield className="mr-2 h-4 w-4" />
                                Make admin
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleSuspension(user._id, user.isSuspended)}
                          >
                            {user.isSuspended ? (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Unsuspend
                              </>
                            ) : (
                              <>
                                <UserX className="mr-2 h-4 w-4" />
                                Suspend
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

