import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowRightLeft,
  Move,
  Trash2,
  Save,
  Info,
  Loader2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DrawingCanvas, type CountingLine, type DrawingTool } from "@/components/configurator/DrawingCanvas";

interface VideoLineConfiguratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoName: string;
  videoFile?: File;
  videoUrl?: string;
  existingLines?: CountingLine[];
  onSave: (lines: CountingLine[]) => void;
  isSaving?: boolean;
}

export function VideoLineConfigurator({
  open,
  onOpenChange,
  videoName,
  videoFile,
  videoUrl,
  existingLines = [],
  onSave,
  isSaving = false,
}: VideoLineConfiguratorProps) {
  const [lines, setLines] = useState<CountingLine[]>(existingLines);
  const [selectedTool, setSelectedTool] = useState<DrawingTool>("line");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setLines(existingLines);
      setSelectedTool("line");
      setSelectedId(null);
    }
  }, [open, existingLines]);

  // Extract thumbnail from video - optimized for speed
  useEffect(() => {
    if (open && videoUrl) {
      setThumbnailUrl(null);
      
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";
      
      // Try without crossOrigin first for faster loading
      // Only add crossOrigin if we get a security error
      let triedWithCors = false;
      
      const extractFrame = () => {
        try {
          const canvas = document.createElement("canvas");
          // Use standard 16:9 aspect ratio if dimensions not available
          canvas.width = video.videoWidth || 1920;
          canvas.height = video.videoHeight || 1080;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
            setThumbnailUrl(dataUrl);
          }
        } catch (e) {
          // Security error - try with crossOrigin
          if (!triedWithCors && e instanceof DOMException && e.name === "SecurityError") {
            triedWithCors = true;
            video.crossOrigin = "anonymous";
            video.load();
            return;
          }
          console.error("Failed to extract thumbnail:", e);
          // Use video URL directly as fallback (video element will show it)
          setThumbnailUrl(videoUrl);
        }
      };
      
      video.onloadedmetadata = () => {
        // Seek to 0.5 seconds for faster frame extraction
        video.currentTime = Math.min(0.5, video.duration || 0.5);
      };
      
      video.onseeked = extractFrame;
      
      // Fallback: if seeking doesn't work, try on canplay
      video.oncanplay = () => {
        if (!thumbnailUrl) {
          extractFrame();
        }
      };
      
      video.onerror = () => {
        console.error("Failed to load video for thumbnail");
        // Use video URL directly as fallback
        setThumbnailUrl(videoUrl);
      };
      
      video.src = videoUrl;
      video.load();
      
      return () => {
        video.pause();
        video.removeAttribute("src");
        video.load();
      };
    }
  }, [open, videoUrl]);

  const handleSelectElement = useCallback((id: string | null, type: "roi" | "line" | "zone" | null) => {
    setSelectedId(id);
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (selectedId) {
      setLines(lines.filter(l => l.id !== selectedId));
      setSelectedId(null);
    }
  }, [selectedId, lines]);

  const handleSave = useCallback(() => {
    onSave(lines);
  }, [lines, onSave]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Configure Counting Lines</DialogTitle>
          <DialogDescription>
            Draw counting lines on the video frame. Click two points to create a line.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col gap-4">
          {/* Toolbar */}
          <TooltipProvider delayDuration={300}>
            <div className="flex items-center justify-between border rounded-lg bg-muted/30 px-3 py-2">
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={selectedTool === "select" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setSelectedTool("select")}
                    >
                      <Move className="h-4 w-4 mr-1" />
                      Select
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Click to select and drag line endpoints</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={selectedTool === "line" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setSelectedTool("line")}
                    >
                      <ArrowRightLeft className="h-4 w-4 mr-1" />
                      Draw Line
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Click start point, then end point to draw a counting line</TooltipContent>
                </Tooltip>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteSelected}
                  disabled={!selectedId}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
              <Badge variant="outline">
                {lines.length} counting line{lines.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </TooltipProvider>

          {/* Canvas Area */}
          <div className="flex-1 min-h-0 relative rounded-lg overflow-hidden bg-black flex items-center justify-center">
            {thumbnailUrl ? (
              <>
                {thumbnailUrl.startsWith("data:") ? (
                  <img
                    src={thumbnailUrl}
                    alt="Video frame"
                    className="max-h-full max-w-full object-contain"
                    style={{ pointerEvents: "none" }}
                  />
                ) : (
                  <video
                    src={thumbnailUrl}
                    className="max-h-full max-w-full object-contain"
                    style={{ pointerEvents: "none" }}
                    muted
                    playsInline
                    preload="metadata"
                    onLoadedMetadata={(e) => {
                      const video = e.currentTarget;
                      video.currentTime = 0.5;
                    }}
                  />
                )}
                <div className="absolute inset-0">
                  <DrawingCanvas
                    tool={selectedTool}
                    rois={[]}
                    lines={lines}
                    zones={[]}
                    onRoisChange={() => {}}
                    onLinesChange={setLines}
                    onZonesChange={() => {}}
                    selectedId={selectedId || undefined}
                    onSelectElement={handleSelectElement}
                  />
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm">Loading video frame...</p>
              </div>
            )}
          </div>

          {/* Help text */}
          {lines.length === 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Draw a counting line:</strong> With "Draw Line" selected, click once for the start point, 
                then click again for the end point. The arrow indicates the "IN" direction.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <p className="text-sm text-muted-foreground mr-auto">
            {videoName}
          </p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save & Process
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}