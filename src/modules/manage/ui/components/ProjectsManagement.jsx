import React, { useState } from 'react';
import { 
  Briefcase, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Target, 
  User, 
  ChevronDown, 
  ChevronUp,
  Layers
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import CustomSelect from '../../../../components/common/CustomSelect';
import { deleteProject } from '../../services/manageService';
import ProjectFormModal from './ProjectFormModal';

const ProjectsManagement = ({ projects, loading, onRefresh, dropdowns }) => {
  const { canManageProjects } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [expandedProjectId, setExpandedProjectId] = useState(null);

  const filteredProjects = projects.filter(p => 
    p.project_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteProject = async (proj) => {
    if (!window.confirm(`Are you sure you want to delete project: ${proj.project_name}?`)) return;
    try {
      await deleteProject(proj.project_id);
      toast.success('Project deleted successfully');
      onRefresh();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {canManageProjects && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add New Project
          </button>
        )}
      </div>

      {/* Projects List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <span className="text-slate-500 font-medium">Loading projects...</span>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-20 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
             <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-3" />
             <p className="text-slate-500">No projects found</p>
          </div>
        ) : (
          filteredProjects.map((p) => (
            <div key={p.project_id} className="bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden">
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{p.project_name}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Target className="w-3.5 h-3.5" />
                        Target: <span className="font-bold text-slate-700">{p.monthly_hours_target || 0} hrs</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Layers className="w-3.5 h-3.5" />
                        Tasks: <span className="font-bold text-slate-700">{p.tasks?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setExpandedProjectId(expandedProjectId === p.project_id ? null : p.project_id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  >
                    {expandedProjectId === p.project_id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {expandedProjectId === p.project_id ? 'Hide Details' : 'View Details'}
                  </button>
                  {canManageProjects && (
                    <div className="flex items-center gap-2 border-l border-slate-100 pl-3">
                      <button 
                        onClick={() => setEditingProject(p)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                         onClick={() => handleDeleteProject(p)}
                         className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Collapsible Details */}
              {expandedProjectId === p.project_id && (
                <div className="border-t border-slate-50 bg-slate-50/50 p-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Owner Info cards */}
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Team Owner</label>
                       <div className="flex items-center gap-2">
                         <User className="w-4 h-4 text-indigo-500" />
                         <span className="text-sm font-bold text-slate-700">{p.owner_name || 'Not assigned'}</span>
                       </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Assistant Manager</label>
                       <div className="flex items-center gap-2">
                         <User className="w-4 h-4 text-indigo-500" />
                         <span className="text-sm font-bold text-slate-700">{p.apm_name || 'Not assigned'}</span>
                       </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">QA Owner</label>
                       <div className="flex items-center gap-2">
                         <User className="w-4 h-4 text-indigo-500" />
                         <span className="text-sm font-bold text-slate-700">{p.qa_name || 'Not assigned'}</span>
                       </div>
                    </div>
                  </div>

                  {/* Tasks Section Placeholder */}
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <Layers className="w-4 h-4 text-indigo-500" /> Project Tasks
                        </h4>
                        {canManageProjects && (
                          <button className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider hover:underline flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Add Task
                          </button>
                        )}
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {p.tasks?.length > 0 ? p.tasks.map(t => (
                          <div key={t.task_id} className="bg-white px-4 py-3 rounded-lg border border-slate-100 flex items-center justify-between group">
                            <span className="text-sm text-slate-600 font-medium">{t.task_name}</span>
                            {canManageProjects && (
                              <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-rose-500">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )) : (
                          <div className="col-span-full py-4 text-center text-xs text-slate-400 italic">No tasks added to this project.</div>
                        )}
                     </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {(showAddModal || editingProject) && (
        <ProjectFormModal 
          project={editingProject}
          onClose={() => {
            setShowAddModal(false);
            setEditingProject(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingProject(null);
            onRefresh();
          }}
          dropdowns={dropdowns}
        />
      )}
    </div>
  );
};

export default ProjectsManagement;
