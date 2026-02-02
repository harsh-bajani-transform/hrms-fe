import React from 'react';

const AgentFilterBar = ({ dateRange, setDateRange }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
      <div className="flex items-center gap-2 text-slate-700 font-semibold">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-funnel w-4 h-4 sm:w-5 sm:h-5 text-blue-600" aria-hidden="true"><path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"></path></svg>
        <span className="text-sm sm:text-base">Organization Analytics</span>
      </div>
      <div className="w-full grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-2 lg:flex lg:flex-row lg:gap-4 lg:w-auto">
        <div className="col-span-2 sm:col-span-1 bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-row items-center gap-3">
          <label className="text-xs text-slate-500 uppercase font-bold">FROM</label>
          <input
            className="flex-1 bg-white border border-slate-300 text-slate-700 text-sm rounded px-2 py-1.5 outline-none"
            type="date"
            name="start"
            value={dateRange.start}
            onChange={handleChange}
          />
        </div>
        <div className="col-span-2 sm:col-span-1 bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-row items-center gap-3">
          <label className="text-xs text-slate-500 uppercase font-bold">TO</label>
          <input
            className="flex-1 bg-white border border-slate-300 text-slate-700 text-sm rounded px-2 py-1.5 outline-none"
            type="date"
            name="end"
            value={dateRange.end}
            onChange={handleChange}
          />
        </div>
        <button
          className="col-span-2 sm:col-span-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg px-4 py-2 transition-colors"
          onClick={() => setDateRange({ start: '', end: '' })}
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default AgentFilterBar;
