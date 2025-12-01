import { getCurrentUser } from "@/lib/auth/session";
import { getConvexClient } from "@/lib/convex/client";
import { api } from "@/convex/_generated/api";
import { ProfileForm } from "@/components/dashboard/profile-form";

export default async function ProfilePage() {
  const current = await getCurrentUser();
  if (!current) {
    return null;
  }

  const convex = getConvexClient();
  const profile = await convex.query(api.profiles.getProfileWithPicture, {
    userId: current.user._id,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Profile Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile information and profile picture.
        </p>
      </div>

      <ProfileForm initialProfile={profile} userId={current.user._id} />
    </div>
  );
}

