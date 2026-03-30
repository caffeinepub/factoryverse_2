import type { Session } from "@/App";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useActor } from "@/hooks/useActor";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface Project {
  id: string;
  name: string;
  status: string;
  createdAt: bigint;
  deadline: string;
  companyId: string;
  description: string;
}

interface Task {
  id: bigint;
  title: string;
  status: string;
  assigneeId: string;
  dueDate: string;
  projectId: string;
  companyId: string;
}

interface Props {
  session: Session;
}

const STATUS_COLORS: Record<string, { bar: string; badge: string }> = {
  Planning: { bar: "bg-blue-400", badge: "bg-blue-100 text-blue-700" },
  Active: { bar: "bg-indigo-500", badge: "bg-indigo-100 text-indigo-700" },
  OnHold: { bar: "bg-orange-400", badge: "bg-orange-100 text-orange-700" },
  Completed: { bar: "bg-gray-400", badge: "bg-gray-100 text-gray-600" },
};

const TASK_COLORS: Record<string, string> = {
  Pending: "bg-yellow-400",
  InProgress: "bg-blue-500",
  Done: "bg-green-500",
};

const DAYS_SHOWN = 90;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDate(str: string): Date | null {
  if (!str) return null;
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : startOfDay(d);
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
}

function formatDay(date: Date): string {
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

const STATUS_TR: Record<string, string> = {
  Planning: "Planlama",
  Active: "Aktif",
  OnHold: "Beklemede",
  Completed: "Tamamland\u0131",
};

export default function GanttCalendar({ session }: Props) {
  const { actor, isFetching } = useActor();
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskMap, setTaskMap] = useState<Record<string, Task[]>>({});
  const [loading, setLoading] = useState(true);
  const [viewStart, setViewStart] = useState<Date>(() => {
    const d = startOfDay(new Date());
    d.setDate(d.getDate() - 10);
    return d;
  });

  useEffect(() => {
    if (!actor || isFetching) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const ps = (await actor!.listProjects(session.companyId)) as Project[];
        if (cancelled) return;
        setProjects(ps);
        const taskResults = await Promise.all(
          ps.map((p) => actor!.listTasks(p.id) as Promise<Task[]>),
        );
        if (cancelled) return;
        const map: Record<string, Task[]> = {};
        ps.forEach((p, i) => {
          map[p.id] = taskResults[i];
        });
        setTaskMap(map);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [actor, isFetching, session.companyId]);

  const viewEnd = new Date(viewStart);
  viewEnd.setDate(viewEnd.getDate() + DAYS_SHOWN);

  function shiftView(days: number) {
    setViewStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + days);
      return d;
    });
  }

  function calcBar(start: Date | null, end: Date | null) {
    if (!start || !end) return null;
    const s = Math.max(daysBetween(viewStart, start), 0);
    const e = Math.min(daysBetween(viewStart, end), DAYS_SHOWN);
    if (e <= s) return null;
    const left = (s / DAYS_SHOWN) * 100;
    const width = ((e - s) / DAYS_SHOWN) * 100;
    return {
      left: `${left.toFixed(2)}%`,
      width: `${Math.max(width, 0.5).toFixed(2)}%`,
    };
  }

  const today = startOfDay(new Date());
  const todayOffset = daysBetween(viewStart, today);
  const todayVisible = todayOffset >= 0 && todayOffset <= DAYS_SHOWN;
  const todayLeft = (todayOffset / DAYS_SHOWN) * 100;

  // Build month tick marks
  const monthTicks: { label: string; left: string }[] = [];
  const cur = new Date(viewStart);
  cur.setDate(1);
  if (cur < viewStart) cur.setMonth(cur.getMonth() + 1);
  while (cur < viewEnd) {
    const offset = daysBetween(viewStart, cur);
    monthTicks.push({
      label: formatMonthYear(cur),
      left: `${((offset / DAYS_SHOWN) * 100).toFixed(2)}%`,
    });
    cur.setMonth(cur.getMonth() + 1);
  }

  const COL_WIDTH = 220;

  return (
    <div className="space-y-4" data-ocid="calendar.page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-xl font-bold"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Takvim & Gantt
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {formatDay(viewStart)} —{" "}
            {formatDay(new Date(viewEnd.getTime() - 86400000))}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => shiftView(-30)}
            data-ocid="calendar.pagination_prev"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const d = startOfDay(new Date());
              d.setDate(d.getDate() - 10);
              setViewStart(d);
            }}
            data-ocid="calendar.toggle"
          >
            Bug\u00fcn
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => shiftView(30)}
            data-ocid="calendar.pagination_next"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div
          className="flex items-center justify-center py-20"
          data-ocid="calendar.loading_state"
        >
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty state */}
      {!loading && projects.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-24 text-center"
          data-ocid="calendar.empty_state"
        >
          <CalendarDays className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <p className="font-medium text-muted-foreground">
            Hen\u00fcz proje yok
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Projeler eklendiğinde burada g\u00f6r\u00fcnecek
          </p>
        </div>
      )}

      {/* Gantt */}
      {!loading && projects.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Month header */}
          <div className="flex border-b border-border">
            <div
              className="flex-shrink-0 border-r border-border bg-muted/30 px-4 py-2 text-xs font-semibold text-muted-foreground"
              style={{ width: COL_WIDTH }}
            >
              Proje / G\u00f6rev
            </div>
            <div className="flex-1 relative h-8 overflow-hidden">
              {monthTicks.map((t) => (
                <span
                  key={t.left}
                  className="absolute top-2 text-xs text-muted-foreground font-medium whitespace-nowrap"
                  style={{ left: t.left, transform: "translateX(-50%)" }}
                >
                  {t.label}
                </span>
              ))}
              {todayVisible && (
                <div
                  className="absolute top-0 bottom-0 w-px bg-red-400/60"
                  style={{ left: `${todayLeft.toFixed(2)}%` }}
                />
              )}
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {projects.map((project, pIdx) => {
              const colors =
                STATUS_COLORS[project.status] ?? STATUS_COLORS.Planning;
              const createdDate = parseDate(
                new Date(Number(project.createdAt) / 1000000)
                  .toISOString()
                  .split("T")[0],
              );
              const deadlineDate = parseDate(project.deadline);
              const projectBar = calcBar(createdDate, deadlineDate);
              const tasks = taskMap[project.id] ?? [];

              return (
                <div key={project.id} data-ocid={`calendar.item.${pIdx + 1}`}>
                  {/* Project row */}
                  <div className="flex items-center hover:bg-muted/20 transition-colors">
                    <div
                      className="flex-shrink-0 border-r border-border px-4 py-3 flex items-center gap-2"
                      style={{ width: COL_WIDTH }}
                    >
                      <div
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colors.bar}`}
                      />
                      <span
                        className="text-sm font-semibold truncate"
                        title={project.name}
                      >
                        {project.name}
                      </span>
                      <Badge
                        className={`ml-auto text-xs px-1.5 py-0 border-0 flex-shrink-0 ${colors.badge}`}
                      >
                        {STATUS_TR[project.status] ?? project.status}
                      </Badge>
                    </div>
                    <div className="flex-1 relative h-10">
                      {monthTicks.map((t) => (
                        <div
                          key={t.left}
                          className="absolute top-0 bottom-0 w-px bg-border/40"
                          style={{ left: t.left }}
                        />
                      ))}
                      {todayVisible && (
                        <div
                          className="absolute top-0 bottom-0 w-px bg-red-400/40"
                          style={{ left: `${todayLeft.toFixed(2)}%` }}
                        />
                      )}
                      {projectBar && (
                        <div
                          className={`absolute top-2.5 h-5 rounded-full opacity-90 ${colors.bar}`}
                          style={{
                            left: projectBar.left,
                            width: projectBar.width,
                          }}
                          title={`${project.name}: ${createdDate ? formatDay(createdDate) : "?"} \u2192 ${deadlineDate ? formatDay(deadlineDate) : "?"}`}
                        />
                      )}
                    </div>
                  </div>

                  {/* Task rows */}
                  {tasks.map((task) => {
                    const dueDate = parseDate(task.dueDate);
                    const taskStart = dueDate
                      ? new Date(dueDate.getTime() - 86400000 * 3)
                      : null;
                    const taskBar = calcBar(taskStart, dueDate);
                    const taskColor =
                      TASK_COLORS[task.status] ?? "bg-slate-400";
                    return (
                      <div
                        key={String(task.id)}
                        className="flex items-center bg-muted/10 hover:bg-muted/20 transition-colors"
                      >
                        <div
                          className="flex-shrink-0 border-r border-border px-4 py-2 flex items-center gap-2"
                          style={{ width: COL_WIDTH }}
                        >
                          <div className="w-px h-4 bg-border ml-1.5 flex-shrink-0" />
                          <span
                            className="text-xs text-muted-foreground truncate pl-1.5"
                            title={task.title}
                          >
                            {task.title}
                          </span>
                        </div>
                        <div className="flex-1 relative h-8">
                          {monthTicks.map((t) => (
                            <div
                              key={t.left}
                              className="absolute top-0 bottom-0 w-px bg-border/30"
                              style={{ left: t.left }}
                            />
                          ))}
                          {todayVisible && (
                            <div
                              className="absolute top-0 bottom-0 w-px bg-red-400/30"
                              style={{ left: `${todayLeft.toFixed(2)}%` }}
                            />
                          )}
                          {taskBar && (
                            <div
                              className={`absolute top-2 h-3 rounded-full opacity-80 ${taskColor}`}
                              style={{
                                left: taskBar.left,
                                width: taskBar.width,
                              }}
                              title={`${task.title}: ${dueDate ? formatDay(dueDate) : "?"}`}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="border-t border-border px-4 py-3 bg-muted/20 flex flex-wrap gap-4">
            {Object.entries(STATUS_COLORS).map(([status, c]) => (
              <div
                key={status}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <div className={`w-3 h-3 rounded-full ${c.bar}`} />
                {STATUS_TR[status] ?? status}
              </div>
            ))}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-4">
              <div className="w-px h-4 bg-red-400" />
              Bug\u00fcn
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
