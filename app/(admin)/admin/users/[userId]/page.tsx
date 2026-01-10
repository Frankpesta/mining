import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getConvexClient } from "@/lib/convex/client";
import { requireAdminSession } from "@/lib/auth/session";
import { UserDetailsView } from "@/components/admin/user-details-view";
import { ArrowLeft, LogIn } from "lucide-react";
import Link from "next/link";
import { loginAsUser } from "./login-as-user/actions";

export default async function UserDetailsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await requireAdminSession();
  const { userId } = await params;
  const convex = getConvexClient();

  const userDetails = await convex.query(api.usersAdmin.getUserDetails, {
    userId: userId as any,
  });

  if (!userDetails) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/users">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Users
            </Button>
          </Link>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            User Details
          </h1>
          <p className="text-sm text-muted-foreground">
            View and manage user account information
          </p>
        </div>
        <form action={loginAsUser.bind(null, userId)}>
          <Button type="submit" variant="default">
            <LogIn className="mr-2 h-4 w-4" />
            Login as User
          </Button>
        </form>
      </div>

      <UserDetailsView userDetails={userDetails} />
    </div>
  );
}
