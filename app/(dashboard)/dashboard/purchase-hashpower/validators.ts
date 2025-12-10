import { z } from "zod";

export const depositRequestSchema = z.object({
  crypto: z.enum(["ETH", "BTC"]),
  amount: z.coerce
    .number("Enter a numeric amount")
    .positive("Amount must be greater than zero"),
  txHash: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export type DepositRequestInput = z.input<typeof depositRequestSchema>;
export type DepositRequestValues = z.infer<typeof depositRequestSchema>;

