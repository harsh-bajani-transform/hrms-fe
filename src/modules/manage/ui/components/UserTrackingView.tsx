import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Users, Search, UserLock } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
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
import { Switch } from "@/components/ui/switch";
import api from "../../../../services/api";
import { useAuth } from "../../../../context/AuthContext";
import Loading from "../../../../components/common/Loading";

interface UserType {
  user_id: string | number;
  user_name?: string;
  user_email?: string;
  role?: string;
  role_name?: string;
  user_creation_permission?: number;
  project_creation_permission?: number;
  can_manage_users?: number;
  can_manage_projects?: number;
  [key: string]: unknown;
}

const UserTrackingView: React.FC = () => {
  const { user } = useAuth() as { user: UserType };
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [updatingUserId, setUpdatingUserId] = useState<string | number | null>(
    null,
  );

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.post("/permission/user_list", {
        logged_in_user_id: user?.user_id,
      });
      if (response.data?.status === 200) {
        const usersArray = response.data.data?.users || [];
        const mappedUsers = usersArray.map((u: UserType) => ({
          ...u,
          role_name: u.role,
          can_manage_users: u.user_creation_permission,
          can_manage_projects: u.project_creation_permission,
        }));
        setUsers(mappedUsers || []);
      } else {
        toast.error("Failed to load users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Error loading users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const uniqueRoles = useMemo(() => {
    return [...new Set(users.map((u) => u.role_name))].filter(Boolean).sort();
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((userData) => {
      const matchesSearch =
        userData.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        userData.user_email
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        userData.role_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole =
        roleFilter === "all" || userData.role_name === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const handleTogglePermission = async (
    targetUser: UserType,
    permissionKey: "can_manage_users" | "can_manage_projects",
  ) => {
    if (!targetUser.user_id) return;

    setUpdatingUserId(targetUser.user_id);
    const currentValue = targetUser[permissionKey];
    const newValue = currentValue === 1 ? 0 : 1;

    try {
      const payload = {
        user_id: user?.user_id,
        target_user_id: targetUser.user_id,
        project_creation_permission:
          permissionKey === "can_manage_projects"
            ? newValue
            : targetUser.can_manage_projects || 0,
        user_creation_permission:
          permissionKey === "can_manage_users"
            ? newValue
            : targetUser.can_manage_users || 0,
      };

      const response = await api.post("/permission/update", payload);
      if (response.data) {
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.user_id === targetUser.user_id
              ? {
                  ...u,
                  [permissionKey]: newValue,
                  user_creation_permission:
                    permissionKey === "can_manage_users"
                      ? newValue
                      : u.user_creation_permission || 0,
                  project_creation_permission:
                    permissionKey === "can_manage_projects"
                      ? newValue
                      : u.project_creation_permission || 0,
                }
              : u,
          ),
        );
        toast.success(
          `Permission ${newValue === 1 ? "granted" : "revoked"} successfully!`,
        );
      }
    } catch (error) {
      console.error("Error updating permission:", error);
      toast.error("Failed to update permission");
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (loading) {
    return (
      <Loading
        title="Loading users..."
        description="Fetching user permissions and role information"
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-0 py-0 space-y-6">
      <div className="mb-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <UserLock className="w-7 h-7 text-blue-700" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">User Permissions</h2>
            <p className="text-slate-500 text-sm">
              Manage create permissions for users and projects.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded border border-slate-100 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 h-10"
              />
            </div>
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px] h-10">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {uniqueRoles.map((role) => (
                <SelectItem key={role} value={role!}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 border-b border-slate-100">
              <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                User
              </TableHead>
              <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Role
              </TableHead>
              <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                Manage Users
              </TableHead>
              <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                Manage Projects
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="px-6 py-12 text-center text-slate-400"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Users className="w-8 h-8 opacity-20" />
                    <span className="text-sm">No users found</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => (
                <TableRow
                  key={u.user_id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800">
                        {u.user_name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {u.user_email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge
                      variant="outline"
                      className="font-bold border-indigo-200 text-indigo-700 bg-indigo-50/50"
                    >
                      {u.role_name}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <Switch
                        checked={u.can_manage_users === 1}
                        onCheckedChange={() =>
                          handleTogglePermission(u, "can_manage_users")
                        }
                        disabled={updatingUserId === u.user_id}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <Switch
                        checked={u.can_manage_projects === 1}
                        onCheckedChange={() =>
                          handleTogglePermission(u, "can_manage_projects")
                        }
                        disabled={updatingUserId === u.user_id}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
          <p className="text-xs text-slate-500 font-medium">
            Showing{" "}
            <span className="text-slate-800">{filteredUsers.length}</span> of{" "}
            <span className="text-slate-800">{users.length}</span> users
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserTrackingView;
