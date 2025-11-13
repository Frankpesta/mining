import { z } from "zod";

export const depositRequestSchema = z.object({
  crypto: z.enum(["ETH", "USDT", "USDC"]),
  amount: z.coerce
    .number({
      invalid_type_error: "Enter a numeric amount",
      required_error: "Amount is required",
    })
    .positive("Amount must be greater than zero"),
  txHash: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export type DepositRequestInput = z.input<typeof depositRequestSchema>;
export type DepositRequestValues = z.infer<typeof depositRequestSchema>;

