import React, { useState, useMemo, useCallback } from "react";
import { Search, UserPlus, User } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "../../../../context/AuthContext";
import { deleteUser, updateUser } from "../../services/manageService";
import UserFormModal from "./UserFormModal";
import { UserDropdowns } from "../../../../hooks/useUserDropdowns";
import { createColumns, type UserType } from "./UsersManagementColumns";

interface UsersManagementProps {
  users: Array<UserType>;
  loading: boolean;
  onRefresh: () => void;
  dropdowns: UserDropdowns;
}

const UsersManagement: React.FC<UsersManagementProps> = ({
  users,
  loading,
  onRefresh,
  dropdowns,
}) => {
  const { canManageUsers } = useAuth() as { canManageUsers: boolean };
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | number | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.user_email?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [users, searchTerm]);

  const handleDelete = useCallback(
    async (userToDelete: UserType) => {
      if (
        !window.confirm(
          `Are you sure you want to delete ${userToDelete.user_name}?`,
        )
      )
        return;
      try {
        setIsDeleting(userToDelete.user_id);
        await deleteUser(userToDelete.user_id, {
          device_id: "web",
          device_type: "Laptop",
        });
        toast.success("User deleted successfully");
        onRefresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setIsDeleting(null);
      }
    },
    [onRefresh],
  );

  const handleToggleStatus = useCallback(
    async (userToToggle: UserType) => {
      const newStatus = userToToggle.is_active === 1 ? 0 : 1;
      try {
        await updateUser({
          user_id: userToToggle.user_id,
          is_active: newStatus,
        });
        toast.success(
          `User ${newStatus === 1 ? "activated" : "deactivated"} successfully`,
        );
        onRefresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unknown error");
      }
    },
    [onRefresh],
  );

  // Create columns with dependencies
  const columns = useMemo(
    () =>
      createColumns(
        canManageUsers,
        isDeleting,
        handleToggleStatus,
        handleDelete,
        setEditingUser,
      ),
    [canManageUsers, isDeleting, handleToggleStatus, handleDelete],
  );

  return (
    <div className="space-y-6">
      {/* Search and Actions */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search users by name or email..."
            className="w-full pl-10 "
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {canManageUsers && (
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700  px-4"
          >
            <UserPlus className="w-4 h-4" />
            Add New User
          </Button>
        )}
      </div>

      {/* Users Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        loading={loading}
        emptyMessage="No users found"
        emptyIcon={User}
        showPagination={true}
        pageSize={10}
        headerClassName="border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wide"
      />

      {/* Modals */}
      {(showAddModal || editingUser) && (
        <UserFormModal
          user={editingUser ?? undefined}
          onClose={() => {
            setShowAddModal(false);
            setEditingUser(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingUser(null);
            onRefresh();
          }}
          dropdowns={dropdowns}
        />
      )}
    </div>
  );
};

export default UsersManagement;
