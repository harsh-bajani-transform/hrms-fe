import { ColumnDef, createColumnHelper } from '@tanstack/react-table';
import type { Id } from '../../../dashboard/types';

type PermissionFlag = 0 | 1;

export interface PermissionUser {
  user_id: Id;
  user_name?: string;
  user_email?: string;
  role?: string;
  designation?: string;
  user_creation_permission?: PermissionFlag;
  project_creation_permission?: PermissionFlag;
  [key: string]: unknown;
}

type PermissionType = 'user' | 'project';

const columnHelper = createColumnHelper<PermissionUser>();

export const createColumns = (
  updatingPermission: string | null,
  handlePermissionToggle: (
    targetUserId: Id,
    permissionType: PermissionType,
    currentValue: PermissionFlag | null | undefined,
  ) => Promise<void>
): ColumnDef<PermissionUser, unknown>[] => [
  columnHelper.display({
    id: 'index',
    header: '#',
    cell: (info) => (
      <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
        {info.row.index + 1}
      </div>
    ),
  }),
  columnHelper.accessor('user_name' as const, {
    header: 'User Name',
    cell: (info) => (
      <div className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{info.getValue() as string}</div>
        {info.row.original.designation && (
          <div className="text-sm text-gray-500">{info.row.original.designation}</div>
        )}
      </div>
    ),
  }) as ColumnDef<PermissionUser, unknown>,
  columnHelper.accessor('user_email' as const, {
    header: 'Email',
    cell: (info) => (
      <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {info.getValue() as string}
      </div>
    ),
  }) as ColumnDef<PermissionUser, unknown>,
  columnHelper.accessor('role' as const, {
    header: 'Role',
    cell: (info) => {
      const role = info.getValue() as string;
      return (
        <div className="px-6 py-4 whitespace-nowrap">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            role === 'Admin' ? 'bg-purple-100 text-purple-700' :
            role === 'Manager' ? 'bg-blue-100 text-blue-700' :
            'bg-green-100 text-green-700'
          }`}>
            {role}
          </span>
        </div>
      );
    },
  }) as ColumnDef<PermissionUser, unknown>,
  columnHelper.accessor('user_creation_permission' as const, {
    header: () => (
      <div className="text-center">User Creation Permission</div>
    ),
    cell: (info) => (
      <div className="px-6 py-4 whitespace-nowrap text-center">
        <button
          onClick={() => handlePermissionToggle(info.row.original.user_id, 'user', info.getValue())}
          disabled={updatingPermission === `${info.row.original.user_id}-user`}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            info.getValue() === 1 ? 'bg-green-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
              info.getValue() === 1 ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    ),
  }) as ColumnDef<PermissionUser, unknown>,
  columnHelper.accessor('project_creation_permission' as const, {
    header: () => (
      <div className="text-center">Project Creation Permission</div>
    ),
    cell: (info) => (
      <div className="px-6 py-4 whitespace-nowrap text-center">
        <button
          onClick={() => handlePermissionToggle(info.row.original.user_id, 'project', info.getValue())}
          disabled={updatingPermission === `${info.row.original.user_id}-project`}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            info.getValue() === 1 ? 'bg-green-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
              info.getValue() === 1 ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    ),
  }) as ColumnDef<PermissionUser, unknown>,
];
