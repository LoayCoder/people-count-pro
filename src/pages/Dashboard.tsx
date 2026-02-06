import { Header } from "@/components/layout/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { OccupancyChart } from "@/components/dashboard/OccupancyChart";
import { InOutChart } from "@/components/dashboard/InOutChart";
import { CameraWidget } from "@/components/dashboard/CameraWidget";
import { AlertsList } from "@/components/dashboard/AlertsList";
import { Users, ArrowUpRight, ArrowDownRight, TrendingUp, Clock, Camera, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useDashboardStats, useOccupancyChartData } from "@/hooks/use-dashboard-stats";
import { useCameras } from "@/hooks/use-cameras";
import { useLiveCounts } from "@/hooks/use-live-counts";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { formatDistanceToNow } from "date-fns";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "N/A";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: chartData } = useOccupancyChartData();
  const { data: cameras, isLoading: camerasLoading } = useCameras();
  const { data: liveCounts } = useLiveCounts();

  const isLoading = statsLoading || camerasLoading;

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

  // Prepare camera widgets with live data
  const cameraWidgets = cameras?.slice(0, 4).map((camera) => {
    const counts = liveCountsMap.get(camera.id);
    return {
      name: camera.name,
      location: camera.sites?.name || "Unknown",
      status: camera.status as "online" | "offline" | "processing" | "error",
      occupancy: counts?.occupancy || 0,
      inCount: counts?.in_count || 0,
      outCount: counts?.out_count || 0,
      lastUpdated: camera.last_seen_at
        ? formatDistanceToNow(new Date(camera.last_seen_at), { addSuffix: false })
        : "Never",
    };
  }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Dashboard" subtitle="Real-time people counting overview" />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Dashboard" subtitle="Real-time people counting overview" />
      
      <div className="p-6">
        {/* Top Stats */}
        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Current Occupancy"
            value={stats?.currentOccupancy.toLocaleString() || "0"}
            subtitle="Across all zones"
            icon={Users}
            variant="primary"
          />
          <StatCard
            title="Total IN Today"
            value={stats?.totalInToday.toLocaleString() || "0"}
            subtitle="Since 00:00"
            icon={ArrowUpRight}
            variant="success"
          />
          <StatCard
            title="Total OUT Today"
            value={stats?.totalOutToday.toLocaleString() || "0"}
            subtitle="Since 00:00"
            icon={ArrowDownRight}
            variant="destructive"
          />
          <StatCard
            title="Peak Occupancy"
            value={stats?.peakOccupancy.toLocaleString() || "0"}
            subtitle={stats?.peakTime ? `At ${new Date(stats.peakTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Today"}
            icon={TrendingUp}
            variant="warning"
          />
        </div>

        {/* Secondary Stats */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <StatCard
            title="Active Cameras"
            value={`${stats?.activeCameras || 0}/${stats?.totalCameras || 0}`}
            icon={Camera}
          />
          <StatCard
            title="Avg. Dwell Time"
            value={formatDuration(stats?.avgDwellSeconds || null)}
            icon={Clock}
          />
          <StatCard
            title="Active Alerts"
            value={stats?.activeAlerts.toString() || "0"}
            icon={AlertTriangle}
            variant={stats?.activeAlerts && stats.activeAlerts > 0 ? "warning" : "default"}
          />
        </div>

        {/* Charts */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium">Occupancy Over Time</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Today</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <OccupancyChart data={chartData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium">IN/OUT Timeline</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Today</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <InOutChart data={chartData} />
            </CardContent>
          </Card>
        </div>

        {/* Cameras and Alerts */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Camera Grid */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Live Camera Feeds</h2>
              <Button variant="outline" size="sm" asChild>
                <Link to="/live-monitoring">View All Cameras</Link>
              </Button>
            </div>
            {cameraWidgets.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {cameraWidgets.map((camera, index) => (
                  <CameraWidget key={index} {...camera} />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Camera className="mx-auto h-12 w-12 text-muted-foreground/30" />
                <p className="mt-4 text-muted-foreground">No cameras configured</p>
                <Button className="mt-4" asChild>
                  <Link to="/cameras">Add Cameras</Link>
                </Button>
              </Card>
            )}
          </div>

          {/* Alerts */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Alerts</h2>
              <Button variant="ghost" size="sm" className="text-primary" asChild>
                <Link to="/alerts">View All</Link>
              </Button>
            </div>
            <Card>
              <CardContent className="p-4">
                <AlertsList limit={5} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
