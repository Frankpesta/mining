import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getConvexClient } from "@/lib/convex/client";
import { requireAdminSession } from "@/lib/auth/session";
import { UserDetailsView } from "@/components/admin/user-details-view";
import { ArrowLeft, LogIn } from "lucide-react";
import Link from "next/link";
import { loginAsUser } from "./login-as-user/actions";
import { getCryptoPrices } from "@/lib/crypto-prices";

export default async function UserDetailsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireAdminSession();
  const { userId } = await params;
  const convex = getConvexClient();

  const userDetails = await convex.query(api.usersAdmin.getUserDetails, {
    userId: userId as any,
  });

  if (!userDetails) {
    notFound();
  }

  // Balances store raw coin quantities (e.g. BTC/ETH amounts), not USD,
  // so they must be converted with live prices before summing.
  const balanceCoins = new Set<string>();
  for (const balance of [userDetails.user.platformBalance, userDetails.user.miningBalance]) {
    for (const [key, value] of Object.entries(balance)) {
      if (key !== "others" && typeof value === "number" && value > 0) {
        balanceCoins.add(key);
      }
      if (key === "others" && value && typeof value === "object") {
        Object.keys(value).forEach((coin) => balanceCoins.add(coin));
      }
    }
  }
  const prices = balanceCoins.size > 0 ? await getCryptoPrices([...balanceCoins]) : {};

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

      <UserDetailsView userDetails={userDetails} showBalanceControls prices={prices} />
    </div>
  );
}
