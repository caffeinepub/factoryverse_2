import type { Session } from "@/App";
import type {
  FailureWithProject as Failure,
  HseRecord,
  Project,
  Task,
} from "@/backend.d";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useActor } from "@/hooks/useActor";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Loader2,
  ShieldAlert,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface Props {
  session: Session;
  navigateToDetail?: (personnelId: string) => void;
}

interface PersonnelStats {
  assigneeId: string;
  totalTasks: number;
  doneTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  completionPct: number;
  failureCount: number;
  hseCount: number;
}

const statusColors: Record<string, string> = {
  done: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "in-progress": "bg-blue-100 text-blue-700 border-blue-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
};

export default function PerformanceReports({
  session,
  navigateToDetail,
}: Props) {
  const { actor } = useActor();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [failures, setFailures] = useState<Failure[]>([]);
  const [hseRecords, setHseRecords] = useState<HseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: actor is used via api cast; actor stabilizes after init
  useEffect(() => {
    const api = actor as any;
    if (!api || !session.companyId) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [projects, failuresData, hseData] = await Promise.all([
          api.listProjects(session.companyId) as Promise<Project[]>,
          api.listFailures(session.companyId) as Promise<Failure[]>,
          api.listHseRecords(session.companyId) as Promise<HseRecord[]>,
        ]);

        const taskArrays = await Promise.all(
          projects.map((p: Project) => api.listTasks(p.id) as Promise<Task[]>),
        );
        const allTasks = taskArrays.flat();

        setTasks(allTasks);
        setFailures(failuresData);
        setHseRecords(hseData);
      } catch {
        toast.error("Performans verileri yüklenirken hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [session.companyId, actor]);

  const personnelStats = useMemo<PersonnelStats[]>(() => {
    const assignedTasks = tasks.filter(
      (t) => t.assigneeId && t.assigneeId !== "",
    );
    const assigneeMap = new Map<string, Task[]>();
    for (const task of assignedTasks) {
      const existing = assigneeMap.get(task.assigneeId) ?? [];
      existing.push(task);
      assigneeMap.set(task.assigneeId, existing);
    }

    return Array.from(assigneeMap.entries())
      .map(([assigneeId, myTasks]) => {
        const done = myTasks.filter((t) => t.status === "done").length;
        const inProgress = myTasks.filter(
          (t) => t.status === "in-progress",
        ).length;
        const pending = myTasks.filter((t) => t.status === "pending").length;
        const total = myTasks.length;
        const completionPct = total > 0 ? Math.round((done / total) * 100) : 0;
        const failureCount = failures.filter(
          (f) => f.reportedBy === assigneeId,
        ).length;
        const hseCount = hseRecords.filter(
          (h) => h.reportedBy === assigneeId,
        ).length;
        return {
          assigneeId,
          totalTasks: total,
          doneTasks: done,
          inProgressTasks: inProgress,
          pendingTasks: pending,
          completionPct,
          failureCount,
          hseCount,
        };
      })
      .sort((a, b) => b.completionPct - a.completionPct);
  }, [tasks, failures, hseRecords]);

  const avgCompletion = useMemo(() => {
    if (personnelStats.length === 0) return 0;
    return Math.round(
      personnelStats.reduce((sum, p) => sum + p.completionPct, 0) /
        personnelStats.length,
    );
  }, [personnelStats]);

  const topPerformer = personnelStats[0];

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-64"
        data-ocid="performance.loading_state"
      >
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
        >
          Personel Performans Raporları
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Görev tamamlanma oranları, arıza ve İSG katkıları
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card data-ocid="performance.summary.card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" /> Toplam Personel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className="text-3xl font-bold"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              {personnelStats.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Ort. Tamamlanma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className="text-3xl font-bold"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              %{avgCompletion}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> En Yüksek Performans
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPerformer ? (
              <div>
                <p
                  className="text-lg font-bold truncate"
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  {topPerformer.assigneeId.length > 12
                    ? `${topPerformer.assigneeId.slice(0, 12)}…`
                    : topPerformer.assigneeId}
                </p>
                <p className="text-sm text-muted-foreground">
                  %{topPerformer.completionPct} tamamlandı
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Personnel list */}
      {personnelStats.length === 0 ? (
        <Card data-ocid="performance.empty_state">
          <CardContent className="pt-12 pb-12 flex flex-col items-center gap-3 text-center">
            <ClipboardList className="w-12 h-12 text-muted-foreground/40" />
            <p className="font-medium">Henüz atanmış görev bulunmuyor</p>
            <p className="text-muted-foreground text-sm">
              Personele görev atandıkça performans verileri burada görünecektir.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3" data-ocid="performance.list">
          {personnelStats.map((p, idx) => (
            <Card
              key={p.assigneeId}
              data-ocid={`performance.item.${idx + 1}`}
              className={
                navigateToDetail
                  ? "cursor-pointer hover:shadow-md transition-shadow"
                  : ""
              }
              onClick={() => navigateToDetail?.(p.assigneeId)}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Avatar + ID */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span
                        className="text-sm font-bold text-primary"
                        style={{
                          fontFamily: "'Bricolage Grotesque', sans-serif",
                        }}
                      >
                        {p.assigneeId.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {p.assigneeId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.totalTasks} görev atandı
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="flex-1 min-w-0 sm:max-w-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">
                        Tamamlanma
                      </span>
                      <span className="text-xs font-semibold">
                        %{p.completionPct}
                      </span>
                    </div>
                    <Progress value={p.completionPct} className="h-2" />
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <span
                      className={`text-xs px-2 py-1 rounded-full border font-medium flex items-center gap-1 ${statusColors.done}`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {p.doneTasks} tamamlandı
                    </span>
                    {p.inProgressTasks > 0 && (
                      <span
                        className={`text-xs px-2 py-1 rounded-full border font-medium ${statusColors["in-progress"]}`}
                      >
                        {p.inProgressTasks} devam ediyor
                      </span>
                    )}
                    {p.pendingTasks > 0 && (
                      <span
                        className={`text-xs px-2 py-1 rounded-full border font-medium ${statusColors.pending}`}
                      >
                        {p.pendingTasks} bekliyor
                      </span>
                    )}
                    {p.failureCount > 0 && (
                      <Badge
                        variant="outline"
                        className="text-xs gap-1 border-red-200 text-red-600"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {p.failureCount} arıza
                      </Badge>
                    )}
                    {p.hseCount > 0 && (
                      <Badge
                        variant="outline"
                        className="text-xs gap-1 border-orange-200 text-orange-600"
                      >
                        <ShieldAlert className="w-3 h-3" />
                        {p.hseCount} İSG
                      </Badge>
                    )}
                    {navigateToDetail && (
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
