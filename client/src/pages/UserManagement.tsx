import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, UserPlus, Edit, Trash2, ArrowLeft, Shield, Mail, Plus, Settings, Lock } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import type { Permissions } from "@shared/schema";

interface User {
  _id: string;
  username: string;
  email?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface CustomRole {
  id: string;
  name: string;
  description?: string;
  permissions: Permissions;
  isSystem: boolean;
  createdAt?: string;
}

const defaultPermissions: Permissions = {
  canViewReports: true,
  canCreateReports: true,
  canEditReports: false,
  canDeleteReports: false,
  canViewAllReports: false,
  canAccessAdmin: false,
  canManageUsers: false,
  canViewActivityLogs: false,
  canExportData: true,
  canBackupRestore: false,
};

const permissionLabels: Record<keyof Permissions, string> = {
  canViewReports: "View Reports",
  canCreateReports: "Create Reports",
  canEditReports: "Edit Reports",
  canDeleteReports: "Delete Reports",
  canViewAllReports: "View All Reports",
  canAccessAdmin: "Access Admin Panel",
  canManageUsers: "Manage Users",
  canViewActivityLogs: "View Activity Logs",
  canExportData: "Export Data",
  canBackupRestore: "Backup & Restore",
};

export default function UserManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCreateRoleDialog, setShowCreateRoleDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("employee");
  
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("employee");
  const [editIsActive, setEditIsActive] = useState(true);

  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [changePasswordUser, setChangePasswordUser] = useState<User | null>(null);
  const [changePassword, setChangePassword] = useState("");

  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [newRolePermissions, setNewRolePermissions] = useState<Permissions>(defaultPermissions);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: roles = [], isLoading: rolesLoading } = useQuery<CustomRole[]>({
    queryKey: ['/api/roles'],
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; email?: string; role: string }) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User Created",
        description: "New user has been created successfully.",
      });
      setShowCreateDialog(false);
      resetCreateForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create User",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: string; email?: string; role: string; isActive: boolean }) => {
      const response = await fetch(`/api/users/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, role: data.role, isActive: data.isActive }),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User Updated",
        description: "User has been updated successfully.",
      });
      setEditingUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update User",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User Deleted",
        description: "User has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Delete User",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { userId: string; newPassword: string }) => {
      const response = await fetch(`/api/users/${data.userId}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: data.newPassword }),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change password');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Password Changed",
        description: "User password has been changed successfully.",
      });
      setShowChangePasswordDialog(false);
      setChangePasswordUser(null);
      setChangePassword("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Change Password",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; permissions: Permissions }) => {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create role');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      toast({
        title: "Role Created",
        description: "New role has been created successfully.",
      });
      setShowCreateRoleDialog(false);
      resetRoleForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; description?: string; permissions: Permissions }) => {
      const response = await fetch(`/api/roles/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, description: data.description, permissions: data.permissions }),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update role');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      toast({
        title: "Role Updated",
        description: "Role has been updated successfully.",
      });
      setEditingRole(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete role');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      toast({
        title: "Role Deleted",
        description: "Role has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Delete Role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetCreateForm = () => {
    setNewUsername("");
    setNewPassword("");
    setNewEmail("");
    setNewRole("employee");
  };

  const resetRoleForm = () => {
    setNewRoleName("");
    setNewRoleDescription("");
    setNewRolePermissions(defaultPermissions);
  };

  const handleCreateUser = () => {
    if (!newUsername || !newPassword) {
      toast({
        title: "Validation Error",
        description: "Username and password are required.",
        variant: "destructive",
      });
      return;
    }

    createUserMutation.mutate({
      username: newUsername,
      password: newPassword,
      email: newEmail || undefined,
      role: newRole,
    });
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditEmail(user.email || "");
    setEditRole(user.role);
    setEditIsActive(user.isActive);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;

    updateUserMutation.mutate({
      id: editingUser._id,
      email: editEmail || undefined,
      role: editRole,
      isActive: editIsActive,
    });
  };

  const handleCreateRole = () => {
    if (!newRoleName) {
      toast({
        title: "Validation Error",
        description: "Role name is required.",
        variant: "destructive",
      });
      return;
    }

    createRoleMutation.mutate({
      name: newRoleName,
      description: newRoleDescription || undefined,
      permissions: newRolePermissions,
    });
  };

  const handleEditRole = (role: CustomRole) => {
    setEditingRole(role);
    setNewRoleName(role.name);
    setNewRoleDescription(role.description || "");
    setNewRolePermissions(role.permissions);
  };

  const handleUpdateRole = () => {
    if (!editingRole) return;

    updateRoleMutation.mutate({
      id: editingRole.id,
      name: newRoleName,
      description: newRoleDescription || undefined,
      permissions: newRolePermissions,
    });
  };

  const getRoleBadge = (role: string) => {
    const systemRoles: Record<string, "destructive" | "default" | "secondary"> = {
      admin: "destructive",
      manager: "default",
      employee: "secondary",
    };
    
    return (
      <Badge variant={systemRoles[role.toLowerCase()] || "outline"}>
        {role}
      </Badge>
    );
  };

  const togglePermission = (key: keyof Permissions) => {
    setNewRolePermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin">
              <Button className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
              <p className="text-muted-foreground">Manage users and roles</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Roles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      All Users
                    </CardTitle>
                    <CardDescription>Total users: {users.length}</CardDescription>
                  </div>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading users...</p>
                ) : users.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No users found</p>
                ) : (
                  <div className="space-y-3">
                    {users.map((u) => (
                      <Card key={u._id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{u.username}</h3>
                              {getRoleBadge(u.role)}
                              {!u.isActive && <Badge variant="outline">Inactive</Badge>}
                              {u._id === user?.id && <Badge variant="outline">You</Badge>}
                            </div>
                            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                              {u.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3 w-3" />
                                  <span>{u.email}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-4">
                                <span>Created: {new Date(u.createdAt).toLocaleDateString()}</span>
                                {u.lastLogin && (
                                  <span>Last login: {new Date(u.lastLogin).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUser(u)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setChangePasswordUser(u);
                                setShowChangePasswordDialog(true);
                              }}
                            >
                              <Lock className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={u._id === user?.id}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete user "{u.username}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteUserMutation.mutate(u._id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      All Roles
                    </CardTitle>
                    <CardDescription>Manage system and custom roles</CardDescription>
                  </div>
                  <Button onClick={() => setShowCreateRoleDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Role
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {rolesLoading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading roles...</p>
                ) : roles.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No roles found</p>
                ) : (
                  <div className="space-y-3">
                    {roles.map((role) => (
                      <Card key={role.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{role.name}</h3>
                              {role.isSystem && <Badge variant="secondary">System</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {role.description || "No description"}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(role.permissions).map(([key, value]) => 
                                value && (
                                  <Badge key={key} variant="outline" className="text-xs">
                                    {permissionLabels[key as keyof Permissions]}
                                  </Badge>
                                )
                              )}
                            </div>
                          </div>
                          {!role.isSystem && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditRole(role)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Role</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete role "{role.name}"? Users with this role will need to be reassigned.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteRoleMutation.mutate(role.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter password"
              />
              <p className="text-xs text-muted-foreground">
                Min 8 chars with uppercase, lowercase, number, and special character
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.name.toLowerCase()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User: {editingUser?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="Enter email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.name.toLowerCase()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-active"
                checked={editIsActive}
                onCheckedChange={setEditIsActive}
              />
              <Label htmlFor="edit-active">Account Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Role Dialog */}
      <Dialog open={showCreateRoleDialog} onOpenChange={(open) => {
        setShowCreateRoleDialog(open);
        if (!open) resetRoleForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Role Name *</Label>
              <Input
                id="role-name"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="e.g., Supervisor, Viewer, Accountant"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-description">Description</Label>
              <Textarea
                id="role-description"
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                placeholder="Describe what this role can do..."
                rows={2}
              />
            </div>
            <div className="space-y-3">
              <Label>Permissions</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.keys(permissionLabels) as Array<keyof Permissions>).map((key) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={newRolePermissions[key]}
                      onCheckedChange={() => togglePermission(key)}
                    />
                    <Label htmlFor={key} className="text-sm font-normal cursor-pointer">
                      {permissionLabels[key]}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRole} disabled={createRoleMutation.isPending}>
              {createRoleMutation.isPending ? "Creating..." : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingRole} onOpenChange={(open) => {
        if (!open) {
          setEditingRole(null);
          resetRoleForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role: {editingRole?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-role-name">Role Name *</Label>
              <Input
                id="edit-role-name"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="e.g., Supervisor, Viewer, Accountant"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role-description">Description</Label>
              <Textarea
                id="edit-role-description"
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                placeholder="Describe what this role can do..."
                rows={2}
              />
            </div>
            <div className="space-y-3">
              <Label>Permissions</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.keys(permissionLabels) as Array<keyof Permissions>).map((key) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-${key}`}
                      checked={newRolePermissions[key]}
                      onCheckedChange={() => togglePermission(key)}
                    />
                    <Label htmlFor={`edit-${key}`} className="text-sm font-normal cursor-pointer">
                      {permissionLabels[key]}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRole(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} disabled={updateRoleMutation.isPending}>
              {updateRoleMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password for {changePasswordUser?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password *</Label>
              <Input
                id="new-password"
                type="password"
                value={changePassword}
                onChange={(e) => setChangePassword(e.target.value)}
                placeholder="Enter new password"
              />
              <p className="text-xs text-muted-foreground">
                Min 8 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangePasswordDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!changePassword.trim()) {
                  toast({
                    title: "Validation Error",
                    description: "Password is required.",
                    variant: "destructive",
                  });
                  return;
                }
                if (changePasswordUser) {
                  changePasswordMutation.mutate({
                    userId: changePasswordUser._id,
                    newPassword: changePassword,
                  });
                }
              }}
              disabled={changePasswordMutation.isPending || !changePassword.trim()}
            >
              {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
