"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { resetPasswordAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthFormState = Awaited<ReturnType<typeof resetPasswordAction>>;

const initialState: AuthFormState = {
  status: "idle",
};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="token" value={token} />

      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
        <p className="text-sm text-muted-foreground">
          Passwords must include at least 8 characters, uppercase, lowercase, a number, and a
          symbol.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Strong password"
          aria-invalid={Boolean(state.fieldErrors?.password)}
        />
        {state.fieldErrors?.password ? (
          <p className="text-xs text-destructive">{state.fieldErrors.password}</p>
        ) : null}
      </div>

      {state.message ? (
        <p
          className={`text-sm ${
            state.status === "error" ? "text-destructive" : "text-green-600"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <SubmitButton label="Update password" />

      <p className="text-center text-sm text-muted-foreground">
        Back to{" "}
        <Link href="/auth/login" className="font-medium text-primary hover:underline">
          sign in
        </Link>
      </p>
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Updating..." : label}
    </Button>
  );
}

