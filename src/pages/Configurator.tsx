import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  Square,
  ArrowRightLeft,
  Shapes,
  Save,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Move,
  Crosshair,
  Settings,
  Eye,
} from "lucide-react";

export default function Configurator() {
  const [selectedTool, setSelectedTool] = useState<string>("select");
  const [confidence, setConfidence] = useState([0.5]);
  const [minTrackAge, setMinTrackAge] = useState([3]);

  return (
    <div className="min-h-screen">
      <Header title="Camera Configurator" subtitle="Configure AI counting parameters and detection zones" />

      <div className="p-6">
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
                    title="Select"
                  >
                    <Move className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={selectedTool === "roi" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setSelectedTool("roi")}
                    title="Draw ROI Polygon"
                  >
                    <Shapes className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={selectedTool === "line" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setSelectedTool("line")}
                    title="Draw Counting Line"
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={selectedTool === "zone" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setSelectedTool("zone")}
                    title="Draw Zone Polygon"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                  <div className="mx-2 h-6 w-px bg-border" />
                  <Button variant="ghost" size="icon" title="Undo">
                    <Undo className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" title="Redo">
                    <Redo className="h-4 w-4" />
                  </Button>
                  <div className="mx-2 h-6 w-px bg-border" />
                  <Button variant="ghost" size="icon" title="Zoom In">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" title="Zoom Out">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Eye className="mr-1 h-3 w-3" />
                    Preview Mode
                  </Badge>
                  <Button size="sm">
                    <Save className="mr-2 h-4 w-4" />
                    Save Config
                  </Button>
                </div>
              </div>

              {/* Canvas */}
              <div className="relative aspect-video bg-black">
                {/* Placeholder for camera feed */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                  <div className="text-center">
                    <Camera className="mx-auto h-16 w-16 text-muted-foreground/30" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      Select a camera to configure
                    </p>
                  </div>
                </div>

                {/* Demo overlays */}
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1920 1080">
                  {/* ROI Polygon */}
                  <polygon
                    points="200,100 1700,100 1800,900 100,900"
                    fill="hsla(217, 91%, 60%, 0.1)"
                    stroke="hsl(217, 91%, 60%)"
                    strokeWidth="2"
                    strokeDasharray="8,4"
                  />
                  
                  {/* Counting Line */}
                  <line
                    x1="300"
                    y1="540"
                    x2="1600"
                    y2="540"
                    stroke="hsl(142, 71%, 45%)"
                    strokeWidth="3"
                  />
                  <polygon
                    points="1550,520 1600,540 1550,560"
                    fill="hsl(142, 71%, 45%)"
                  />
                  <text
                    x="1620"
                    y="545"
                    fill="hsl(142, 71%, 45%)"
                    fontSize="14"
                    fontWeight="bold"
                  >
                    IN →
                  </text>
                  <polygon
                    points="350,520 300,540 350,560"
                    fill="hsl(0, 72%, 51%)"
                  />
                  <text
                    x="220"
                    y="545"
                    fill="hsl(0, 72%, 51%)"
                    fontSize="14"
                    fontWeight="bold"
                  >
                    ← OUT
                  </text>

                  {/* Zone */}
                  <polygon
                    points="400,600 800,600 800,900 400,900"
                    fill="hsla(38, 92%, 50%, 0.15)"
                    stroke="hsl(38, 92%, 50%)"
                    strokeWidth="2"
                  />
                  <text
                    x="600"
                    y="750"
                    fill="hsl(38, 92%, 50%)"
                    fontSize="16"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    Zone A
                  </text>
                </svg>

                {/* Crosshair on mouse position (demo) */}
                <Crosshair className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-primary opacity-50" />
              </div>

              {/* Config Status Bar */}
              <div className="flex items-center gap-4 border-t border-border bg-muted/30 px-4 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-primary/50" />
                  <span className="text-muted-foreground">ROI: 1 polygon</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-success" />
                  <span className="text-muted-foreground">Lines: 1 counting line</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-warning" />
                  <span className="text-muted-foreground">Zones: 1 zone</span>
                </div>
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
                <Select defaultValue="main-entrance">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main-entrance">Main Entrance</SelectItem>
                    <SelectItem value="lobby-1">Lobby Camera 1</SelectItem>
                    <SelectItem value="parking">Parking Entrance</SelectItem>
                    <SelectItem value="conference">Conference Hall</SelectItem>
                  </SelectContent>
                </Select>
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
                  <Label className="text-sm">Max Lost Frames</Label>
                  <Select defaultValue="30">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 frames</SelectItem>
                      <SelectItem value="30">30 frames</SelectItem>
                      <SelectItem value="45">45 frames</SelectItem>
                      <SelectItem value="60">60 frames</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <div className="rounded-lg border border-dashed border-border p-3 text-center text-sm text-muted-foreground">
                      Draw a polygon to define the region of interest
                    </div>
                  </TabsContent>
                  <TabsContent value="lines" className="mt-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded-lg border border-success/30 bg-success/5 p-2">
                        <div className="flex items-center gap-2">
                          <ArrowRightLeft className="h-4 w-4 text-success" />
                          <span className="text-sm">Line 1</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Bi-directional
                        </Badge>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="zones" className="mt-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning/5 p-2">
                        <div className="flex items-center gap-2">
                          <Square className="h-4 w-4 text-warning" />
                          <span className="text-sm">Zone A</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Dwell tracking
                        </Badge>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
