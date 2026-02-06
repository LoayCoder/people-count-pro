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
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAlerts, useAcknowledgeAlert, useCloseAlert } from "@/hooks/use-alerts";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";

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
  const [severityFilter, setSeverityFilter] = useState("all");

  const { data: alerts, isLoading } = useAlerts();
  const acknowledgeAlert = useAcknowledgeAlert();
  const closeAlert = useCloseAlert();

  const filteredAlerts = alerts?.filter((alert) => {
    const matchesSearch =
      alert.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.camera?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
    
    if (activeTab === "all") return matchesSearch && matchesSeverity;
    return matchesSearch && matchesSeverity && alert.status === activeTab;
  }) || [];

  const alertCounts = {
    all: alerts?.length || 0,
    new: alerts?.filter((a) => a.status === "new").length || 0,
    acknowledged: alerts?.filter((a) => a.status === "acknowledged").length || 0,
    closed: alerts?.filter((a) => a.status === "closed").length || 0,
  };

  const severityCounts = {
    critical: alerts?.filter((a) => a.severity === "critical" && a.status !== "closed").length || 0,
    high: alerts?.filter((a) => a.severity === "high" && a.status !== "closed").length || 0,
    medium: alerts?.filter((a) => a.severity === "medium" && a.status !== "closed").length || 0,
    low: alerts?.filter((a) => a.severity === "low" && a.status !== "closed").length || 0,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Alerts" subtitle="Monitor and manage system alerts" />
        <LoadingSpinner />
      </div>
    );
  }

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
                <p className="text-2xl font-bold">{severityCounts.critical}</p>
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
                <p className="text-2xl font-bold">{severityCounts.high}</p>
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
                <p className="text-2xl font-bold">{severityCounts.medium}</p>
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
                <p className="text-2xl font-bold">{severityCounts.low}</p>
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
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
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
              {filteredAlerts.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="No alerts found"
                  description={searchQuery || severityFilter !== "all" ? "No alerts match your filters" : "No alerts have been generated"}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
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
                      const Icon = alertIcons[alert.type as keyof typeof alertIcons] || Bell;
                      const severity = severityStyles[alert.severity as keyof typeof severityStyles] || severityStyles.low;
                      const status = statusBadge[alert.status as keyof typeof statusBadge] || statusBadge.new;

                      return (
                        <TableRow
                          key={alert.id}
                          className={cn(
                            alert.status === "new" && alert.severity === "critical" && "bg-destructive/5"
                          )}
                        >
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
                                {alert.acknowledged_by && (
                                  <p className="text-xs text-muted-foreground">
                                    Acknowledged by {alert.acknowledged_by}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {alert.camera?.name && (
                              <div>
                                <p className="text-sm">{alert.camera.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {alert.site?.name}
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
                              {new Date(alert.created_at).toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {alert.status === "new" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => acknowledgeAlert.mutate(alert.id)}
                                  title="Acknowledge"
                                >
                                  <CheckCircle className="h-4 w-4 text-success" />
                                </Button>
                              )}
                              {alert.status !== "closed" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => closeAlert.mutate(alert.id)}
                                  title="Close"
                                >
                                  <XCircle className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
