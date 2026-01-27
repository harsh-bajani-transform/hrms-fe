import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Users, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../../services/api';
import { useAuth } from '../../../../context/AuthContext';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';

const UserTrackingView = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [updatingPermission, setUpdatingPermission] = useState(null);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.post('/permission/user_list', {
        user_id: user?.user_id
      });

      if (response.data?.status === 200) {
        setUsers(response.data.data || []);
      } else {
        toast.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error loading users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  // Get unique roles for filter
  const uniqueRoles = useMemo(() => {
    return [...new Set(users.map(u => u.role))].sort();
  }, [users]);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(userData => {
      const matchesSearch = 
        userData.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        userData.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        userData.role?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === 'all' || userData.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Handle permission toggle
  const handlePermissionToggle = async (targetUserId, permissionType, currentValue) => {
    const permissionKey = `${targetUserId}-${permissionType}`;
    setUpdatingPermission(permissionKey);

    try {
      // Find the target user to get both permission values
      const targetUser = users.find(u => u.user_id === targetUserId);
      
      const payload = {
        user_id: user.user_id,
        target_user_id: targetUserId,
        project_creation_permission: permissionType === 'project' 
          ? (currentValue === 1 ? 0 : 1) 
          : (targetUser?.project_creation_permission || 0),
        user_creation_permission: permissionType === 'user' 
          ? (currentValue === 1 ? 0 : 1) 
          : (targetUser?.user_creation_permission || 0)
      };

      const response = await api.post('/permission/update', payload);
      
      if (response.data) {
        // Update local state
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u.user_id === targetUserId 
              ? {
                  ...u,
                  [permissionType === 'project' ? 'project_creation_permission' : 'user_creation_permission']: currentValue === 1 ? 0 : 1
                }
              : u
          )
        );
        toast.success(`Permission ${currentValue === 1 ? 'revoked' : 'granted'} successfully!`);
      }
    } catch (error) {
      console.error('Error updating permission:', error);
      toast.error(error.response?.data?.message || 'Failed to update permission');
    } finally {
      setUpdatingPermission(null);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto px-0 py-0 space-y-6">
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-indigo-700 tracking-tight">User Permissions</h2>
        <p className="text-slate-500 text-sm">Manage create permissions for users and projects.</p>
      </div>


      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
              />
            </div>
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm appearance-none cursor-pointer"
          >
            <option value="all">All Roles</option>
            {uniqueRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm text-center py-12">
          <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No users found</h3>
          <p className="text-slate-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    User Creation
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Project Creation
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((userData) => (
                  <tr key={userData.user_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-semibold text-slate-800">{userData.user_name}</div>
                        <div className="text-xs text-slate-500">{userData.user_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        userData.role === 'Admin' ? 'bg-indigo-100 text-indigo-700' :
                        userData.role === 'Manager' ? 'bg-blue-100 text-blue-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {userData.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handlePermissionToggle(userData.user_id, 'user', userData.user_creation_permission)}
                        disabled={updatingPermission === `${userData.user_id}-user`}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                          userData.user_creation_permission === 1 ? 'bg-indigo-600' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                            userData.user_creation_permission === 1 ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handlePermissionToggle(userData.user_id, 'project', userData.project_creation_permission)}
                        disabled={updatingPermission === `${userData.user_id}-project`}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                          userData.project_creation_permission === 1 ? 'bg-indigo-600' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                            userData.project_creation_permission === 1 ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
            <p className="text-xs text-slate-500 font-medium">
              Showing <span className="text-slate-800">{filteredUsers.length}</span> of <span className="text-slate-800">{users.length}</span> users
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTrackingView;
