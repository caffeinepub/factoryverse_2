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

interface Shift {
  id: string;
  companyId: string;
  personnelId: string;
  shiftType: string;
  date: string;
  note: string;
  createdAt: bigint;
}

interface Props {
  session: Session;
}

const STATUS_COLORS: Record<string, { bar: string; badge: string }> = {
  Planning: { bar: "bg-blue-400", badge: "bg-blue-100 text-blue-700" },
  Active: { bar: "bg-indigo-500", badge: "bg-indigo-100 text-indigo-700" },
  OnHold: { bar: "bg-orange-400", badge: "bg-orange-100 text-orange-700" },
  Completed: { bar: "bg-gray-400", badge: "bg-gray-100 text-gray-700" },
};

const TASK_COLORS: Record<string, string> = {
  Pending: "bg-yellow-400",
  InProgress: "bg-blue-500",
  Done: "bg-green-500",
};

const TASK_CHIP_COLORS: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  InProgress: "bg-blue-100 text-blue-800",
  Done: "bg-green-100 text-green-800",
};

const SHIFT_CHIP_COLORS: Record<string, string> = {
  Sabah: "bg-amber-100 text-amber-800",
  Öğlen: "bg-sky-100 text-sky-800",
  Gece: "bg-indigo-100 text-indigo-800",
};

const DAYS_SHOWN = 90;
const WEEK_DAYS_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

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

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const STATUS_TR: Record<string, string> = {
  Planning: "Planlama",
  Active: "Aktif",
  OnHold: "Beklemede",
  Completed: "Tamamlandı",
};

export default function GanttCalendar({ session }: Props) {
  const { actor, isFetching } = useActor();
  const [view, setView] = useState<"gantt" | "calendar">("gantt");

  // Gantt state
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskMap, setTaskMap] = useState<Record<string, Task[]>>({});
  const [loading, setLoading] = useState(true);
  const [viewStart, setViewStart] = useState<Date>(() => {
    const d = startOfDay(new Date());
    d.setDate(d.getDate() - 10);
    return d;
  });

  // Calendar state
  const [calMonth, setCalMonth] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [calLoading, setCalLoading] = useState(false);

  // Load Gantt data
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

  // Load Calendar data
  useEffect(() => {
    if (view !== "calendar" || !actor || isFetching) return;
    let cancelled = false;
    async function loadCal() {
      setCalLoading(true);
      try {
        const api = actor as any;
        const [tasks, sh] = await Promise.all([
          api.listAllTasks(session.companyId).catch(() => []),
          api.listShifts(session.companyId).catch(() => []),
        ]);
        if (cancelled) return;
        setAllTasks(tasks as Task[]);
        setShifts(sh as Shift[]);
      } finally {
        if (!cancelled) setCalLoading(false);
      }
    }
    loadCal();
    return () => {
      cancelled = true;
    };
  }, [view, actor, isFetching, session.companyId]);

  // Gantt calculations
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

  // Calendar grid
  const calYear = calMonth.getFullYear();
  const calMonthIdx = calMonth.getMonth();
  const firstDayOfMonth = new Date(calYear, calMonthIdx, 1);
  // Monday=0 offset
  let startOffset = firstDayOfMonth.getDay() - 1;
  if (startOffset < 0) startOffset = 6;
  const daysInMonth = new Date(calYear, calMonthIdx + 1, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  // Build task map by date string
  const tasksByDate: Record<string, Task[]> = {};
  for (const t of allTasks) {
    if (t.dueDate) {
      if (!tasksByDate[t.dueDate]) tasksByDate[t.dueDate] = [];
      tasksByDate[t.dueDate].push(t);
    }
  }

  // Build shift map by date string
  const shiftsByDate: Record<string, Shift[]> = {};
  for (const s of shifts) {
    if (s.date) {
      if (!shiftsByDate[s.date]) shiftsByDate[s.date] = [];
      shiftsByDate[s.date].push(s);
    }
  }

  const todayStr = toDateStr(today);

  function changeCalMonth(delta: number) {
    setCalMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + delta);
      return d;
    });
  }

  return (
    <div className="space-y-4" data-ocid="calendar.page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2
            className="text-xl font-bold"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Takvim & Gantt
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {view === "gantt"
              ? `${formatDay(viewStart)} — ${formatDay(new Date(viewEnd.getTime() - 86400000))}`
              : formatMonthYear(calMonth)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setView("gantt")}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                view === "gantt"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
              data-ocid="calendar.view_gantt"
            >
              Gantt
            </button>
            <button
              type="button"
              onClick={() => setView("calendar")}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                view === "calendar"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
              data-ocid="calendar.view_monthly"
            >
              Aylık
            </button>
          </div>

          {/* Navigation */}
          {view === "gantt" ? (
            <>
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
                Bugün
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => shiftView(30)}
                data-ocid="calendar.pagination_next"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeCalMonth(-1)}
                data-ocid="calendar.month_prev"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const d = new Date();
                  setCalMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                }}
                data-ocid="calendar.month_today"
              >
                Bugün
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeCalMonth(1)}
                data-ocid="calendar.month_next"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ============ GANTT VIEW ============ */}
      {view === "gantt" && (
        <>
          {loading && (
            <div
              className="flex items-center justify-center py-20"
              data-ocid="calendar.loading_state"
            >
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {!loading && projects.length === 0 && (
            <div
              className="flex flex-col items-center justify-center py-24 text-center"
              data-ocid="calendar.empty_state"
            >
              <CalendarDays className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <p className="font-medium text-muted-foreground">
                Henüz proje yok
              </p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                Projeler eklendiğinde burada görünecek
              </p>
            </div>
          )}

          {!loading && projects.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Month header */}
              <div className="flex border-b border-border">
                <div
                  className="flex-shrink-0 border-r border-border bg-muted/30 px-4 py-2 text-xs font-semibold text-muted-foreground"
                  style={{ width: COL_WIDTH }}
                >
                  Proje / Görev
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
                    <div
                      key={project.id}
                      data-ocid={`calendar.item.${pIdx + 1}`}
                    >
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
                  Bugün
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ============ MONTHLY CALENDAR VIEW ============ */}
      {view === "calendar" && (
        <>
          {calLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {!calLoading && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Day-of-week headers */}
              <div className="grid grid-cols-7 border-b border-border">
                {WEEK_DAYS_TR.map((d) => (
                  <div
                    key={d}
                    className="py-2 text-center text-xs font-semibold text-muted-foreground border-r last:border-r-0 border-border"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {Array.from({ length: totalCells }).map((_, idx) => {
                  const dayNumber = idx - startOffset + 1;
                  const isCurrentMonth =
                    dayNumber >= 1 && dayNumber <= daysInMonth;
                  const cellDate = isCurrentMonth
                    ? new Date(calYear, calMonthIdx, dayNumber)
                    : null;
                  const dateStr = cellDate ? toDateStr(cellDate) : "";
                  const isToday = dateStr === todayStr;
                  const dayTasks = dateStr ? (tasksByDate[dateStr] ?? []) : [];
                  const dayShifts = dateStr
                    ? (shiftsByDate[dateStr] ?? [])
                    : [];
                  const isLastRow = idx >= totalCells - 7;

                  return (
                    <div
                      key={
                        dateStr ||
                        `pad-${calYear}-${calMonthIdx}-${idx - startOffset}`
                      }
                      className={`min-h-[96px] p-1.5 border-r border-b last:border-r-0 border-border
                        ${isLastRow ? "border-b-0" : ""}
                        ${isCurrentMonth ? "bg-background" : "bg-muted/20"}
                      `}
                    >
                      {isCurrentMonth && (
                        <>
                          <div className="flex items-center justify-end mb-1">
                            <span
                              className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full
                                ${
                                  isToday
                                    ? "bg-primary text-primary-foreground"
                                    : "text-foreground"
                                }`}
                            >
                              {dayNumber}
                            </span>
                          </div>

                          <div className="space-y-0.5">
                            {dayTasks.slice(0, 2).map((task) => (
                              <div
                                key={String(task.id)}
                                className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${
                                  TASK_CHIP_COLORS[task.status] ??
                                  "bg-slate-100 text-slate-700"
                                }`}
                                title={task.title}
                              >
                                {task.title}
                              </div>
                            ))}
                            {dayShifts.slice(0, 2).map((sh) => (
                              <div
                                key={sh.id}
                                className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${
                                  SHIFT_CHIP_COLORS[sh.shiftType] ??
                                  "bg-purple-100 text-purple-800"
                                }`}
                                title={`${sh.shiftType} vardiyası`}
                              >
                                ⏰ {sh.shiftType}
                              </div>
                            ))}
                            {(dayTasks.length > 2 || dayShifts.length > 2) && (
                              <div className="text-[10px] text-muted-foreground px-1">
                                +
                                {dayTasks.length +
                                  dayShifts.length -
                                  Math.min(dayTasks.length, 2) -
                                  Math.min(dayShifts.length, 2)}{" "}
                                daha
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="border-t border-border px-4 py-3 bg-muted/20 flex flex-wrap gap-4">
                <span className="text-xs font-semibold text-muted-foreground mr-1">
                  Görevler:
                </span>
                {Object.entries(TASK_CHIP_COLORS).map(([status, cls]) => (
                  <div key={status} className="flex items-center gap-1.5">
                    <div
                      className={`text-[10px] px-2 py-0.5 rounded font-medium ${cls}`}
                    >
                      {status === "Pending"
                        ? "Bekliyor"
                        : status === "InProgress"
                          ? "Devam Ediyor"
                          : "Tamamlandı"}
                    </div>
                  </div>
                ))}
                <span className="text-xs font-semibold text-muted-foreground ml-3 mr-1">
                  Vardiyalar:
                </span>
                {Object.entries(SHIFT_CHIP_COLORS).map(([type, cls]) => (
                  <div key={type} className="flex items-center gap-1.5">
                    <div
                      className={`text-[10px] px-2 py-0.5 rounded font-medium ${cls}`}
                    >
                      {type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
