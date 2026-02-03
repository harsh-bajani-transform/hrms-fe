import { Filter, Clock, Activity } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { DateRange } from "../../types";

export interface FilterBarProps {
  isAgent: boolean;
  isQA?: boolean;

  selectedTask: string;
  setSelectedTask: (value: string) => void;

  comparisonMode: string;
  setComparisonMode: (value: string) => void;

  dateRange: DateRange;
  handleDateRangeChange: (field: keyof DateRange, value: string) => void;

  allTasks?: string[];
}

const FilterBar = ({
  isAgent,
  isQA,
  selectedTask,
  setSelectedTask,
  comparisonMode,
  setComparisonMode,
  dateRange,
  handleDateRangeChange,
  allTasks = [],
}: FilterBarProps) => {
  return (
    <div
      className="
        bg-white p-4 sm:p-6 rounded-xl shadow-md border border-slate-200
        flex flex-col gap-6
        lg:flex-row lg:items-center lg:justify-between
        transition-shadow hover:shadow-lg
      "
    >
      {/* TITLE */}
      <div className="flex items-center gap-3 text-gray-900">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Filter className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-semibold">
            {isAgent ? "My Analytics" : "Organization Analytics"}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Filter and analyze data</p>
        </div>
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
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600 ml-1">Task Type</label>
            <Select value={selectedTask} onValueChange={setSelectedTask}>
              <SelectTrigger className="h-11 w-full lg:w-50 bg-white border-gray-300">
                <Clock className="w-4 h-4 mr-2 text-gray-500" />
                <SelectValue placeholder="All Tasks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Tasks</SelectItem>
                {allTasks.map((task) => (
                  <SelectItem key={task} value={task}>
                    {task}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* PREV PERIOD - Hidden for agents and QA */}
        {!isAgent && !isQA && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600 ml-1">Comparison</label>
            <Select value={comparisonMode} onValueChange={setComparisonMode}>
              <SelectTrigger className="h-11 w-full lg:w-50 bg-white border-gray-300">
                <Activity className="w-4 h-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Select Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="previous_period">Previous Period</SelectItem>
                <SelectItem value="prev_week">Last Week</SelectItem>
                <SelectItem value="prev_month">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* FROM DATE */}
        <div className="col-span-2 sm:col-span-1 space-y-1.5">
          <label className="text-xs font-medium text-gray-600 ml-1">
            From Date
          </label>
          <Input
            type="date"
            value={dateRange.start}
            onChange={(e) => handleDateRangeChange("start", e.target.value)}
            className=" bg-white border-gray-300"
          />
        </div>

        {/* TO DATE */}
        <div className="col-span-2 sm:col-span-1 space-y-1.5">
          <label className="text-xs font-medium text-gray-600 ml-1">
            To Date
          </label>
          <div className="flex gap-2">
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => handleDateRangeChange("end", e.target.value)}
              className="bg-white border-gray-300 flex-1"
            />
            {(dateRange.start || dateRange.end) && (
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={() => {
                  handleDateRangeChange("start", "");
                  handleDateRangeChange("end", "");
                }}
                className="h-11 px-4 border-gray-300 hover:bg-gray-50"
                title="Clear date filter"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
