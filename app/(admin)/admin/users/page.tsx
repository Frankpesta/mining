import { api } from "@/convex/_generated/api";
import { UserManagementTable } from "@/components/admin/user-management-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getConvexClient } from "@/lib/convex/client";

export default async function AdminUsersPage() {
  const convex = getConvexClient();
  const users = await convex.query(api.usersAdmin.listAllUsers, { limit: 200 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">User management</h1>
        <p className="text-sm text-muted-foreground">
          Search users, adjust balances, toggle roles, and review account activity from a single
          surface.
        </p>
      </div>

      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle>All users</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <UserManagementTable initialUsers={users} />
        </CardContent>
      </Card>
    </div>
  );
}
