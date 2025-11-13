"use client";

import { useTransition } from "react";
import { Power, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { pauseMiningOperation, resumeMiningOperation } from "@/app/(admin)/admin/mining-operations/actions";
import type { Id } from "@/convex/_generated/dataModel";

type MiningOperation = {
  _id: string;
  userId: Id<"users">;
  status: "active" | "completed" | "paused";
};

type MiningOperationActionsProps = {
  operation: MiningOperation;
};

export function MiningOperationActions({ operation }: MiningOperationActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handlePause = () => {
    startTransition(async () => {
      try {
        await pauseMiningOperation(operation._id);
        toast.success("Mining operation paused");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to pause operation");
      }
    });
  };

  const handleResume = () => {
    startTransition(async () => {
      try {
        await resumeMiningOperation(operation._id);
        toast.success("Mining operation resumed");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to resume operation");
      }
    });
  };

  if (operation.status === "completed") {
    return <span className="text-sm text-muted-foreground">Completed</span>;
  }

  return (
    <div className="flex justify-end gap-2">
      {operation.status === "active" ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handlePause}
          disabled={isPending}
        >
          <Power className="mr-2 h-4 w-4" />
          {isPending ? "Pausing..." : "Pause"}
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleResume}
          disabled={isPending}
        >
          <Play className="mr-2 h-4 w-4" />
          {isPending ? "Resuming..." : "Resume"}
        </Button>
      )}
    </div>
  );
}

