import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Bell,
  Camera,
  Server,
  Clock,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  type: "occupancy_threshold" | "spike_detected" | "camera_offline" | "worker_failure";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  camera?: string;
  site?: string;
  timestamp: string;
  status: "new" | "acknowledged" | "closed";
  acknowledgedBy?: string;
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "occupancy_threshold",
    severity: "critical",
    message: "Occupancy exceeded 95% threshold at Conference Hall",
    camera: "Conference Hall",
    site: "Building A",
    timestamp: "2024-01-15 14:32:15",
    status: "new",
  },
  {
    id: "2",
    type: "occupancy_threshold",
    severity: "high",
    message: "Occupancy exceeded 90% threshold at Main Entrance",
    camera: "Main Entrance",
    site: "Building A",
    timestamp: "2024-01-15 14:28:42",
    status: "new",
  },
  {
    id: "3",
    type: "spike_detected",
    severity: "medium",
    message: "Sudden increase of 35 people detected at Lobby",
    camera: "Lobby Camera 1",
    site: "Building A",
    timestamp: "2024-01-15 14:15:00",
    status: "acknowledged",
    acknowledgedBy: "John Smith",
  },
  {
    id: "4",
    type: "camera_offline",
    severity: "critical",
    message: "Connection lost to Parking Entrance camera",
    camera: "Parking Entrance",
    site: "Parking Lot",
    timestamp: "2024-01-15 13:45:22",
    status: "acknowledged",
    acknowledgedBy: "Admin",
  },
  {
    id: "5",
    type: "worker_failure",
    severity: "high",
    message: "AI worker process terminated unexpectedly",
    timestamp: "2024-01-15 12:00:00",
    status: "closed",
  },
  {
    id: "6",
    type: "occupancy_threshold",
    severity: "low",
    message: "Occupancy reached 70% at Cafeteria",
    camera: "Cafeteria Main",
    site: "Building B",
    timestamp: "2024-01-15 11:30:00",
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
  low: { bg: "bg-muted", text: "text-muted-foreground", border: "border-muted" },
  medium: { bg: "bg-warning/20", text: "text-warning", border: "border-warning/30" },
  high: { bg: "bg-destructive/20", text: "text-destructive", border: "border-destructive/30" },
  critical: { bg: "bg-destructive", text: "text-destructive-foreground", border: "border-destructive" },
};

const statusBadge = {
  new: { className: "bg-primary text-primary-foreground", label: "New" },
  acknowledged: { className: "bg-warning/20 text-warning border-warning/30", label: "Acknowledged" },
  closed: { className: "bg-muted text-muted-foreground", label: "Closed" },
};

export default function Alerts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredAlerts = mockAlerts.filter((alert) => {
    const matchesSearch =
      alert.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.camera?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    return matchesSearch && alert.status === activeTab;
  });

  const alertCounts = {
    all: mockAlerts.length,
    new: mockAlerts.filter((a) => a.status === "new").length,
    acknowledged: mockAlerts.filter((a) => a.status === "acknowledged").length,
    closed: mockAlerts.filter((a) => a.status === "closed").length,
  };

  return (
    <div className="min-h-screen">
      <Header title="Alerts" subtitle="Monitor and manage system alerts" />

      <div className="p-6">
        {/* Stats */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/20">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-sm text-muted-foreground">Critical</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-destructive/20">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
                <Bell className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-sm text-muted-foreground">High</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-warning/20">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                <Bell className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-sm text-muted-foreground">Medium</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-sm text-muted-foreground">Low</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-9"
              />
            </div>
            <Select defaultValue="all-severity">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-severity">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <CheckCircle className="mr-2 h-4 w-4" />
              Acknowledge Selected
            </Button>
            <Button variant="outline" size="sm">
              <XCircle className="mr-2 h-4 w-4" />
              Close Selected
            </Button>
          </div>
        </div>

        {/* Tabs and Table */}
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="pb-0">
              <TabsList>
                <TabsTrigger value="all">
                  All ({alertCounts.all})
                </TabsTrigger>
                <TabsTrigger value="new">
                  New ({alertCounts.new})
                </TabsTrigger>
                <TabsTrigger value="acknowledged">
                  Acknowledged ({alertCounts.acknowledged})
                </TabsTrigger>
                <TabsTrigger value="closed">
                  Closed ({alertCounts.closed})
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input type="checkbox" className="rounded border-border" />
                    </TableHead>
                    <TableHead>Alert</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.map((alert) => {
                    const Icon = alertIcons[alert.type];
                    const severity = severityStyles[alert.severity];
                    const status = statusBadge[alert.status];

                    return (
                      <TableRow
                        key={alert.id}
                        className={cn(
                          alert.status === "new" && alert.severity === "critical" && "bg-destructive/5"
                        )}
                      >
                        <TableCell>
                          <input type="checkbox" className="rounded border-border" />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                                severity.bg
                              )}
                            >
                              <Icon className={cn("h-4 w-4", severity.text)} />
                            </div>
                            <div>
                              <p className="font-medium">{alert.message}</p>
                              {alert.acknowledgedBy && (
                                <p className="text-xs text-muted-foreground">
                                  Acknowledged by {alert.acknowledgedBy}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {alert.camera && (
                            <div>
                              <p className="text-sm">{alert.camera}</p>
                              <p className="text-xs text-muted-foreground">
                                {alert.site}
                              </p>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs capitalize",
                              severity.bg,
                              severity.text,
                              severity.border
                            )}
                          >
                            {alert.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("text-xs", status.className)}
                          >
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {alert.timestamp}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {alert.status === "new" && (
                              <Button variant="ghost" size="icon">
                                <CheckCircle className="h-4 w-4 text-success" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
