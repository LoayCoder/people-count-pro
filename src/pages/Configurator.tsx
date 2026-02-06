import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Camera,
  Square,
  ArrowRightLeft,
  Shapes,
  Save,
  Undo,
  Redo,
  Move,
  Settings,
  Eye,
  Trash2,
  Loader2,
  HelpCircle,
  Info,
} from "lucide-react";
import { useCameras } from "@/hooks/use-cameras";
import { useCameraConfig, useSaveCameraConfig } from "@/hooks/use-camera-config";
import { DrawingCanvas, type ROIPolygon, type CountingLine, type Zone, type DrawingTool } from "@/components/configurator/DrawingCanvas";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { toast } from "sonner";

export default function Configurator() {
  const [selectedTool, setSelectedTool] = useState<DrawingTool>("select");
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedElementType, setSelectedElementType] = useState<"roi" | "line" | "zone" | null>(null);

  // Drawing state
  const [rois, setRois] = useState<ROIPolygon[]>([]);
  const [lines, setLines] = useState<CountingLine[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);

  // Threshold state
  const [confidence, setConfidence] = useState([0.5]);
  const [minTrackAge, setMinTrackAge] = useState([3]);
  const [maxLostFrames, setMaxLostFrames] = useState([30]);

  // Undo/redo history
  const [history, setHistory] = useState<Array<{ rois: ROIPolygon[]; lines: CountingLine[]; zones: Zone[] }>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const { data: cameras, isLoading: camerasLoading } = useCameras();
  const { data: config, isLoading: configLoading } = useCameraConfig(selectedCameraId);
  const saveConfig = useSaveCameraConfig();

  // Load config when camera changes
  useEffect(() => {
    if (config) {
      setRois(config.roi_json);
      setLines(config.line_json);
      setZones(config.zone_json);
      setConfidence([config.thresholds_json.confidence]);
      setMinTrackAge([config.thresholds_json.min_track_age]);
      setMaxLostFrames([config.thresholds_json.max_lost_frames]);
      setHistory([{ rois: config.roi_json, lines: config.line_json, zones: config.zone_json }]);
      setHistoryIndex(0);
    } else if (selectedCameraId && !configLoading) {
      // New config - reset state
      setRois([]);
      setLines([]);
      setZones([]);
      setConfidence([0.5]);
      setMinTrackAge([3]);
      setMaxLostFrames([30]);
      setHistory([{ rois: [], lines: [], zones: [] }]);
      setHistoryIndex(0);
    }
  }, [config, selectedCameraId, configLoading]);

  // Auto-select first camera
  useEffect(() => {
    if (cameras && cameras.length > 0 && !selectedCameraId) {
      setSelectedCameraId(cameras[0].id);
    }
  }, [cameras, selectedCameraId]);

  const pushHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ rois: [...rois], lines: [...lines], zones: [...zones] });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex, rois, lines, zones]);

  const handleRoisChange = useCallback((newRois: ROIPolygon[]) => {
    setRois(newRois);
    pushHistory();
  }, [pushHistory]);

  const handleLinesChange = useCallback((newLines: CountingLine[]) => {
    setLines(newLines);
    pushHistory();
  }, [pushHistory]);

  const handleZonesChange = useCallback((newZones: Zone[]) => {
    setZones(newZones);
    pushHistory();
  }, [pushHistory]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setRois(prev.rois);
      setLines(prev.lines);
      setZones(prev.zones);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setRois(next.rois);
      setLines(next.lines);
      setZones(next.zones);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex]);

  const handleSave = useCallback(() => {
    if (!selectedCameraId) {
      toast.error("Please select a camera first");
      return;
    }

    saveConfig.mutate({
      cameraId: selectedCameraId,
      rois,
      lines,
      zones,
      thresholds: {
        confidence: confidence[0],
        min_track_age: minTrackAge[0],
        max_lost_frames: maxLostFrames[0],
      },
    });
  }, [selectedCameraId, rois, lines, zones, confidence, minTrackAge, maxLostFrames, saveConfig]);

  const handleDeleteSelected = useCallback(() => {
    if (!selectedElementId) return;
    
    if (selectedElementType === "roi") {
      setRois(rois.filter(r => r.id !== selectedElementId));
    } else if (selectedElementType === "line") {
      setLines(lines.filter(l => l.id !== selectedElementId));
    } else if (selectedElementType === "zone") {
      setZones(zones.filter(z => z.id !== selectedElementId));
    }
    setSelectedElementId(null);
    setSelectedElementType(null);
    pushHistory();
  }, [selectedElementId, selectedElementType, rois, lines, zones, pushHistory]);

  const handleSelectElement = useCallback((id: string | null, type: "roi" | "line" | "zone" | null) => {
    setSelectedElementId(id);
    setSelectedElementType(type);
  }, []);

  const selectedCamera = cameras?.find(c => c.id === selectedCameraId);

  if (camerasLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Camera Configurator" subtitle="Configure AI counting parameters and detection zones" />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Camera Configurator" subtitle="Configure AI counting parameters and detection zones" />

      <div className="p-6">
        {!cameras || cameras.length === 0 ? (
          <EmptyState
            icon={Camera}
            title="No cameras configured"
            description="Add cameras in the Camera Management page first"
            actionLabel="Go to Cameras"
            actionHref="/cameras"
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Main Canvas Area */}
            <div className="lg:col-span-3">
              <Card className="overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
                  <div className="flex items-center gap-1">
                    <Button
                      variant={selectedTool === "select" ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => setSelectedTool("select")}
                      title="Select & Move"
                    >
                      <Move className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={selectedTool === "roi" ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => setSelectedTool("roi")}
                      title="Draw ROI Polygon (double-click to close)"
                    >
                      <Shapes className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={selectedTool === "line" ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => setSelectedTool("line")}
                      title="Draw Counting Line (click start, then end)"
                    >
                      <ArrowRightLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={selectedTool === "zone" ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => setSelectedTool("zone")}
                      title="Draw Zone Polygon (double-click to close)"
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                    <div className="mx-2 h-6 w-px bg-border" />
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Undo"
                      onClick={handleUndo}
                      disabled={historyIndex <= 0}
                    >
                      <Undo className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Redo"
                      onClick={handleRedo}
                      disabled={historyIndex >= history.length - 1}
                    >
                      <Redo className="h-4 w-4" />
                    </Button>
                    <div className="mx-2 h-6 w-px bg-border" />
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete Selected"
                      onClick={handleDeleteSelected}
                      disabled={!selectedElementId}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      <Eye className="mr-1 h-3 w-3" />
                      {selectedTool === "select" ? "Select Mode" : selectedTool === "roi" ? "Drawing ROI" : selectedTool === "line" ? "Drawing Line" : "Drawing Zone"}
                    </Badge>
                    <Button size="sm" onClick={handleSave} disabled={saveConfig.isPending}>
                      {saveConfig.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Config
                    </Button>
                  </div>
                </div>

                {/* Canvas */}
                <div className="relative aspect-video bg-black">
                  {/* Background / Placeholder */}
                  {selectedCamera?.last_snapshot_url ? (
                    <img
                      src={selectedCamera.last_snapshot_url}
                      alt="Camera feed"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                      <div className="text-center">
                        <Camera className="mx-auto h-16 w-16 text-muted-foreground/30" />
                        <p className="mt-4 text-sm text-muted-foreground">
                          {selectedCamera?.name || "Select a camera"}
                        </p>
                        <p className="text-xs text-muted-foreground/60">
                          Click to add points, double-click to close polygons
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Interactive Canvas */}
                  <DrawingCanvas
                    tool={selectedTool}
                    rois={rois}
                    lines={lines}
                    zones={zones}
                    onRoisChange={handleRoisChange}
                    onLinesChange={handleLinesChange}
                    onZonesChange={handleZonesChange}
                    selectedId={selectedElementId || undefined}
                    onSelectElement={handleSelectElement}
                  />
                </div>

                {/* Config Status Bar */}
                <div className="flex items-center gap-4 border-t border-border bg-muted/30 px-4 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm bg-primary/50" />
                    <span className="text-muted-foreground">ROI: {rois.length} polygon{rois.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm bg-success" />
                    <span className="text-muted-foreground">Lines: {lines.length} counting line{lines.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm bg-warning" />
                    <span className="text-muted-foreground">Zones: {zones.length} zone{zones.length !== 1 ? "s" : ""}</span>
                  </div>
                  {config && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      v{config.version} • Last saved: {new Date(config.updated_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </Card>
            </div>

            {/* Sidebar Controls */}
            <div className="space-y-4">
              {/* Camera Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Camera className="h-4 w-4" />
                    Camera Selection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selectedCameraId || undefined}
                    onValueChange={setSelectedCameraId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a camera..." />
                    </SelectTrigger>
                    <SelectContent>
                      {cameras?.map((camera) => (
                        <SelectItem key={camera.id} value={camera.id}>
                          {camera.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCamera && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Status: <span className={selectedCamera.status === "online" ? "text-success" : "text-destructive"}>
                        {selectedCamera.status}
                      </span>
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* AI Parameters */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Settings className="h-4 w-4" />
                    AI Parameters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Confidence Threshold</Label>
                      <span className="font-mono text-sm text-muted-foreground">
                        {confidence[0].toFixed(2)}
                      </span>
                    </div>
                    <Slider
                      value={confidence}
                      onValueChange={setConfidence}
                      min={0.1}
                      max={1}
                      step={0.05}
                    />
                    <p className="text-xs text-muted-foreground">
                      Higher values reduce false positives
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Min Track Age (frames)</Label>
                      <span className="font-mono text-sm text-muted-foreground">
                        {minTrackAge[0]}
                      </span>
                    </div>
                    <Slider
                      value={minTrackAge}
                      onValueChange={setMinTrackAge}
                      min={1}
                      max={10}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">
                      Frames before counting a track
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Max Lost Frames</Label>
                      <span className="font-mono text-sm text-muted-foreground">
                        {maxLostFrames[0]}
                      </span>
                    </div>
                    <Slider
                      value={maxLostFrames}
                      onValueChange={setMaxLostFrames}
                      min={15}
                      max={60}
                      step={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Frames before dropping a track
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Layers Panel */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Layers</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="lines">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="roi" className="text-xs">ROI</TabsTrigger>
                      <TabsTrigger value="lines" className="text-xs">Lines</TabsTrigger>
                      <TabsTrigger value="zones" className="text-xs">Zones</TabsTrigger>
                    </TabsList>
                    <TabsContent value="roi" className="mt-3">
                      {rois.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border p-3 text-center text-sm text-muted-foreground">
                          Draw a polygon to define the region of interest
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {rois.map((roi, idx) => (
                            <div
                              key={roi.id}
                              className={`flex items-center justify-between rounded-lg border p-2 cursor-pointer transition-colors ${
                                selectedElementId === roi.id
                                  ? "border-primary bg-primary/10"
                                  : "border-primary/30 bg-primary/5"
                              }`}
                              onClick={() => handleSelectElement(roi.id, "roi")}
                            >
                              <div className="flex items-center gap-2">
                                <Shapes className="h-4 w-4 text-primary" />
                                <span className="text-sm">ROI {idx + 1}</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {roi.points.length} points
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="lines" className="mt-3">
                      {lines.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border p-3 text-center text-sm text-muted-foreground">
                          Draw a line to set up counting
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {lines.map((line) => (
                            <div
                              key={line.id}
                              className={`flex items-center justify-between rounded-lg border p-2 cursor-pointer transition-colors ${
                                selectedElementId === line.id
                                  ? "border-success bg-success/10"
                                  : "border-success/30 bg-success/5"
                              }`}
                              onClick={() => handleSelectElement(line.id, "line")}
                            >
                              <div className="flex items-center gap-2">
                                <ArrowRightLeft className="h-4 w-4 text-success" />
                                <span className="text-sm">{line.name}</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                Bi-directional
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="zones" className="mt-3">
                      {zones.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border p-3 text-center text-sm text-muted-foreground">
                          Draw zones for dwell tracking
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {zones.map((zone) => (
                            <div
                              key={zone.id}
                              className={`flex items-center justify-between rounded-lg border p-2 cursor-pointer transition-colors ${
                                selectedElementId === zone.id
                                  ? "border-warning bg-warning/10"
                                  : "border-warning/30 bg-warning/5"
                              }`}
                              onClick={() => handleSelectElement(zone.id, "zone")}
                            >
                              <div className="flex items-center gap-2">
                                <Square className="h-4 w-4 text-warning" />
                                <span className="text-sm">{zone.name}</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                Dwell tracking
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
