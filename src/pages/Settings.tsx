import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Bell,
  Shield,
  Database,
  Cpu,
  Save,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/hooks/use-settings";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export default function Settings() {
  const { user, profile } = useAuth();
  const { settings, isLoading, updateMultipleSettings } = useSettings();

  // Local form state
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [alertEmail, setAlertEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Settings state
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [occupancyAlerts, setOccupancyAlerts] = useState(true);
  const [spikeAlerts, setSpikeAlerts] = useState(true);
  const [cameraOfflineAlerts, setCameraOfflineAlerts] = useState(true);
  const [systemAlerts, setSystemAlerts] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [detectionModel, setDetectionModel] = useState("yolov8");
  const [trackingAlgorithm, setTrackingAlgorithm] = useState("bytetrack");
  const [maxWorkers, setMaxWorkers] = useState("4");
  const [gpuAcceleration, setGpuAcceleration] = useState("auto");
  const [countingDataRetention, setCountingDataRetention] = useState("90");
  const [snapshotRetention, setSnapshotRetention] = useState("7");
  const [storeCameraSnapshots, setStoreCameraSnapshots] = useState(true);
  const [storeAlertSnapshots, setStoreAlertSnapshots] = useState(true);
  const [autoLogout, setAutoLogout] = useState(true);

  // Load settings
  useEffect(() => {
    if (settings && !isLoading) {
      setDemoMode(settings.demo_mode ?? false);
      setAutoRefresh(settings.auto_refresh ?? true);
      setOccupancyAlerts(settings.occupancy_alerts ?? true);
      setSpikeAlerts(settings.spike_alerts ?? true);
      setCameraOfflineAlerts(settings.camera_offline_alerts ?? true);
      setSystemAlerts(settings.system_alerts ?? true);
      setInAppNotifications(settings.in_app_notifications ?? true);
      setEmailNotifications(settings.email_notifications ?? false);
      setAlertEmail(settings.alert_email ?? "");
      setDetectionModel(settings.detection_model ?? "yolov8");
      setTrackingAlgorithm(settings.tracking_algorithm ?? "bytetrack");
      setMaxWorkers(String(settings.max_workers ?? 4));
      setGpuAcceleration(settings.gpu_acceleration ?? "auto");
      setCountingDataRetention(String(settings.counting_data_retention ?? 90));
      setSnapshotRetention(String(settings.snapshot_retention ?? 7));
      setStoreCameraSnapshots(settings.store_camera_snapshots ?? true);
      setStoreAlertSnapshots(settings.store_alert_snapshots ?? true);
    }
  }, [settings, isLoading]);

  useEffect(() => {
    setFullName(profile?.full_name || "");
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (error: unknown) {
      toast.error(`Failed to update profile: ${(error as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = () => {
    updateMultipleSettings.mutate({
      occupancy_alerts: occupancyAlerts,
      spike_alerts: spikeAlerts,
      camera_offline_alerts: cameraOfflineAlerts,
      system_alerts: systemAlerts,
      in_app_notifications: inAppNotifications,
      email_notifications: emailNotifications,
      alert_email: alertEmail,
    });
  };

  const handleSaveAI = () => {
    updateMultipleSettings.mutate({
      detection_model: detectionModel,
      tracking_algorithm: trackingAlgorithm,
      max_workers: parseInt(maxWorkers),
      gpu_acceleration: gpuAcceleration,
    });
  };

  const handleSaveStorage = () => {
    updateMultipleSettings.mutate({
      counting_data_retention: parseInt(countingDataRetention),
      snapshot_retention: parseInt(snapshotRetention),
      store_camera_snapshots: storeCameraSnapshots,
      store_alert_snapshots: storeAlertSnapshots,
    });
  };

  const handleSaveSystemPrefs = () => {
    updateMultipleSettings.mutate({
      demo_mode: demoMode,
      auto_refresh: autoRefresh,
    });
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      toast.error(`Failed to update password: ${(error as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Settings" subtitle="Configure system preferences and integrations" />
        <div className="p-6">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Settings" subtitle="Configure system preferences and integrations" />

      <div className="p-6">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="ai">AI Processing</TabsTrigger>
            <TabsTrigger value="storage">Storage</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Settings
                  </CardTitle>
                  <CardDescription>
                    Manage your account information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                    />
                  </div>
                  <Button onClick={handleSaveProfile} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Preferences</CardTitle>
                  <CardDescription>
                    Configure system-wide settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Demo Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Use sample video data for testing
                      </p>
                    </div>
                    <Switch checked={demoMode} onCheckedChange={setDemoMode} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-refresh Dashboard</Label>
                      <p className="text-sm text-muted-foreground">
                        Refresh live data every 10 seconds
                      </p>
                    </div>
                    <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                  </div>
                  <Button onClick={handleSaveSystemPrefs} disabled={updateMultipleSettings.isPending}>
                    {updateMultipleSettings.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure how you receive alerts and notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Alert Types</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Occupancy Threshold Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          When occupancy exceeds configured limits
                        </p>
                      </div>
                      <Switch checked={occupancyAlerts} onCheckedChange={setOccupancyAlerts} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>People Spike Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Sudden increases in people count
                        </p>
                      </div>
                      <Switch checked={spikeAlerts} onCheckedChange={setSpikeAlerts} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Camera Offline Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          When camera connection is lost
                        </p>
                      </div>
                      <Switch checked={cameraOfflineAlerts} onCheckedChange={setCameraOfflineAlerts} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>System Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          AI worker and system health issues
                        </p>
                      </div>
                      <Switch checked={systemAlerts} onCheckedChange={setSystemAlerts} />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Delivery Methods</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>In-App Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Show notifications in the dashboard
                      </p>
                    </div>
                    <Switch checked={inAppNotifications} onCheckedChange={setInAppNotifications} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send alerts to your email
                      </p>
                    </div>
                    <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email-alerts">Alert Email Address</Label>
                    <Input
                      id="email-alerts"
                      type="email"
                      placeholder="alerts@company.com"
                      value={alertEmail}
                      onChange={(e) => setAlertEmail(e.target.value)}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveNotifications} disabled={updateMultipleSettings.isPending}>
                  {updateMultipleSettings.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  AI Processing Settings
                </CardTitle>
                <CardDescription>
                  Configure AI model and processing parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Detection Model</Label>
                    <Select value={detectionModel} onValueChange={setDetectionModel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yolov8">YOLOv8 (Recommended)</SelectItem>
                        <SelectItem value="yolov7">YOLOv7</SelectItem>
                        <SelectItem value="yolov5">YOLOv5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tracking Algorithm</Label>
                    <Select value={trackingAlgorithm} onValueChange={setTrackingAlgorithm}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bytetrack">ByteTrack (Recommended)</SelectItem>
                        <SelectItem value="deepsort">DeepSORT</SelectItem>
                        <SelectItem value="sort">SORT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Processing Resources</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Max Concurrent Workers</Label>
                      <Select value={maxWorkers} onValueChange={setMaxWorkers}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 Workers</SelectItem>
                          <SelectItem value="4">4 Workers</SelectItem>
                          <SelectItem value="8">8 Workers</SelectItem>
                          <SelectItem value="16">16 Workers</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>GPU Acceleration</Label>
                      <Select value={gpuAcceleration} onValueChange={setGpuAcceleration}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto Detect</SelectItem>
                          <SelectItem value="cuda">CUDA (NVIDIA)</SelectItem>
                          <SelectItem value="cpu">CPU Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveAI} disabled={updateMultipleSettings.isPending}>
                  {updateMultipleSettings.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save AI Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="storage">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Storage Settings
                </CardTitle>
                <CardDescription>
                  Configure data retention and storage options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Counting Data Retention</Label>
                    <Select value={countingDataRetention} onValueChange={setCountingDataRetention}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 Days</SelectItem>
                        <SelectItem value="60">60 Days</SelectItem>
                        <SelectItem value="90">90 Days</SelectItem>
                        <SelectItem value="180">180 Days</SelectItem>
                        <SelectItem value="365">1 Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Snapshot Retention</Label>
                    <Select value={snapshotRetention} onValueChange={setSnapshotRetention}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Day</SelectItem>
                        <SelectItem value="7">7 Days</SelectItem>
                        <SelectItem value="14">14 Days</SelectItem>
                        <SelectItem value="30">30 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Store Camera Snapshots</Label>
                    <p className="text-sm text-muted-foreground">
                      Capture periodic snapshots from cameras
                    </p>
                  </div>
                  <Switch checked={storeCameraSnapshots} onCheckedChange={setStoreCameraSnapshots} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Store Alert Snapshots</Label>
                    <p className="text-sm text-muted-foreground">
                      Capture frame when alert is triggered
                    </p>
                  </div>
                  <Switch checked={storeAlertSnapshots} onCheckedChange={setStoreAlertSnapshots} />
                </div>

                <Button onClick={handleSaveStorage} disabled={updateMultipleSettings.isPending}>
                  {updateMultipleSettings.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Storage Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage security and access control
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Password</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Current Password</Label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                    <div></div>
                    <div className="space-y-2">
                      <Label>New Password</Label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm New Password</Label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleChangePassword}
                    disabled={!newPassword || isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Change Password
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Session Security</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-logout on Inactivity</Label>
                      <p className="text-sm text-muted-foreground">
                        Log out after 30 minutes of inactivity
                      </p>
                    </div>
                    <Switch checked={autoLogout} onCheckedChange={setAutoLogout} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
