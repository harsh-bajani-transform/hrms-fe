import React, { useMemo } from "react";
import {
  Download,
  Eye,
  FileText,
  Layout,
  Calendar as CalendarIcon,
  Plus,
} from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Task, Project } from "../../types";

interface DocxPreviewProps {
  html: string;
}

// Imported from parent - you may want to extract this to a shared file
const DocxPreview: React.FC<DocxPreviewProps> = ({ html }) => {
  const [showFull, setShowFull] = React.useState(false);

  const { processedHtml, firstPageHtml, hasMore } = React.useMemo(() => {
    const fixTableHeadings = (rawHtml: string): string => {
      return rawHtml.replace(
        /(<table[\s\S]*?<\/table>)(\s*<(h[1-6])[^>]*>.*?<\/\3>)/gi,
        "$2$1",
      );
    };

    const addImageStyling = (rawHtml: string): string => {
      return rawHtml.replace(/<img /g, '<img class="project-docx-img" ');
    };

    const processed = addImageStyling(fixTableHeadings(html || ""));
    let firstPage = processed;
    let more = false;

    if (processed.includes("page-break-before:always")) {
      const parts = processed.split(/<hr[^>]*page-break-before:always[^>]*>/i);
      firstPage = parts[0] ?? "";
      more = parts.length > 1;
    }
    return {
      processedHtml: processed,
      firstPageHtml: firstPage,
      hasMore: more,
    };
  }, [html]);

  return (
    <div
      className="project-docx-html bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-none"
      style={{
        fontFamily: "Segoe UI, Arial, sans-serif",
        maxHeight: showFull ? 500 : 320,
        overflowY: "auto",
        position: "relative",
      }}
    >
      <style>{`
        .project-docx-html img, .project-docx-img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 1em auto;
          box-shadow: 0 2px 8px rgba(30,64,175,0.08);
          border-radius: 0.5em;
        }
        .project-docx-html h1 {
          font-size: 2.25rem;
          color: #1e40af;
          margin-bottom: 0.75em;
          margin-top: 0.5em;
          font-weight: bold;
        }
        .project-docx-html h2 {
          font-size: 1.5rem;
          color: #2563eb;
          margin-bottom: 0.6em;
          margin-top: 1.2em;
          font-weight: 600;
        }
        .project-docx-html h3 {
          font-size: 1.2rem;
          color: #2563eb;
          margin-bottom: 0.5em;
          margin-top: 1em;
          font-weight: 500;
        }
        .project-docx-html p {
          margin-bottom: 0.7em;
          color: #1e293b;
        }
        .project-docx-html table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
          background: #fff;
        }
        .project-docx-html th, .project-docx-html td {
          border: 1px solid #2563eb;
          padding: 0.5em 1em;
          text-align: left;
        }
        .project-docx-html th {
          background: #dbeafe;
          color: #1e40af;
          font-weight: bold;
        }
        .project-docx-html tr:nth-child(even) td {
          background: #f1f5f9;
        }
        .project-docx-html ul, .project-docx-html ol {
          margin-left: 2em;
          margin-bottom: 1em;
          padding-left: 1.5em;
        }
        .project-docx-html ul {
          list-style-type: disc;
        }
        .project-docx-html ol {
          list-style-type: decimal;
        }
        .project-docx-html ul ul,
        .project-docx-html ol ul {
          list-style-type: circle;
        }
        .project-docx-html ol ol,
        .project-docx-html ul ol {
          list-style-type: lower-latin;
        }
        .project-docx-html li {
          margin-bottom: 0.3em;
          color: #1e293b;
        }
        .project-docx-html li > ul,
        .project-docx-html li > ol {
          margin-top: 0.2em;
          margin-bottom: 0.2em;
        }
        .project-docx-html a {
          color: #2563eb;
          text-decoration: underline;
          word-break: break-all;
        }
      `}</style>

      <div
        dangerouslySetInnerHTML={{
          __html: showFull ? processedHtml : firstPageHtml,
        }}
      />

      {hasMore && !showFull && (
        <div className="absolute bottom-2 left-0 w-full flex justify-center pointer-events-none">
          <div className="h-12 w-full bg-linear-to-t from-blue-50 to-transparent absolute bottom-0 left-0" />
        </div>
      )}

      {hasMore && (
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 text-sm font-semibold block mx-auto relative z-10"
          onClick={() => setShowFull((v) => !v)}
          type="button"
        >
          {showFull ? "Show Less" : "Show Full Preview"}
        </button>
      )}
    </div>
  );
};

interface ProjectAccordionItemProps {
  project: Project;
  dateFilter: string;
  expanded: number | null;
  docxHtml: Record<number, string>;
  taskColumns: ColumnDef<Task, unknown>[];
  onAddDummyTask: (projectId: number) => void;
}

export const ProjectAccordionItem: React.FC<ProjectAccordionItemProps> = ({
  project,
  dateFilter,
  expanded,
  docxHtml,
  taskColumns,
  onAddDummyTask,
}) => {
  const filterTasksByDate = (tasks: Task[], date: string) =>
    tasks.filter((task) => task.due === date);

  const todaysTasks = useMemo(
    () => filterTasksByDate(project.tasks, dateFilter),
    [project.tasks, dateFilter],
  );
  const isProjectExpanded = expanded === project.id;

  console.log(
    "[ProjectAccordionItem]",
    project.name,
    "- project.id:",
    project.id,
    "expanded:",
    expanded,
    "isProjectExpanded:",
    isProjectExpanded,
  );

  return (
    <AccordionItem
      key={project.id}
      value={String(project.id)}
      className="border-none"
    >
      <Card
        className={`overflow-hidden transition-all duration-300 border-slate-200 ${isProjectExpanded ? "ring-2 ring-blue-500/20 shadow-xl" : "hover:shadow-md"}`}
      >
        <CardHeader className="p-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-6">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-100">
                {project.name[0]}
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">
                  {project.name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="secondary"
                    className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none px-2 py-0 text-[10px] uppercase tracking-wider font-bold"
                  >
                    Project
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 md:ml-auto">
              <div className="flex items-center gap-3 pr-4 border-r border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  PPRT
                </span>
                {project.pprtFile ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className=" w-9 p-0 rounded-full bg-slate-50 hover:bg-blue-50 text-blue-600"
                    asChild
                  >
                    <a
                      href={project.pprtFile}
                      download
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </Button>
                ) : (
                  <span className="text-xs text-slate-300 font-mediumitalic">
                    Empty
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 pr-4 border-r border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Guide
                </span>
                {project.instructionFile ? (
                  <div className="flex gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className=" w-9 p-0 rounded-full bg-slate-50 hover:bg-blue-50 text-blue-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        const raw = docxHtml[project.id] || "";
                        const win = window.open("", "_blank");
                        if (win) {
                          win.document
                            .write(`<!DOCTYPE html><html><head><title>Guide</title>
                            <style>body{font-family:sans-serif;padding:2rem;line-height:1.6;color:#334155;max-width:800px;margin:0 auto;background:#f8fafc}</style>
                            </head><body><div style="background:white;padding:3rem;border-radius:1rem;box-shadow:0 4px 6px -1px rgb(0 0 0/0.1)">${raw}</div></body></html>`);
                          win.document.close();
                        }
                      }}
                      disabled={!docxHtml[project.id]}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className=" w-9 p-0 rounded-full bg-slate-50 hover:bg-blue-50 text-blue-600"
                      asChild
                    >
                      <a href={project.instructionFile} download>
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-300 font-mediumitalic">
                    Empty
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <AccordionTrigger className="hover:no-underline py-0">
                  <Badge className="bg-emerald-50! text-emerald-700! border-emerald-100! px-3 py-1 text-xs font-bold gap-2">
                    <Layout className="w-3.5 h-3.5" />
                    {todaysTasks.length}{" "}
                    {todaysTasks.length === 1 ? "Task" : "Tasks"} Today
                  </Badge>
                </AccordionTrigger>
              </div>
            </div>
          </div>
        </CardHeader>

        <AccordionContent>
          <CardContent className="pt-0 px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-8 mt-4 border-t border-slate-100 pt-8">
              {/* Project Instruction HTML view */}
              {project.instructionFile && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 px-1">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Project Instructions
                  </h4>
                  <DocxPreview html={docxHtml[project.id] || ""} />
                </div>
              )}

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-blue-600" />
                    Assigned Tasks
                  </h4>
                  <div className="flex items-center gap-3">
                    <Input
                      type="date"
                      className=" w-40 font-semibold text-slate-700 border-slate-200"
                      value={dateFilter}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => e.stopPropagation()}
                      readOnly
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className=" border-indigo-200 text-blue-600 hover:bg-blue-50 font-bold"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddDummyTask(project.id);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Quick Add
                    </Button>
                  </div>
                </div>

                {todaysTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 rounded bg-slate-50 border border-slate-100 border-dashed text-slate-400">
                    <CalendarIcon className="w-8 h-8 opacity-20 mb-2" />
                    <p className="text-sm font-medium">
                      No tasks assigned for this date.
                    </p>
                  </div>
                ) : (
                  <DataTable
                    columns={taskColumns}
                    data={todaysTasks}
                    loading={false}
                    emptyMessage="No tasks assigned for this date."
                    emptyIcon={CalendarIcon}
                    showPagination={true}
                    pageSize={10}
                    containerClassName="rounded border border-slate-200 overflow-hidden shadow-sm bg-white"
                    headerClassName="bg-slate-50/80"
                    rowClassName="border-slate-100"
                    rowHoverClassName="hover:bg-slate-50/50 transition-colors"
                  />
                )}
              </div>
            </div>
          </CardContent>
        </AccordionContent>
      </Card>
    </AccordionItem>
  );
};
