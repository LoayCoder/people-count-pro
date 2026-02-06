import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  FileText,
  Download,
  Calendar as CalendarIcon,
  FileSpreadsheet,
  File,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { StatCard } from "@/components/dashboard/StatCard";
import { OccupancyChart } from "@/components/dashboard/OccupancyChart";
import { InOutChart } from "@/components/dashboard/InOutChart";

interface Report {
  id: string;
  name: string;
  type: string;
  dateRange: string;
  createdAt: string;
  size: string;
}

const mockReports: Report[] = [
  {
    id: "1",
    name: "Daily Summary - 2024-01-15",
    type: "Daily",
    dateRange: "Jan 15, 2024",
    createdAt: "Jan 15, 2024 23:59",
    size: "245 KB",
  },
  {
    id: "2",
    name: "Weekly Report - Week 2",
    type: "Weekly",
    dateRange: "Jan 8-14, 2024",
    createdAt: "Jan 14, 2024 23:59",
    size: "1.2 MB",
  },
  {
    id: "3",
    name: "Monthly Report - December 2023",
    type: "Monthly",
    dateRange: "Dec 1-31, 2023",
    createdAt: "Jan 1, 2024 00:15",
    size: "3.8 MB",
  },
  {
    id: "4",
    name: "Custom Analysis - Conference Event",
    type: "Custom",
    dateRange: "Jan 10, 2024 09:00-17:00",
    createdAt: "Jan 10, 2024 18:30",
    size: "520 KB",
  },
];

export default function Reports() {
  const [date, setDate] = useState<Date>();

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
                <Select defaultValue="daily">
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
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sites</SelectItem>
                    <SelectItem value="building-a">Building A</SelectItem>
                    <SelectItem value="building-b">Building B</SelectItem>
                    <SelectItem value="parking">Parking Lot</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Camera</Label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cameras</SelectItem>
                    <SelectItem value="main">Main Entrance</SelectItem>
                    <SelectItem value="lobby">Lobby Camera 1</SelectItem>
                    <SelectItem value="conference">Conference Hall</SelectItem>
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
                      onSelect={setDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-end">
                <Button className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Preview */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total IN (Today)"
            value="1,284"
            icon={ArrowUpRight}
            variant="success"
          />
          <StatCard
            title="Total OUT (Today)"
            value="1,037"
            icon={ArrowDownRight}
            variant="destructive"
          />
          <StatCard
            title="Peak Occupancy"
            value="312"
            subtitle="At 14:35"
            icon={TrendingUp}
            variant="warning"
          />
          <StatCard
            title="Avg. Dwell Time"
            value="4m 32s"
            icon={Clock}
          />
        </div>

        {/* Charts */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Occupancy Trend</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <OccupancyChart />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">IN/OUT Distribution</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <InOutChart />
            </CardContent>
          </Card>
        </div>

        {/* Generated Reports */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Generated Reports</CardTitle>
            <Badge variant="outline">{mockReports.length} Reports</Badge>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date Range</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="w-32">Export</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{report.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{report.type}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {report.dateRange}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {report.createdAt}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {report.size}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" title="Export CSV">
                          <FileSpreadsheet className="h-4 w-4 text-success" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Export PDF">
                          <File className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
