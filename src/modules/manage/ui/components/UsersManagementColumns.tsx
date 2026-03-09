import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Edit2, Trash2, CheckCircle, XCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface UserType {
  user_id: string | number;
  id?: string | number;
  user_name?: string;
  name?: string;
  user_email?: string;
  email?: string;
  role_name?: string | undefined;
  role?: string | undefined;
  designation_name?: string | undefined;
  designation?: string | undefined;
  is_active?: number;
  project_manager_names?: string;
  asst_manager_names?: string;
  project_managers?: Array<{ user_name?: string; name?: string }>;
  asst_managers?: Array<{ user_name?: string; name?: string }>;
  [key: string]: unknown;
}

const columnHelper = createColumnHelper<UserType>();

// Capitalize first letter utility
const capitalize = (str: string | undefined) =>
  str && typeof str === "string" && str.length > 0
    ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    : str || "";

export const createColumns = (
  canManageUsers: boolean,
  isDeleting: string | number | null,
  handleToggleStatus: (user: UserType) => Promise<void>,
  handleDelete: (user: UserType) => Promise<void>,
  setEditingUser: (user: UserType) => void,
): ColumnDef<UserType, any>[] => [
  columnHelper.display({
    id: "user",
    header: "User",
    cell: (info) => {
      const u = info.row.original;
      const name = u.user_name || u.name || "Unknown";
      const email = u.user_email || u.email || "";
      return (
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-blue-100 uppercase">
              {name.substring(0, 2)}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">
                {capitalize(name)}
              </div>
              <div className="text-xs text-gray-500 truncate">{email.toLowerCase()}</div>
            </div>
          </div>
        </div>
      );
    },
  }),
  columnHelper.display({
    id: "designation",
    header: "Designation",
    cell: (info) => {
      const u = info.row.original;
      return (
        <div className="px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-50 p-1.5 rounded-lg">
              <Shield className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm text-gray-700 font-medium">
              {capitalize(u.designation_name || u.designation) || "—"}
            </span>
          </div>
        </div>
      );
    },
  }),
  columnHelper.display({
    id: "reporting_to",
    header: "Reporting To",
    cell: (info) => {
      const u = info.row.original;
      const role = (u.role_name || u.role || "").toUpperCase();
      
      const renderNames = (names: string[]) => {
        if (!names || names.length === 0) return <span className="text-gray-400 text-xs italic">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {names.map((name, idx) => (
              <Badge key={idx} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 text-[10px] font-medium px-2 py-0">
                {capitalize(name)}
              </Badge>
            ))}
          </div>
        );
      };

      if (["SUPER_ADMIN", "SUPERADMIN"].includes(role.replace(/[_\s]/g, ""))) {
        return <span className="text-gray-400 text-xs italic">—</span>;
      }

      if (["ASSISTANT_MANAGER", "ASSISTANTMANAGER"].includes(role.replace(/[_\s]/g, ""))) {
        if (u.project_manager_names) {
          const names = u.project_manager_names.split(",").map(n => n.trim()).filter(Boolean);
          if (names.length > 0) return renderNames(names);
        }
        if (u.project_managers && u.project_managers.length > 0) {
          const names = u.project_managers.map(pm => pm.user_name || pm.name || "").filter(Boolean);
          if (names.length > 0) return renderNames(names);
        }
      }

      if (["QA", "AGENT"].includes(role.replace(/[_\s]/g, ""))) {
        if (u.asst_manager_names) {
          const names = u.asst_manager_names.split(",").map(n => n.trim()).filter(Boolean);
          if (names.length > 0) return renderNames(names);
        }
        if (u.asst_managers && u.asst_managers.length > 0) {
          const names = u.asst_managers.map(am => am.user_name || am.name || "").filter(Boolean);
          if (names.length > 0) return renderNames(names);
        }
      }

      return <span className="text-gray-400 text-xs italic">—</span>;
    },
  }),
  columnHelper.display({
    id: "role",
    header: "Role",
    cell: (info) => {
      const u = info.row.original;
      const roleLabel = capitalize((u.role_name || u.role || "").replace("_", " "));
      return (
        <div className="px-6 py-4">
          <Badge variant="outline" className="bg-blue-50/50 text-blue-700 border-blue-100 font-medium">
            {roleLabel || "Agent"}
          </Badge>
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
                ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 shadow-sm"
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
                className="bg-blue-50/50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                title="Edit User"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDelete(u)}
                className="bg-rose-50/50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
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

