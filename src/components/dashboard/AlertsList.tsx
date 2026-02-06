import { AlertTriangle, Bell, Camera, Server, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Alert {
  id: string;
  type: "occupancy_threshold" | "spike_detected" | "camera_offline" | "worker_failure";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  camera?: string;
  timestamp: string;
  status: "new" | "acknowledged" | "closed";
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "occupancy_threshold",
    severity: "high",
    message: "Occupancy exceeded 90% threshold at Main Entrance",
    camera: "Main Entrance",
    timestamp: "2 min ago",
    status: "new",
  },
  {
    id: "2",
    type: "spike_detected",
    severity: "medium",
    message: "Sudden increase of 25 people detected at Lobby",
    camera: "Lobby Camera 1",
    timestamp: "8 min ago",
    status: "new",
  },
  {
    id: "3",
    type: "camera_offline",
    severity: "critical",
    message: "Connection lost to Parking Entrance camera",
    camera: "Parking Entrance",
    timestamp: "15 min ago",
    status: "acknowledged",
  },
  {
    id: "4",
    type: "worker_failure",
    severity: "high",
    message: "AI worker process terminated unexpectedly",
    timestamp: "1 hour ago",
    status: "closed",
  },
];

const alertIcons = {
  occupancy_threshold: Bell,
  spike_detected: AlertTriangle,
  camera_offline: Camera,
  worker_failure: Server,
};

const severityStyles = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/20 text-warning border-warning/30",
  high: "bg-destructive/20 text-destructive border-destructive/30",
  critical: "bg-destructive text-destructive-foreground alert-pulse",
};

export function AlertsList() {
  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-3 pr-4">
        {mockAlerts.map((alert) => {
          const Icon = alertIcons[alert.type];
          
          return (
            <div
              key={alert.id}
              className={cn(
                "flex gap-3 rounded-lg border p-3 transition-colors",
                alert.status === "new"
                  ? "border-border bg-card"
                  : "border-border/50 bg-card/50 opacity-75"
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  alert.severity === "critical"
                    ? "bg-destructive/20"
                    : alert.severity === "high"
                    ? "bg-destructive/10"
                    : "bg-muted"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    alert.severity === "critical" || alert.severity === "high"
                      ? "text-destructive"
                      : "text-muted-foreground"
                  )}
                />
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-tight text-foreground">
                    {alert.message}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn("shrink-0 text-xs", severityStyles[alert.severity])}
                  >
                    {alert.severity}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{alert.timestamp}</span>
                  {alert.camera && (
                    <>
                      <span>•</span>
                      <span>{alert.camera}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
