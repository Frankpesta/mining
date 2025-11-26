"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/components/ui/use-toast";
import { createHotWallet, deleteHotWallet, updateHotWallet } from "@/app/(admin)/admin/settings/actions";
import { SUPPORTED_CRYPTO, CRYPTO_NAMES, type SupportedCrypto } from "@/lib/crypto/constants";

const walletFormSchema = z.object({
  crypto: z.enum([
    "BTC",
    "ETH",
    "SOL",
    "LTC",
    "BNB",
    "ADA",
    "XRP",
    "DOGE",
    "DOT",
    "MATIC",
    "AVAX",
    "ATOM",
    "LINK",
    "UNI",
    "USDT",
    "USDC",
  ]),
  address: z.string().min(1, "Address is required"),
  label: z.string().optional(),
});

type WalletFormValues = z.infer<typeof walletFormSchema>;

type HotWallet = {
  _id: string;
  crypto: SupportedCrypto;
  address: string;
  label?: string | null;
};

type HotWalletManagerProps = {
  initialWallets: HotWallet[];
};

export function HotWalletManager({ initialWallets }: HotWalletManagerProps) {
  const router = useRouter();
  const [wallets, setWallets] = useState(initialWallets);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<HotWallet | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<WalletFormValues>({
    resolver: zodResolver(walletFormSchema),
    defaultValues: {
      crypto: "BTC" as SupportedCrypto,
      address: "",
      label: "",
    },
  });

  // Update wallets when initialWallets prop changes (after refresh)
  useEffect(() => {
    setWallets(initialWallets);
  }, [initialWallets]);

  const handleCreate = (values: WalletFormValues) => {
    startTransition(async () => {
      try {
        await createHotWallet(values);
        toast.success("Hot wallet created successfully");
        setIsCreateOpen(false);
        form.reset();
        router.refresh(); // Refresh to get updated wallets from server
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create wallet");
      }
    });
  };

  const handleUpdate = (walletId: string, values: WalletFormValues) => {
    startTransition(async () => {
      try {
        await updateHotWallet(walletId, values);
        toast.success("Hot wallet updated successfully");
        setEditingWallet(null);
        form.reset();
        router.refresh(); // Refresh to get updated wallets from server
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update wallet");
      }
    });
  };

  const handleDelete = (walletId: string) => {
    if (!confirm("Are you sure you want to delete this wallet? Users won't be able to deposit to it.")) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteHotWallet(walletId);
        toast.success("Hot wallet deleted successfully");
        router.refresh(); // Refresh to get updated wallets from server
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete wallet");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add wallet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create hot wallet</DialogTitle>
              <DialogDescription>Add a new deposit wallet address</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="crypto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cryptocurrency</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          {SUPPORTED_CRYPTO.map((crypto) => (
                            <option key={crypto} value={crypto}>
                              {CRYPTO_NAMES[crypto]} ({crypto})
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wallet address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="0x..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Main deposit wallet" />
                      </FormControl>
                      <FormDescription>Optional label to identify this wallet</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {wallets.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No hot wallets configured. Add one to enable deposits.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead>Cryptocurrency</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Label</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallets.map((wallet) => (
                <TableRow key={wallet._id}>
                  <TableCell className="font-medium">{wallet.crypto}</TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-2 py-1 text-xs">{wallet.address}</code>
                  </TableCell>
                  <TableCell>{wallet.label || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingWallet(wallet);
                          form.reset({
                            crypto: wallet.crypto,
                            address: wallet.address,
                            label: wallet.label ?? "",
                          });
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(wallet._id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {editingWallet && (
        <Dialog open={!!editingWallet} onOpenChange={(open) => !open && setEditingWallet(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit hot wallet</DialogTitle>
              <DialogDescription>Update wallet address and label</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((values) => handleUpdate(editingWallet._id, values))}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="crypto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cryptocurrency</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          disabled
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="ETH">Ethereum (ETH)</option>
                          <option value="USDT">Tether (USDT)</option>
                          <option value="USDC">USD Coin (USDC)</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wallet address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="0x..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Main deposit wallet" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditingWallet(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Updating..." : "Update"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

