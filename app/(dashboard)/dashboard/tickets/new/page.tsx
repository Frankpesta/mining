import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { NewTicketForm } from "@/components/dashboard/new-ticket-form";

export default async function NewTicketPage() {
  const current = await getCurrentUser();
  if (!current) {
    redirect("/auth/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create New Ticket</h1>
        <p className="text-sm text-muted-foreground">
          Submit a support ticket and we'll get back to you soon.
        </p>
      </div>

      <NewTicketForm userId={current.user._id} userEmail={current.user.email} />
    </div>
  );
}

