import React, { useState, useRef } from "react";
import {
  Briefcase,
  Layers,
  X,
  Target,
  Users,
  Shield,
  Brain,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
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
import { createProject, updateProject } from "../../services/manageService";
import { useDeviceInfo } from "../../../../hooks/useDeviceInfo";
import { UserDropdowns } from "../../../../hooks/useUserDropdowns";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Hash, Download } from "lucide-react";

import type { ProjectFormModalProps } from "../../types";

interface FormDataState {
  name: string;
  projectCode: string;
  description: string;
  ownerId: string;
  apmIds: (string | number)[];
  qaIds: (string | number)[];
  monthlyTarget: string;
  projectCategoryId: string;
  teamIds: (string | number)[];
  requiresAIEvaluation: boolean;
  requiresDuplicateCheck: boolean;
}

const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  project,
  onClose,
  onSuccess,
  dropdowns,
}) => {
  const isEditMode = !!project;
  const { device_id, device_type } = useDeviceInfo();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormDataState>({
    name: project?.project_name || "",
    projectCode: project?.project_code || "",
    description: project?.project_description || "",
    ownerId: project?.owner_id?.toString() || "",
    apmIds: project
      ? Array.isArray(project.apm_id)
        ? project.apm_id.map(String)
        : project.apm_id
          ? [project.apm_id.toString()]
          : []
      : [],
    qaIds: project
      ? Array.isArray(project.qa_id)
        ? project.qa_id.map(String)
        : project.qa_id
          ? [project.qa_id.toString()]
          : []
      : [],
    monthlyTarget: project?.monthly_hours_target?.toString() || "",
    projectCategoryId: project?.project_category_id?.toString() || "",
    teamIds: project
      ? Array.isArray(project.project_team_id)
        ? project.project_team_id.map(String)
        : Array.isArray((project as Record<string, unknown>).project_team)
          ? ((project as Record<string, unknown>).project_team as Array<{ user_id?: string | number } | string | number>).map((u) => String(typeof u === 'object' ? u.user_id || "" : u))
          : []
      : [],
    requiresAIEvaluation: !!project?.requires_ai_evaluation,
    requiresDuplicateCheck: !!project?.requires_duplicate_check,
  });

  const [projectFiles, setProjectFiles] = useState<File[]>([]);
  const [existingFile, setExistingFile] = useState<string | null>(project?.project_file || null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormDataState, string>>>(
    {},
  );

  const validate = () => {
    const newErrors: Partial<Record<keyof FormDataState, string>> = {};
    if (!formData.name.trim()) newErrors.name = "Project name is required";
    if (!formData.projectCode.trim())
      newErrors.projectCode = "Project code is required";
    if (!formData.ownerId) newErrors.ownerId = "Owner is required";
    if (formData.apmIds.length === 0)
      newErrors.apmIds = "At least one Assistant Manager is required";
    if (formData.qaIds.length === 0)
      newErrors.qaIds = "At least one QA Owner is required";
    if (formData.teamIds.length === 0)
      newErrors.teamIds = "At least one Agent is required";
    if (!formData.monthlyTarget || isNaN(Number(formData.monthlyTarget)))
      newErrors.monthlyTarget =
        "Monthly target is required and must be a number";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const oversized = newFiles.some(f => f.size > 5 * 1024 * 1024);
      if (oversized) {
        toast.error("Some files exceed the 5MB limit");
      }
      const validFiles = newFiles.filter(f => f.size <= 5 * 1024 * 1024);
      setProjectFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setProjectFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setIsSubmitting(true);
      
      const submitData = new FormData();
      submitData.append("project_name", formData.name);
      submitData.append("project_code", formData.projectCode);
      submitData.append("project_description", formData.description);
      submitData.append("owner_id", formData.ownerId);
      submitData.append("monthly_hours_target", formData.monthlyTarget);
      submitData.append("project_category_id", formData.projectCategoryId);
      submitData.append("device_id", device_id);
      submitData.append("device_type", device_type);

      // Legacy backend formats for arrays (JSON strings of numbers)
      submitData.append("asst_project_manager_id", JSON.stringify(formData.apmIds.map(Number)));
      submitData.append("project_qa_id", JSON.stringify(formData.qaIds.map(Number)));
      submitData.append("project_team_id", JSON.stringify(formData.teamIds.map(Number)));
      
      submitData.append("requires_ai_evaluation", formData.requiresAIEvaluation ? "1" : "0");
      submitData.append("requires_duplicate_check", formData.requiresDuplicateCheck ? "1" : "0");
      
      // Legacy backend expects 'file' key
      projectFiles.forEach(file => submitData.append("file", file));

      // Handle existing files in edit mode
      if (isEditMode && project) {
        // Collect URLs from files that were marked as existing (if we had that state)
        // For now, if existingFile is not replaced, we might need a way to track it.
        // Looking at legacy, they use 'existing_files' JSON array.
        const existingFilesToKeep = existingFile ? [existingFile] : [];
        submitData.append("existing_files", JSON.stringify(existingFilesToKeep));
      }

      if (isEditMode && project) {
        await updateProject(project.project_id, submitData);
        toast.success("Project updated successfully");
      } else {
        await createProject(submitData);
        toast.success("Project created successfully");
      }
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
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
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded flex items-center justify-center border border-white/30 shadow-inner">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-white leading-none">
                {isEditMode ? "Edit Project" : "New Project"}
              </DialogTitle>
              <p className="text-blue-100/80 text-sm font-medium mt-1.5">
                {isEditMode
                  ? `Optimizing ${project?.project_name}`
                  : "Launch a new operational initiative"}
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-8 bg-white max-h-[70vh] overflow-y-auto scrollbar-hide"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* PROJECT NAME */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-gray-700 px-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Project Title
              </label>
              <Input
                name="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. HRMS Migration"
                className={` bg-gray-50 border-gray-200 focus:bg-white transition-all ${errors.name ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100"}`}
              />
              {errors.name && (
                <p className="text-xs text-red-500 font-medium mt-1 px-1">
                  {errors.name}
                </p>
              )}
            </div>

            {/* PROJECT CODE */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 px-1 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" />
                Project Code
              </label>
              <Input
                name="projectCode"
                value={formData.projectCode}
                onChange={(e) =>
                  setFormData({ ...formData, projectCode: e.target.value })
                }
                placeholder="e.g. PRJ001"
                className={` bg-gray-50 border-gray-200 focus:bg-white transition-all ${errors.projectCode ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100"}`}
              />
              {errors.projectCode && (
                <p className="text-xs text-red-500 font-medium mt-1 px-1">
                  {errors.projectCode}
                </p>
              )}
            </div>

            {/* MONTHLY TARGET */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 px-1 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                Monthly Target
              </label>
              <Input
                name="monthlyTarget"
                type="number"
                value={formData.monthlyTarget}
                onChange={(e) =>
                  setFormData({ ...formData, monthlyTarget: e.target.value })
                }
                placeholder="e.g. 100"
                className={` bg-gray-50 border-gray-200 focus:bg-white transition-all ${errors.monthlyTarget ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100"}`}
              />
            </div>

            {/* PROJECT CATEGORY */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-gray-700 px-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Project Category
              </label>
              <Select
                value={formData.projectCategoryId}
                onValueChange={(val) =>
                  setFormData({ ...formData, projectCategoryId: val })
                }
              >
                <SelectTrigger
                  className={` w-full bg-gray-50 border-gray-200 focus:bg-white transition-all`}
                >
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {dropdowns.projectCategories && dropdowns.projectCategories.length > 0 ? (
                    dropdowns.projectCategories.map((cat, idx) => {
                      const id = (cat.project_category_id || cat.id)?.toString() || "";
                      const name = String(cat.project_category_name || cat.label || cat.name || id);
                      return (
                        <SelectItem key={`${id}-${idx}`} value={id}>
                          {name}
                        </SelectItem>
                      );
                    })
                  ) : (
                    <SelectItem value="none" disabled>
                      No categories available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* DESCRIPTION */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-gray-700 px-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Project Description
              </label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Briefly describe the project scope..."
                className="bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-400 transition-all min-h-[100px] resize-none"
              />
            </div>

            {/* AI EVALUATION & DUPLICATE CHECK TOGGLES */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 ${formData.requiresAIEvaluation ? 'border-blue-500 bg-blue-50/50' : 'border-gray-100 bg-gray-50/30 hover:border-gray-200'}`}
                onClick={() => setFormData(prev => ({ ...prev, requiresAIEvaluation: !prev.requiresAIEvaluation }))}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.requiresAIEvaluation ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  <Brain className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">Requires AI Evaluation</p>
                  <p className="text-xs text-gray-500">Enable mandatory AI quality check</p>
                </div>
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${formData.requiresAIEvaluation ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                  {formData.requiresAIEvaluation && <Briefcase className="w-3.5 h-3.5 text-white" />}
                </div>
              </div>

              <div 
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 ${formData.requiresDuplicateCheck ? 'border-purple-500 bg-purple-50/50' : 'border-gray-100 bg-gray-50/30 hover:border-gray-200'}`}
                onClick={() => setFormData(prev => ({ ...prev, requiresDuplicateCheck: !prev.requiresDuplicateCheck }))}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.requiresDuplicateCheck ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  <Shield className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">Duplicate Check</p>
                  <p className="text-xs text-gray-500">Prevent duplicate file submission</p>
                </div>
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${formData.requiresDuplicateCheck ? 'bg-purple-500 border-purple-500' : 'border-gray-300'}`}>
                  {formData.requiresDuplicateCheck && <Briefcase className="w-3.5 h-3.5 text-white" />}
                </div>
              </div>
            </div>

            {/* OWNER */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 px-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Project Owner (PM)
              </label>
              <Select
                value={formData.ownerId}
                onValueChange={(val) =>
                  setFormData({ ...formData, ownerId: val })
                }
              >
                <SelectTrigger
                  className={` w-full bg-gray-50 border-gray-200 focus:bg-white transition-all ${errors.ownerId ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100"}`}
                >
                  <SelectValue placeholder="Select PM" />
                </SelectTrigger>
                <SelectContent>
                  {dropdowns.projectManagers.map((m) => (
                    <SelectItem
                      key={(m.user_id || m.id)?.toString()}
                      value={(m.user_id || m.id)?.toString() || ""}
                    >
                      {String(m.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ASSISTANT MANAGER (MULTIPLE) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 px-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Assistant Manager(s)
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className={` w-full bg-gray-50 border-gray-200 flex justify-between px-3 font-normal font-sans ${errors.apmIds ? "border-red-500" : ""}`}
                  >
                    <span className="truncate">
                      {formData.apmIds.length > 0
                        ? `${formData.apmIds.length} selected`
                        : "Select AMs"}
                    </span>
                    <ChevronDown className="w-4 h-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 max-h-[300px] overflow-y-auto">
                  {dropdowns.assistantManagers.map((m) => {
                    const id = (m.user_id || m.id)?.toString() || "";
                    return (
                      <DropdownMenuCheckboxItem
                        key={id}
                        checked={formData.apmIds.includes(id)}
                        onCheckedChange={(checked) => {
                          const nextIds = checked
                            ? [...formData.apmIds, id]
                            : formData.apmIds.filter((x) => x !== id);
                          setFormData({ ...formData, apmIds: nextIds });
                        }}
                      >
                        {String(m.label)}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              {formData.apmIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.apmIds.map((id) => {
                    const manager = dropdowns.assistantManagers.find(
                      (m) => (m.user_id || m.id)?.toString() === id.toString(),
                    );
                    return (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-0.5"
                      >
                        {String(manager?.label || id)}
                        <X
                          className="w-3 h-3 ml-1 cursor-pointer"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              apmIds: formData.apmIds.filter((x) => x !== id),
                            });
                          }}
                        />
                      </Badge>
                    );
                  })}
                </div>
              )}
              {errors.apmIds && (
                <p className="text-xs text-red-500 font-medium mt-1 px-1">
                  {errors.apmIds}
                </p>
              )}
            </div>

            {/* QA OWNER (MULTIPLE) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 px-1 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                Quality Assurance(s)
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className={` w-full bg-gray-50 border-gray-200 flex justify-between px-3 font-normal font-sans ${errors.qaIds ? "border-red-500" : ""}`}
                  >
                    <span className="truncate">
                      {formData.qaIds.length > 0
                        ? `${formData.qaIds.length} selected`
                        : "Select QAs"}
                    </span>
                    <ChevronDown className="w-4 h-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 max-h-[300px] overflow-y-auto">
                  {dropdowns.qas.map((q) => {
                    const id = (q.user_id || q.id)?.toString() || "";
                    return (
                      <DropdownMenuCheckboxItem
                        key={id}
                        checked={formData.qaIds.includes(id)}
                        onCheckedChange={(checked) => {
                          const nextIds = checked
                            ? [...formData.qaIds, id]
                            : formData.qaIds.filter((x) => x !== id);
                          setFormData({ ...formData, qaIds: nextIds });
                        }}
                      >
                        {String(q.label)}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              {formData.qaIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.qaIds.map((id) => {
                    const qa = dropdowns.qas.find(
                      (q) => (q.user_id || q.id)?.toString() === id.toString(),
                    );
                    return (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2 py-0.5"
                      >
                        {String(qa?.label || id)}
                        <X
                          className="w-3 h-3 ml-1 cursor-pointer"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              qaIds: formData.qaIds.filter((x) => x !== id),
                            });
                          }}
                        />
                      </Badge>
                    );
                  })}
                </div>
              )}
              {errors.qaIds && (
                <p className="text-xs text-red-500 font-medium mt-1 px-1">
                  {errors.qaIds}
                </p>
              )}
            </div>

            {/* TEAM ASSIGNMENT (AGENTS) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 px-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Agent(s)
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className={` w-full bg-gray-50 border-gray-200 flex justify-between px-3 font-normal font-sans ${errors.teamIds ? "border-red-500" : ""}`}
                  >
                    <span className="truncate">
                      {formData.teamIds.length > 0
                        ? `${formData.teamIds.length} selected`
                        : "Select Agents"}
                    </span>
                    <ChevronDown className="w-4 h-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 max-h-[300px] overflow-y-auto">
                  {dropdowns.agents.map((a) => {
                    const id = (a.user_id || a.id)?.toString() || "";
                    return (
                      <DropdownMenuCheckboxItem
                        key={id}
                        checked={formData.teamIds.includes(id)}
                        onCheckedChange={(checked) => {
                          const nextIds = checked
                            ? [...formData.teamIds, id]
                            : formData.teamIds.filter((x) => x !== id);
                          setFormData({ ...formData, teamIds: nextIds });
                        }}
                      >
                        {String(a.label)}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              {formData.teamIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.teamIds.map((id) => {
                    const agent = dropdowns.agents.find(
                      (a) => (a.user_id || a.id)?.toString() === id.toString(),
                    );
                    return (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="bg-purple-50 text-purple-700 hover:bg-purple-100 px-2 py-0.5"
                      >
                        {String(agent?.label || id)}
                        <X
                          className="w-3 h-3 ml-1 cursor-pointer"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              teamIds: formData.teamIds.filter((x) => x !== id),
                            });
                          }}
                        />
                      </Badge>
                    );
                  })}
                </div>
              )}
              {errors.teamIds && (
                <p className="text-xs text-red-500 font-medium mt-1 px-1">
                  {errors.teamIds}
                </p>
              )}
            </div>

            {/* PROJECT FILE */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-gray-700 px-1 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                Project Files (Guidelines/SOP)
              </label>
              
              {/* Existing file display if any */}
              {existingFile && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-800 text-sm">
                    <FileText className="w-4 h-4" />
                    <span>Existing file: {existingFile.split(/[\\/]/).pop()}</span>
                  </div>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm" 
                    className="text-amber-700 hover:text-amber-900"
                    onClick={() => setExistingFile(null)}
                  >
                    Replace
                  </Button>
                </div>
              )}

              <div
                className="relative group cursor-pointer border-2 border-dashed border-gray-200 rounded p-6 bg-gray-50/50 hover:bg-white hover:border-blue-400 transition-all text-center flex flex-col items-center gap-3"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-12 h-12 bg-white rounded shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">
                    Click to upload project files
                  </p>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mt-1">
                    PDF, DOCX, XLSX (MAX 5MB per file)
                  </p>
                </div>
              </div>
              
              {/* Selected files preview */}
              {projectFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {projectFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                        <span className="text-sm text-blue-700 truncate">{file.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 hover:bg-blue-100 text-blue-600 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(idx);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx"
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
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200 rounded transition-all border-none"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectFormModal;
