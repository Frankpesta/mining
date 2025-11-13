"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getConvexClient } from "@/lib/convex/client";
import {
  hashPassword,
  validatePasswordStrength,
  verifyPassword,
} from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { createTokenExpiry, generateRandomToken } from "@/lib/auth/tokens";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email/auth";

type AuthFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

const SignupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string(),
});

const LoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string(),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string(),
});

function formatZodErrors(
  result: z.ZodSafeParseError<unknown>,
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  const formErrors = result.error.flatten();
  for (const [key, value] of Object.entries(formErrors.fieldErrors)) {
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
      fieldErrors[key] = value[0];
    }
  }
  if (formErrors.formErrors.length > 0) {
    fieldErrors["form"] = formErrors.formErrors[0]!;
  }
  return fieldErrors;
}

function extractErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export async function signupAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const payload = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = SignupSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: formatZodErrors(parsed),
      message: "Please correct highlighted fields.",
    };
  }

  const passwordStrength = validatePasswordStrength(parsed.data.password);
  if (!passwordStrength.isValid) {
    return {
      status: "error",
      fieldErrors: {
        password: passwordStrength.failed.join(", "),
      },
      message: "Password does not meet complexity requirements.",
    };
  }

  const convex = getConvexClient();
  const verificationToken = generateRandomToken(64);
  const verificationExpiresAt = createTokenExpiry(60); // 60 minutes

  try {
    const passwordHash = await hashPassword(parsed.data.password);
    await convex.mutation(api.users.createUser, {
      email: parsed.data.email,
      passwordHash,
      verificationToken,
      verificationTokenExpiresAt: verificationExpiresAt,
    });

    await sendVerificationEmail({
      email: parsed.data.email,
      token: verificationToken,
    });
  } catch (error) {
    const message = extractErrorMessage(error, "Unable to create account.");
    return {
      status: "error",
      message,
      fieldErrors: {
        form: message,
      },
    };
  }

  return {
    status: "success",
    message: "Account created. Check your email to verify your account.",
  };
}

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const rawNext = formData.get("next");
  const safeNext =
    typeof rawNext === "string" &&
    rawNext.startsWith("/") &&
    !rawNext.startsWith("//")
      ? rawNext
      : null;

  const payload = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = LoginSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: formatZodErrors(parsed),
      message: "Please correct highlighted fields.",
    };
  }

  const convex = getConvexClient();
  const user = await convex.query(api.users.getUserByEmail, {
    email: parsed.data.email,
  });

  if (!user) {
    return {
      status: "error",
      message: "Invalid credentials.",
      fieldErrors: { form: "Invalid credentials." },
    };
  }

  const validPassword = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!validPassword) {
    return {
      status: "error",
      message: "Invalid credentials.",
      fieldErrors: { form: "Invalid credentials." },
    };
  }

  if (!user.isEmailVerified) {
    return {
      status: "error",
      message: "Please verify your email to continue.",
      fieldErrors: { form: "Email verification required." },
    };
  }

  if (user.isSuspended) {
    return {
      status: "error",
      message: "Your account is currently suspended. Contact support.",
      fieldErrors: { form: "Account suspended." },
    };
  }

  let userAgent: string | undefined;
  let ipAddress: string | undefined;

  try {
    const headerList = await headers();
    const getHeader = (name: string) => {
      if (typeof headerList.get === "function") {
        return headerList.get(name) ?? undefined;
      }
      const rawValue = (headerList as unknown as Record<string, string | string[] | undefined>)[
        name.toLowerCase()
      ];
      if (Array.isArray(rawValue)) {
        return rawValue[0];
      }
      return rawValue;
    };

    userAgent = getHeader("user-agent");
    const forwardedFor = getHeader("x-forwarded-for");
    ipAddress = forwardedFor?.split(",")[0]?.trim();
  } catch {
    // headers() may not be available in non-request server action executions
  }

  await createSession({
    userId: user._id,
    role: user.role,
    email: user.email,
    userAgent,
    ipAddress,
  });

  await convex.mutation(api.users.updateLastLogin, {
    userId: user._id,
    lastLogin: Date.now(),
  });

  const destination =
    user.role === "admin"
      ? safeNext && safeNext.startsWith("/admin")
        ? safeNext
        : "/admin"
      : safeNext && !safeNext.startsWith("/admin")
        ? safeNext
        : "/dashboard";
  
  // Revalidate to ensure cookies are committed before redirect
  revalidatePath("/", "layout");
  redirect(destination);
}

export async function forgotPasswordAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const payload = {
    email: String(formData.get("email") ?? ""),
  };

  const parsed = ForgotPasswordSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: formatZodErrors(parsed),
      message: "Please provide a valid email.",
    };
  }

  const convex = getConvexClient();
  const user = await convex.query(api.users.getUserByEmail, {
    email: parsed.data.email,
  });

  if (!user) {
    // Obscure existence of account
    return {
      status: "success",
      message: "If an account exists, a password reset email has been sent.",
    };
  }

  const resetToken = generateRandomToken(64);
  const resetTokenExpiresAt = createTokenExpiry(30); // 30 minutes

  await convex.mutation(api.users.setResetToken, {
    userId: user._id,
    resetToken,
    resetTokenExpiresAt,
  });

  await sendPasswordResetEmail({
    email: user.email,
    token: resetToken,
  });

  return {
    status: "success",
    message: "If an account exists, a password reset email has been sent.",
  };
}

export async function resetPasswordAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const payload = {
    token: String(formData.get("token") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = ResetPasswordSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: formatZodErrors(parsed),
      message: "Unable to reset password.",
    };
  }

  const passwordStrength = validatePasswordStrength(parsed.data.password);
  if (!passwordStrength.isValid) {
    return {
      status: "error",
      fieldErrors: {
        password: passwordStrength.failed.join(", "),
      },
      message: "Password does not meet complexity requirements.",
    };
  }

  const convex = getConvexClient();

  try {
    const passwordHash = await hashPassword(parsed.data.password);
    await convex.mutation(api.users.consumeResetToken, {
      token: parsed.data.token,
      passwordHash,
    });
    return {
      status: "success",
      message: "Password reset successfully. You can now log in.",
    };
  } catch (error) {
    const message = extractErrorMessage(error, "Reset link is invalid or expired.");
    return {
      status: "error",
      message,
      fieldErrors: { form: message },
    };
  }
}

export async function verifyEmailByToken(token: string) {
  const convex = getConvexClient();
  const userId = (await convex.mutation(api.users.consumeVerificationToken, {
    token,
  })) as Id<"users">;
  return userId;
}