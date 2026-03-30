import type { Page, Session } from "@/App";
import type {
  Failure,
  HseRecord,
  MaintenancePlan,
  Project,
  Task,
} from "@/backend.d";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActor } from "@/hooks/useActor";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Loader2,
  ShieldAlert,
  User,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  session: Session;
  personnelId: string;
  navigate: (p: Page) => void;
}

const taskStatusConfig: Record<string, { label: string; cls: string }> = {
  done: {
    label: "Tamamlandı",
    cls: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  "in-progress": {
    label: "Devam Ediyor",
    cls: "bg-blue-100 text-blue-700 border-blue-200",
  },
  pending: {
    label: "Bekliyor",
    cls: "bg-amber-100 text-amber-700 border-amber-200",
  },
};

const hseTypeConfig: Record<string, { label: string; cls: string }> = {
  accident: { label: "Kaza", cls: "bg-red-100 text-red-700 border-red-200" },
  audit: { label: "Denetim", cls: "bg-blue-100 text-blue-700 border-blue-200" },
  risk: {
    label: "Risk",
    cls: "bg-orange-100 text-orange-700 border-orange-200",
  },
};

const maintenanceStatusConfig: Record<string, { label: string; cls: string }> =
  {
    active: {
      label: "Aktif",
      cls: "bg-green-100 text-green-700 border-green-200",
    },
    Active: {
      label: "Aktif",
      cls: "bg-green-100 text-green-700 border-green-200",
    },
    completed: {
      label: "Tamamlandı",
      cls: "bg-gray-100 text-gray-600 border-gray-200",
    },
    Completed: {
      label: "Tamamlandı",
      cls: "bg-gray-100 text-gray-600 border-gray-200",
    },
    pending: {
      label: "Bekliyor",
      cls: "bg-yellow-100 text-yellow-700 border-yellow-200",
    },
    Pending: {
      label: "Bekliyor",
      cls: "bg-yellow-100 text-yellow-700 border-yellow-200",
    },
  };

const frequencyLabel: Record<string, string> = {
  daily: "Günlük",
  weekly: "Haftalık",
  monthly: "Aylık",
  yearly: "Yıllık",
};

function StatusPill({
  status,
  config,
}: { status: string; config: Record<string, { label: string; cls: string }> }) {
  const cfg = config[status] ?? {
    label: status,
    cls: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full font-medium border ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}

export default function PersonnelDetail({
  session,
  personnelId,
  navigate,
}: Props) {
  const { actor } = useActor();
  const api = actor as any;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [maintenancePlans, setMaintenancePlans] = useState<MaintenancePlan[]>(
    [],
  );
  const [hseRecords, setHseRecords] = useState<HseRecord[]>([]);
  const [failures, setFailures] = useState<Failure[]>([]);
  const [loading, setLoading] = useState(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: actor stabilizes after init
  useEffect(() => {
    if (!api || !personnelId || !session.companyId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const [projects, allPlans, allHse, allFailures] = await Promise.all([
          api.listProjects(session.companyId) as Promise<Project[]>,
          api.listMaintenancePlans(session.companyId) as Promise<
            MaintenancePlan[]
          >,
          api.listHseRecords(session.companyId) as Promise<HseRecord[]>,
          api.listFailures(session.companyId) as Promise<Failure[]>,
        ]);

        const taskArrays = await Promise.all(
          projects.map((p: Project) => api.listTasks(p.id) as Promise<Task[]>),
        );
        const allTasks = taskArrays.flat();

        setTasks(allTasks.filter((t: Task) => t.assigneeId === personnelId));
        setMaintenancePlans(
          allPlans.filter((p: MaintenancePlan) => p.assignedTo === personnelId),
        );
        setHseRecords(
          allHse.filter((h: HseRecord) => h.reportedBy === personnelId),
        );
        setFailures(
          allFailures.filter((f: Failure) => f.reportedBy === personnelId),
        );
      } catch {
        toast.error("Personel verileri yüklenirken hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [api, personnelId, session.companyId]);

  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const completionPct =
    tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const today = new Date().toISOString().split("T")[0];

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-64"
        data-ocid="personnel-detail.loading_state"
      >
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-ocid="personnel-detail.panel">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("performance")}
        data-ocid="personnel-detail.back.button"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Performans Raporlarına Dön
      </Button>

      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <h2
                className="text-2xl font-bold"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                {personnelId}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Personel Detay Sayfası
              </p>
            </div>
          </div>

          {/* Summary badges */}
          <div className="flex flex-wrap gap-3 mt-5 pt-5 border-t border-border">
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
              <ClipboardList className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">{tasks.length} görev</span>
              {tasks.length > 0 && (
                <Badge
                  variant="outline"
                  className="text-xs border-emerald-200 text-emerald-700"
                >
                  %{completionPct}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
              <Wrench className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-medium">
                {maintenancePlans.length} bakım planı
              </span>
            </div>
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
              <ShieldAlert className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">
                {hseRecords.length} İSG kaydı
              </span>
            </div>
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium">
                {failures.length} arıza bildirimi
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card data-ocid="personnel-detail.tasks.section">
        <CardHeader className="pb-3">
          <CardTitle
            className="text-base flex items-center gap-2"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            <ClipboardList className="w-4 h-4 text-blue-500" />
            Atanan Görevler
            {tasks.length > 0 && (
              <span className="ml-1 text-xs bg-muted rounded-full px-2 py-0.5 text-muted-foreground font-normal">
                {tasks.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div
              className="flex flex-col items-center gap-2 py-8 text-center"
              data-ocid="personnel-detail.tasks.empty"
            >
              <ClipboardList className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Bu personele atanmış görev yok.
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Başlık</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Bitiş Tarihi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((t, idx) => (
                    <TableRow
                      key={String(t.id)}
                      data-ocid={`personnel-detail.task.${idx + 1}`}
                    >
                      <TableCell className="font-medium">{t.title}</TableCell>
                      <TableCell>
                        <StatusPill
                          status={t.status}
                          config={taskStatusConfig}
                        />
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {t.dueDate || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Maintenance Plans */}
      <Card data-ocid="personnel-detail.maintenance.section">
        <CardHeader className="pb-3">
          <CardTitle
            className="text-base flex items-center gap-2"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            <Wrench className="w-4 h-4 text-indigo-500" />
            Sorumlu Olduğu Bakım Planları
            {maintenancePlans.length > 0 && (
              <span className="ml-1 text-xs bg-muted rounded-full px-2 py-0.5 text-muted-foreground font-normal">
                {maintenancePlans.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {maintenancePlans.length === 0 ? (
            <div
              className="flex flex-col items-center gap-2 py-8 text-center"
              data-ocid="personnel-detail.maintenance.empty"
            >
              <Wrench className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Bu personele atanmış bakım planı yok.
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Başlık</TableHead>
                    <TableHead>Periyot</TableHead>
                    <TableHead>Sonraki Tarih</TableHead>
                    <TableHead>Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenancePlans.map((plan, idx) => {
                    const isOverdue =
                      plan.nextDate < today &&
                      plan.status.toLowerCase() !== "completed";
                    return (
                      <TableRow
                        key={plan.id}
                        className={isOverdue ? "bg-red-50" : ""}
                        data-ocid={`personnel-detail.maintenance.${idx + 1}`}
                      >
                        <TableCell className="font-medium">
                          {plan.title}
                        </TableCell>
                        <TableCell className="text-sm">
                          {frequencyLabel[plan.frequency] || plan.frequency}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1.5">
                            <span>{plan.nextDate || "—"}</span>
                            {isOverdue && (
                              <span className="text-xs text-red-600 font-medium">
                                Gecikmiş
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusPill
                            status={plan.status}
                            config={maintenanceStatusConfig}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* HSE Records */}
      <Card data-ocid="personnel-detail.hse.section">
        <CardHeader className="pb-3">
          <CardTitle
            className="text-base flex items-center gap-2"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            <ShieldAlert className="w-4 h-4 text-orange-500" />
            İSG Kayıtları
            {hseRecords.length > 0 && (
              <span className="ml-1 text-xs bg-muted rounded-full px-2 py-0.5 text-muted-foreground font-normal">
                {hseRecords.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hseRecords.length === 0 ? (
            <div
              className="flex flex-col items-center gap-2 py-8 text-center"
              data-ocid="personnel-detail.hse.empty"
            >
              <ShieldAlert className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Bu personele ait İSG kaydı yok.
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Başlık</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead className="hidden md:table-cell">Önem</TableHead>
                    <TableHead>Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hseRecords.map((h, idx) => (
                    <TableRow
                      key={h.id}
                      data-ocid={`personnel-detail.hse.${idx + 1}`}
                    >
                      <TableCell className="font-medium">{h.title}</TableCell>
                      <TableCell>
                        <StatusPill status={h.hseType} config={hseTypeConfig} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {h.severity || "—"}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {h.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Failures */}
      {failures.length > 0 && (
        <Card data-ocid="personnel-detail.failures.section">
          <CardHeader className="pb-3">
            <CardTitle
              className="text-base flex items-center gap-2"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Bildirdiği Arızalar
              <span className="ml-1 text-xs bg-muted rounded-full px-2 py-0.5 text-muted-foreground font-normal">
                {failures.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Başlık</TableHead>
                    <TableHead>Önem</TableHead>
                    <TableHead>Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {failures.map((f, idx) => (
                    <TableRow
                      key={f.id}
                      data-ocid={`personnel-detail.failure.${idx + 1}`}
                    >
                      <TableCell className="font-medium">{f.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {f.severity}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {f.status}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
