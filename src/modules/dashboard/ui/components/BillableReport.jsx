import * as XLSX from 'xlsx';
import { toast } from "react-hot-toast";
import React, { useState, useEffect } from "react";
import { fetchDailyBillableReport, fetchMonthlyBillableReport } from "../../services/billableReportService";
import { Download } from 'lucide-react';

const BillableReport = () => {
  // State for tab toggle
  const [activeToggle, setActiveToggle] = useState('daily');
  // State for date range filter
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // State for API data, loading, and error
  const [dailyData, setDailyData] = useState([]);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [errorDaily, setErrorDaily] = useState(null);

  // State for monthly report API data, loading, and error
  const [monthlySummaryData, setMonthlySummaryData] = useState([]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [errorMonthly, setErrorMonthly] = useState(null);

  // Export to Excel for a single monthly summary row
  const handleExportMonthlyExcelRow = (row) => {
    try {
      const exportData = [{
        'Year & Month': row.month_year,
        'Billable Hours Delivered': Number(row.total_billable_hours || row.total_billable_hours_month || 0).toFixed(2),
        'Monthly Goal': row.monthly_target ?? row.monthly_goal,
        'Pending Target': Number(row.pending_target || 0).toFixed(2),
        'Avg. QC Score': row.avg_qc_score ?? '-',
      }];
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet['!cols'] = [
        { wch: 16 },
        { wch: 24 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, row.month_year);
      const filename = `Monthly_Summary_${row.month_year}.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast.success(`Exported ${row.month_year} summary!`);
    } catch {
      toast.error('Failed to export monthly summary');
    }
  };

  // Fetch daily report data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoadingDaily(true);
      setErrorDaily(null);
      try {
        const payload = {};
        if (startDate) payload.date_from = startDate;
        if (endDate) payload.date_to = endDate;
        const res = await fetchDailyBillableReport(payload);
        setDailyData(Array.isArray(res.data?.trackers) ? res.data.trackers : []);
      } catch {
        setErrorDaily("Failed to fetch daily report data");
      } finally {
        setLoadingDaily(false);
      }
    };
    fetchData();
  }, [startDate, endDate]);

  // Fetch monthly report data from API
  useEffect(() => {
    if (activeToggle !== 'monthly') return;
    const fetchData = async () => {
      setLoadingMonthly(true);
      setErrorMonthly(null);
      try {
        const payload = {};
        const res = await fetchMonthlyBillableReport(payload);
        setMonthlySummaryData(Array.isArray(res.data) ? res.data : []);
      } catch {
        setErrorMonthly("Failed to fetch monthly report data");
      } finally {
        setLoadingMonthly(false);
      }
    };
    fetchData();
  }, [activeToggle]);

  // Export daily data to Excel
  const handleExportDailyExcel = () => {
    try {
      const exportData = dailyData.map(row => ({
        'Date': row.date_time,
        'Assign Hours': row.actual_target ?? '-',
        'Worked Hours': row.billable_hours ?? '-',
        'QC score': row.qc_score ?? '-',
        'Daily Required Hours': row.tenure_target ?? '-',
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet['!cols'] = [
        { wch: 12 },
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
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-700">Date Range:</span>
              <input 
                type="date" 
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
              />
              <span className="text-slate-400">to</span>
              <input 
                type="date" 
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
              />
            </div>
            <button
              onClick={handleExportDailyExcel}
              disabled={dailyData.length === 0 || loadingDaily}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Daily Excel</span>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            {loadingDaily ? (
              <div className="py-20 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-slate-500 font-medium">Loading daily report...</p>
              </div>
            ) : errorDaily ? (
              <div className="py-20 text-center text-rose-600 font-medium">{errorDaily}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 font-bold text-slate-700">Date</th>
                      <th className="px-6 py-4 font-bold text-slate-700 text-center">Assign Hours</th>
                      <th className="px-6 py-4 font-bold text-slate-700 text-center">Worked Hours</th>
                      <th className="px-6 py-4 font-bold text-slate-700 text-center">QC Score</th>
                      <th className="px-6 py-4 font-bold text-slate-700 text-center">Required Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {dailyData.length > 0 ? (
                      dailyData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-slate-600 font-medium">{row.date_time}</td>
                          <td className="px-6 py-4 text-center text-slate-600 font-bold">
                            {row.actual_target ? Number(row.actual_target).toFixed(2) : '-'}
                          </td>
                          <td className="px-6 py-4 text-center text-slate-600 font-bold">
                            {row.billable_hours ? Number(row.billable_hours).toFixed(2) : '-'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                              (row.qc_score >= 90) ? 'bg-emerald-50 text-emerald-700' : 
                              (row.qc_score >= 80) ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {row.qc_score !== null && row.qc_score !== undefined ? `${Number(row.qc_score).toFixed(2)}%` : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-slate-600">
                            {row.tenure_target ? Number(row.tenure_target).toFixed(2) : '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium">No daily data available for this range.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeToggle === 'monthly' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          {loadingMonthly ? (
            <div className="py-20 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-slate-500 font-medium">Loading monthly report...</p>
            </div>
          ) : errorMonthly ? (
            <div className="py-20 text-center text-rose-600 font-medium">{errorMonthly}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 font-bold text-slate-700">Year & Month</th>
                    <th className="px-6 py-4 font-bold text-slate-700 text-center">Delivered Hours</th>
                    <th className="px-6 py-4 font-bold text-slate-700 text-center">Monthly Goal</th>
                    <th className="px-6 py-4 font-bold text-slate-700 text-center">Pending Target</th>
                    <th className="px-6 py-4 font-bold text-slate-700 text-center">Avg. QC Score</th>
                    <th className="px-6 py-4 font-bold text-slate-700 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {monthlySummaryData.length > 0 ? (
                    monthlySummaryData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-slate-600 font-medium">{row.month_year}</td>
                        <td className="px-6 py-4 text-center text-slate-600 font-bold">
                          {Number(row.total_billable_hours || row.total_billable_hours_month || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center text-slate-600">
                          {row.monthly_target ?? row.monthly_goal}
                        </td>
                        <td className="px-6 py-4 text-center text-slate-600">
                          {Number(row.pending_target || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className="font-bold text-blue-600">{row.avg_qc_score ?? '-'}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleExportMonthlyExcelRow(row)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold transition-all border border-emerald-100 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Excel</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-medium">No monthly data available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BillableReport;
