"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { resendVerificationEmailAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthFormState = Awaited<ReturnType<typeof resendVerificationEmailAction>>;

const initialState: AuthFormState = {
  status: "idle",
};

export function ResendVerificationForm() {
  const [state, formAction] = useActionState(resendVerificationEmailAction, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Resend verification email</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email address and we'll send you a new verification link.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@company.com"
          aria-invalid={Boolean(state.fieldErrors?.email)}
          required
        />
        {state.fieldErrors?.email ? (
          <p className="text-xs text-destructive">{state.fieldErrors.email}</p>
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

      <SubmitButton label="Send verification email" />

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link href="/auth/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Sending..." : label}
    </Button>
  );
}

