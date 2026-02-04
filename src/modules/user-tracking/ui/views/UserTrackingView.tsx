import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, Users } from 'lucide-react'
import { toast } from 'sonner'

import Loading from '@/components/common/Loading'
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
import { DataTable } from '@/components/ui/data-table'
import { createColumns, type PermissionUser } from './UserTrackingViewColumns'

type PermissionFlag = 0 | 1
type PermissionType = 'user' | 'project'

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

  // Create columns with dependencies
  const columns = useMemo(
    () => createColumns(updatingPermission, handlePermissionToggle),
    [updatingPermission]
  );

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
      console.log('[UserTracking] API Response:', response)

      if (asRecord(response) && response.status === 200) {
        const responseData = asRecord(response.data) ? response.data : null
        const usersArray = responseData && Array.isArray(responseData.users) 
          ? (responseData.users as PermissionUser[]) 
          : []
        
        console.log('[UserTracking] Parsed users:', usersArray)
        setUsers(usersArray)
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

  if (loading) {
    return (
      <Loading 
        title="Loading users..." 
        description="Please wait while we fetch user tracking data"
      />
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

      {/* Users Table with DataTable Component */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        loading={false}
        emptyMessage="No users found"
        emptyIcon={Users}
        showPagination={true}
        pageSize={10}
        containerClassName="bg-white rounded-lg shadow-md overflow-hidden"
        headerClassName=""
        rowClassName=""
        rowHoverClassName="hover:bg-gray-50 transition-colors"
      />
    </div>
  );
}

export default UserTrackingView
