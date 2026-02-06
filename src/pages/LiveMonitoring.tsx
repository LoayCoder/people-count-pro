import { Header } from "@/components/layout/Header";
import { CameraWidget } from "@/components/dashboard/CameraWidget";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, ArrowUpRight, ArrowDownRight, Clock, Grid3X3, List, RefreshCw, Maximize2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useCameras } from "@/hooks/use-cameras";
import { useSites } from "@/hooks/use-sites";
import { useLiveCounts, useLiveCountsRealtime } from "@/hooks/use-live-counts";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDistanceToNow } from "date-fns";
import { Camera } from "lucide-react";

export default function LiveMonitoring() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: cameras, isLoading: camerasLoading, refetch: refetchCameras } = useCameras();
  const { data: sites } = useSites();
  const { data: liveCounts } = useLiveCounts();
  const { data: stats } = useDashboardStats();

  // Enable realtime updates
  useLiveCountsRealtime();

  // Create a map of camera_id to latest live counts
  const liveCountsMap = new Map<string, { in_count: number; out_count: number; occupancy: number; timestamp: string }>();
  if (liveCounts) {
    for (const count of liveCounts) {
      const existing = liveCountsMap.get(count.camera_id);
      if (!existing || new Date(count.timestamp) > new Date(existing.timestamp)) {
        liveCountsMap.set(count.camera_id, count);
      }
    }
  }

  // Filter cameras
  const filteredCameras = cameras?.filter((camera) => {
    if (siteFilter !== "all" && camera.site_id !== siteFilter) return false;
    if (statusFilter !== "all" && camera.status !== statusFilter) return false;
    return true;
  });

  // Prepare camera widgets with live data
  const cameraWidgets = filteredCameras?.map((camera) => {
    const counts = liveCountsMap.get(camera.id);
    return {
      id: camera.id,
      name: camera.name,
      location: camera.site?.name || "Unknown",
      status: camera.status as "online" | "offline" | "processing" | "error",
      occupancy: counts?.occupancy || 0,
      inCount: counts?.in_count || 0,
      outCount: counts?.out_count || 0,
      lastUpdated: camera.last_seen_at
        ? formatDistanceToNow(new Date(camera.last_seen_at), { addSuffix: false })
        : "Never",
    };
  }) || [];

  // Calculate live stats from counts
  const totalOccupancy = Array.from(liveCountsMap.values()).reduce((sum, c) => sum + c.occupancy, 0);
  const totalInLastHour = stats?.totalInToday || 0;
  const totalOutLastHour = stats?.totalOutToday || 0;

  if (camerasLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Live Monitoring" subtitle="Real-time view of all active cameras" />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Live Monitoring" subtitle="Real-time view of all active cameras" />

      <div className="p-6">
        {/* Stats Bar */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Occupancy"
            value={totalOccupancy.toString()}
            icon={Users}
            variant="primary"
          />
          <StatCard
            title="People IN (Today)"
            value={`+${totalInLastHour}`}
            icon={ArrowUpRight}
            variant="success"
          />
          <StatCard
            title="People OUT (Today)"
            value={`-${totalOutLastHour}`}
            icon={ArrowDownRight}
            variant="destructive"
          />
          <StatCard
            title="Avg. Dwell Time"
            value={stats?.avgDwellSeconds ? `${Math.floor(stats.avgDwellSeconds / 60)}m ${stats.avgDwellSeconds % 60}s` : "N/A"}
            icon={Clock}
          />
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Select value={siteFilter} onValueChange={setSiteFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by site" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sites</SelectItem>
                {sites?.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetchCameras()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh All
            </Button>
            <div className="flex items-center rounded-lg border border-border">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-r-none"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-l-none"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Live status indicator */}
        <div className="mb-4 flex items-center gap-2">
          <span className="live-indicator" />
          <span className="text-sm font-medium text-success">Live</span>
          <span className="text-sm text-muted-foreground">
            • Auto-refreshing with realtime updates
          </span>
        </div>

        {/* Camera Grid */}
        {cameraWidgets.length === 0 ? (
          <EmptyState
            icon={Camera}
            title="No cameras found"
            description={siteFilter !== "all" || statusFilter !== "all" ? "No cameras match your filters" : "Add cameras to start monitoring"}
            actionLabel="Add Camera"
            actionHref="/cameras"
          />
        ) : (
          <div
            className={cn(
              "grid gap-4",
              viewMode === "grid"
                ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1"
            )}
          >
            {cameraWidgets.map((camera) => (
              <div key={camera.id} className="relative group">
                <CameraWidget {...camera} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
