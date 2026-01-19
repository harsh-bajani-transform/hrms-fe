import React, { useState, useEffect, useMemo } from 'react';
import { Users, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import { fetchUserList, updatePermission } from '../../services/userTrackingService';

const UserTrackingView = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [updatingPermission, setUpdatingPermission] = useState(null);

  // Fetch users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetchUserList(user?.user_id);

      if (response?.status === 200) {
        setUsers(response.data || []);
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
  };

  // Get unique roles for filter
  const uniqueRoles = useMemo(() => {
    return [...new Set(users.map(u => u.role))].filter(Boolean).sort();
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

      const response = await updatePermission(payload);
      
      if (response) {
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
              <input
                type="text"
                placeholder="Search by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        <div className="bg-white rounded-lg shadow-md text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No users found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-linear-to-r from-blue-600 to-blue-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    User Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">
                    User Creation Permission
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">
                    Project Creation Permission
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((userData, index) => (
                  <tr key={userData.user_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{userData.user_name}</div>
                      {userData.designation && (
                        <div className="text-sm text-gray-500">{userData.designation}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {userData.user_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        userData.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                        userData.role === 'Manager' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {userData.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handlePermissionToggle(userData.user_id, 'user', userData.user_creation_permission)}
                        disabled={updatingPermission === `${userData.user_id}-user`}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                          userData.user_creation_permission === 1 ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                            userData.user_creation_permission === 1 ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handlePermissionToggle(userData.user_id, 'project', userData.project_creation_permission)}
                        disabled={updatingPermission === `${userData.user_id}-project`}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                          userData.project_creation_permission === 1 ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                            userData.project_creation_permission === 1 ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Results Count */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredUsers.length}</span> of <span className="font-semibold text-gray-900">{users.length}</span> users
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTrackingView;
