import { Camera, RefreshCw, AlertTriangle, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CameraWidgetProps {
  name: string;
  location: string;
  status: "online" | "offline" | "processing" | "error";
  occupancy: number;
  inCount: number;
  outCount: number;
  lastUpdated: string;
  thumbnailUrl?: string;
}

const statusConfig = {
  online: { label: "Online", className: "status-online" },
  offline: { label: "Offline", className: "status-offline" },
  processing: { label: "Processing", className: "status-processing" },
  error: { label: "Error", className: "status-offline" },
};

export function CameraWidget({
  name,
  location,
  status,
  occupancy,
  inCount,
  outCount,
  lastUpdated,
  thumbnailUrl,
}: CameraWidgetProps) {
  const statusInfo = statusConfig[status];

  return (
    <div className="group overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/30">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Camera className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Overlay */}
        <div className="camera-overlay" />
        
        {/* Status badge */}
        <Badge
          variant="outline"
          className={cn(
            "absolute left-3 top-3 text-xs",
            statusInfo.className
          )}
        >
          {status === "online" && <span className="live-indicator mr-1.5" />}
          {statusInfo.label}
        </Badge>

        {/* Refresh button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-3 top-3 h-8 w-8 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>

        {/* Occupancy overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div className="flex items-center gap-2 rounded-md bg-black/60 px-2 py-1 backdrop-blur-sm">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-mono text-lg font-bold text-foreground">
              {occupancy}
            </span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="mb-3">
          <h3 className="font-medium text-foreground">{name}</h3>
          <p className="text-sm text-muted-foreground">{location}</p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <ArrowUpRight className="h-4 w-4 text-success" />
            <span className="font-mono text-sm font-medium text-success">
              +{inCount}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowDownRight className="h-4 w-4 text-destructive" />
            <span className="font-mono text-sm font-medium text-destructive">
              -{outCount}
            </span>
          </div>
          <span className="ml-auto text-xs text-muted-foreground">
            {lastUpdated}
          </span>
        </div>
      </div>
    </div>
  );
}
