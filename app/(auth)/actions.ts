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
    referralCode: String(formData.get("referralCode") ?? "").trim() || undefined,
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
      referralCode: payload.referralCode,
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
    // Trim the token to handle any whitespace issues
    const token = parsed.data.token.trim();
    await convex.mutation(api.users.consumeResetToken, {
      token,
      passwordHash,
    });
    return {
      status: "success",
      message: "Password reset successfully. You can now log in.",
    };
  } catch (error) {
    // Handle ConvexError and regular Error instances
    const errorMessage = error instanceof Error 
      ? error.message 
      : (error && typeof error === "object" && "message" in error)
        ? String(error.message)
        : "";
    let message = "Unable to reset password.";
    
    if (errorMessage.includes("expired")) {
      message = "This reset link has expired. Please request a new password reset link.";
    } else if (errorMessage.includes("Invalid")) {
      message = "This reset link is invalid or has already been used. Please request a new one.";
    } else {
      message = "Reset link is invalid or expired. Please request a new password reset link.";
    }
    
    return {
      status: "error",
      message,
      fieldErrors: { form: message },
    };
  }
}

export async function verifyEmailByToken(token: string) {
  if (!token || token.trim().length === 0) {
    throw new Error("Verification token is required");
  }

  const convex = getConvexClient();
  try {
    const userId = (await convex.mutation(api.users.consumeVerificationToken, {
      token: token.trim(),
    })) as Id<"users">;
    return userId;
  } catch (error) {
    // Re-throw ConvexError and other errors with their original messages
    if (error instanceof Error) {
      throw error;
    }
    // Handle Convex error objects that might not be Error instances
    if (error && typeof error === "object" && "message" in error) {
      throw new Error(String(error.message));
    }
    throw new Error("Unable to verify email address. Please try again.");
  }
}

export async function resendVerificationEmailAction(
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
      message: "Please provide a valid email address.",
    };
  }

  const convex = getConvexClient();
  const user = await convex.query(api.users.getUserByEmail, {
    email: parsed.data.email,
  });

  if (!user) {
    // Obscure existence of account for security
    return {
      status: "success",
      message: "If an account exists and is unverified, a verification email has been sent.",
    };
  }

  // Only send if email is not verified
  if (user.isEmailVerified) {
    return {
      status: "success",
      message: "Your email is already verified. You can sign in now.",
    };
  }

  const verificationToken = generateRandomToken(64);
  const verificationTokenExpiresAt = createTokenExpiry(60); // 60 minutes

  await convex.mutation(api.users.setVerificationToken, {
    userId: user._id,
    verificationToken,
    verificationTokenExpiresAt,
  });

  await sendVerificationEmail({
    email: user.email,
    token: verificationToken,
  });

  return {
    status: "success",
    message: "Verification email sent. Please check your inbox.",
  };
}