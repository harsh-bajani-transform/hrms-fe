import React, { useState, useMemo } from 'react';
import { 
  Search, 
  UserPlus, 
  Edit2, 
  Trash2, 
  MoreVertical,
  CheckCircle,
  XCircle,
  Shield,
  User
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import { deleteUser, updateUser } from '../../services/manageService';
import UserFormModal from './UserFormModal';

const UsersManagement = ({ users, loading, onRefresh, dropdowns }) => {
  const { canManageUsers } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleDelete = async (userToDelete) => {
    if (!window.confirm(`Are you sure you want to delete ${userToDelete.user_name}?`)) return;
    
    try {
      setIsDeleting(userToDelete.user_id);
      await deleteUser(userToDelete.user_id, {
        device_id: 'web',
        device_type: 'Laptop'
      });
      toast.success('User deleted successfully');
      onRefresh();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleStatus = async (userToToggle) => {
    const newStatus = userToToggle.is_active === 1 ? 0 : 1;
    try {
      await updateUser({
        user_id: userToToggle.user_id,
        is_active: newStatus
      });
      toast.success(`User ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`);
      onRefresh();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Actions */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {canManageUsers && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200"
          >
            <UserPlus className="w-4 h-4" />
            Add New User
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role & Designation</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-medium">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                       <User className="w-8 h-8 opacity-20" />
                       <span className="text-sm">No users found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.user_id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs border border-indigo-100 uppercase">
                          {u.user_name?.substring(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">{u.user_name}</div>
                          <div className="text-xs text-slate-500">{u.user_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <Shield className="w-3 h-3 text-indigo-500" />
                          {u.role_name || 'AGENT'}
                        </div>
                        <div className="text-xs text-slate-500">{u.designation_name || '—'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <button 
                        onClick={() => canManageUsers && handleToggleStatus(u)}
                        disabled={!canManageUsers}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                          u.is_active === 1 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        } ${canManageUsers ? 'hover:scale-105 active:scale-95' : 'cursor-default'}`}
                      >
                        {u.is_active === 1 ? (
                          <><CheckCircle className="w-3 h-3" /> Active</>
                        ) : (
                          <><XCircle className="w-3 h-3" /> Inactive</>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {canManageUsers && (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setEditingUser(u)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                             onClick={() => handleDelete(u)}
                             className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                             disabled={isDeleting === u.user_id}
                             title="Delete User"
                          >
                            <Trash2 className={`w-4 h-4 ${isDeleting === u.user_id ? 'animate-pulse' : ''}`} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {(showAddModal || editingUser) && (
        <UserFormModal 
          user={editingUser}
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
