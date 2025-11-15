import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getConvexClient } from "@/lib/convex/client";
import { getCurrentUser } from "@/lib/auth/session";
import { formatDate } from "@/lib/utils";
import { ProfilesTable } from "@/components/admin/profiles-table";

export default async function AdminProfilesPage() {
  const current = await getCurrentUser();
  if (!current || current.user.role !== "admin") {
    return null;
  }

  const convex = getConvexClient();
  const profiles = await convex.query(api.profiles.getAllProfiles, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">User Profiles</h1>
        <p className="text-sm text-muted-foreground">
          View and manage all user profiles with their information and profile pictures.
        </p>
      </div>

      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle>All User Profiles</CardTitle>
          <CardDescription>
            Complete list of user profiles with contact information and profile pictures.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfilesTable profiles={profiles} />
        </CardContent>
      </Card>
    </div>
  );
}

