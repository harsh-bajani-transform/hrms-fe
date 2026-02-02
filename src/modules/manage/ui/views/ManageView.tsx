import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Settings, Users, Briefcase, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import UsersManagement from '../components/UsersManagement';
import ProjectsManagement from '../components/ProjectsManagement';
import UserTrackingView from '../components/UserTrackingView';
import UserMonthlyTargetCard from '../components/UserMonthlyTargetCard';
import { fetchUsersList, fetchProjectsList } from '../../services/manageService';

import { useUserDropdowns, UserDropdowns } from '../../../../hooks/useUserDropdowns';

interface User {
	user_id: string | number;
	user_name?: string;
	user_email?: string;
	role_id?: string | number;
	role?: string;
	permissions?: string[];
	designation_id?: string | number;
	designation_name?: string;
	project_manager_id?: string | number;
	assistant_manager_id?: string | number;
	qa_id?: string | number;
	team_id?: string | number;
	is_active?: number;
	[key: string]: unknown;
}

interface Project {
	project_id: string | number;
	project_name?: string;
	owner_name?: string;
	apm_name?: string;
	qa_name?: string;
	monthly_hours_target?: number;
	tasks?: Array<{ task_id: string | number; task_name: string; task_target: number }>;
	[key: string]: unknown;
}

const ManageView: React.FC = () => {
	const { user } = useAuth() as { user: User };
	const [activeTab, setActiveTab] = useState<string>('users');
	const [users, setUsers] = useState<User[]>([]);
	const [projects, setProjects] = useState<Project[]>([]);
	const [loadingUsers, setLoadingUsers] = useState(false);
	const [loadingProjects, setLoadingProjects] = useState(false);
	const { dropdowns, loadDropdowns } = useUserDropdowns();
	const hasFetchedUsers = useRef(false);
	const hasFetchedProjects = useRef(false);

	const canManageUsers = user?.permissions?.includes('manage_users') || user?.role === 'admin' || user?.role_id === 1;
	const canManageProjects = user?.permissions?.includes('manage_projects') || user?.role === 'admin' || user?.role_id === 1;
	const isAssistantManager = user?.role_id === 4;

	const hasLabel = (obj: unknown): obj is { label: string } => {
		return !!obj && typeof obj === 'object' && 'label' in obj && typeof (obj as { label: unknown }).label === 'string';
	};
	const enrichUsers = useCallback((rawUsers: User[], meta: UserDropdowns) => {
		if (!rawUsers || !meta) return rawUsers;
		return rawUsers.map((u) => {
			const role = meta.roles?.find((r) => r.role_id === u.role_id);
			const designation = meta.designations?.find((d) => d.designation_id === u.designation_id);
			return {
				...u,
				role_name: hasLabel(role) ? role.label : (typeof u.role_name === 'string' ? u.role_name : undefined),
				designation_name: hasLabel(designation) ? designation.label : (typeof u.designation_name === 'string' ? u.designation_name : undefined),
				role_id: u.role_id?.toString(),
				designation_id: u.designation_id?.toString(),
				project_manager_id: (u.project_manager_id || u.project_manager)?.toString(),
				assistant_manager_id: (u.assistant_manager_id || u.assistant_manager)?.toString(),
				qa_id: (u.qa_id || u.qa)?.toString(),
				team_id: (u.team_id || u.team)?.toString(),
			};
		});
	}, []);

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

	const enrichedUsers = useMemo(() => {
		return enrichUsers(users, dropdowns);
	}, [users, dropdowns, enrichUsers]);

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
				<div className="text-lg font-semibold">You do not have permission to access this page.</div>
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto py-8">
			<div className="flex gap-4 mb-8">
				<button
					className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 border border-blue-200'}`}
					onClick={() => setActiveTab('users')}
				>
					<Users className="w-5 h-5" /> Users
				</button>
				<button
					className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${activeTab === 'projects' ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 border border-blue-200'}`}
					onClick={() => setActiveTab('projects')}
				>
					<Briefcase className="w-5 h-5" /> Projects
				</button>
				<button
					className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${activeTab === 'tracking' ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 border border-blue-200'}`}
					onClick={() => setActiveTab('tracking')}
				>
					<Settings className="w-5 h-5" /> User Tracking
				</button>
				<button
					className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${activeTab === 'monthly_target' ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 border border-blue-200'}`}
					onClick={() => setActiveTab('monthly_target')}
				>
					<Briefcase className="w-5 h-5" /> Monthly Target
				</button>
			</div>

			{activeTab === 'users' && (
				<UsersManagement
					users={enrichedUsers}
					loading={loadingUsers}
					onRefresh={loadUsersData}
					dropdowns={dropdowns}
				/>
			)}
			{activeTab === 'projects' && (
				<ProjectsManagement
					projects={projects}
					loading={loadingProjects}
					onRefresh={loadProjectsData}
					dropdowns={dropdowns}
				/>
			)}
			{activeTab === 'tracking' && <UserTrackingView />}
			{activeTab === 'monthly_target' && <UserMonthlyTargetCard />}
		</div>
	);
};

export default ManageView;
