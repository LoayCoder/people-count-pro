import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  Maximize2, 
  Volume2, 
  VolumeX,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CountingLine {
  id: string;
  name: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  inDirection: "left" | "right";
}

interface VideoPlayerProps {
  videoUrl: string;
  countingLines?: CountingLine[];
  className?: string;
  showOverlay?: boolean;
}

export function VideoPlayer({ 
  videoUrl, 
  countingLines = [], 
  className,
  showOverlay = true,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setVideoDimensions({ 
        width: video.videoWidth, 
        height: video.videoHeight 
      });
    };
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleRestart = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    setCurrentTime(0);
    video.play();
    setIsPlaying(true);
  };

  const handleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate line positions relative to displayed video size
  // Lines are stored as pixel coordinates, we need to normalize them to percentages (0-100)
  const getScaledPosition = (point: { x: number; y: number }) => {
    // If video dimensions are available, normalize pixel coords to percentage
    if (videoDimensions.width > 0 && videoDimensions.height > 0) {
      return {
        x: (point.x / videoDimensions.width) * 100,
        y: (point.y / videoDimensions.height) * 100,
      };
    }
    // Fallback: assume coordinates are already percentages if < 1, otherwise estimate based on common resolutions
    if (point.x <= 1 && point.y <= 1) {
      return { x: point.x * 100, y: point.y * 100 };
    }
    // Fallback for when video hasn't loaded yet - estimate based on 1920x1080
    return {
      x: (point.x / 1920) * 100,
      y: (point.y / 1080) * 100,
    };
  };

  return (
    <div 
      ref={containerRef}
      className={cn("relative rounded-lg overflow-hidden bg-black", className)}
    >
      {/* Video Element */}
      <div className="relative aspect-video">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          muted={isMuted}
          playsInline
          crossOrigin="anonymous"
        />

        {/* Counting Lines Overlay */}
        {showOverlay && countingLines.length > 0 && (
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {countingLines.map((line) => {
              const start = getScaledPosition(line.start);
              const end = getScaledPosition(line.end);
              const midX = (start.x + end.x) / 2;
              const midY = (start.y + end.y) / 2;

              // Calculate perpendicular direction for arrow
              const dx = end.x - start.x;
              const dy = end.y - start.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              const perpX = -dy / len * 3;
              const perpY = dx / len * 3;
              
              // Arrow points in direction of "IN"
              const arrowDir = line.inDirection === "left" ? 1 : -1;
              const arrowEndX = midX + perpX * arrowDir;
              const arrowEndY = midY + perpY * arrowDir;

              return (
                <g key={line.id}>
                  {/* Main line */}
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke="hsl(var(--primary))"
                    strokeWidth="0.5"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  {/* Direction arrow */}
                  <line
                    x1={midX}
                    y1={midY}
                    x2={arrowEndX}
                    y2={arrowEndY}
                    stroke="hsl(var(--success))"
                    strokeWidth="0.4"
                    markerEnd="url(#arrowhead)"
                    vectorEffect="non-scaling-stroke"
                  />
                  {/* Line label */}
                  <text
                    x={midX}
                    y={midY - 2}
                    fill="white"
                    fontSize="2"
                    textAnchor="middle"
                    className="drop-shadow-md"
                  >
                    {line.name}
                  </text>
                </g>
              );
            })}
            {/* Arrow marker definition */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="4"
                markerHeight="4"
                refX="2"
                refY="2"
                orient="auto"
              >
                <polygon 
                  points="0 0, 4 2, 0 4" 
                  fill="hsl(var(--success))" 
                />
              </marker>
            </defs>
          </svg>
        )}

        {/* Play/Pause overlay button */}
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
        >
          <div className="w-16 h-16 rounded-full bg-background/80 flex items-center justify-center">
            {isPlaying ? (
              <Pause className="h-8 w-8" />
            ) : (
              <Play className="h-8 w-8 ml-1" />
            )}
          </div>
        </button>
      </div>

      {/* Controls */}
      <div className="bg-card border-t p-2 space-y-2">
        {/* Progress bar */}
        <Slider
          value={[currentTime]}
          min={0}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          className="w-full"
        />
        
        {/* Control buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={togglePlay}>
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleRestart}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleMute}>
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <span className="text-xs text-muted-foreground ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          
          <Button variant="ghost" size="icon" onClick={handleFullscreen}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
