import { Header } from "@/components/layout/Header";
import { CameraWidget } from "@/components/dashboard/CameraWidget";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    name: "Lobby Camera 2",
    location: "Building A - Lobby",
    status: "online" as const,
    occupancy: 15,
    inCount: 45,
    outCount: 30,
    lastUpdated: "5 sec ago",
  },
  {
    name: "Conference Hall",
    location: "Building A - 2nd Floor",
    status: "online" as const,
    occupancy: 85,
    inCount: 120,
    outCount: 35,
    lastUpdated: "2 sec ago",
  },
  {
    name: "Cafeteria Main",
    location: "Building B - Ground Floor",
    status: "online" as const,
    occupancy: 62,
    inCount: 180,
    outCount: 118,
    lastUpdated: "8 sec ago",
  },
  {
    name: "Emergency Exit A",
    location: "Building A - Ground Floor",
    status: "online" as const,
    occupancy: 0,
    inCount: 5,
    outCount: 5,
    lastUpdated: "30 sec ago",
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
    name: "VIP Lounge",
    location: "Building A - 3rd Floor",
    status: "processing" as const,
    occupancy: 12,
    inCount: 25,
    outCount: 13,
    lastUpdated: "Just now",
  },
];

export default function LiveMonitoring() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <div className="min-h-screen">
      <Header title="Live Monitoring" subtitle="Real-time view of all active cameras" />

      <div className="p-6">
        {/* Stats Bar */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Occupancy"
            value="244"
            icon={Users}
            variant="primary"
          />
          <StatCard
            title="People IN (Last Hour)"
            value="+312"
            icon={ArrowUpRight}
            variant="success"
          />
          <StatCard
            title="People OUT (Last Hour)"
            value="-268"
            icon={ArrowDownRight}
            variant="destructive"
          />
          <StatCard
            title="Avg. Dwell Time"
            value="4m 18s"
            icon={Clock}
          />
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Select defaultValue="all">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by site" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sites</SelectItem>
                <SelectItem value="building-a">Building A</SelectItem>
                <SelectItem value="building-b">Building B</SelectItem>
                <SelectItem value="parking">Parking Lot</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all-status">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-status">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
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
            • Auto-refreshing every 10 seconds
          </span>
        </div>

        {/* Camera Grid */}
        <div
          className={cn(
            "grid gap-4",
            viewMode === "grid"
              ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1"
          )}
        >
          {mockCameras.map((camera, index) => (
            <div key={index} className="relative group">
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
      </div>
    </div>
  );
}
