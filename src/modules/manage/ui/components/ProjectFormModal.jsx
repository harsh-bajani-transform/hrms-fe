import React, { useState } from 'react';
import { X, Upload, Briefcase, User, Users, Target, Check, ChevronDown, Trash2, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import CustomSelect from '../../../../components/common/CustomSelect';
import { createProject, updateProject } from '../../services/manageService';

const ProjectFormModal = ({ project, onClose, onSuccess, dropdowns }) => {
  const isEditMode = !!project;
  
  const [formData, setFormData] = useState({
    name: project?.project_name || '',
    projectManagerId: project?.project_manager_id?.toString() || '',
    assistantManagerIds: project?.asst_project_managers?.map(v => v.user_id?.toString()) || [],
    qaIds: project?.qa_users?.map(v => v.user_id?.toString()) || [],
    teamIds: project?.project_team?.map(v => v.team_id?.toString() || v.user_id?.toString()) || [],
    monthlyHoursTarget: project?.monthly_hours_target || '',
    files: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState({ am: false, qa: false, teams: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error('Project Name is required');
    if (!formData.projectManagerId) return toast.error('Project Manager is required');

    try {
      setIsSubmitting(true);
      const payload = {
        name: formData.name,
        project_manager_id: formData.projectManagerId,
        asst_project_managers: formData.assistantManagerIds,
        qa_users: formData.qaIds,
        project_team: formData.teamIds,
        monthly_hours_target: formData.monthlyHoursTarget
      };

      if (isEditMode) {
        await updateProject(project.project_id, payload);
        toast.success('Project updated successfully');
      } else {
        await createProject(payload);
        toast.success('Project created successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMultiSelect = (field, id) => {
    setFormData(prev => {
      const current = prev[field];
      if (current.includes(id)) {
        return { ...prev, [field]: current.filter(item => item !== id) };
      } else {
        return { ...prev, [field]: [...current, id] };
      }
    });
  };

  const MultiSelectField = ({ label, field, options, isOpen, onToggle, icon: IconComponent }) => (
    <div className="relative space-y-1">
      <label className="text-xs font-bold text-slate-700 ml-1">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center justify-between pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm hover:bg-slate-100 transition-all"
        >
          <IconComponent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <span className="truncate text-slate-600">
            {formData[field].length > 0 
              ? `${formData[field].length} selected` 
              : 'Select...'}
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-48 overflow-y-auto p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
            {options.map(opt => (
              <label 
                key={opt.value} 
                className="flex items-center gap-3 px-3 py-2 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMultiSelect(field, opt.value);
                }}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  formData[field].includes(opt.value) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                }`}>
                  {formData[field].includes(opt.value) && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-xs font-bold text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
      {/* Selected Tags */}
      <div className="flex flex-wrap gap-1.5 mt-2">
        {formData[field].map(id => {
          const opt = options.find(o => o.value === id);
          return opt ? (
            <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold border border-indigo-100">
              {opt.label}
              <X className="w-2.5 h-2.5 cursor-pointer hover:text-indigo-900" onClick={() => toggleMultiSelect(field, id)} />
            </span>
          ) : null;
        })}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-100 p-4" onClick={() => setDropdownOpen({ am: false, qa: false, teams: false })}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 bg-indigo-600 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              {isEditMode ? 'Edit Project' : 'Create New Project'}
            </h2>
            <p className="text-indigo-100 text-xs mt-0.5">Manage project scope, assignments and targets</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <form id="project-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Basic Info */}
              <div className="space-y-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5" /> Project Information
                </h3>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Project Name</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Health Insurance Processing"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-800"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Monthly Hours Target</label>
                  <div className="relative">
                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      placeholder="e.g. 720"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      value={formData.monthlyHoursTarget}
                      onChange={(e) => setFormData({ ...formData, monthlyHoursTarget: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Project Manager (Owner)</label>
                  <CustomSelect
                    value={formData.projectManagerId}
                    onChange={(val) => setFormData({ ...formData, projectManagerId: val })}
                    options={dropdowns.projectManagers.map(m => ({ value: m.user_id?.toString(), label: m.label }))}
                    placeholder="Select PM"
                  />
                </div>
              </div>

              {/* Right Column: Assignments */}
              <div className="space-y-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" /> Team Assignments
                </h3>

                <MultiSelectField 
                  label="Assistant Manager(s)" 
                  field="assistantManagerIds"
                  options={dropdowns.assistantManagers.map(m => ({ value: m.user_id?.toString(), label: m.label }))}
                  isOpen={dropdownOpen.am}
                  onToggle={() => setDropdownOpen({ am: !dropdownOpen.am, qa: false, teams: false })}
                  icon={User}
                />

                <MultiSelectField 
                  label="QA Analyst(s)" 
                  field="qaIds"
                  options={dropdowns.qas.map(q => ({ value: q.user_id?.toString(), label: q.label }))}
                  isOpen={dropdownOpen.qa}
                  onToggle={() => setDropdownOpen({ am: false, qa: !dropdownOpen.qa, teams: false })}
                  icon={Shield}
                />

                <MultiSelectField 
                  label="Teams / Agents" 
                  field="teamIds"
                  options={dropdowns.teams.map(t => ({ value: t.team_id?.toString(), label: t.label }))}
                  isOpen={dropdownOpen.teams}
                  onToggle={() => setDropdownOpen({ am: false, qa: false, teams: !dropdownOpen.teams })}
                  icon={Users}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="project-form"
            disabled={isSubmitting}
            className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:scale-95 flex items-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {isEditMode ? 'Update Project' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectFormModal;
