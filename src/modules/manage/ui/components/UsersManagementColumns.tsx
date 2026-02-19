import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Edit2, Trash2, CheckCircle, XCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface UserType {
  user_id: string | number;
  user_name?: string;
  user_email?: string;
  role_name?: string | undefined;
  designation_name?: string | undefined;
  is_active?: number;
  [key: string]: unknown;
}

const columnHelper = createColumnHelper<UserType>();

export const createColumns = (
  canManageUsers: boolean,
  isDeleting: string | number | null,
  handleToggleStatus: (user: UserType) => Promise<void>,
  handleDelete: (user: UserType) => Promise<void>,
  setEditingUser: (user: UserType) => void,
): ColumnDef<UserType, unknown>[] => [
  columnHelper.display({
    id: "user",
    header: "User",
    cell: (info) => {
      const u = info.row.original;
      return (
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9  rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-semibold text-xs border border-blue-200 uppercase">
              {u.user_name?.substring(0, 2)}
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {u.user_name}
              </div>
              <div className="text-xs text-gray-500">{u.user_email}</div>
            </div>
          </div>
        </div>
      );
    },
  }),
  columnHelper.display({
    id: "role",
    header: "Role & Designation",
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
    id: "status",
    header: "Status",
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
    id: "actions",
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
];
