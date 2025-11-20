"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { loginAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthFormState = Awaited<ReturnType<typeof loginAction>>;

const initialState: AuthFormState = {
  status: "idle",
};

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  return (
    <form action={formAction} className="space-y-6">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Access your mining dashboard and manage portfolios securely.
        </p>
      </div>
      <Field
        id="email"
        name="email"
        label="Email"
        type="email"
        placeholder="you@company.com"
        error={state.fieldErrors?.email}
      />
      <Field
        id="password"
        name="password"
        label="Password"
        type="password"
        placeholder="••••••••"
        error={state.fieldErrors?.password}
      />

      {state.message ? (
        <div className="space-y-2">
          <p className="text-sm text-destructive">{state.message}</p>
          {state.message.includes("verify your email") && (
            <Link
              href="/auth/resend-verification"
              className="text-sm font-medium text-primary hover:underline"
            >
              Resend verification email
            </Link>
          )}
        </div>
      ) : null}

      <SubmitButton label="Sign in" />

      <div className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
        <Link
          href="/auth/forgot-password"
          className="font-medium text-primary hover:underline"
        >
          Forgot your password?
        </Link>
        <p>
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/signup"
            className="font-medium text-primary hover:underline"
          >
            Register now
          </Link>
        </p>
      </div>
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
      {pending ? "Signing in..." : label}
    </Button>
  );
}

