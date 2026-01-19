import React, { useState, useRef } from 'react';
import { X, Upload, User, UserPlus, Eye, EyeOff, Shield, Briefcase, Users, Phone, Mail, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';
import CustomSelect from '../../../../components/common/CustomSelect';
import { fileToBase64 } from '../../../../lib/fileToBase64';
import { addUser, updateUser } from '../../services/manageService';
import { useDeviceInfo } from '../../../../hooks/useDeviceInfo';

const UserFormModal = ({ user, onClose, onSuccess, dropdowns }) => {
  const isEditMode = !!user;
  const { device_id, device_type } = useDeviceInfo();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: user?.user_name || '',
    email: user?.user_email || '',
    phone: user?.user_number || '',
    password: '',
    roleId: user?.role_id?.toString() || '',
    designationId: user?.designation_id?.toString() || '',
    projectManagerId: user?.project_manager_id?.toString() || '',
    assistantManagerId: user?.assistant_manager_id?.toString() || '',
    qaId: user?.qa_id?.toString() || '',
    teamId: user?.team_id?.toString() || '',
    address: user?.user_address || '',
    tenure: user?.user_tenure || '',
    profilePicture: null
  });

  const [profilePreview, setProfilePreview] = useState(user?.profile_picture || null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Field visibility logic based on Role
  const getFieldVisibility = (selectedRoleId) => {
    const roleId = Number(selectedRoleId);
    if (!roleId || [1, 2, 6].includes(roleId)) { // Admin, Super Admin, Agent
      return { pm: true, am: true, qa: true };
    }
    if (roleId === 5) return { pm: true, am: true, qa: false }; // QA
    if (roleId === 4) return { pm: true, am: false, qa: false }; // Assistant Manager
    if (roleId === 3) return { pm: false, am: false, qa: false }; // Project Manager
    return { pm: true, am: true, qa: true };
  };

  const visibility = getFieldVisibility(formData.roleId);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!isEditMode && !formData.email.trim()) newErrors.email = 'Email is required';
    if (!isEditMode && !formData.password) newErrors.password = 'Password is required';
    if (formData.password && formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!formData.roleId) newErrors.roleId = 'Role is required';
    if (!formData.designationId) newErrors.designationId = 'Designation is required';
    if (!formData.teamId) newErrors.teamId = 'Team is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const payload = {
        user_name: formData.name,
        user_email: formData.email,
        user_password: formData.password || undefined,
        role_id: formData.roleId,
        designation_id: formData.designationId,
        project_manager: formData.projectManagerId,
        assistant_manager: formData.assistantManagerId,
        qa: formData.qaId,
        team: formData.teamId,
        user_number: formData.phone,
        user_address: formData.address,
        user_tenure: formData.tenure,
        profile_picture: formData.profilePicture,
        device_id,
        device_type
      };

      if (isEditMode) {
        await updateUser({ ...payload, user_id: user.user_id });
        toast.success('User updated successfully');
      } else {
        await addUser(payload);
        toast.success('User created successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB');
        return;
      }
      const base64 = await fileToBase64(file);
      setFormData({ ...formData, profilePicture: base64 });
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-100 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-indigo-600 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              {isEditMode ? <User className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              {isEditMode ? 'Edit User' : 'Create New User'}
            </h2>
            <p className="text-indigo-100 text-xs mt-0.5">
              {isEditMode ? `Updating ${user.user_name}'s profile` : 'Fill in the information to invite a new member'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <form id="user-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center gap-3 pb-6 border-b border-slate-100">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                  {profilePreview ? (
                    <img src={profilePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-slate-300" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all scale-90 group-hover:scale-100"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Profile Picture (Max 2MB)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <User className="w-3.5 h-3.5" /> Basic Information
                </h3>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border ${errors.name ? 'border-rose-400' : 'border-slate-200'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all`}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  {errors.name && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.name}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="john@example.com"
                      disabled={isEditMode}
                      className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border ${errors.email ? 'border-rose-400' : 'border-slate-200'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${isEditMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  {errors.email && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.email}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="10-digit number"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">
                    {isEditMode ? 'New Password (Optional)' : 'Password'}
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={isEditMode ? 'Leave blank to keep current' : 'At least 6 characters'}
                      className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.password ? 'border-rose-400' : 'border-slate-200'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all`}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  {errors.password && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.password}</p>}
                </div>
              </div>

              {/* Organization Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <Shield className="w-3.5 h-3.5" /> Organization Details
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Role</label>
                    <CustomSelect
                      value={formData.roleId}
                      onChange={(val) => setFormData({ ...formData, roleId: val })}
                      options={dropdowns.roles.map(r => ({ value: r.role_id?.toString(), label: r.label }))}
                      placeholder="Select Role"
                      className={errors.roleId ? 'border-rose-400' : ''}
                    />
                    {errors.roleId && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.roleId}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Designation</label>
                    <CustomSelect
                      value={formData.designationId}
                      onChange={(val) => setFormData({ ...formData, designationId: val })}
                      options={dropdowns.designations.map(d => ({ value: d.designation_id?.toString(), label: d.label }))}
                      placeholder="Select Designation"
                      className={errors.designationId ? 'border-rose-400' : ''}
                    />
                    {errors.designationId && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.designationId}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Team</label>
                    <CustomSelect
                      value={formData.teamId}
                      onChange={(val) => setFormData({ ...formData, teamId: val })}
                      options={dropdowns.teams.map(t => ({ value: t.team_id?.toString(), label: t.label }))}
                      placeholder="Select Team"
                      className={errors.teamId ? 'border-rose-400' : ''}
                    />
                    {errors.teamId && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.teamId}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Tenure (Years)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 1.5"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      value={formData.tenure}
                      onChange={(e) => setFormData({ ...formData, tenure: e.target.value })}
                    />
                  </div>
                </div>

                {/* Hierarchical Fields */}
                <div className="space-y-4 pt-2">
                  {visibility.pm && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 ml-1">Project Manager</label>
                      <CustomSelect
                        value={formData.projectManagerId}
                        onChange={(val) => setFormData({ ...formData, projectManagerId: val })}
                        options={dropdowns.projectManagers.map(m => ({ value: m.user_id?.toString(), label: m.label }))}
                        placeholder="Select PM"
                      />
                    </div>
                  )}

                  {visibility.am && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 ml-1">Assistant Manager</label>
                      <CustomSelect
                        value={formData.assistantManagerId}
                        onChange={(val) => setFormData({ ...formData, assistantManagerId: val })}
                        options={dropdowns.assistantManagers.map(m => ({ value: m.user_id?.toString(), label: m.label }))}
                        placeholder="Select AM"
                      />
                    </div>
                  )}

                  {visibility.qa && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 ml-1">Quality Analyst</label>
                      <CustomSelect
                        value={formData.qaId}
                        onChange={(val) => setFormData({ ...formData, qaId: val })}
                        options={dropdowns.qas.map(q => ({ value: q.user_id?.toString(), label: q.label }))}
                        placeholder="Select QA"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 ml-1 flex items-center gap-2">
                 <MapPin className="w-3.5 h-3.5" /> Address (Optional)
              </label>
              <textarea
                placeholder="Street name, City, State..."
                rows="2"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
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
            form="user-form"
            disabled={isSubmitting}
            className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:scale-95 flex items-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {isEditMode ? 'Update User' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserFormModal;
