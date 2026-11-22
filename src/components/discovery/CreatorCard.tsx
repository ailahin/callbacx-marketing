"use client";

import * as React from "react";
import { useState } from "react";
import {
  Card,
  CardHeader,
  CardMedia,
  CardContent,
  CardFooter,
  Badge,
  StatusBadge,
  Button,
  IconButton,
  Tag,
} from "@/components";
import {
  MapPinIcon,
  StarIcon,
  UsersIcon,
  EyeIcon,
  PlayIcon,
  LinkIcon,
  ChevronRightIcon,
  LockIcon,
} from "@/components/ui/icons";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import type { CreatorListItem } from "@/services/creators";

export interface CreatorCardProps {
  creator: CreatorListItem;
  onSelect?: (creator: CreatorListItem) => void;
  variant?: "default" | "compact";
  showFavorite?: boolean;
  onFavoriteToggle?: (creatorId: string, isFavorited: boolean) => void;
  className?: string;
}

/** Human-readable label for a creator's availability status. */
function availabilityLabel(status: string): string {
  switch (status) {
    case "open":
      return "Open to collaborations";
    case "busy":
      return "Currently busy";
    case "unavailable":
      return "Unavailable";
    default:
      return "Availability not specified";
  }
}

/** Primary platform badge + follower/engagement summary from social accounts. */
function platformSummary(creator: CreatorListItem) {
  const primary = creator.socialAccounts[0];
  if (!primary) return null;
  return (
    <span className="flex items-center gap-1 text-xs text-text-secondary">
      {primary.is_verified && (
        <Badge variant="success" size="xs" className="ml-1">
          Verified
        </Badge>
      )}
      {primary.platform.charAt(0).toUpperCase() + primary.platform.slice(1)}
      {primary.followers_count !== null && (
        <>
          <span className="mx-1">·</span>
          {formatNumber(primary.followers_count)} followers
        </>
      )}
      {primary.engagement_rate !== null && (
        <>
          <span className="mx-1">·</span>
          {primary.engagement_rate.toFixed(2)}% engagement
        </>
      )}
      {primary.metrics_source === "platform_api" && (
        <span className="mx-1 text-text-tertiary" title="Synced from platform API">
          (synced)
        </span>
      )}
    </span>
  );
}

export function CreatorCard({
  creator,
  onSelect,
  variant = "default",
  showFavorite = true,
  onFavoriteToggle,
  className,
}: CreatorCardProps) {
  const [isFavorited, setIsFavorited] = useState(creator.is_favorited);
  const [isAdding, setIsAdding] = useState(false);

  const primary = creator.socialAccounts[0];
  const minRate =
    creator.min_rate !== null
      ? formatCurrency(creator.min_rate, creator.rates[0]?.currency ?? "USD")
      : "Not disclosed";

  const contactEmail = creator.contact_email;

  const handleFavorite = async () => {
    setIsAdding(true);
    try {
      onFavoriteToggle?.(creator.id, !isFavorited);
      setIsFavorited((prev) => !prev);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card
      variant={variant === "compact" ? "ghost" : "default"}
      padding={variant === "compact" ? "none" : "md"}
      hover={variant === "default"}
      className={cn("overflow-hidden", className)}
      onClick={onSelect ? () => onSelect(creator) : undefined}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-label={`View profile for ${creator.display_name}`}
    >
        <CardMedia
          src={creator.avatar_url ?? ""}
        alt={`Avatar of ${creator.display_name}`}
        aspectRatio="square"
      />
      <CardHeader
        title={creator.display_name}
        description={creator.bio ? truncateMiddle(creator.bio, 90) : "No bio available"}
        action={
          showFavorite && (
            <IconButton
              aria-label={isFavorited ? "Remove from favourites" : "Add to favourites"}
              variant="ghost"
              size="sm"
              disabled={isAdding}
              onClick={(e) => {
                e.stopPropagation();
                handleFavorite();
              }}
            >
              <StarIcon className="h-5 w-5" />
            </IconButton>
          )
        }
      />
      <CardContent className="space-y-3">
        {creator.categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {creator.categories.slice(0, 3).map((cat) => (
              <Tag key={cat.id} variant="default" size="sm">
                {cat.name}
              </Tag>
            ))}
          </div>
        )}
        {platformSummary(creator) && (
          <p className="text-sm text-text-secondary">{platformSummary(creator)}</p>
        )}
        {creator.location && (
          <p className="flex items-center gap-2 text-sm text-text-secondary">
            <MapPinIcon className="h-4 w-4" />
            <span className="line-clamp-1">
              {typeof creator.location === "object" && creator.location !== null
                ? [
                    (creator.location as Record<string, unknown>).city,
                    (creator.location as Record<string, unknown>).region,
                    (creator.location as Record<string, unknown>).country,
                  ]
                  .filter(Boolean)
                  .join(", ") || "Location not disclosed"
                : "Location not disclosed"}
            </span>
          </p>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">{availabilityLabel(creator.availability_status)}</span>
          <StatusBadge
            status={
              creator.availability_status === "open"
                ? "active"
                : creator.availability_status === "busy"
                  ? "pending"
                  : "inactive"
            }
            size="xs"
            showDot={false}
          />
        </div>
        <div className="flex items-center justify-between text-sm font-medium text-text-primary">
          <span>Rate</span>
          <span>{minRate}</span>
        </div>
      </CardContent>
      <CardFooter divided className="pt-3">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(creator);
            }}
          >
            View profile <ChevronRightIcon className="h-4 w-4" />
          </Button>
          {contactEmail && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                void navigator.clipboard.writeText(contactEmail);
              }}
            >
              <EyeIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

function truncateMiddle(text: string, max: number): string {
  if (text.length <= max) return text;
  const half = Math.floor((max - 3) / 2);
  return text.slice(0, half) + "..." + text.slice(text.length - half);
}
