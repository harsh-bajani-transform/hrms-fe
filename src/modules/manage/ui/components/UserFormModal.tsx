import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  User,
  UserPlus,
  Eye,
  EyeOff,
  Shield,
  Briefcase,
  Users,
  Phone,
  Mail,
  MapPin,
  PlusCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fileToBase64 } from "../../../../lib/fileToBase64";
import { addUser, updateUser } from "../../services/manageService";
import { useDeviceInfo } from "../../../../hooks/useDeviceInfo";
import { UserDropdowns } from "../../../../hooks/useUserDropdowns";

interface UserType {
  user_id?: string | number;
  user_name?: string;
  user_email?: string;
  user_number?: string;
  user_address?: string;
  user_tenure?: string;
  role_id?: string | number;
  designation_id?: string | number;
  project_manager_id?: string | number;
  assistant_manager_id?: string | number;
  qa_id?: string | number;
  team_id?: string | number;
  profile_picture?: string | null;
  [key: string]: unknown;
}

interface UserFormModalProps {
  user?: UserType | undefined;
  onClose: () => void;
  onSuccess: () => void;
  dropdowns: UserDropdowns;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  roleId: string;
  designationId: string;
  projectManagerId: string;
  assistantManagerId: string;
  qaId: string;
  teamId: string;
  address: string;
  tenure: string;
  profilePicture: string | null;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  user,
  onClose,
  onSuccess,
  dropdowns,
}) => {
  const isEditMode = !!user;
  const { device_id, device_type } = useDeviceInfo();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    name: user?.user_name || "",
    email: user?.user_email || "",
    phone: user?.user_number || "",
    password: "",
    roleId: user?.role_id?.toString() || "",
    designationId: user?.designation_id?.toString() || "",
    projectManagerId: user?.project_manager_id?.toString() || "",
    assistantManagerId: user?.assistant_manager_id?.toString() || "",
    qaId: user?.qa_id?.toString() || "",
    teamId: user?.team_id?.toString() || "",
    address: user?.user_address || "",
    tenure: user?.user_tenure || "",
    profilePicture: null,
  });

  const [profilePreview, setProfilePreview] = useState<string | null>(
    user?.profile_picture || null,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  );

  const getFieldVisibility = (selectedRoleId: string) => {
    const roleId = Number(selectedRoleId);
    if (!roleId || [1, 2, 6].includes(roleId)) {
      return { pm: true, am: true, qa: true };
    }
    if (roleId === 5) return { pm: true, am: true, qa: false };
    if (roleId === 4) return { pm: true, am: false, qa: false };
    if (roleId === 3) return { pm: false, am: false, qa: false };
    return { pm: true, am: true, qa: true };
  };

  const visibility = getFieldVisibility(formData.roleId);

  const validate = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!isEditMode && !formData.email.trim())
      newErrors.email = "Email is required";
    if (!isEditMode && !formData.password)
      newErrors.password = "Password is required";
    if (formData.password && formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (!formData.roleId) newErrors.roleId = "Role is required";
    if (!formData.designationId)
      newErrors.designationId = "Designation is required";
    if (!formData.teamId) newErrors.teamId = "Team is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        team_id: formData.teamId,
        user_number: formData.phone,
        user_address: formData.address,
        user_tenure: formData.tenure,
        profile_picture: formData.profilePicture,
        device_id,
        device_type,
      };
      if (isEditMode) {
        await updateUser({ ...payload, user_id: user?.user_id });
        toast.success("User updated successfully");
      } else {
        await addUser(payload);
        toast.success("User created successfully");
      }
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size must be less than 2MB");
        return;
      }
      const base64 = await fileToBase64(file);
      setFormData({ ...formData, profilePicture: base64 as string });
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-white">
        {/* Banner Header */}
        <div className="bg-linear-to-r from-blue-600 to-blue-700 px-8 py-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/20 rounded-full -ml-12 -mb-12 blur-xl" />

          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 shadow-inner">
              {isEditMode ? (
                <User className="w-6 h-6 text-white" />
              ) : (
                <UserPlus className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-white leading-none">
                {isEditMode ? "Update Member" : "Add New Member"}
              </DialogTitle>
              <p className="text-blue-100/80 text-sm font-medium mt-1.5">
                {isEditMode
                  ? "Refine team member profiles"
                  : "Expand your workforce with ease"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-8 bg-white max-h-[70vh] overflow-y-auto scrollbar-hide"
        >
          {/* Centered Upload Area */}
          <div className="flex flex-col items-center justify-center space-y-4 mb-4">
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-200 group-hover:border-blue-400 overflow-hidden bg-slate-50 flex items-center justify-center transition-all">
                {profilePreview ? (
                  <img
                    src={profilePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-blue-500">
                    <Upload className="w-8 h-8" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      Upload Photo
                    </span>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity">
                <PlusCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs text-slate-400 font-medium italic">
              Accepted formats: JPG, PNG. Max 2MB.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* FULL NAME */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                <User className="w-3 h-3" />
                Full Name
              </label>
              <Input
                name="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. John Doe"
                className={`h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all ${errors.name ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100"}`}
              />
              {errors.name && (
                <p className="text-[10px] text-red-500 font-bold mt-1 px-1">
                  {errors.name}
                </p>
              )}
            </div>

            {/* EMAIL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                <Mail className="w-3 h-3" />
                Email Address
              </label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled={isEditMode}
                placeholder="john@example.com"
                className={`h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all ${errors.email ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100"}`}
              />
              {errors.email && (
                <p className="text-[10px] text-red-500 font-bold mt-1 px-1">
                  {errors.email}
                </p>
              )}
            </div>

            {/* PHONE */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                <Phone className="w-3 h-3" />
                Contact Number
              </label>
              <Input
                name="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+91 98765 43210"
                className={`h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all ${errors.phone ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100"}`}
              />
            </div>

            {/* ROLE */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                Permission Role
              </label>
              <Select
                value={formData.roleId}
                onValueChange={(val) =>
                  setFormData({ ...formData, roleId: val })
                }
              >
                <SelectTrigger
                  className={`h-11 w-full bg-slate-50/50 border-slate-200 focus:bg-white transition-all ${errors.roleId ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100"}`}
                >
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  {dropdowns.roles.map((r) => (
                    <SelectItem
                      key={String(r.role_id)}
                      value={String(r.role_id)}
                    >
                      {String(r.role_name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {visibility.pm && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                  <Shield className="w-3 h-3" />
                  Project Manager
                </label>
                <Select
                  value={formData.projectManagerId}
                  onValueChange={(val) =>
                    setFormData({ ...formData, projectManagerId: val })
                  }
                >
                  <SelectTrigger className="h-11 w-full bg-slate-50/50 border-slate-200">
                    <SelectValue placeholder="Select PM" />
                  </SelectTrigger>
                  <SelectContent>
                    {dropdowns.projectManagers.map((m) => (
                      <SelectItem
                        key={String(m.user_id ?? m.id)}
                        value={String(m.user_id ?? m.id)}
                      >
                        {String(m.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {visibility.am && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                  <Users className="w-3 h-3" />
                  Assistant Manager
                </label>
                <Select
                  value={formData.assistantManagerId}
                  onValueChange={(val) =>
                    setFormData({ ...formData, assistantManagerId: val })
                  }
                >
                  <SelectTrigger className="h-11 w-full bg-slate-50/50 border-slate-200">
                    <SelectValue placeholder="Select AM" />
                  </SelectTrigger>
                  <SelectContent>
                    {dropdowns.assistantManagers.map((m) => (
                      <SelectItem
                        key={String(m.user_id ?? m.id)}
                        value={String(m.user_id ?? m.id)}
                      >
                        {String(m.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {visibility.qa && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                  <Shield className="w-3 h-3" />
                  Quality Analyst
                </label>
                <Select
                  value={formData.qaId}
                  onValueChange={(val) =>
                    setFormData({ ...formData, qaId: val })
                  }
                >
                  <SelectTrigger className="h-11 w-full bg-slate-50/50 border-slate-200">
                    <SelectValue placeholder="Select QA" />
                  </SelectTrigger>
                  <SelectContent>
                    {dropdowns.qas.map((q) => (
                      <SelectItem
                        key={String(q.user_id ?? q.id)}
                        value={String(q.user_id ?? q.id)}
                      >
                        {String(q.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* DESIGNATION */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                <Briefcase className="w-3 h-3" />
                Designation
              </label>
              <Select
                value={formData.designationId}
                onValueChange={(val) =>
                  setFormData({ ...formData, designationId: val })
                }
              >
                <SelectTrigger
                  className={`h-11 w-full bg-slate-50/50 border-slate-200 focus:bg-white transition-all ${errors.designationId ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100"}`}
                >
                  <SelectValue placeholder="Select Designation" />
                </SelectTrigger>
                <SelectContent>
                  {dropdowns.designations.map((d) => (
                    <SelectItem
                      key={String(d.designation_id)}
                      value={String(d.designation_id)}
                    >
                      {String(d.designation_name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* TEAM/DEPT */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                <Users className="w-3 h-3" />
                Department
              </label>
              <Select
                value={formData.teamId}
                onValueChange={(val) =>
                  setFormData({ ...formData, teamId: val })
                }
              >
                <SelectTrigger className="h-11 w-full bg-slate-50/50 border-slate-200">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {dropdowns.teams.map((t) => (
                    <SelectItem
                      key={String(t.team_id)}
                      value={String(t.team_id)}
                    >
                      {String(t.team_name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* PASSWORD */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                <Eye className="w-3 h-3" />
                {isEditMode ? "New Password (Optional)" : "Password"}
              </label>
              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder={
                    isEditMode
                      ? "Leave blank to keep current"
                      : "Minimum 6 characters"
                  }
                  className={`h-11 pr-10 bg-slate-50/50 border-slate-200 focus:bg-white transition-all ${errors.password ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* TENURE */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                <Briefcase className="w-3 h-3" />
                Tenure (Years)
              </label>
              <Input
                name="tenure"
                type="number"
                step="0.1"
                value={formData.tenure}
                onChange={(e) =>
                  setFormData({ ...formData, tenure: e.target.value })
                }
                placeholder="e.g. 1.5"
                className="h-11 bg-slate-50/50 border-slate-200"
              />
            </div>

            {/* ADDRESS */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                <MapPin className="w-3 h-3" />
                Residency Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                rows={2}
                placeholder="Full address details..."
                className="w-full p-4 text-sm rounded-xl bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-blue-400 focus:ring-blue-100 transition-all outline-hidden resize-none"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 flex-row gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1 h-12 font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200 rounded-xl transition-all border-none"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Create Member"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserFormModal;
