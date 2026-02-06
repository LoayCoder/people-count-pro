import { AlertTriangle, Bell, Camera, Server, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAlerts } from "@/hooks/use-alerts";

interface AlertsListProps {
  limit?: number;
}

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

export function AlertsList({ limit = 10 }: AlertsListProps) {
  const { data: alerts, isLoading } = useAlerts();

  const displayAlerts = alerts?.slice(0, limit) || [];

  if (isLoading) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading alerts...</p>
      </div>
    );
  }

  if (displayAlerts.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <div className="text-center">
          <Bell className="mx-auto h-8 w-8 text-muted-foreground/30" />
          <p className="mt-2 text-sm text-muted-foreground">No alerts</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-3 pr-4">
        {displayAlerts.map((alert) => {
          const Icon = alertIcons[alert.type] || Bell;
          
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
                  <span>{new Date(alert.created_at).toLocaleString()}</span>
                  {alert.camera?.name && (
                    <>
                      <span>•</span>
                      <span>{alert.camera.name}</span>
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
