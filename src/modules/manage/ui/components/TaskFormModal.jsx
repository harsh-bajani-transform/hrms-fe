import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fetchDropdowns } from '../../../agent/services/agentService';
import { addTask, updateTask } from '../../services/manageService';

const TaskFormModal = ({ project, task, onClose, onSuccess }) => {
  const isEditMode = !!task;
  const [formData, setFormData] = useState({
    name: task?.task_name || '',
    description: task?.task_description || '',
    target: task?.task_target || '',
    teamIds: task?.task_team_id ? (Array.isArray(task.task_team_id) ? task.task_team_id.map(String) : [String(task.task_team_id)]) : [],
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Load agents on mount
  useEffect(() => {
    const loadAgents = async () => {
      setAgentsLoading(true);
      try {
        const res = await fetchDropdowns({ dropdown_type: 'agent' });
        // Expected format from dropdown/get is { data: [...] } or just [...] depend on API wrapper
        // Looking at agentService.js: fetchDropdowns returns res.data.
        // Legacy dropdownService returns res.data.
        // API response format usually: { status: 200, data: [...] } or directly [...]
        // Let's assume response structure matches legacy: res.data IS the array (from dropdownService) but agentService returns res.data which MIGHT be { data: [] }.
        const data = res.data || res || [];
        
        const normalized = (Array.isArray(data) ? data : []).map((item) => {
          const id = item.user_id || item.team_id || item.id;
          const label = item.label || item.user_name || item.team_name || item.name || '';
          return id ? { id: String(id), label } : null;
        }).filter(Boolean);
        
        setAgents(normalized);
      } catch (error) {
        console.error('Failed to fetch agents:', error);
        toast.error('Failed to load agents list');
      } finally {
        setAgentsLoading(false);
      }
    };
    loadAgents();
  }, []);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTeamDropdown && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowTeamDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTeamDropdown]);

  const toggleTeamSelection = (id) => {
    setFormData((prev) => {
      const exists = prev.teamIds.includes(id);
      const updated = exists ? prev.teamIds.filter((t) => t !== id) : [...prev.teamIds, id];
      return { ...prev, teamIds: updated };
    });
    if (formErrors.teamIds) setFormErrors((prev) => ({ ...prev, teamIds: '' }));
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Task name is required';
    if (!formData.target) errors.target = 'Target is required';
    else if (Number(formData.target) <= 0) errors.target = 'Target must be greater than 0';
    if (!formData.teamIds || formData.teamIds.length === 0) errors.teamIds = 'Select at least one agent';
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validate();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      const payload = {
        project_id: project.project_id,
        task_name: formData.name,
        task_description: formData.description,
        task_target: formData.target,
        task_team_id: formData.teamIds,
        // For update
        ...(isEditMode && { task_id: task.task_id })
      };

      if (isEditMode) {
        await updateTask(payload);
        toast.success('Task updated successfully');
      } else {
        await addTask(payload);
        toast.success('Task added successfully');
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'add'} task`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTeamLabel = () => {
    if (agentsLoading) return 'Loading agents...';
    if (formData.teamIds.length === 0) return 'Select agents';
    const names = agents.filter(a => formData.teamIds.includes(a.id)).map(a => a.label);
    if (names.length === 0) return `${formData.teamIds.length} selected`;
    if (names.length > 2) return `${names.length} selected`;
    return names.join(', ');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
        <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
          <h2 className="text-lg font-bold">{isEditMode ? 'Edit Task' : 'Add New Task'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Task Name <span className="text-red-500">*</span></label>
            <input
              className="w-full text-sm p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. Data Entry - Shift A"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
            {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Target (Hours) <span className="text-red-500">*</span></label>
            <input
              type="number"
              className="w-full text-sm p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="0"
              value={formData.target}
              onChange={(e) => handleChange('target', e.target.value)}
            />
            {formErrors.target && <p className="text-xs text-red-500 mt-1">{formErrors.target}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
            <textarea
              className="w-full text-sm p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[80px]"
              placeholder="Optional description..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>

          <div ref={dropdownRef}>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Assigned Agents <span className="text-red-500">*</span></label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTeamDropdown(!showTeamDropdown)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 hover:bg-slate-50"
              >
                <span className="truncate text-left">{renderTeamLabel()}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showTeamDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showTeamDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {agentsLoading && <div className="p-3 text-xs text-slate-500 flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin"/> Loading...</div>}
                  {!agentsLoading && agents.length === 0 && <div className="p-3 text-xs text-slate-500">No agents found</div>}
                  {agents.map(agent => (
                    <label key={agent.id} className="flex items-center px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 mr-3"
                        checked={formData.teamIds.includes(agent.id)}
                        onChange={() => toggleTeamSelection(agent.id)}
                      />
                      <span className="text-slate-700">{agent.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {formErrors.teamIds && <p className="text-xs text-red-500 mt-1">{formErrors.teamIds}</p>}
          </div>
        </div>

        <div className="p-4 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditMode ? null : <Plus className="w-4 h-4" />)}
            {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Task' : 'Add Task')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskFormModal;
