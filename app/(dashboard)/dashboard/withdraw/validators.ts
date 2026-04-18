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

