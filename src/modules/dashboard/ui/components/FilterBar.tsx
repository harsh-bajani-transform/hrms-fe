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
          <Select value={selectedTask} onValueChange={setSelectedTask}>
            <SelectTrigger className="h-9 w-full lg:w-[180px]">
              <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Select Task" />
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
        )}

        {/* PREV PERIOD - Hidden for agents and QA */}
        {!isAgent && !isQA && (
          <Select value={comparisonMode} onValueChange={setComparisonMode}>
            <SelectTrigger className="h-9 w-full lg:w-[180px]">
              <Activity className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="previous_period">Prev Period</SelectItem>
              <SelectItem value="prev_week">Last Week</SelectItem>
              <SelectItem value="prev_month">Last Month</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* FROM DATE */}
        <div
          className="
            col-span-2 sm:col-span-1
            bg-slate-50 p-3 rounded-lg border border-slate-200
            flex flex-row items-center gap-3
          "
        >
          <label className="text-xs text-slate-500 uppercase font-bold">
            FROM
          </label>
          <Input
            type="date"
            value={dateRange.start}
            onChange={(e) => handleDateRangeChange("start", e.target.value)}
            className="flex-1 h-8 bg-white"
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
          <label className="text-xs text-slate-500 uppercase font-bold">
            TO
          </label>
          <Input
            type="date"
            value={dateRange.end}
            onChange={(e) => handleDateRangeChange("end", e.target.value)}
            className="flex-1 h-8 bg-white"
          />
          {(dateRange.start || dateRange.end) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                handleDateRangeChange("start", "");
                handleDateRangeChange("end", "");
              }}
              title="Clear date filter"
            >
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
