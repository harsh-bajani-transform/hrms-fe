import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../../../context/AuthContext";
import { addTrackerEntry } from "../../services/trackerService";
import TrackerTable from "../components/TrackerTable";
import { fetchDropdownData } from "../../../dashboard/services/dashboardService";

const TrackerView = () => {
  const { user } = useAuth();
  
  // State
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [viewAll, setViewAll] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTask, setSelectedTask] = useState("");
  const [baseTarget, setBaseTarget] = useState("");
  const [baseTargetLoading, setBaseTargetLoading] = useState(false);
  const [productionTarget, setProductionTarget] = useState("");
  const [file, setFile] = useState(null);
  const [fileBase64, setFileBase64] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Date state for header (default to today)
  const [entryDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  // Fetch projects with tasks on mount
  useEffect(() => {
    const fetchProjectsWithTasks = async () => {
      try {
        setLoadingProjects(true);
        const payload = {
          dropdown_type: "projects with tasks",
          logged_in_user_id: user?.user_id
        };
        const res = await fetchDropdownData(payload);
        const projectsWithTasks = res?.data || [];
        setProjects(projectsWithTasks);
      } catch (error) {
        console.error('[TrackerView] Error fetching projects with tasks:', error);
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };
    if (user?.user_id) {
      fetchProjectsWithTasks();
    }
  }, [user?.user_id]);

  // Update tasks when project changes
  useEffect(() => {
    if (!selectedProject) {
      setTasks([]);
      setSelectedTask("");
      setBaseTarget("");
      return;
    }
    setLoadingTasks(true);
    const project = projects.find(p => String(p.project_id) === String(selectedProject));
    setTasks(project?.tasks || []);
    if (!project?.tasks?.find(t => String(t.task_id) === String(selectedTask))) {
      setSelectedTask("");
      setBaseTarget("");
    }
    setLoadingTasks(false);
  }, [selectedProject, projects, selectedTask]);

  // Calculate base target as user_tenure * task_target
  useEffect(() => {
    if (!selectedProject || !selectedTask || !user?.user_tenure) {
      setBaseTarget("");
      return;
    }
    setBaseTargetLoading(true);
    const project = projects.find(p => String(p.project_id) === String(selectedProject));
    const task = project?.tasks?.find(t => String(t.task_id) === String(selectedTask));
    if (task && user.user_tenure) {
      setBaseTarget(Number(task.task_target) * Number(user.user_tenure));
    } else {
      setBaseTarget("");
    }
    setBaseTargetLoading(false);
  }, [selectedProject, selectedTask, projects, user]);

  // Handle file upload
  const handleFileChange = async (e) => {
    const fileObj = e.target.files[0];
    if (!fileObj) return;
    
    setFile(fileObj);
    
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileBase64(reader.result);
      };
      reader.readAsDataURL(fileObj);
    } catch (error) {
      console.error('[TrackerView] Error converting file:', error);
      setFileBase64(null);
      toast.error("Failed to process file");
    }
  };

  // Live validation function
  const validate = () => {
    const newErrors = {};
    if (!selectedProject) newErrors.selectedProject = "Project is required.";
    if (!selectedTask) newErrors.selectedTask = "Task is required.";
    if (!baseTarget) newErrors.baseTarget = "Base Target is required.";
    if (!productionTarget) newErrors.productionTarget = "Production Target is required.";
    else if (isNaN(Number(productionTarget)) || Number(productionTarget) < 0) newErrors.productionTarget = "Enter a valid number.";
    return newErrors;
  };

  // Live validation on field change
  useEffect(() => {
    const validate = () => {
      const newErrors = {};
      if (!selectedProject) newErrors.selectedProject = "Project is required.";
      if (!selectedTask) newErrors.selectedTask = "Task is required.";
      if (!baseTarget) newErrors.baseTarget = "Base Target is required.";
      if (!productionTarget) newErrors.productionTarget = "Production Target is required.";
      else if (isNaN(Number(productionTarget)) || Number(productionTarget) < 0) newErrors.productionTarget = "Enter a valid number.";
      return newErrors;
    };
    setErrors(validate());
  }, [selectedProject, selectedTask, baseTarget, productionTarget]);

  // Handle blur for live validation
  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate());
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched to show all errors
    setTouched({ 
      selectedProject: true, 
      selectedTask: true, 
      baseTarget: true, 
      productionTarget: true 
    });
    
    setTimeout(async () => {
      const clientErrors = validate();
      setErrors(clientErrors);
      
      // Check for validation errors
      if (Object.keys(clientErrors).length > 0) {
        return;
      }
      
      setSubmitting(true);
      
      // Prepare payload for /tracker/add
      const payload = {
        project_id: Number(selectedProject),
        task_id: Number(selectedTask),
        user_id: user?.user_id,
        production: Number(productionTarget),
        tenure_target: Number(baseTarget),
        tracker_file: fileBase64 || undefined
      };
      
      try {
        const res = await addTrackerEntry(payload);
        
        if (res?.status === 201) {
          toast.success("Tracker added successfully!");
          
          // Reset form fields
          setSelectedProject("");
          setSelectedTask("");
          setBaseTarget("");
          setProductionTarget("");
          setFile(null);
          setFileBase64(null);
          setTouched({});
          
          // Automatically switch to "View All" to show the newly added tracker
          setTimeout(() => {
            setViewAll(true);
          }, 500);
        } else {
          toast.error(res?.message || "Failed to add tracker.");
        }
      } catch (err) {
        console.error('[TrackerView] Error submitting tracker:', err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to add tracker.");
      } finally {
        setSubmitting(false);
      }
    }, 0);
  };

  // Handle view all data
  const handleViewAll = () => setViewAll(true);
  const handleBackToForm = () => setViewAll(false);

  return (
    <>
      {viewAll ? (
        <TrackerTable
          userId={user?.user_id}
          projects={projects}
          onClose={handleBackToForm}
        />
      ) : (
        <div className="space-y-6 max-w-6xl mx-auto">
          {/* Data Entry Form */}
          <div className="flex flex-col items-center justify-center min-h-[80vh] w-full">
            <div className="w-full max-w-5xl rounded-t-lg bg-blue-700 flex flex-col sm:flex-row items-center justify-between px-12 py-6 mb-0" style={{ minWidth: 700 }}>
            <div className="flex items-center gap-2 text-white">
              <span className="text-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-plus w-6 h-6" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M8 12h8"></path><path d="M12 8v8"></path></svg>
              </span>
              <div>
                <div className="font-bold text-xl leading-tight">New Production Entry</div>
                <div className="text-sm opacity-80">Log output as <span className="font-semibold">{user?.user_name || user?.name || "-"}</span></div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 sm:mt-0">
              <span className="text-white text-sm font-semibold">DATE</span>
              <input
                type="text"
                className="rounded px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-blue-300 bg-white font-semibold"
                value={entryDate}
                readOnly
                style={{ color: '#1e293b', fontWeight: 600, cursor: 'not-allowed', width: '110px', minWidth: '0' }}
                tabIndex={-1}
              />
            </div>
          </div>
          <form
            className="bg-white rounded-b-lg shadow-lg p-12 w-full max-w-5xl flex flex-col gap-10"
            style={{ minWidth: 700 }}
            onSubmit={handleSubmit}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col w-full max-w-[340px] mx-auto">
                  <label className="text-sm font-semibold text-slate-600 flex items-center gap-1 mb-1">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full h-12 min-h-[48px] bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-base text-blue-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-200 placeholder:font-semibold placeholder:text-slate-600 placeholder:text-xs"
                    value={selectedProject}
                    onChange={e => setSelectedProject(e.target.value)}
                    onBlur={() => handleBlur('selectedProject')}
                    disabled={loadingProjects}
                    aria-invalid={!!errors.selectedProject}
                  >
                    <option value="" className="font-semibold text-slate-600 text-xs">Select Project</option>
                    {projects.map((p) => (
                      <option key={p.project_id} value={p.project_id} className="font-normal text-slate-700 text-base">{p.project_name}</option>
                    ))}
                  </select>
                  {touched.selectedProject && errors.selectedProject && (
                    <span className="text-xs text-red-600 mt-1">{errors.selectedProject}</span>
                  )}
                </div>
                <div className="flex flex-col w-full max-w-[340px] mx-auto">
                  <label className="text-sm font-semibold text-slate-600 flex items-center gap-1 mb-1">
                    Task Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full h-12 min-h-[48px] bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-base text-blue-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-200 placeholder:font-semibold placeholder:text-slate-600 placeholder:text-xs"
                    value={selectedTask}
                    onChange={e => setSelectedTask(e.target.value)}
                    onBlur={() => handleBlur('selectedTask')}
                    disabled={!selectedProject || loadingTasks}
                    aria-invalid={!!errors.selectedTask}
                  >
                    <option value="" className="font-semibold text-slate-600 text-xs">Select Task</option>
                    {tasks.map((t) => (
                      <option key={t.task_id} value={t.task_id} className="font-normal text-slate-700 text-base">{t.task_name || t.label}</option>
                    ))}
                  </select>
                  {touched.selectedTask && errors.selectedTask && (
                    <span className="text-xs text-red-600 mt-1">{errors.selectedTask}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col w-full max-w-[340px] mx-auto">
                  <label className="text-sm font-semibold text-slate-600 flex items-center gap-1 mb-1">
                    Base Target <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 text-base text-blue-700 font-semibold gap-2 min-h-[48px] h-12">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-blue-400"><rect width="14" height="10" x="5" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <span className="text-blue-700 font-semibold">{baseTargetLoading ? 'Loading...' : (baseTarget ? baseTarget : '-')}</span>
                  </div>
                  {touched.baseTarget && errors.baseTarget && (
                    <span className="text-xs text-red-600 mt-1">{errors.baseTarget}</span>
                  )}
                </div>
                <div className="flex flex-col w-full max-w-[340px] mx-auto">
                  <label className="text-sm font-semibold text-slate-600 flex items-center gap-1 mb-1">
                    Production Target <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 text-base text-blue-700 font-semibold gap-2 min-h-[48px] h-12">
                    <input
                      type="number"
                      min="0"
                      className="bg-transparent outline-none border-none w-full h-full text-blue-700 font-semibold text-base px-0 placeholder:font-semibold placeholder:text-slate-600 placeholder:text-xs"
                      value={productionTarget}
                      onChange={e => setProductionTarget(e.target.value)}
                      onBlur={() => handleBlur('productionTarget')}
                      placeholder="Enter value"
                      style={{ minWidth: 0 }}
                      aria-invalid={!!errors.productionTarget}
                    />
                  </div>
                  {touched.productionTarget && errors.productionTarget && (
                    <span className="text-xs text-red-600 mt-1">{errors.productionTarget}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-center mt-2 mb-2">
              <div className="w-full max-w-md">
                <label className="text-sm font-semibold text-slate-600 flex items-center gap-1 mb-1">Project Files</label>
                <div
                  className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 min-h-[44px] h-11 cursor-pointer group"
                  onClick={() => document.getElementById('custom-file-upload').click()}
                  style={{ transition: 'border 0.2s' }}
                >
                  <div className="flex items-center gap-2 text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-slate-400"><path d="M16 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2"/><rect width="8" height="8" x="14" y="2" rx="2"/><path d="M8 12h4m-2-2v4"/></svg>
                    <span className="font-medium select-none">{file ? file.name : 'Select project files'}</span>
                  </div>
                  <span className="text-blue-600 font-semibold text-sm group-hover:underline select-none">Browse</span>
                  <input
                    id="custom-file-upload"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-4 justify-center mt-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
              <button
                type="button"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                onClick={handleViewAll}
              >
                View All Data
              </button>
            </div>
          </form>
        </div>
        </div>
      )}
    </>
  );
};

export default TrackerView;
