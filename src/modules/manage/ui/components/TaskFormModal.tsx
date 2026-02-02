import React, { useState, useRef } from 'react';
import { X, Upload, ClipboardList, Calendar, User, Users, FileText, Briefcase } from 'lucide-react';
import { toast } from 'react-hot-toast';
import CustomSelect from '../../../../components/common/CustomSelect';
import { fileToBase64 } from '../../../../lib/fileToBase64';
import { addTask, updateTask } from '../../services/manageService';
import { useDeviceInfo } from '../../../../hooks/useDeviceInfo';

export interface TaskType {
  task_id?: string | number;
  task_name?: string;
  task_description?: string;
  start_date?: string;
  end_date?: string;
  assigned_to?: string | number;
  project_id?: string | number;
  attachment?: string | null;
  [key: string]: unknown;
}

interface TaskFormModalProps {
  task?: TaskType | undefined;
  onClose: () => void;
  onSuccess: () => void;
  dropdowns: {
    users: Array<{ user_id?: string | number; id?: string | number; label: string }>;
    projects: Array<{ project_id?: string | number; id?: string | number; label: string }>;
  };
}

interface FormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  assignedTo: string;
  projectId: string;
  attachment: string | null;
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({ task, onClose, onSuccess, dropdowns }) => {
  const isEditMode = !!task;
  const { device_id, device_type } = useDeviceInfo();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    name: task?.task_name || '',
    description: task?.task_description || '',
    startDate: task?.start_date || '',
    endDate: task?.end_date || '',
    assignedTo: task?.assigned_to?.toString() || '',
    projectId: task?.project_id?.toString() || '',
    attachment: null,
  });

  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(task?.attachment || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validate = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.name.trim()) newErrors.name = 'Task name is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (!formData.assignedTo) newErrors.assignedTo = 'Assignee is required';
    if (!formData.projectId) newErrors.projectId = 'Project is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setIsSubmitting(true);
      const payload = {
        task_name: formData.name,
        task_description: formData.description,
        start_date: formData.startDate,
        end_date: formData.endDate,
        assigned_to: formData.assignedTo,
        project_id: formData.projectId,
        attachment: formData.attachment,
        device_id,
        device_type,
      };
      if (isEditMode) {
        await updateTask({ ...payload, task_id: task?.task_id });
        toast.success('Task updated successfully');
      } else {
        await addTask(payload);
        toast.success('Task created successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Attachment size must be less than 5MB');
        return;
      }
      const base64 = await fileToBase64(file);
      setFormData({ ...formData, attachment: base64 as string });
      setAttachmentPreview(file.name);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-100 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-indigo-600 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              {isEditMode ? <ClipboardList className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
              {isEditMode ? 'Edit Task' : 'Create New Task'}
            </h2>
            <p className="text-indigo-100 text-xs mt-0.5">
              {isEditMode ? `Updating ${task?.task_name}` : 'Fill in the information to create a new task'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <form id="task-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Attachment Section */}
            <div className="flex flex-col items-center gap-3 pb-6 border-b border-slate-100">
              <div className="relative group">
                <div className="w-20 h-20 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                  {attachmentPreview ? (
                    <FileText className="w-10 h-10 text-indigo-400" />
                  ) : (
                    <FileText className="w-10 h-10 text-slate-300" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all scale-90 group-hover:scale-100"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="application/pdf,image/*"
                />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attachment (Max 5MB, PDF/Image)</p>
              {attachmentPreview && <p className="text-xs text-slate-500 font-bold">{attachmentPreview}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <ClipboardList className="w-3.5 h-3.5" /> Task Details
                </h3>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Task Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Prepare Report"
                      className={`w-full pr-4 py-2.5 bg-slate-50 border ${errors.name ? 'border-rose-400' : 'border-slate-200'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all`}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  {errors.name && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.name}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Description</label>
                  <textarea
                    placeholder="Task details..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              {/* Assignment Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <Users className="w-3.5 h-3.5" /> Assignment
                </h3>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Assign To</label>
                  <CustomSelect
                    value={formData.assignedTo}
                    onChange={(val: string) => setFormData({ ...formData, assignedTo: val })}
                    options={dropdowns.users.map(u => ({ value: ((u.user_id ?? u.id) ? String(u.user_id ?? u.id) : ''), label: typeof u.label === 'string' ? u.label : String(u.label ?? '') }))}
                    placeholder="Select User"
                    className={errors.assignedTo ? 'border-rose-400' : ''}
                  />
                  {errors.assignedTo && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.assignedTo}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Project</label>
                  <CustomSelect
                    value={formData.projectId}
                    onChange={(val: string) => setFormData({ ...formData, projectId: val })}
                    options={dropdowns.projects.map(p => ({ value: ((p.project_id ?? p.id) ? String(p.project_id ?? p.id) : ''), label: typeof p.label === 'string' ? p.label : String(p.label ?? '') }))}
                    placeholder="Select Project"
                    className={errors.projectId ? 'border-rose-400' : ''}
                  />
                  {errors.projectId && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.projectId}</p>}
                </div>
              </div>
            </div>
            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 ml-1 flex items-center gap-2">
                   <Calendar className="w-3.5 h-3.5" /> Start Date
                </label>
                <input
                  type="date"
                  className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.startDate ? 'border-rose-400' : 'border-slate-200'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all`}
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
                {errors.startDate && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.startDate}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 ml-1 flex items-center gap-2">
                   <Calendar className="w-3.5 h-3.5" /> End Date
                </label>
                <input
                  type="date"
                  className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.endDate ? 'border-rose-400' : 'border-slate-200'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all`}
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
                {errors.endDate && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.endDate}</p>}
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
            form="task-form"
            disabled={isSubmitting}
            className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:scale-95 flex items-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {isEditMode ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskFormModal;
