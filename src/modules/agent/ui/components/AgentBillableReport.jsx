import * as XLSX from 'xlsx';
import { toast } from "react-hot-toast";
import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);
import { fetchDailyBillableReport, fetchMonthlyBillableReport } from "../../../dashboard/services/billableReportService";
import { useAuth } from "../../../../context/AuthContext";

const AgentBillableReport = () => {
  // Export the visible monthly report table (with filters applied)
  const handleExportMonthlyTable = () => {
    try {
      const exportData = monthlySummaryData.map(row => ({
        'Year & Month': row.month_year,
        'Billable Hours Delivered': row.total_billable_hours
          ? Number(row.total_billable_hours).toFixed(2)
          : (row.total_billable_hours_month
            ? Number(row.total_billable_hours_month).toFixed(2)
            : '-'),
        'Monthly Goal': row.monthly_target ?? row.monthly_goal,
        'Pending Target': row.pending_target ? Number(row.pending_target).toFixed(2) : '-',
        'Avg. QC Score': row.avg_qc_score ?? '-',
      }));

      // Calculate totals
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
      worksheet['!cols'] = [
        { wch: 16 },
        { wch: 24 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Report');
      const filename = `Monthly_Report.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast.success('Monthly report exported!');
    } catch {
      toast.error('Failed to export monthly report');
    }
  };

  // Export daily report for a specific month-year from /tracker/view
  const handleExportMonthDailyExcel = async (monthYear) => {
    try {
      // Use fetchDailyBillableReport to ensure correct payload (logged_in_user_id, month_year)
      const payload = { month_year: monthYear };
      const res = await fetchDailyBillableReport(payload);
      const trackers = Array.isArray(res.data?.trackers) ? res.data.trackers : [];
      // Format and prepare export data
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
      // Calculate totals for countable columns
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
      worksheet['!cols'] = [
        { wch: 20 },
        { wch: 14 },
        { wch: 14 },
        { wch: 10 },
        { wch: 20 },
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Month Daily Report');
      const filename = `Month_Daily_Report_${monthYear}.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast.success('Month daily report exported!');
    } catch {
      toast.error('Failed to export month daily report');
    }
  };

  // State for tab toggle (must be first hook)
  const [activeToggle, setActiveToggle] = useState(() => {
    // Try to get from localStorage, fallback to 'daily'
    if (typeof window !== 'undefined') {
      return localStorage.getItem('agent_billable_active_tab') || 'daily';
    }
    return 'daily';
  });

  // Persist tab selection to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('agent_billable_active_tab', activeToggle);
    }
  }, [activeToggle]);

  // State for date range filter
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  // State for month filter
  const [monthFilter, setMonthFilter] = useState('');

  // State for API data, loading, and error
  const [dailyData, setDailyData] = useState([]);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [errorDaily, setErrorDaily] = useState(null);

  // Fetch daily report data from API on mount or when date range/month changes
  useEffect(() => {
    const fetchData = async () => {
      setLoadingDaily(true);
      setErrorDaily(null);
      try {
        const payload = {};
        if (monthFilter) {
          // Use 'month_year' in the format 'JAN2026' for the API if a month is selected
          const [year, month] = monthFilter.split('-');
          const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
          const monthLabel = monthNames[Number(month) - 1];
          payload.month_year = `${monthLabel}${year}`;
        } else {
          if (startDate) payload.date_from = startDate;
          if (endDate) payload.date_to = endDate;
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
  }, [startDate, endDate, monthFilter]);

  // State for monthly report API data, loading, and error
  const [monthlySummaryData, setMonthlySummaryData] = useState([]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [errorMonthly, setErrorMonthly] = useState(null);
  const [monthlyMonth, setMonthlyMonth] = useState("");
  const { user } = useAuth();

  // Fetch monthly report data from API when monthly tab is active or month filter changes
  useEffect(() => {
    if (activeToggle !== 'monthly') return;
    const fetchData = async () => {
      setLoadingMonthly(true);
      setErrorMonthly(null);
      try {
        let payload = {};
        if (monthlyMonth) {
          // monthlyMonth is in format YYYY-MM
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

  // No need to filter here, as API returns filtered data
  const filteredDailyData = dailyData;

  // Export filtered daily data to Excel with totals
  const handleExportDailyExcel = () => {
    try {
      // Format and prepare export data
      const exportData = filteredDailyData.map(row => {
        // Format date-time as dd-mm-yyyy hh:mm am/pm
        let formattedDateTime = '';
        if (row.date_time) {
          const d = dayjs(row.date_time);
          formattedDateTime = d.isValid() ? d.format('DD-MM-YYYY hh:mm A') : row.date_time;
        }
        return {
          'Date-Time': formattedDateTime,
          'Assign Hours': '-',
          'Worked Hours': Number(row.billable_hours ?? row.workedHours ?? row.worked_hours) || 0,
          'QC score': row.qc_score !== undefined && row.qc_score !== null ? Number(row.qc_score) : (row.qcScore ?? '-'),
          'Daily Required Hours': Number(row.tenure_target ?? row.dailyRequiredHours ?? row.daily_required_hours) || 0,
        };
      });

      // Calculate totals for countable columns
      const totalAssign = exportData.reduce((sum, r) => sum + (Number(r['Assign Hours']) || 0), 0);
      const totalWorked = exportData.reduce((sum, r) => sum + (Number(r['Worked Hours']) || 0), 0);
      const totalRequired = exportData.reduce((sum, r) => sum + (Number(r['Daily Required Hours']) || 0), 0);
      // For QC score, show average if all are numbers
      const qcScores = exportData.map(r => Number(r['QC score'])).filter(v => !isNaN(v));
      const avgQC = qcScores.length > 0 ? (qcScores.reduce((a, b) => a + b, 0) / qcScores.length).toFixed(2) : '-';

      // Add totals row
      exportData.push({
        'Date-Time': 'TOTAL',
        'Assign Hours': totalAssign,
        'Worked Hours': totalWorked,
        'QC score': avgQC,
        'Daily Required Hours': totalRequired,
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet['!cols'] = [
        { wch: 20 },
        { wch: 14 },
        { wch: 14 },
        { wch: 10 },
        { wch: 20 },
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Report');
      const filename = `Daily_Report_${startDate || 'all'}_${endDate || 'all'}.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast.success('Daily report exported!');
    } catch {
      toast.error('Failed to export daily report');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-2 sm:px-4">
      <div className="w-full flex flex-col items-center">
        <div className="w-full max-w-7xl flex items-center gap-4 mb-8">
          <button
            className={`px-6 py-2 rounded-lg font-semibold text-blue-700 border-2 border-blue-700 transition-all duration-150 focus:outline-none ${activeToggle === 'daily' ? 'bg-blue-700 text-white' : 'bg-white'}`}
            onClick={() => setActiveToggle('daily')}
          >
            Daily Report
          </button>
          <button
            className={`px-6 py-2 rounded-lg font-semibold text-blue-700 border-2 border-blue-700 transition-all duration-150 focus:outline-none ${activeToggle === 'monthly' ? 'bg-blue-700 text-white' : 'bg-white'}`}
            onClick={() => setActiveToggle('monthly')}
          >
            Monthly Report
          </button>
        </div>
      </div>
      {/* Daily Report view (table, filter, export) */}
      {activeToggle === 'daily' && (
        <div className="w-full max-w-5xl mx-auto mt-8">
          {/* Date Range Filter and Export Button */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <label className="font-semibold text-blue-700">Date Range:</label>
              <input type="date" className="border rounded px-2 py-1" value={startDate} onChange={e => setStartDate(e.target.value)} />
              <span className="mx-2">to</span>
              <input type="date" className="border rounded px-2 py-1" value={endDate} onChange={e => setEndDate(e.target.value)} />
              <label className="font-semibold text-blue-700 ml-4">Month:</label>
              <input
                type="month"
                className="border rounded px-2 py-1"
                value={monthFilter}
                onChange={e => setMonthFilter(e.target.value)}
                style={{ minWidth: 120 }}
              />
              {/* Clear Filters Button */}
              <button
                className="ml-4 px-3 py-1 rounded bg-gray-300 hover:bg-gray-400 text-gray-800 text-xs font-semibold border border-gray-400 shadow-sm transition"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setMonthFilter('');
                }}
                type="button"
              >
                Clear Filters
              </button>
            </div>
            <button
              onClick={handleExportDailyExcel}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-sm border border-green-700 shadow-sm transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              title="Export filtered data to Excel"
              aria-label="Export to Excel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M16 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="8 12 12 16 16 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="8" x2="12" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span>Export to Excel</span>
            </button>
          </div>
          {/* Daily Report Table */}
          <div className="overflow-x-auto bg-white rounded-2xl">
            {loadingDaily ? (
              <div className="py-8 text-center text-blue-700 font-semibold">Loading daily report...</div>
            ) : errorDaily ? (
              <div className="py-8 text-center text-red-600 font-semibold">{errorDaily}</div>
            ) : (
              <table className="min-w-full divide-y divide-blue-100 text-sm">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="px-6 py-3 text-left font-semibold text-blue-700 uppercase tracking-wider">Date-Time</th>
                    <th className="px-6 py-3 text-center font-semibold text-blue-700 uppercase tracking-wider">Assign Hours</th>
                    <th className="px-6 py-3 text-center font-semibold text-blue-700 uppercase tracking-wider">Worked Hours</th>
                    <th className="px-6 py-3 text-center font-semibold text-blue-700 uppercase tracking-wider">QC score</th>
                    <th className="px-6 py-3 text-center font-semibold text-blue-700 uppercase tracking-wider">Daily Required Hours</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-blue-50">
                  {filteredDailyData.length > 0 ? (
                    filteredDailyData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-blue-50 transition group">
                        <td className="px-6 py-3 text-black font-medium whitespace-nowrap">{
                          row.date_time ? dayjs(row.date_time).format('DD-MM-YYYY hh:mm A') : '-'
                        }</td>
                        <td className="px-6 py-3 text-center text-black">-</td>
                        <td className="px-6 py-3 text-center text-black">{row.billable_hours ? Number(row.billable_hours).toFixed(2) : '-'}</td>
                        <td className="px-6 py-3 text-center text-black">{'qc_score' in row ? (row.qc_score !== null ? Number(row.qc_score).toFixed(2) : '-') : '-'}</td>
                        <td className="px-6 py-3 text-center text-black">{row.tenure_target ? Number(row.tenure_target).toFixed(2) : '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-3 text-center text-gray-400">No data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Monthly Report view (summary table, per-row export) */}
      {activeToggle === 'monthly' && (
        <div className="w-full max-w-7xl mx-auto mt-4">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <label className="font-semibold text-blue-700">Month:</label>
            <input
              type="month"
              className="border border-blue-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-500 bg-white shadow-sm transition"
              value={monthlyMonth}
              onChange={e => setMonthlyMonth(e.target.value)}
              style={{ minWidth: 120 }}
            />
            {/* Clear Filters Button */}
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
              className="px-3 py-1 rounded bg-linear-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white text-xs font-semibold border border-green-700 shadow-sm transition mr-2"
            >
              Export Month
            </button>
          </div>
          <div className="p-6 overflow-x-auto bg-white rounded-2xl shadow-lg w-full">
            {loadingMonthly ? (
              <div className="py-8 text-center text-blue-700 font-semibold">Loading monthly report...</div>
            ) : errorMonthly ? (
              <div className="py-8 text-center text-red-600 font-semibold">{errorMonthly}</div>
            ) : (
              <table className="min-w-full divide-y divide-blue-100 text-sm">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="px-6 py-3 text-left font-semibold text-blue-700 uppercase tracking-wider">Year & Month</th>
                    <th className="px-6 py-3 text-center font-semibold text-blue-700 uppercase tracking-wider">Billable Hours Delivered</th>
                    <th className="px-6 py-3 text-center font-semibold text-blue-700 uppercase tracking-wider">Monthly Goal</th>
                    <th className="px-6 py-3 text-center font-semibold text-blue-700 uppercase tracking-wider">Pending Target</th>
                    <th className="px-6 py-3 text-center font-semibold text-blue-700 uppercase tracking-wider">Avg. QC Score</th>
                    <th className="px-6 py-3 text-center font-semibold text-blue-700 uppercase tracking-wider">Export</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-blue-50">
                  {monthlySummaryData.length > 0 ? (
                    monthlySummaryData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-blue-50 transition group">
                        <td className="px-6 py-3 text-black font-medium whitespace-nowrap">{row.month_year}</td>
                        <td className="px-6 py-3 text-center text-black">{row.total_billable_hours ? Number(row.total_billable_hours).toFixed(2) : (row.total_billable_hours_month ? Number(row.total_billable_hours_month).toFixed(2) : '-')}</td>
                        <td className="px-6 py-3 text-center text-black">{row.monthly_target ?? row.monthly_goal}</td>
                        <td className="px-6 py-3 text-center text-black">{row.pending_target ? Number(row.pending_target).toFixed(2) : '-'}</td>
                        <td className="px-6 py-3 text-center text-black">{row.avg_qc_score ?? '-'}</td>
                        <td className="px-6 py-3 text-center">
                          <button
                            onClick={() => handleExportMonthDailyExcel(row.month_year)}
                            className="flex items-center gap-2 px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white text-xs font-semibold border border-green-700 shadow-sm transition"
                            title={`Export daily report for ${row.month_year}`}
                            aria-label={`Export daily report for ${row.month_year}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M16 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="8 12 12 16 16 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="8" x2="12" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            <span>Excel</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-3 text-center text-gray-400">No data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentBillableReport;
