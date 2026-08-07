import { z } from "zod";

export const withdrawalRequestSchema = z.object({
  balanceSource: z.enum(["platform", "mining"]),
  crypto: z.string().min(1, "Select an asset"),
  amount: z.coerce
    .number("Enter a numeric amount")
    .positive("Amount must be greater than zero"),
  destinationAddress: z
    .string()
    .trim()
    .min(12, "Destination address looks too short")
    .max(256, "Destination address is too long"),
  requestedFee: z.coerce.number().optional(),
  note: z
    .string()
    .trim()
    .max(280, "Notes must be 280 characters or less")
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export type WithdrawalRequestInput = z.input<typeof withdrawalRequestSchema>;
export type WithdrawalRequestValues = z.infer<typeof withdrawalRequestSchema>;

export const bankWithdrawalRequestSchema = z
  .object({
    balanceSource: z.enum(["platform", "mining"]),
    crypto: z.string().min(1, "Select an asset"),
    amount: z.coerce
      .number("Enter a numeric amount")
      .positive("Amount must be greater than zero"),
    currency: z.string().trim().min(1, "Select a payout currency"),
    accountHolderName: z
      .string()
      .trim()
      .min(2, "Enter the name on the bank account")
      .max(120, "Name is too long"),
    bankName: z.string().trim().min(2, "Enter the bank name").max(120, "Bank name is too long"),
    accountNumber: z
      .string()
      .trim()
      .min(4, "Enter a valid account number")
      .max(64, "Account number is too long"),
    accountType: z.enum(["checking", "savings"]).optional(),
    routingNumber: z
      .string()
      .trim()
      .max(34, "Routing number is too long")
      .optional()
      .transform((value) => (value ? value : undefined)),
    swiftCode: z
      .string()
      .trim()
      .max(11, "SWIFT/BIC code is too long")
      .optional()
      .transform((value) => (value ? value : undefined)),
    iban: z
      .string()
      .trim()
      .max(34, "IBAN is too long")
      .optional()
      .transform((value) => (value ? value : undefined)),
    bankAddress: z
      .string()
      .trim()
      .max(200, "Bank address is too long")
      .optional()
      .transform((value) => (value ? value : undefined)),
    bankCountry: z
      .string()
      .trim()
      .min(2, "Enter the bank's country")
      .max(80, "Country is too long"),
    note: z
      .string()
      .trim()
      .max(280, "Notes must be 280 characters or less")
      .optional()
      .transform((value) => (value ? value : undefined)),
  })
  .refine(
    (values) => Boolean(values.routingNumber || values.swiftCode || values.iban),
    {
      message: "Provide at least one of routing number, SWIFT/BIC, or IBAN",
      path: ["routingNumber"],
    },
  );

export type BankWithdrawalRequestInput = z.input<typeof bankWithdrawalRequestSchema>;
export type BankWithdrawalRequestValues = z.infer<typeof bankWithdrawalRequestSchema>;

