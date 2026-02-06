import { useState, useRef, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Upload,
  FileVideo,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Info,
  ArrowRightLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  useRecordedJobs,
  useCreateRecordedJob,
  useDeleteRecordedJob,
  useProcessVideo,
  useRecordedJobsRealtime,
  JobResult,
} from "@/hooks/use-recorded-jobs";
import { useCameras } from "@/hooks/use-cameras";
import { useCameraConfig } from "@/hooks/use-camera-config";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

const statusConfig = {
  pending: { icon: Clock, className: "text-muted-foreground", label: "Pending" },
  processing: { icon: Loader2, className: "text-primary animate-spin", label: "Processing" },
  completed: { icon: CheckCircle, className: "text-success", label: "Completed" },
  failed: { icon: XCircle, className: "text-destructive", label: "Failed" },
};

export default function RecordedAnalysis() {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: jobs, isLoading: jobsLoading } = useRecordedJobs();
  const { data: cameras } = useCameras();
  const createJob = useCreateRecordedJob();
  const deleteJob = useDeleteRecordedJob();
  const processVideo = useProcessVideo();

  // Enable realtime updates
  useRecordedJobsRealtime();

  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const file = files[0];
      const allowedTypes = ["video/mp4", "video/avi", "video/quicktime", "video/x-msvideo", "video/x-matroska"];

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload MP4, AVI, MOV, or MKV files.",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 500 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 500MB.",
          variant: "destructive",
        });
        return;
      }

      setUploading(true);
      setUploadProgress(0);

      try {
        // Generate unique filename
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("video-uploads")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        setUploadProgress(50);

        // Get the public URL
        const { data: urlData } = supabase.storage
          .from("video-uploads")
          .getPublicUrl(fileName);

        // Create job record
        const job = await createJob.mutateAsync({
          video_name: file.name,
          video_url: urlData.publicUrl,
          camera_id: selectedCamera || null,
          status: "pending",
          progress: 0,
        });

        setUploadProgress(100);

        toast({
          title: "Upload complete",
          description: "Video has been uploaded. Click 'Start Processing' to analyze.",
        });

        // Auto-start processing
        if (job?.id) {
          processVideo.mutate(job.id);
        }
      } catch (error: any) {
        console.error("Upload error:", error);
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [selectedCamera, createJob, processVideo, toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload]
  );

  const handleRetry = (jobId: string) => {
    processVideo.mutate(jobId);
  };

  const handleViewResults = (job: any) => {
    setSelectedJob(job);
    setResultsDialogOpen(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  if (jobsLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Recorded Video Analysis" subtitle="Process and analyze recorded video files" />
        <LoadingSpinner />
      </div>
    );
  }

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
                  : "border-border hover:border-primary/50",
                uploading && "pointer-events-none opacity-50"
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/avi,video/quicktime,video/x-msvideo,video/x-matroska"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />

              {uploading ? (
                <>
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <h3 className="mt-4 text-lg font-medium">Uploading...</h3>
                  <Progress value={uploadProgress} className="mt-4 w-48" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {uploadProgress}% complete
                  </p>
                </>
              ) : (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">Upload Video Files</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Drag and drop MP4, AVI, MOV, or MKV files here
                  </p>
                  <div className="mt-4 flex items-center gap-4">
                    <Button onClick={() => fileInputRef.current?.click()}>
                      <FileVideo className="mr-2 h-4 w-4" />
                      Select Files
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Max file size: 500MB
                    </span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Setup */}
        <CameraConfigSetup 
          cameras={cameras || []} 
          selectedCamera={selectedCamera} 
          onCameraChange={setSelectedCamera} 
        />

        {/* Processing Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Processing Jobs</CardTitle>
            <Badge variant="outline">{jobs?.length || 0} Jobs</Badge>
          </CardHeader>
          <CardContent>
            {!jobs || jobs.length === 0 ? (
              <EmptyState
                icon={FileVideo}
                title="No processing jobs"
                description="Upload a video file to start analyzing. Results will appear here once processing is complete."
                action={{
                  label: "Upload Video",
                  onClick: () => fileInputRef.current?.click(),
                }}
              />
            ) : (
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
                  {jobs.map((job) => {
                    const StatusIcon = statusConfig[job.status as keyof typeof statusConfig]?.icon || Clock;
                    const statusClass = statusConfig[job.status as keyof typeof statusConfig]?.className || "";
                    const statusLabel = statusConfig[job.status as keyof typeof statusConfig]?.label || job.status;
                    const result = job.result_json as unknown as JobResult | null;

                    return (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <FileVideo className="h-8 w-8 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{job.video_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(job.created_at)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {job.camera ? (
                            <Badge variant="outline">{(job.camera as any).name}</Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusIcon className={cn("h-4 w-4", statusClass)} />
                            <span className="text-sm">{statusLabel}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-32">
                            <Progress value={job.progress || 0} className="h-2" />
                            <span className="text-xs text-muted-foreground">
                              {job.progress || 0}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {result ? (
                            <div className="text-sm">
                              <span className="text-success">+{result.totalIn}</span>
                              {" / "}
                              <span className="text-destructive">-{result.totalOut}</span>
                              <p className="text-xs text-muted-foreground">
                                Peak: {result.peakOccupancy}
                              </p>
                            </div>
                          ) : job.error_message ? (
                            <span className="text-xs text-destructive">{job.error_message}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {job.status === "completed" && result && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewResults(job)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {job.status === "failed" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRetry(job.id)}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteJob.mutate(job.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results Dialog */}
      <Dialog open={resultsDialogOpen} onOpenChange={setResultsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Analysis Results</DialogTitle>
            <DialogDescription>
              {selectedJob?.video_name}
            </DialogDescription>
          </DialogHeader>
          {selectedJob?.result_json && (() => {
            const result = selectedJob.result_json as unknown as JobResult & { isDemo?: boolean; lineCount?: number };
            return (
              <div className="grid gap-4 py-4">
                {result.isDemo && (
                  <Alert variant="default" className="border-warning/50 bg-warning/10">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <AlertDescription className="text-sm">
                      <strong>Demo Mode:</strong> These are simulated results. For accurate counting, integrate a Computer Vision backend.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold text-success">
                        {result.totalIn}
                      </p>
                      <p className="text-sm text-muted-foreground">Total IN</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold text-destructive">
                        {result.totalOut}
                      </p>
                      <p className="text-sm text-muted-foreground">Total OUT</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold text-primary">
                        {result.peakOccupancy}
                      </p>
                      <p className="text-sm text-muted-foreground">Peak Occupancy</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold">
                        {Math.floor(result.avgDwellSeconds / 60)}m {result.avgDwellSeconds % 60}s
                      </p>
                      <p className="text-sm text-muted-foreground">Avg Dwell Time</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>
                    Confidence: {(result.confidence * 100).toFixed(0)}%
                  </span>
                  {result.lineCount !== undefined && result.lineCount > 0 && (
                    <>
                      <span className="mx-2">•</span>
                      <ArrowRightLeft className="h-4 w-4" />
                      <span>{result.lineCount} counting line{result.lineCount !== 1 ? 's' : ''} applied</span>
                    </>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
