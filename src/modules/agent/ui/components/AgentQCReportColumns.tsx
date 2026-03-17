import dayjs from "dayjs";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";

export interface QCRecord {
  qc_id: number | string;
  tracker_id: number | string;
  evaluation_datetime: string;
  qa_agent: string;
  project_task: string;
  project_name: string;
  task_name: string;
  file_name: string;
  total_records: number;
  error_list: any;
  status: string;
  qc_score: number | string;
  rework_file_path?: string;
}

const columnHelper = createColumnHelper<QCRecord>();

export function createQCReportColumns(
  handleOpenReworkModal: (
    errorList: any,
    recordInfo: {
      qaAgent: string;
      projectTask: string;
      evalDate: string;
      trackerId: string | number;
    },
    status: string,
    qcId: string | number,
    trackerId: string | number,
  ) => void,
  reworkFiles: Record<string, string>,
): ColumnDef<QCRecord, unknown>[] {
  return [
    columnHelper.accessor("evaluation_datetime", {
      id: "evaluation_info",
      header: "Evaluation Info",
      cell: (info) => {
        const val = info.getValue();
        if (!val) return "-";
        const date = dayjs(val);
        return (
          <div className="px-6 py-4">
            <div className="font-semibold text-slate-900">
              {date.format("DD/MMM/YYYY")}
            </div>
            <div className="text-slate-500 text-xs">
              {date.format("hh:mm A")}
            </div>
          </div>
        );
      },
    }) as ColumnDef<QCRecord, unknown>,
    columnHelper.accessor("qa_agent", {
      header: "QA Agent",
      cell: (info) => <div className="px-6 py-4">{info.getValue()}</div>,
    }) as ColumnDef<QCRecord, unknown>,
    columnHelper.accessor("project_task", {
      header: "Project / Task",
      cell: (info) => <div className="px-6 py-4">{info.getValue()}</div>,
    }) as ColumnDef<QCRecord, unknown>,
    columnHelper.accessor("file_name", {
      header: () => <div className="text-center">File</div>,
      cell: (info) => {
        const fileName = info.getValue();
        return (
          <div className="px-6 py-4 text-center">
            {fileName && fileName !== "-" ? (
              <a
                href={fileName}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
              >
                <Download className="w-4 h-4 mx-auto" />
              </a>
            ) : (
              "-"
            )}
          </div>
        );
      },
    }) as ColumnDef<QCRecord, unknown>,
    columnHelper.accessor("total_records", {
      header: () => <div className="text-center">Records</div>,
      cell: (info) => (
        <div className="px-6 py-4 text-center font-medium">
          {info.getValue()}
        </div>
      ),
    }) as ColumnDef<QCRecord, unknown>,
    columnHelper.display({
      id: "actions",
      header: "Action",
      cell: (info) => {
        const row = info.row.original;
        const dateTime = dayjs(row.evaluation_datetime);
        const isRework =
          row.status?.toLowerCase() === "rework" ||
          row.status?.toLowerCase() === "correction";
        return (
          <div className="px-6 py-4">
            <Button
              variant={isRework ? "default" : "secondary"}
              size="sm"
              className={isRework ? "bg-orange-500 hover:bg-orange-600" : ""}
              onClick={() =>
                handleOpenReworkModal(
                  row.error_list,
                  {
                    qaAgent: row.qa_agent,
                    projectTask: row.project_task,
                    evalDate: dateTime.format("DD/MMM/YYYY"),
                    trackerId: row.tracker_id,
                  },
                  row.status,
                  row.qc_id,
                  row.tracker_id,
                )
              }
            >
              {isRework ? (
                <>
                  <Upload className="w-3 h-3 mr-1" />
                  {reworkFiles[row.tracker_id] ? "View" : "Fix"}
                </>
              ) : (
                "View Errors"
              )}
            </Button>
          </div>
        );
      },
    }),
    columnHelper.accessor("status", {
      header: () => <div className="text-center">Status</div>,
      cell: (info) => {
        const status = info.getValue();
        if (!status) return "-";
        const statusLower = status.toLowerCase();
        let badgeClass = "bg-slate-100 text-slate-700";
        if (statusLower === "regular" || statusLower === "approved")
          badgeClass = "bg-green-100 text-green-800";
        else if (statusLower === "rework")
          badgeClass = "bg-yellow-100 text-yellow-800";
        else if (statusLower === "correction")
          badgeClass = "bg-red-100 text-red-800";

        return (
          <div className="px-6 py-4 text-center">
            <Badge
              className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border-transparent ${badgeClass}`}
            >
              {status}
            </Badge>
          </div>
        );
      },
    }) as ColumnDef<QCRecord, unknown>,
    columnHelper.accessor("qc_score", {
      header: () => <div className="text-center">Score</div>,
      cell: (info) => {
        const score = info.getValue();
        if (
          score === null ||
          score === undefined ||
          score === "-" ||
          isNaN(Number(score))
        )
          return <div className="px-6 py-4 text-center">-</div>;

        const numScore = Number(score);
        let colorClass = "text-slate-700 bg-slate-100";
        if (numScore >= 95) colorClass = "text-green-800 bg-green-100";
        else if (numScore >= 80) colorClass = "text-yellow-700 bg-yellow-100";
        else colorClass = "text-red-700 bg-red-200";

        return (
          <div className="px-6 py-4 text-center">
            <Badge className={`px-2 py-1 rounded-lg text-xs font-bold border-transparent ${colorClass}`}>
              {numScore.toFixed(2)}%
            </Badge>
          </div>
        );
      },
    }) as ColumnDef<QCRecord, unknown>,
  ];
}
