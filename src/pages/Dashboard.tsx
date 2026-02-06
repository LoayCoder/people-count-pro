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

const mockCameras = [
  {
    name: "Main Entrance",
    location: "Building A - Ground Floor",
    status: "online" as const,
    occupancy: 42,
    inCount: 156,
    outCount: 114,
    lastUpdated: "Just now",
  },
  {
    name: "Lobby Camera 1",
    location: "Building A - Lobby",
    status: "online" as const,
    occupancy: 28,
    inCount: 89,
    outCount: 61,
    lastUpdated: "10 sec ago",
  },
  {
    name: "Parking Entrance",
    location: "Parking Lot B",
    status: "offline" as const,
    occupancy: 0,
    inCount: 0,
    outCount: 0,
    lastUpdated: "15 min ago",
  },
  {
    name: "Conference Hall",
    location: "Building A - 2nd Floor",
    status: "processing" as const,
    occupancy: 85,
    inCount: 120,
    outCount: 35,
    lastUpdated: "5 sec ago",
  },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen">
      <Header title="Dashboard" subtitle="Real-time people counting overview" />
      
      <div className="p-6">
        {/* Top Stats */}
        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Current Occupancy"
            value="247"
            subtitle="Across all zones"
            icon={Users}
            trend={{ value: 12, isPositive: true }}
            variant="primary"
          />
          <StatCard
            title="Total IN Today"
            value="1,284"
            subtitle="Since 00:00"
            icon={ArrowUpRight}
            trend={{ value: 8, isPositive: true }}
            variant="success"
          />
          <StatCard
            title="Total OUT Today"
            value="1,037"
            subtitle="Since 00:00"
            icon={ArrowDownRight}
            variant="destructive"
          />
          <StatCard
            title="Peak Occupancy"
            value="312"
            subtitle="At 14:35 today"
            icon={TrendingUp}
            variant="warning"
          />
        </div>

        {/* Secondary Stats */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <StatCard
            title="Active Cameras"
            value="12/15"
            icon={Camera}
          />
          <StatCard
            title="Avg. Dwell Time"
            value="4m 32s"
            icon={Clock}
          />
          <StatCard
            title="Active Alerts"
            value="3"
            icon={AlertTriangle}
            variant="warning"
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
              <OccupancyChart />
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
              <InOutChart />
            </CardContent>
          </Card>
        </div>

        {/* Cameras and Alerts */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Camera Grid */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Live Camera Feeds</h2>
              <Button variant="outline" size="sm">
                View All Cameras
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {mockCameras.map((camera, index) => (
                <CameraWidget key={index} {...camera} />
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Alerts</h2>
              <Button variant="ghost" size="sm" className="text-primary">
                View All
              </Button>
            </div>
            <Card>
              <CardContent className="p-4">
                <AlertsList />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
