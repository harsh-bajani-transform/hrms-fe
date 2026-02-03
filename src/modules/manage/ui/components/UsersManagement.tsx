import React, { useState, useMemo } from "react";
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Shield,
  User,
} from "lucide-react";
import { toast } from "sonner";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
} from "@tanstack/react-table";
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
import { DataTablePagination } from "@/components/ui/pagination";
import { useAuth } from "../../../../context/AuthContext";
import { deleteUser, updateUser } from "../../services/manageService";
import UserFormModal from "./UserFormModal";
import { UserDropdowns } from "../../../../hooks/useUserDropdowns";

interface UserType {
  user_id: string | number;
  user_name?: string;
  user_email?: string;
  role_name?: string | undefined;
  designation_name?: string | undefined;
  is_active?: number;
  [key: string]: unknown;
}

interface UsersManagementProps {
  users: Array<UserType>;
  loading: boolean;
  onRefresh: () => void;
  dropdowns: UserDropdowns;
}

const columnHelper = createColumnHelper<UserType>();

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

  const handleDelete = async (userToDelete: UserType) => {
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
  };

  const handleToggleStatus = async (userToToggle: UserType) => {
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
  };

  // Define columns
  const columns = useMemo<ColumnDef<UserType, unknown>[]>(
    () => [
      columnHelper.display({
        id: 'user',
        header: 'User',
        cell: (info) => {
          const u = info.row.original;
          return (
            <div className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-semibold text-xs border border-blue-200 uppercase">
                  {u.user_name?.substring(0, 2)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {u.user_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {u.user_email}
                  </div>
                </div>
              </div>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'role',
        header: 'Role & Designation',
        cell: (info) => {
          const u = info.row.original;
          return (
            <div className="px-6 py-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                  <Shield className="w-3 h-3 text-blue-600" />
                  {u.role_name || "AGENT"}
                </div>
                <div className="text-xs text-gray-500">
                  {u.designation_name || "—"}
                </div>
              </div>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'status',
        header: 'Status',
        cell: (info) => {
          const u = info.row.original;
          return (
            <div className="px-6 py-4">
              <Badge
                variant={u.is_active === 1 ? "default" : "secondary"}
                className={`cursor-pointer ${
                  u.is_active === 1
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                    : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                }`}
                onClick={() => canManageUsers && handleToggleStatus(u)}
              >
                {u.is_active === 1 ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" /> Active
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 mr-1" /> Inactive
                  </>
                )}
              </Badge>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: (info) => {
          const u = info.row.original;
          return (
            <div className="px-6 py-4 text-right">
              {canManageUsers && (
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setEditingUser(u)}
                    className="text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                    title="Edit User"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(u)}
                    className="text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                    disabled={isDeleting === u.user_id}
                    title="Delete User"
                  >
                    <Trash2
                      className={`w-4 h-4 ${
                        isDeleting === u.user_id ? "animate-pulse" : ""
                      }`}
                    />
                  </Button>
                </div>
              )}
            </div>
          );
        },
      }),
    ],
    [canManageUsers, isDeleting],
  );

  // Initialize TanStack Table
  const table = useReactTable({
    data: filteredUsers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Search and Actions */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search users by name or email..."
            className="w-full pl-10 h-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {canManageUsers && (
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 h-11 px-4"
          >
            <UserPlus className="w-4 h-4" />
            Add New User
          </Button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-gray-50 border-b border-gray-200">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="px-6 py-12 text-center text-slate-400"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium">
                      Loading users...
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="px-6 py-12 text-center text-gray-400"
                >
                  <div className="flex flex-col items-center gap-2">
                    <User className="w-8 h-8 opacity-20" />
                    <span className="text-sm">No users found</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-blue-50 transition-colors group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="p-0">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {!loading && filteredUsers.length > 0 && (
          <DataTablePagination table={table} />
        )}
      </div>

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
