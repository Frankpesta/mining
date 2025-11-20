"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";

import { signupAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthFormState = Awaited<ReturnType<typeof signupAction>>;

const initialState: AuthFormState = {
  status: "idle",
};

export function SignupForm() {
  const [state, formAction] = useActionState(signupAction, initialState);
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Join blockhashpro to access mining dashboards and portfolio analytics.
        </p>
      </div>

      <Field
        error={state.fieldErrors?.email}
        id="email"
        label="Email"
        placeholder="you@company.com"
        type="email"
        name="email"
      />
      <Field
        error={state.fieldErrors?.password}
        id="password"
        label="Password"
        placeholder="Strong password"
        type="password"
        name="password"
      />
      <Field
        error={state.fieldErrors?.referralCode}
        id="referralCode"
        label="Referral Code (Optional)"
        placeholder="Enter referral code"
        type="text"
        name="referralCode"
        defaultValue={refCode || ""}
      />

      {state.message ? (
        <p
          className={`text-sm ${
            state.status === "error" ? "text-destructive" : "text-green-600"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <SubmitButton label="Create account" />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...props} aria-invalid={Boolean(error)} />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Processing..." : label}
    </Button>
  );
}

