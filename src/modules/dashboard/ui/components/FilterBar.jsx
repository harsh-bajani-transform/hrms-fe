import React from 'react';
import { Filter, Clock, Activity } from 'lucide-react';
import CustomSelect from '../../../../components/common/CustomSelect';

const FilterBar = ({
  isAgent,
  isQA,
  selectedTask,
  setSelectedTask,
  comparisonMode,
  setComparisonMode,
  dateRange,
  handleDateRangeChange,
  allTasks = []
}) => {
  return (
    <div
      className="
        bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-100
        flex flex-col gap-4
        lg:flex-row lg:items-center lg:justify-between
      "
    >
      {/* TITLE */}
      <div className="flex items-center gap-2 text-slate-700 font-semibold">
        <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
        <span className="text-sm sm:text-base">
          {isAgent ? "My Analytics" : "Organization Analytics"}
        </span>
      </div>

      {/* FILTER AREA */}
      <div
        className="
          w-full
          grid grid-cols-2 gap-3
          sm:grid-cols-2 sm:gap-4
          md:grid-cols-2
          lg:flex lg:flex-row lg:gap-4 lg:w-auto
        "
      >

        {/* TASK - Hidden for agents and QA */}
        {!isAgent && !isQA && (
          <CustomSelect
            value={selectedTask}
            onChange={setSelectedTask}
            options={[
              { value: 'All', label: 'All Tasks' },
              ...allTasks.map(task => ({ value: task, label: task }))
            ]}
            icon={Clock}
            placeholder="Select Task"
          />
        )}

        {/* PREV PERIOD - Hidden for agents and QA */}
        {!isAgent && !isQA && (
          <CustomSelect
            value={comparisonMode}
            onChange={setComparisonMode}
            options={[
              { value: 'previous_period', label: 'Prev Period' },
              { value: 'prev_week', label: 'Last Week' },
              { value: 'prev_month', label: 'Last Month' }
            ]}
            icon={Activity}
            placeholder="Select Period"
          />
        )}

        {/* FROM DATE */}
        <div
          className="
            col-span-2 sm:col-span-1
            bg-slate-50 p-3 rounded-lg border border-slate-200
            flex flex-row items-center gap-3
          "
        >
          <label className="text-xs text-slate-500 uppercase font-bold">FROM</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => handleDateRangeChange('start', e.target.value)}
            className="flex-1 bg-white border border-slate-300 text-slate-700 text-sm rounded px-2 py-1.5 outline-none"
          />
        </div>

        {/* TO DATE */}
        <div
          className="
            col-span-2 sm:col-span-1
            bg-slate-50 p-3 rounded-lg border border-slate-200
            flex flex-row items-center gap-3
          "  
        >
          <label className="text-xs text-slate-500 uppercase font-bold">TO</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => handleDateRangeChange('end', e.target.value)}
            className="flex-1 bg-white border border-slate-300 text-slate-700 text-sm rounded px-2 py-1.5 outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
