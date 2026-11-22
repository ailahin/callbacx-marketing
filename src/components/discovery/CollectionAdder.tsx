"use client";

import * as React from "react";
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
  Badge,
} from "@/components";
import { PlusIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import type { CreatorCollections } from "@/lib/supabase/types/database";
import {
  listCollections,
  addCollectionItem,
} from "@/services/creators";
import { useToast } from "@/components";

export interface CollectionAdderProps {
  creatorId: string;
  className?: string;
}

/**
 * Adds a creator to one of the current brand's collections. Lists owned
 * collections in a sheet and creates the collection-item link.
 */
export function CollectionAdder({
  creatorId,
  className,
}: CollectionAdderProps) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [collections, setCollections] = React.useState<CreatorCollections[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [adding, setAdding] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    listCollections().then((result) => {
      if (!mounted) return;
      if (result.error) {
        toast({ variant: "error", message: result.error.message });
      } else {
        setCollections(result.data ?? []);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleAdd = async (collectionId: string) => {
    setAdding(collectionId);
    try {
      const result = await addCollectionItem({
        collection_id: collectionId,
        creator_profile_id: creatorId,
      });
      if (result.error) {
        toast({ variant: "error", message: result.error.message });
      } else {
        toast({ variant: "success", message: "Added to collection" });
        setOpen(false);
        setSelected(null);
      }
    } catch {
      toast({ variant: "error", message: "Could not add to collection." });
    } finally {
      setAdding(null);
    }
  };

  if (collections.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className={cn("flex items-center gap-1.5 text-xs", className)}
      >
        <PlusIcon className="h-3 w-3" />
        <span>No collections</span>
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className={cn("flex items-center gap-1.5 text-xs", className)}
      >
        <PlusIcon className="h-3 w-3" />
        <span>Add to collection</span>
      </Button>
      <Sheet open={open} onOpenChange={setOpen} side="right">
        <SheetTrigger />
        <SheetContent className="max-w-[360px]">
          <SheetHeader className="pb-4">
            <SheetTitle>Add to collection</SheetTitle>
            <SheetDescription>
              Select a collection to save {creatorId.slice(0, 8)}...
            </SheetDescription>
            <SheetClose />
          </SheetHeader>
          <CardContent className="p-4 space-y-2">
            {collections.map((collection) => (
              <Button
                key={collection.id}
                variant="ghost"
                size="sm"
                fullWidth
                onClick={() => setSelected(collection.id)}
                className={cn(
                  "flex items-center justify-between gap-2 text-left",
                  selected === collection.id
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-950/50"
                    : "text-text-secondary hover:bg-surface-subtle dark:hover:bg-neutral-800"
                )}
              >
                <span>{collection.name}</span>
                {!collection.is_public && (
                  <Badge variant="ghost" size="xs">Private</Badge>
                )}
              </Button>
            ))}
          </CardContent>
          <CardFooter className="p-4 border-t border-border-subtle flex gap-3">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!selected || adding !== null}
              loading={adding === selected}
              onClick={() => selected && handleAdd(selected)}
            >
              Add
            </Button>
          </CardFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
