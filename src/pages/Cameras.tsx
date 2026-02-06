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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useNavigate } from "react-router-dom";
import {
  useCameras,
  useCameraStats,
  useCreateCamera,
  useDeleteCamera,
  useToggleCameraEnabled,
} from "@/hooks/use-cameras";
import { useSites } from "@/hooks/use-sites";
import { useZones } from "@/hooks/use-zones";
import { PageLoader } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDistanceToNow } from "date-fns";

const statusConfig = {
  online: { icon: CheckCircle, className: "text-success", label: "Online" },
  offline: { icon: XCircle, className: "text-destructive", label: "Offline" },
  processing: { icon: RefreshCw, className: "text-warning animate-spin", label: "Processing" },
  error: { icon: AlertCircle, className: "text-destructive", label: "Error" },
};

export default function Cameras() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    siteId: "",
    zoneId: "",
    inputType: "live_rtsp" as "live_rtsp" | "recorded_file",
    rtspUrl: "",
    streamType: "main",
  });

  const { data: cameras, isLoading } = useCameras();
  const { data: stats } = useCameraStats();
  const { data: sites } = useSites();
  const { data: zones } = useZones(formData.siteId || undefined);
  const createCamera = useCreateCamera();
  const deleteCamera = useDeleteCamera();
  const toggleEnabled = useToggleCameraEnabled();

  const filteredCameras = cameras?.filter(
    (camera) =>
      camera.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (camera.site as any)?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (camera.zone as any)?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCamera = async () => {
    if (!formData.name) return;

    await createCamera.mutateAsync({
      name: formData.name,
      site_id: formData.siteId || null,
      zone_id: formData.zoneId || null,
      input_type: formData.inputType,
      rtsp_url: formData.rtspUrl || null,
      stream_type: formData.streamType,
      enabled: true,
      status: "offline",
    });

    setIsAddDialogOpen(false);
    setFormData({
      name: "",
      siteId: "",
      zoneId: "",
      inputType: "live_rtsp",
      rtspUrl: "",
      streamType: "main",
    });
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    await deleteCamera.mutateAsync(deleteConfirmId);
    setDeleteConfirmId(null);
  };

  const formatLastSeen = (date: string | null) => {
    if (!date) return "Never";
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Camera Management" subtitle="Manage and monitor all connected cameras" />
        <PageLoader text="Loading cameras..." />
      </div>
    );
  }

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
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
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
                <p className="text-2xl font-bold">{stats?.online || 0}</p>
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
                <p className="text-2xl font-bold">{stats?.offline || 0}</p>
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
                <p className="text-2xl font-bold">{stats?.processing || 0}</p>
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
                  Connect a new camera to the system
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Camera Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Main Entrance"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="site">Site</Label>
                    <Select
                      value={formData.siteId}
                      onValueChange={(value) => setFormData({ ...formData, siteId: value, zoneId: "" })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select site" />
                      </SelectTrigger>
                      <SelectContent>
                        {sites?.map((site) => (
                          <SelectItem key={site.id} value={site.id}>
                            {site.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="zone">Zone</Label>
                    <Select
                      value={formData.zoneId}
                      onValueChange={(value) => setFormData({ ...formData, zoneId: value })}
                      disabled={!formData.siteId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {zones?.map((zone) => (
                          <SelectItem key={zone.id} value={zone.id}>
                            {zone.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Input Type</Label>
                  <Select
                    value={formData.inputType}
                    onValueChange={(value: "live_rtsp" | "recorded_file") =>
                      setFormData({ ...formData, inputType: value })
                    }
                  >
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
                    value={formData.rtspUrl}
                    onChange={(e) => setFormData({ ...formData, rtspUrl: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stream">Stream Type</Label>
                  <Select
                    value={formData.streamType}
                    onValueChange={(value) => setFormData({ ...formData, streamType: value })}
                  >
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
                <Button onClick={handleAddCamera} disabled={!formData.name || createCamera.isPending}>
                  <Play className="mr-2 h-4 w-4" />
                  {createCamera.isPending ? "Adding..." : "Add Camera"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table */}
        <Card>
          {!filteredCameras || filteredCameras.length === 0 ? (
            <EmptyState
              icon={Camera}
              title="No cameras found"
              description={
                searchQuery
                  ? "No cameras match your search. Try a different query."
                  : "Add your first camera to start monitoring."
              }
              action={
                !searchQuery
                  ? {
                      label: "Add Camera",
                      onClick: () => setIsAddDialogOpen(true),
                    }
                  : undefined
              }
            />
          ) : (
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
                  const StatusIcon = statusConfig[camera.status as keyof typeof statusConfig]?.icon || XCircle;
                  const statusClass = statusConfig[camera.status as keyof typeof statusConfig]?.className || "";
                  const statusLabel = statusConfig[camera.status as keyof typeof statusConfig]?.label || camera.status;

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
                              {formatLastSeen(camera.last_seen_at)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{(camera.site as any)?.name || "—"}</p>
                          <p className="text-xs text-muted-foreground">
                            {(camera.zone as any)?.name || "—"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {camera.input_type === "live_rtsp" ? "Live RTSP" : "Recorded"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm capitalize">{camera.stream_type || "main"}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StatusIcon className={cn("h-4 w-4", statusClass)} />
                          <span className="text-sm">{statusLabel}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={camera.enabled}
                          onCheckedChange={(enabled) =>
                            toggleEnabled.mutate({ id: camera.id, enabled })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => navigate(`/configurator?camera=${camera.id}`)}
                            >
                              <Settings2 className="mr-2 h-4 w-4" />
                              Configure
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Play className="mr-2 h-4 w-4" />
                              Test Connection
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteConfirmId(camera.id)}
                            >
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
          )}
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Camera</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this camera? This action cannot be undone.
              All associated configurations and data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
