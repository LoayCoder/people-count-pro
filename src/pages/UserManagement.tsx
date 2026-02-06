import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Users, Shield, UserCog, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { format } from "date-fns";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserWithRole {
  user_id: string;
  role: AppRole;
  email?: string;
  full_name?: string;
  created_at?: string;
}

export default function UserManagement() {
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["users-with-roles"],
    queryFn: async () => {
      // Get all user roles with profiles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select(`
          user_id,
          role
        `);

      if (rolesError) throw rolesError;

      // Get profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, created_at");

      if (profilesError) throw profilesError;

      // Combine data
      const usersMap = new Map<string, UserWithRole>();

      roles?.forEach((role) => {
        usersMap.set(role.user_id, {
          user_id: role.user_id,
          role: role.role,
        });
      });

      profiles?.forEach((profile) => {
        const existing = usersMap.get(profile.user_id);
        if (existing) {
          existing.full_name = profile.full_name || undefined;
          existing.created_at = profile.created_at;
        }
      });

      return Array.from(usersMap.values());
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      toast.success("User role updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update role: ${error.message}`);
    },
  });

  const roleColors: Record<AppRole, string> = {
    admin: "bg-destructive/20 text-destructive border-destructive/30",
    operator: "bg-primary/20 text-primary border-primary/30",
    viewer: "bg-muted text-muted-foreground border-border",
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="min-h-screen">
        <Header title="User Management" subtitle="Manage user accounts and permissions" />

        <div className="p-6">
          {/* Stats */}
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{users?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/20">
                  <Shield className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {users?.filter((u) => u.role === "admin").length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Administrators</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/20">
                  <UserCog className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {users?.filter((u) => u.role === "operator").length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Operators</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                Manage user roles and permissions across the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <LoadingSpinner />
              ) : !users || users.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No Users Found"
                  description="No users have been registered yet."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="w-48">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {user.full_name || "Unnamed User"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {user.user_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={roleColors[user.role]}
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.created_at
                            ? format(new Date(user.created_at), "MMM dd, yyyy")
                            : "Unknown"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select
                              value={user.role}
                              onValueChange={(value: AppRole) =>
                                updateRole.mutate({
                                  userId: user.user_id,
                                  newRole: value,
                                })
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="operator">Operator</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                            {updateRole.isPending && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Role Descriptions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Role Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-destructive" />
                    <span className="font-medium text-destructive">Admin</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Full system access</li>
                    <li>• Manage users and roles</li>
                    <li>• Configure cameras and sites</li>
                    <li>• Access all reports</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCog className="h-4 w-4 text-primary" />
                    <span className="font-medium text-primary">Operator</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• View and manage cameras</li>
                    <li>• Acknowledge alerts</li>
                    <li>• Generate reports</li>
                    <li>• Upload videos for analysis</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-muted-foreground">Viewer</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• View dashboards</li>
                    <li>• View alerts (read-only)</li>
                    <li>• View reports</li>
                    <li>• No configuration access</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}
