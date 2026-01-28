
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { fetchDropdowns, addTracker } from "../../services/agentService";
import { fileToBase64 } from "../../../../lib/fileToBase64";
import { useAuth } from "../../../../context/AuthContext";
// import { log, logError } from "../../config/environment"; // Can use simple console.log for now or migrate config

// Components
import TrackerTable from "../components/TrackerTable"; 
import AgentTabsNavigation from "../components/AgentTabsNavigation";
import AgentBillableReport from "../components/AgentBillableReport";

const AgentDashboardView = ({ embedded = false }) => {
  console.log('🟢 AgentDashboardView is rendering, embedded:', embedded);
  // Auth context for user info
  const { user } = useAuth();
  // Determine if user is admin/superadmin
  const isAdmin = user?.role_name === 'admin' || user?.role_name === 'superadmin' || user?.isSuperAdmin;

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // State for tab management
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
  const [, forceUpdate] = useState(0);

  // Date state for header (default to today)
  const [entryDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  const log = console.log;
  const logError = console.error;

  // Fetch projects with tasks for tracker form from dropdown/get API (fetch only once on mount or user change)
  useEffect(() => {
    const fetchProjectsWithTasks = async () => {
      try {
        setLoadingProjects(true);
        log('[AgentDashboard] Fetching projects with tasks from dropdown/get API');
        
        const payload = {
          dropdown_type: "projects with tasks",
          logged_in_user_id: user?.user_id
        };
        const res = await fetchDropdowns(payload);
        const projectsWithTasks = res.data || []; 
        setProjects(projectsWithTasks);
      } catch (error) {
        logError('[AgentDashboard] Error fetching projects with tasks:', error);
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };
    if (user?.user_id) {
        fetchProjectsWithTasks();
    }
  }, [user?.user_id, log, logError]);

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
    // Only clear selectedTask if it is not in the new task list
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
    
    log('[AgentDashboard] File selected:', fileObj.name);
    setFile(fileObj);
    
    try {
      const base64 = await fileToBase64(fileObj);
      setFileBase64(base64);
      log('[AgentDashboard] File converted to base64');
    } catch (error) {
      logError('[AgentDashboard] Error converting file:', error);
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
    setErrors(validate());
    // eslint-disable-next-line
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
      forceUpdate(n => n + 1);
      
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
        log('[AgentDashboard] Submitting tracker:', payload);
        const res = await addTracker(payload);
        
        if (res.data?.status === 201) {
          log('[AgentDashboard] Tracker added successfully');
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
          logError('[AgentDashboard] Unexpected response:', res.data);
          toast.error(res.data?.message || "Failed to add tracker.");
        }
      } catch (err) {
        logError('[AgentDashboard] Error submitting tracker:', err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to add tracker.");
      } finally {
        setSubmitting(false);
      }
    }, 0);
  };

  // Handle view all data
  const handleViewAll = () => setViewAll(true);
  const handleBackToForm = () => setViewAll(false);

  const content = (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 px-4">
      {/* Navigation Tabs */}
      <AgentTabsNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'overview' && (
        <>
          {viewAll ? (
            <TrackerTable
              userId={isAdmin ? null : user?.user_id}
              isAdmin={isAdmin}
              projects={projects}
              onClose={handleBackToForm}
            />
          ) : (
            <div className="space-y-6 max-w-6xl mx-auto">
              {/* Data Entry Form */}
              <div className="flex flex-col items-center justify-center min-h-[80vh] w-full">
                <div className="w-full max-w-[680px] rounded-t-2xl bg-linear-to-r from-blue-700 via-blue-600 to-blue-500 flex flex-col sm:flex-row items-center justify-between px-7 py-5 mb-0 shadow-xl" style={{ minWidth: 400 }}>
                  <div className="flex items-center gap-3 text-white">
                    <span className="text-3xl">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-plus w-8 h-8" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M8 12h8"></path><path d="M12 8v8"></path></svg>
                    </span>
                    <div>
                      <div className="font-extrabold text-2xl leading-tight tracking-tight drop-shadow">New Production Entry</div>
                      <div className="text-base opacity-90">Log output as <span className="font-bold underline underline-offset-2">{user?.user_name || user?.name || "-"}</span></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-4 sm:mt-0">
                    <span className="text-white text-base font-bold tracking-wide">DATE</span>
                    <input
                      type="text"
                      className="rounded-lg px-3 py-1.5 text-base border-0 focus:ring-2 focus:ring-blue-300 bg-white font-bold shadow"
                      value={entryDate}
                      readOnly
                      style={{ color: '#1e293b', fontWeight: 700, cursor: 'not-allowed', width: '120px', minWidth: '0' }}
                      tabIndex={-1}
                    />
                  </div>
                </div>
                <form
                  className="bg-white rounded-b-2xl shadow-2xl p-8 w-full max-w-[680px] flex flex-col gap-7 border-t-0 border border-blue-100"
                  style={{ minWidth: 400 }}
                  onSubmit={handleSubmit}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col w-full max-w-[260px] mx-auto">
                        <label className="text-base font-bold text-blue-900 flex items-center gap-1 mb-2">
                          Project Name <span className="text-red-500">*</span>
                        </label>
                        <select
                          className="w-full h-10 min-h-10 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-base text-blue-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:font-bold placeholder:text-slate-600 placeholder:text-xs shadow-sm"
                          value={selectedProject}
                          onChange={e => setSelectedProject(e.target.value)}
                          onBlur={() => handleBlur('selectedProject')}
                          disabled={loadingProjects}
                          aria-invalid={!!errors.selectedProject}
                        >
                          <option value="" className="font-bold text-slate-600 text-xs">Select Project</option>
                          {projects.map((p) => (
                            <option key={p.project_id} value={p.project_id} className="font-normal text-slate-700 text-base">{p.project_name}</option>
                          ))}
                        </select>
                        {touched.selectedProject && errors.selectedProject && (
                          <span className="text-xs text-red-600 mt-1">{errors.selectedProject}</span>
                        )}
                      </div>
                      <div className="flex flex-col w-full max-w-[260px] mx-auto">
                        <label className="text-base font-bold text-blue-900 flex items-center gap-1 mb-2">
                          Task Name <span className="text-red-500">*</span>
                        </label>
                        <select
                          className="w-full h-10 min-h-[40px] bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-base text-blue-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:font-bold placeholder:text-slate-600 placeholder:text-xs shadow-sm"
                          value={selectedTask}
                          onChange={e => {
                            const value = String(e.target.value);
                            setSelectedTask(value);
                            // Force base target calculation immediately after task selection
                            setTimeout(() => {
                              const project = projects.find(p => String(p.project_id) === String(selectedProject));
                              const task = project?.tasks?.find(t => String(t.task_id) === String(value));
                              if (task && user?.user_tenure) {
                                setBaseTarget(Number(task.task_target) * Number(user.user_tenure));
                              } else {
                                setBaseTarget("");
                              }
                            }, 0);
                          }}
                          onBlur={() => handleBlur('selectedTask')}
                          disabled={!selectedProject || loadingTasks}
                          aria-invalid={!!errors.selectedTask}
                        >
                          <option value="" className="font-bold text-slate-600 text-xs">Select Task</option>
                          {tasks.map((t) => (
                            <option key={t.task_id} value={t.task_id} className="font-normal text-slate-700 text-base">{t.task_name || t.label}</option>
                          ))}
                        </select>
                        {touched.selectedTask && errors.selectedTask && (
                          <span className="text-xs text-red-600 mt-1">{errors.selectedTask}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col w-full max-w-[260px] mx-auto">
                        <label className="text-base font-bold text-blue-900 flex items-center gap-1 mb-2">
                          Base Target <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-base text-blue-700 font-bold gap-2 min-h-10 h-10 shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-blue-400"><rect width="14" height="10" x="5" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          <span className="text-blue-700 font-bold">{baseTargetLoading ? 'Loading...' : (baseTarget ? baseTarget : '-')}</span>
                        </div>
                        {touched.baseTarget && errors.baseTarget && (
                          <span className="text-xs text-red-600 mt-1">{errors.baseTarget}</span>
                        )}
                      </div>
                      <div className="flex flex-col w-full max-w-[260px] mx-auto">
                        <label className="text-base font-bold text-blue-900 flex items-center gap-1 mb-2">
                          Production Target <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-base text-blue-700 font-bold gap-2 min-h-10 h-10 shadow-sm">
                          <input
                            type="number"
                            min="0"
                            className="bg-transparent outline-none border-none w-full h-full text-blue-700 font-bold text-base px-0 placeholder:font-bold placeholder:text-slate-600 placeholder:text-xs"
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
                    <div className="w-full max-w-xs">
                      <label className="text-base font-bold text-blue-900 flex items-center gap-1 mb-2">Project Files</label>
                      <div
                        className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 min-h-10 h-10 cursor-pointer group shadow-sm"
                        onClick={() => document.getElementById('custom-file-upload').click()}
                        style={{ transition: 'border 0.2s' }}
                      >
                        <div className="flex items-center gap-2 text-blue-600">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-blue-400"><path d="M16 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2"/><rect width="8" height="8" x="14" y="2" rx="2"/><path d="M8 12h4m-2-2v4"/></svg>
                          <span className="font-bold select-none text-sm">{file ? file.name : 'Select project files'}</span>
                        </div>
                        <span className="text-blue-700 font-bold text-sm group-hover:underline select-none">Browse</span>
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
                  <div className="flex gap-4 justify-center mt-6">
                    <button
                      type="submit"
                      className="bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-7 py-2.5 rounded-xl font-extrabold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow"
                      disabled={submitting}
                    >
                      {submitting ? "Submitting..." : "Submit"}
                    </button>
                    <button
                      type="button"
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-7 py-2.5 rounded-xl font-extrabold text-base transition-all flex items-center gap-2 shadow"
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
      )}

      {activeTab === 'billable_report' && <AgentBillableReport />}
    </div>
  );

  return embedded ? content : <div className="w-full relative">{content}</div>;
}

export default AgentDashboardView;
