import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Camera,
  Plus,
  Search,
  Settings2,
  Trash2,
  Play,
  RefreshCw,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface CameraData {
  id: string;
  name: string;
  site: string;
  zone: string;
  inputType: "live_rtsp" | "recorded_file";
  rtspUrl: string;
  streamType: string;
  enabled: boolean;
  status: "online" | "offline" | "processing" | "error";
  lastSeen: string;
}

const mockCameras: CameraData[] = [
  {
    id: "1",
    name: "Main Entrance",
    site: "Building A",
    zone: "Ground Floor",
    inputType: "live_rtsp",
    rtspUrl: "rtsp://192.168.1.100:554/Streaming/Channels/101",
    streamType: "main",
    enabled: true,
    status: "online",
    lastSeen: "Just now",
  },
  {
    id: "2",
    name: "Lobby Camera 1",
    site: "Building A",
    zone: "Lobby",
    inputType: "live_rtsp",
    rtspUrl: "rtsp://192.168.1.101:554/Streaming/Channels/101",
    streamType: "main",
    enabled: true,
    status: "online",
    lastSeen: "2 min ago",
  },
  {
    id: "3",
    name: "Parking Entrance",
    site: "Parking Lot",
    zone: "Entry Gate",
    inputType: "live_rtsp",
    rtspUrl: "rtsp://192.168.1.102:554/Streaming/Channels/101",
    streamType: "sub",
    enabled: true,
    status: "offline",
    lastSeen: "15 min ago",
  },
  {
    id: "4",
    name: "Conference Hall",
    site: "Building A",
    zone: "2nd Floor",
    inputType: "live_rtsp",
    rtspUrl: "rtsp://192.168.1.103:554/Streaming/Channels/101",
    streamType: "main",
    enabled: true,
    status: "processing",
    lastSeen: "Just now",
  },
  {
    id: "5",
    name: "Emergency Exit B",
    site: "Building B",
    zone: "Ground Floor",
    inputType: "live_rtsp",
    rtspUrl: "rtsp://192.168.1.104:554/Streaming/Channels/101",
    streamType: "main",
    enabled: false,
    status: "offline",
    lastSeen: "2 hours ago",
  },
];

const statusConfig = {
  online: { icon: CheckCircle, className: "text-success", label: "Online" },
  offline: { icon: XCircle, className: "text-destructive", label: "Offline" },
  processing: { icon: RefreshCw, className: "text-warning animate-spin", label: "Processing" },
  error: { icon: AlertCircle, className: "text-destructive", label: "Error" },
};

export default function Cameras() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredCameras = mockCameras.filter(
    (camera) =>
      camera.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      camera.site.toLowerCase().includes(searchQuery.toLowerCase()) ||
      camera.zone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Header title="Camera Management" subtitle="Manage and monitor all connected cameras" />

      <div className="p-6">
        {/* Stats */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">15</p>
                <p className="text-sm text-muted-foreground">Total Cameras</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/20">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">Online</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/20">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-sm text-muted-foreground">Offline</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/20">
                <RefreshCw className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-sm text-muted-foreground">Processing</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search cameras..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Camera
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Camera</DialogTitle>
                <DialogDescription>
                  Connect a new Hikvision camera to the system
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Camera Name</Label>
                  <Input id="name" placeholder="e.g., Main Entrance" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="site">Site</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select site" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="building-a">Building A</SelectItem>
                        <SelectItem value="building-b">Building B</SelectItem>
                        <SelectItem value="parking">Parking Lot</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="zone">Zone</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select zone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ground">Ground Floor</SelectItem>
                        <SelectItem value="first">1st Floor</SelectItem>
                        <SelectItem value="second">2nd Floor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Input Type</Label>
                  <Select defaultValue="live_rtsp">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="live_rtsp">Live RTSP Stream</SelectItem>
                      <SelectItem value="recorded_file">Recorded File</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rtsp">RTSP URL</Label>
                  <Input
                    id="rtsp"
                    placeholder="rtsp://username:password@ip:port/path"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stream">Stream Type</Label>
                  <Select defaultValue="main">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">Main Stream (High Quality)</SelectItem>
                      <SelectItem value="sub">Sub Stream (Low Bandwidth)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button>
                  <Play className="mr-2 h-4 w-4" />
                  Test & Add
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Camera</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Input Type</TableHead>
                <TableHead>Stream</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCameras.map((camera) => {
                const StatusIcon = statusConfig[camera.status].icon;
                return (
                  <TableRow key={camera.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Camera className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{camera.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {camera.lastSeen}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{camera.site}</p>
                        <p className="text-xs text-muted-foreground">{camera.zone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {camera.inputType === "live_rtsp" ? "Live RTSP" : "Recorded"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm capitalize">{camera.streamType}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusIcon
                          className={cn("h-4 w-4", statusConfig[camera.status].className)}
                        />
                        <span className="text-sm">{statusConfig[camera.status].label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch checked={camera.enabled} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Settings2 className="mr-2 h-4 w-4" />
                            Configure
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Play className="mr-2 h-4 w-4" />
                            Test Connection
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
