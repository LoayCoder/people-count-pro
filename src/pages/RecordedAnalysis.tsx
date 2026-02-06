import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
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
  Upload,
  FileVideo,
  Play,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Download,
  Eye,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Job {
  id: string;
  videoName: string;
  camera: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  startedAt?: string;
  completedAt?: string;
  result?: {
    totalIn: number;
    totalOut: number;
    peakOccupancy: number;
    avgDwell: string;
  };
}

const mockJobs: Job[] = [
  {
    id: "1",
    videoName: "entrance_2024_01_15_08-12.mp4",
    camera: "Main Entrance",
    status: "completed",
    progress: 100,
    startedAt: "2024-01-15 08:00",
    completedAt: "2024-01-15 08:35",
    result: {
      totalIn: 458,
      totalOut: 412,
      peakOccupancy: 89,
      avgDwell: "3m 45s",
    },
  },
  {
    id: "2",
    videoName: "lobby_morning_shift.mp4",
    camera: "Lobby Camera 1",
    status: "processing",
    progress: 67,
    startedAt: "2024-01-15 09:15",
  },
  {
    id: "3",
    videoName: "conference_event_2024.mp4",
    camera: "Conference Hall",
    status: "pending",
    progress: 0,
  },
  {
    id: "4",
    videoName: "parking_night_review.mp4",
    camera: "Parking Entrance",
    status: "failed",
    progress: 23,
    startedAt: "2024-01-14 22:00",
  },
];

const statusConfig = {
  pending: { icon: Clock, className: "text-muted-foreground", label: "Pending" },
  processing: { icon: Loader2, className: "text-primary animate-spin", label: "Processing" },
  completed: { icon: CheckCircle, className: "text-success", label: "Completed" },
  failed: { icon: XCircle, className: "text-destructive", label: "Failed" },
};

export default function RecordedAnalysis() {
  const [dragActive, setDragActive] = useState(false);

  return (
    <div className="min-h-screen">
      <Header title="Recorded Video Analysis" subtitle="Process and analyze recorded video files" />

      <div className="p-6">
        {/* Upload Area */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div
              className={cn(
                "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors",
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                // Handle file drop
              }}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-medium">Upload Video Files</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Drag and drop MP4 files here, or click to browse
              </p>
              <div className="mt-4 flex items-center gap-4">
                <Button>
                  <FileVideo className="mr-2 h-4 w-4" />
                  Select Files
                </Button>
                <span className="text-sm text-muted-foreground">
                  Max file size: 2GB
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Setup */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Quick Analysis Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Apply Camera Config
                </label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select camera" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main Entrance Config</SelectItem>
                    <SelectItem value="lobby">Lobby Camera 1 Config</SelectItem>
                    <SelectItem value="conference">Conference Hall Config</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Date Range (Video)
                </label>
                <Input type="date" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Processing Priority
                </label>
                <Select defaultValue="normal">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button className="w-full">
                  <Play className="mr-2 h-4 w-4" />
                  Start Processing
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Processing Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Processing Jobs</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">4 Jobs</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Video File</TableHead>
                  <TableHead>Camera Config</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Results</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockJobs.map((job) => {
                  const StatusIcon = statusConfig[job.status].icon;
                  return (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <FileVideo className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{job.videoName}</p>
                            {job.startedAt && (
                              <p className="text-xs text-muted-foreground">
                                Started: {job.startedAt}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{job.camera}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StatusIcon
                            className={cn("h-4 w-4", statusConfig[job.status].className)}
                          />
                          <span className="text-sm">
                            {statusConfig[job.status].label}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-32">
                          <Progress value={job.progress} className="h-2" />
                          <span className="text-xs text-muted-foreground">
                            {job.progress}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {job.result ? (
                          <div className="text-sm">
                            <span className="text-success">+{job.result.totalIn}</span>
                            {" / "}
                            <span className="text-destructive">-{job.result.totalOut}</span>
                            <p className="text-xs text-muted-foreground">
                              Peak: {job.result.peakOccupancy}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {job.status === "completed" && (
                            <>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Download className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
