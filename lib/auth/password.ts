import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function validatePasswordStrength(password: string) {
  const requirements = [
    {
      test: /.{8,}/,
      message: "At least 8 characters",
    },
    {
      test: /[A-Z]/,
      message: "One uppercase letter",
    },
    {
      test: /[a-z]/,
      message: "One lowercase letter",
    },
    {
      test: /[0-9]/,
      message: "One number",
    },
    {
      test: /[^A-Za-z0-9]/,
      message: "One special character",
    },
  ] as const;

  const failed = requirements
    .filter(({ test }) => !test.test(password))
    .map(({ message }) => message);

  return {
    isValid: failed.length === 0,
    failed,
  };
}

