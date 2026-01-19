import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, Users, Briefcase, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import UsersManagement from '../components/UsersManagement';
import ProjectsManagement from '../components/ProjectsManagement';
import { fetchUsersList, fetchProjectsList } from '../../services/manageService';
import { useUserDropdowns } from '../../../../hooks/useUserDropdowns';

const ManageView = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const { dropdowns, loadDropdowns } = useUserDropdowns();
  
  const hasFetchedUsers = useRef(false);
  const hasFetchedProjects = useRef(false);

  const canManageUsers = user?.permissions?.includes('manage_users') || user?.role === 'admin' || user?.role_id === 1;
  const canManageProjects = user?.permissions?.includes('manage_projects') || user?.role === 'admin' || user?.role_id === 1;
  const isAssistantManager = user?.role_id === 4;

  const loadUsersData = useCallback(async () => {
    if (!user?.user_id) return;
    try {
      setLoadingUsers(true);
      const data = await fetchUsersList(user.user_id, 'web', 'Laptop');
      if (data.status === 200) {
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  }, [user?.user_id]);

  const loadProjectsData = useCallback(async () => {
    try {
      setLoadingProjects(true);
      const data = await fetchProjectsList();
      if (data.status === 200) {
        setProjects(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'users' && !hasFetchedUsers.current) {
      hasFetchedUsers.current = true;
      loadUsersData();
      loadDropdowns();
    } else if (activeTab === 'projects' && !hasFetchedProjects.current) {
      hasFetchedProjects.current = true;
      loadProjectsData();
      loadDropdowns();
    }
  }, [activeTab, loadUsersData, loadProjectsData, loadDropdowns]);

  if (!canManageUsers && !canManageProjects && !isAssistantManager) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <Lock className="w-16 h-16 mb-4 opacity-20" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p>You do not have permission to access this module.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-10">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Administration</h1>
              <p className="text-sm text-slate-500">Manage organization resources, users, and projects.</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 border-b border-slate-100 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all relative ${
              activeTab === 'users'
                ? 'text-indigo-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            User Management
            {activeTab === 'users' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all relative ${
              activeTab === 'projects'
                ? 'text-indigo-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Projects & Targets
            {activeTab === 'projects' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'users' ? (
            <UsersManagement 
              users={users} 
              loading={loadingUsers} 
              onRefresh={loadUsersData}
              dropdowns={dropdowns}
            />
          ) : (
            <ProjectsManagement 
              projects={projects} 
              loading={loadingProjects} 
              onRefresh={loadProjectsData}
              dropdowns={dropdowns}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageView;
