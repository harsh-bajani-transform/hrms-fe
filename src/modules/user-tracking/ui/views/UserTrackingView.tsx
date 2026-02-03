import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, Users } from 'lucide-react'
import { toast } from 'sonner'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
} from '@tanstack/react-table'

import { useAuth } from '../../../../context/AuthContext'
import { fetchUserList, updatePermission } from '../../services/userTrackingService'

import type { Id } from '../../../dashboard/types'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTablePagination } from '@/components/ui/pagination'

type PermissionFlag = 0 | 1

interface PermissionUser {
  user_id: Id
  user_name?: string
  user_email?: string
  role?: string
  designation?: string

  user_creation_permission?: PermissionFlag
  project_creation_permission?: PermissionFlag

  [key: string]: unknown
}

type PermissionType = 'user' | 'project'

const columnHelper = createColumnHelper<PermissionUser>()

const UserTrackingView = () => {
  const { user } = useAuth()

  const [users, setUsers] = useState<PermissionUser[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [updatingPermission, setUpdatingPermission] = useState<string | null>(null)

  // Handle permission toggle
  const handlePermissionToggle = async (
    targetUserId: Id,
    permissionType: PermissionType,
    currentValue: PermissionFlag | null | undefined,
  ): Promise<void> => {
    if (!user?.user_id) return

    const permissionKey = `${String(targetUserId)}-${permissionType}`
    setUpdatingPermission(permissionKey)

    try {
      const targetUser = users.find((u) => u.user_id === targetUserId)
      const nextValue: PermissionFlag = Number(currentValue) === 1 ? 0 : 1

      const payload = {
        user_id: user.user_id,
        target_user_id: targetUserId,
        project_creation_permission:
          permissionType === 'project'
            ? nextValue
            : (targetUser?.project_creation_permission ?? 0),
        user_creation_permission:
          permissionType === 'user'
            ? nextValue
            : (targetUser?.user_creation_permission ?? 0),
      }

      const response: unknown = await updatePermission(payload)

      if (response) {
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.user_id === targetUserId
              ? {
                  ...u,
                  [
                    permissionType === 'project'
                      ? 'project_creation_permission'
                      : 'user_creation_permission'
                  ]: nextValue,
                }
              : u,
          ),
        )

        toast.success(
          `Permission ${nextValue === 0 ? 'revoked' : 'granted'} successfully!`,
        )
      }
    } catch (error: unknown) {
      console.error('Error updating permission:', error)

      const message =
        asRecord(error) &&
        asRecord(error.response) &&
        asRecord(error.response.data) &&
        typeof error.response.data.message === 'string'
          ? error.response.data.message
          : undefined

      toast.error(message || 'Failed to update permission')
    } finally {
      setUpdatingPermission(null)
    }
  }

  // Define columns
  const columns = useMemo<ColumnDef<PermissionUser, unknown>[]>(
    () => [
      columnHelper.display({
        id: 'index',
        header: '#',
        cell: (info) => (
          <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
            {info.row.index + 1}
          </div>
        ),
      }),
      columnHelper.accessor('user_name', {
        header: 'User Name',
        cell: (info) => (
          <div className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm font-medium text-gray-900">{info.getValue() as string}</div>
            {info.row.original.designation && (
              <div className="text-sm text-gray-500">{info.row.original.designation}</div>
            )}
          </div>
        ),
      }),
      columnHelper.accessor('user_email', {
        header: 'Email',
        cell: (info) => (
          <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
            {info.getValue() as string}
          </div>
        ),
      }),
      columnHelper.accessor('role', {
        header: 'Role',
        cell: (info) => {
          const role = info.getValue() as string
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
          )
        },
      }),
      columnHelper.accessor('user_creation_permission', {
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
      }),
      columnHelper.accessor('project_creation_permission', {
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
      }),
    ],
    [updatingPermission],
  )

  const asRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null

  const loadUsers = useCallback(async (): Promise<void> => {
    const rawUserId = user?.user_id
    if (rawUserId == null) {
      setUsers([])
      setLoading(false)
      return
    }

    const numericUserId = Number(rawUserId)
    if (!Number.isFinite(numericUserId)) {
      setUsers([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const response: unknown = await fetchUserList(numericUserId)

      if (asRecord(response) && response.status === 200) {
        setUsers(Array.isArray(response.data) ? (response.data as PermissionUser[]) : [])
      } else {
        toast.error('Failed to load users')
      }
    } catch (error: unknown) {
      console.error('Error fetching users:', error)
      toast.error('Error loading users')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [user?.user_id])

  // Fetch users on mount + when logged-in user changes
  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  // Get unique roles for filter
  const uniqueRoles = useMemo((): string[] => {
    const roles = users.map((u) => u.role).filter((r): r is string => Boolean(r))
    return Array.from(new Set(roles)).sort()
  }, [users])

  // Filter users
  const filteredUsers = useMemo((): PermissionUser[] => {
    const q = searchQuery.toLowerCase()

    return users.filter((userData) => {
      const matchesSearch =
        String(userData.user_name ?? '').toLowerCase().includes(q) ||
        String(userData.user_email ?? '').toLowerCase().includes(q) ||
        String(userData.role ?? '').toLowerCase().includes(q)

      const matchesRole = roleFilter === 'all' || userData.role === roleFilter

      return matchesSearch && matchesRole
    })
  }, [users, searchQuery, roleFilter])

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
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-blue-700 flex items-center gap-3">
          <Users className="w-8 h-8" />
          User Tracking
        </h1>
        <p className="text-slate-600 mt-1">Monitor and manage all system users</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value)}>
            <SelectTrigger className="w-full sm:w-48 bg-gray-50 border-gray-300 rounded-lg">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {uniqueRoles.map(role => (
                <SelectItem key={role} value={role}>{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No users found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-200">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <DataTablePagination table={table} />
        </div>
      )}
    </div>
  );
}

export default UserTrackingView
