import * as XLSX from 'xlsx';
import { toast } from "react-hot-toast";
import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);
import { fetchDailyBillableReport, fetchMonthlyBillableReport } from "../../services/billableReportService";
import { fetchDropdown } from "../../../../services/dropdownService";
import { useAuth } from "../../../../context/AuthContext";
import MonthCard from "./MonthCard";
import UserCard from "./UserCard";
import CustomSelect from "./CustomSelect";

const BillableReport = () => {
  const { user } = useAuth();
  const isAgent = user?.role_id === 6 || user?.role_name === 'agent';

  // State for tab toggle with localStorage persistence
  const [activeToggle, setActiveToggle] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('billable_active_tab') || 'daily';
    }
    return 'daily';
  });

  // Persist tab selection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('billable_active_tab', activeToggle);
    }
  }, [activeToggle]);

  // State for date range filter
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [monthFilter, setMonthFilter] = useState('');

  // State for team filter (for non-agents)
  const [teamFilter, setTeamFilter] = useState('');
  const [teamOptions, setTeamOptions] = useState([]);

  // State for API data, loading, and error
  const [dailyData, setDailyData] = useState([]);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [errorDaily, setErrorDaily] = useState(null);

  // State for monthly report API data, loading, and error
  const [monthlySummaryData, setMonthlySummaryData] = useState([]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [errorMonthly, setErrorMonthly] = useState(null);
  const [monthlyMonth, setMonthlyMonth] = useState("");

  // Fetch team options for dropdown (only for non-agents)
  useEffect(() => {
    if (isAgent) return;
    const fetchTeams = async () => {
      try {
        const teams = await fetchDropdown("teams");
        setTeamOptions(teams || []);
      } catch (err) {
        console.error("Failed to fetch teams:", err);
      }
    };
    fetchTeams();
  }, [isAgent]);

  // Fetch daily report data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoadingDaily(true);
      setErrorDaily(null);
      try {
        const payload = {};
        if (monthFilter) {
          const [year, month] = monthFilter.split('-');
          const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
          const monthLabel = monthNames[Number(month) - 1];
          payload.month_year = `${monthLabel}${year}`;
        } else {
          if (startDate) payload.date_from = startDate;
          if (endDate) payload.date_to = endDate;
        }
        if (user?.user_id) {
          payload.logged_in_user_id = user.user_id;
        }
        const res = await fetchDailyBillableReport(payload);
        setDailyData(Array.isArray(res.data?.trackers) ? res.data.trackers : []);
      } catch {
        setErrorDaily("Failed to fetch daily report data");
      } finally {
        setLoadingDaily(false);
      }
    };
    fetchData();
  }, [startDate, endDate, monthFilter, user]);

  // Fetch monthly report data from API
  useEffect(() => {
    if (activeToggle !== 'monthly') return;
    const fetchData = async () => {
      setLoadingMonthly(true);
      setErrorMonthly(null);
      try {
        let payload = {};
        if (monthlyMonth) {
          const [year, month] = monthlyMonth.split('-');
          const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
          const monthLabel = monthNames[Number(month) - 1];
          payload = { month_year: `${monthLabel}${year}` };
        }
        if (user?.user_id) {
          payload.logged_in_user_id = user.user_id;
        }
        const res = await fetchMonthlyBillableReport(payload);
        setMonthlySummaryData(Array.isArray(res.data) ? res.data : []);
      } catch {
        setErrorMonthly("Failed to fetch monthly report data");
      } finally {
        setLoadingMonthly(false);
      }
    };
    fetchData();
  }, [activeToggle, monthlyMonth, user]);

  // Helper: Group monthly data by month-year
  const groupByMonthYear = (data) => {
    const grouped = {};
    data.forEach(item => {
      const key = item.month_year;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });
    return grouped;
  };

  // Helper: Parse month-year string to get label and year
  const parseMonthYear = (monthYear) => {
    const monthMap = {
      JAN: 'January', FEB: 'February', MAR: 'March', APR: 'April',
      MAY: 'May', JUN: 'June', JUL: 'July', AUG: 'August',
      SEP: 'September', OCT: 'October', NOV: 'November', DEC: 'December'
    };
    const monthPart = monthYear.slice(0, 3);
    const yearPart = monthYear.slice(3);
    return { label: monthMap[monthPart] || monthPart, year: yearPart };
  };

  // Export daily data for a specific user
  const handleExportUserDaily = async (userObj) => {
    try {
      const payload = { user_id: userObj.user_id };
      if (monthFilter) {
        const [year, month] = monthFilter.split('-');
        const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const monthLabel = monthNames[Number(month) - 1];
        payload.month_year = `${monthLabel}${year}`;
      }
      const res = await fetchDailyBillableReport(payload);
      const trackers = Array.isArray(res.data?.trackers) ? res.data.trackers : [];
      
      const exportData = trackers.map(row => {
        let formattedDateTime = '';
        if (row.date_time) {
          const d = dayjs(row.date_time);
          formattedDateTime = d.isValid() ? d.format('DD-MM-YYYY hh:mm A') : row.date_time;
        }
        return {
          'Date-Time': formattedDateTime,
          'Assign Hours': '-',
          'Worked Hours': row.billable_hours ? Number(row.billable_hours).toFixed(2) : '-',
          'QC score': 'qc_score' in row ? (row.qc_score !== null ? Number(row.qc_score).toFixed(2) : '-') : '-',
          'Daily Required Hours': row.tenure_target ? Number(row.tenure_target).toFixed(2) : '-',
        };
      });

      const totalWorked = exportData.reduce((sum, r) => sum + (Number(r['Worked Hours']) || 0), 0);
      const totalRequired = exportData.reduce((sum, r) => sum + (Number(r['Daily Required Hours']) || 0), 0);
      const qcScores = exportData.map(r => Number(r['QC score'])).filter(v => !isNaN(v));
      const avgQC = qcScores.length > 0 ? (qcScores.reduce((a, b) => a + b, 0) / qcScores.length).toFixed(2) : '-';

      exportData.push({
        'Date-Time': 'TOTAL',
        'Assign Hours': '-',
        'Worked Hours': totalWorked,
        'QC score': avgQC,
        'Daily Required Hours': totalRequired,
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 20 }];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'User Daily Report');
      const filename = `User_Daily_Report_${userObj.user_name}.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast.success('User daily report exported!');
    } catch {
      toast.error('Failed to export user daily report');
    }
  };

  // Export entire month data for a specific month
  const handleExportMonthData = async (monthObj, users) => {
    try {
      const exportData = users.map(u => ({
        'User Name / Team': `${u.user_name}${u.team_name ? ` / ${u.team_name}` : ''}`,
        'Billable Hour Delivered': u.total_billable_hours ? Number(u.total_billable_hours).toFixed(2) : '-',
        'Monthly Goal': u.monthly_target ?? '-',
        'Pending Target': u.pending_target ? Number(u.pending_target).toFixed(2) : '-',
        'Avg. QC Score': u.avg_qc_score ? Number(u.avg_qc_score).toFixed(2) : '-',
      }));

      const totalBillable = exportData.reduce((sum, r) => sum + (Number(r['Billable Hour Delivered']) || 0), 0);
      const totalGoal = exportData.reduce((sum, r) => sum + (Number(r['Monthly Goal']) || 0), 0);
      const totalPending = exportData.reduce((sum, r) => sum + (Number(r['Pending Target']) || 0), 0);
      const qcScores = exportData.map(r => Number(r['Avg. QC Score'])).filter(v => !isNaN(v));
      const avgQC = qcScores.length > 0 ? (qcScores.reduce((a, b) => a + b, 0) / qcScores.length).toFixed(2) : '-';

      exportData.push({
        'User Name / Team': 'TOTAL',
        'Billable Hour Delivered': totalBillable,
        'Monthly Goal': totalGoal,
        'Pending Target': totalPending,
        'Avg. QC Score': avgQC,
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet['!cols'] = [{ wch: 24 }, { wch: 24 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Month Report');
      const filename = `Month_Report_${monthObj.label}_${monthObj.year}.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast.success('Month report exported!');
    } catch {
      toast.error('Failed to export month report');
    }
  };

  // Export the entire monthly summary table
  const handleExportMonthlyTable = () => {
    try {
      const exportData = monthlySummaryData.map(row => ({
        'Year & Month': row.month_year,
        'Billable Hours Delivered': row.total_billable_hours
          ? Number(row.total_billable_hours).toFixed(2)
          : (row.total_billable_hours_month ? Number(row.total_billable_hours_month).toFixed(2) : '-'),
        'Monthly Goal': row.monthly_target ?? row.monthly_goal,
        'Pending Target': row.pending_target ? Number(row.pending_target).toFixed(2) : '-',
        'Avg. QC Score': row.avg_qc_score ?? '-',
      }));

      const totalBillable = exportData.reduce((sum, r) => sum + (Number(r['Billable Hours Delivered']) || 0), 0);
      const totalGoal = exportData.reduce((sum, r) => sum + (Number(r['Monthly Goal']) || 0), 0);
      const totalPending = exportData.reduce((sum, r) => sum + (Number(r['Pending Target']) || 0), 0);
      const qcScores = exportData.map(r => Number(r['Avg. QC Score'])).filter(v => !isNaN(v));
      const avgQC = qcScores.length > 0 ? (qcScores.reduce((a, b) => a + b, 0) / qcScores.length).toFixed(2) : '-';

      exportData.push({
        'Year & Month': 'TOTAL',
        'Billable Hours Delivered': totalBillable,
        'Monthly Goal': totalGoal,
        'Pending Target': totalPending,
        'Avg. QC Score': avgQC,
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet['!cols'] = [{ wch: 16 }, { wch: 24 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Report');
      const filename = `Monthly_Report.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast.success('Monthly report exported!');
    } catch {
      toast.error('Failed to export monthly report');
    }
  };

  // Filter daily data by team (for non-agents)
  const filteredDailyData = !isAgent && teamFilter
    ? dailyData.filter(item => item.team_name === teamFilter)
    : dailyData;

  // Group monthly data by month-year
  const groupedMonthly = groupByMonthYear(monthlySummaryData);

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <button
          className={`px-6 py-2 rounded-lg font-semibold transition-all duration-150 cursor-pointer ${
            activeToggle === 'daily' 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'
          }`}
          onClick={() => setActiveToggle('daily')}
        >
          Daily Report
        </button>
        <button
          className={`px-6 py-2 rounded-lg font-semibold transition-all duration-150 cursor-pointer ${
            activeToggle === 'monthly' 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'
          }`}
          onClick={() => setActiveToggle('monthly')}
        >
          Monthly Report
        </button>
      </div>

      {activeToggle === 'daily' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-100">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-slate-700">Date Range:</span>
              <input 
                type="date" 
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-500 bg-white shadow-sm transition"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
              <span className="text-slate-500">to</span>
              <input 
                type="date" 
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-500 bg-white shadow-sm transition"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
              <span className="text-sm font-semibold text-slate-700 ml-4">Month:</span>
              <input
                type="month"
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-500 bg-white shadow-sm transition"
                value={monthFilter}
                onChange={e => setMonthFilter(e.target.value)}
                style={{ minWidth: 120 }}
              />
              {!isAgent && (
                <>
                  <span className="text-sm font-semibold text-slate-700 ml-4">Team:</span>
                  <CustomSelect
                    value={teamFilter}
                    onChange={setTeamFilter}
                    options={[{ label: "All Teams", value: "" }, ...teamOptions.map(t => ({ label: t.label, value: t.label }))]}
                    placeholder="Select Team"
                    className="w-48"
                  />
                </>
              )}
              <button
                className="px-3 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm font-semibold border border-gray-400 shadow-sm transition"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setMonthFilter('');
                  setTeamFilter('');
                }}
                type="button"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {loadingDaily ? (
            <div className="py-12 text-center text-blue-700 font-semibold">Loading daily report...</div>
          ) : errorDaily ? (
            <div className="py-12 text-center text-red-600 font-semibold">{errorDaily}</div>
          ) : filteredDailyData.length > 0 ? (
            <div className="space-y-4">
              {/* Group by user if not agent */}
              {!isAgent ? (
                (() => {
                  const userMap = {};
                  filteredDailyData.forEach(item => {
                    const userId = item.user_id;
                    if (!userMap[userId]) {
                      userMap[userId] = {
                        user_id: userId,
                        user_name: item.user_name,
                        team_name: item.team_name,
                        dailyData: []
                      };
                    }
                    userMap[userId].dailyData.push(item);
                  });
                  return Object.values(userMap).map(userObj => (
                    <UserCard
                      key={userObj.user_id}
                      user={userObj}
                      dailyData={userObj.dailyData}
                      defaultCollapsed={true}
                      onExport={() => handleExportUserDaily(userObj)}
                    />
                  ));
                })()
              ) : (
                <UserCard
                  user={{ user_name: user?.user_name, team_name: user?.team_name }}
                  dailyData={filteredDailyData}
                  defaultCollapsed={false}
                />
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400">No data available</div>
          )}
        </div>
      )}

      {activeToggle === 'monthly' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <label className="font-semibold text-blue-700">Month:</label>
            <input
              type="month"
              className="border border-blue-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-500 bg-white shadow-sm transition"
              value={monthlyMonth}
              onChange={e => setMonthlyMonth(e.target.value)}
              style={{ minWidth: 120 }}
            />
            <button
              className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400 text-gray-800 text-xs font-semibold border border-gray-400 shadow-sm transition"
              onClick={() => setMonthlyMonth("")}
              type="button"
            >
              Clear Filters
            </button>
            <div className="flex-1" />
            <button
              onClick={handleExportMonthlyTable}
              className="px-3 py-1 rounded bg-linear-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white text-xs font-semibold border border-green-700 shadow-sm transition"
            >
              Export All
            </button>
          </div>

          {loadingMonthly ? (
            <div className="py-12 text-center text-blue-700 font-semibold">Loading monthly report...</div>
          ) : errorMonthly ? (
            <div className="py-12 text-center text-red-600 font-semibold">{errorMonthly}</div>
          ) : Object.keys(groupedMonthly).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(groupedMonthly).map(([monthYear, users]) => {
                const monthObj = parseMonthYear(monthYear);
                return (
                  <MonthCard
                    key={monthYear}
                    month={monthObj}
                    users={users}
                    onExport={handleExportUserDaily}
                    onExportMonth={handleExportMonthData}
                    teamOptions={teamOptions}
                  />
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400">No data available</div>
          )}
        </div>
      )}
    </div>
  );
};

export default BillableReport;
