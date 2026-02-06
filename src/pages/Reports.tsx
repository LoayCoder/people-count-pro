import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  FileText,
  Download,
  Calendar as CalendarIcon,
  FileSpreadsheet,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { useState, useMemo } from "react";
import { format, subDays } from "date-fns";
import { StatCard } from "@/components/dashboard/StatCard";
import { OccupancyChart } from "@/components/dashboard/OccupancyChart";
import { InOutChart } from "@/components/dashboard/InOutChart";
import { useSites } from "@/hooks/use-sites";
import { useCameras } from "@/hooks/use-cameras";
import { useReportStats, useExportReport, getDateRangeForType, ReportFilters } from "@/hooks/use-reports";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";

export default function Reports() {
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly" | "custom">("daily");
  const [siteId, setSiteId] = useState<string>("all");
  const [cameraId, setCameraId] = useState<string>("all");
  const [date, setDate] = useState<Date>(new Date());

  const sitesQuery = useSites();
  const camerasQuery = useCameras();

  const sites = sitesQuery.data;
  const cameras = camerasQuery.data;

  // Calculate date range based on report type
  const dateRange = getDateRangeForType(reportType);
  const filters: ReportFilters = {
    type: reportType,
    startDate: reportType === "custom" ? (date || subDays(new Date(), 1)) : dateRange.startDate,
    endDate: reportType === "custom" ? (date || new Date()) : dateRange.endDate,
    siteId,
    cameraId,
  };

  const { data: reportData, isLoading } = useReportStats(filters);
  const exportReport = useExportReport();

  // Transform daily data to chart format
  const chartData = useMemo(() => {
    if (!reportData?.dailyData) return [];
    return reportData.dailyData.map((item) => ({
      hour: format(new Date(item.date), "MMM dd"),
      in: item.totalIn,
      out: item.totalOut,
      occupancy: item.peakOccupancy,
    }));
  }, [reportData?.dailyData]);

  const handleExportCSV = () => {
    exportReport.mutate({ filters, format: "csv" });
  };

  const formatDwellTime = (seconds?: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="min-h-screen">
      <Header title="Reports" subtitle="Generate and export counting reports" />

      <div className="p-6">
        {/* Report Generator */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Generate New Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={reportType} onValueChange={(v) => setReportType(v as typeof reportType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily Summary</SelectItem>
                    <SelectItem value="weekly">Weekly Report</SelectItem>
                    <SelectItem value="monthly">Monthly Report</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Site</Label>
                <Select value={siteId} onValueChange={setSiteId}>
                  <SelectTrigger>
                    <SelectValue />
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
              </div>
              <div className="space-y-2">
                <Label>Camera</Label>
                <Select value={cameraId} onValueChange={setCameraId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cameras</SelectItem>
                    {cameras?.map((camera) => (
                      <SelectItem key={camera.id} value={camera.id}>
                        {camera.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => d && setDate(d)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleExportCSV} disabled={exportReport.isPending}>
                  {exportReport.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                  )}
                  Export CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Preview */}
        {isLoading ? (
          <LoadingSpinner />
        ) : reportData?.stats ? (
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-4">
              <StatCard
                title="Total IN"
                value={reportData.stats.totalIn.toLocaleString()}
                icon={ArrowUpRight}
                variant="success"
              />
              <StatCard
                title="Total OUT"
                value={reportData.stats.totalOut.toLocaleString()}
                icon={ArrowDownRight}
                variant="destructive"
              />
              <StatCard
                title="Peak Occupancy"
                value={reportData.stats.peakOccupancy.toString()}
                subtitle={reportData.stats.peakTime ? `At ${format(new Date(reportData.stats.peakTime), "HH:mm")}` : undefined}
                icon={TrendingUp}
                variant="warning"
              />
              <StatCard
                title="Avg. Dwell Time"
                value={formatDwellTime(reportData.stats.avgDwellSeconds)}
                icon={Clock}
              />
            </div>

            {/* Charts */}
            <div className="mb-6 grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">Occupancy Trend</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </CardHeader>
                <CardContent>
                  <OccupancyChart data={chartData} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">IN/OUT Distribution</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </CardHeader>
                <CardContent>
                  <InOutChart data={chartData} />
                </CardContent>
              </Card>
            </div>

            {/* Data Table */}
            {reportData.dailyData.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Daily Breakdown</CardTitle>
                  <Badge variant="outline">{reportData.dailyData.length} Days</Badge>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="py-3 text-left font-medium text-muted-foreground">Date</th>
                          <th className="py-3 text-left font-medium text-muted-foreground">Camera</th>
                          <th className="py-3 text-right font-medium text-muted-foreground">IN</th>
                          <th className="py-3 text-right font-medium text-muted-foreground">OUT</th>
                          <th className="py-3 text-right font-medium text-muted-foreground">Peak</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.dailyData.map((row, idx) => (
                          <tr key={idx} className="border-b border-border/50">
                            <td className="py-3">{format(new Date(row.date), "MMM dd, yyyy")}</td>
                            <td className="py-3 text-muted-foreground">{row.camera || "All"}</td>
                            <td className="py-3 text-right text-success">{row.totalIn.toLocaleString()}</td>
                            <td className="py-3 text-right text-destructive">{row.totalOut.toLocaleString()}</td>
                            <td className="py-3 text-right">{row.peakOccupancy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <EmptyState
            icon={FileText}
            title="No Report Data"
            description="No data available for the selected date range and filters."
          />
        )}
      </div>
    </div>
  );
}
