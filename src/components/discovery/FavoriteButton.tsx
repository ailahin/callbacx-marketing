"use client";

import * as React from "react";
import { Button, Badge } from "@/components";
import { useToast } from "@/components";
import { StarIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { toggleFavorite } from "@/services/creators";

export interface FavoriteButtonProps {
  creatorId: string;
  isFavorited: boolean;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Toggle-favourite button. Calls the creators service and surfaces toast
 * feedback. Parents can listen via the returned state change if needed.
 */
export function FavoriteButton({
  creatorId,
  isFavorited,
  size = "md",
  className,
}: FavoriteButtonProps) {
  const { toast } = useToast();
  const [toggling, setToggling] = React.useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setToggling(true);
    try {
      const result = await toggleFavorite({ creator_profile_id: creatorId });
      if (result.error) {
        toast({ variant: "error", message: result.error.message });
        return;
      }
      toast({
        variant: "success",
        message: result.data?.is_favorited ? "Added to favourites" : "Removed from favourites",
      });
    } catch {
      toast({ variant: "error", message: "Could not update favourites." });
    } finally {
      setToggling(false);
    }
  };

  return (
    <Button
      size={size === "sm" ? "sm" : "md"}
      variant="outline"
      loading={toggling}
      onClick={handleClick}
      className={cn(
        "flex items-center gap-1.5",
        isFavorited
          ? "bg-brand-50 text-brand-600 border-brand-200 hover:bg-brand-100 dark:bg-brand-950/50 dark:text-brand-400 dark:border-brand-800"
          : "",
        className
      )}
      aria-pressed={isFavorited}
    >
      <StarIcon
        className={cn("h-4 w-4", isFavorited ? "text-brand-600 fill-current" : "text-neutral-400")}
      />
      <span className={isFavorited ? "font-medium" : ""}>
        {isFavorited ? "Favourited" : "Favorite"}
      </span>
    </Button>
  );
}
