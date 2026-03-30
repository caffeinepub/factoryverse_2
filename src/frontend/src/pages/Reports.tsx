import type { Session } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActor } from "@/hooks/useActor";
import { BarChart3, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  session: Session;
}

interface ReportData {
  machineTotal: number;
  machineActive: number;
  machineMaintenance: number;
  machineIdle: number;
  failureTotal: number;
  failureOpen: number;
  failureResolved: number;
  projectTotal: number;
  projectPending: number;
  projectActive: number;
  projectCompleted: number;
  projectOnHold: number;
  taskTotal: number;
  taskDone: number;
  hseOpen: number;
  shipmentPlanned: number;
  shipmentInTransit: number;
  shipmentDelivered: number;
  topCostProjects: { name: string; total: number }[];
}

export default function Reports({ session }: Props) {
  const { actor } = useActor();
  const api = actor as any;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: actor stabilizes after init
  useEffect(() => {
    const load = async () => {
      if (!session.companyId || !api) {
        setLoading(false);
        return;
      }
      try {
        const [machines, failures, projects, shipments, hseRecords, costs] =
          await Promise.all([
            api.listMachines(session.companyId),
            api.listFailures(session.companyId),
            api.listProjects(session.companyId),
            api.listShipments(session.companyId),
            api.listHseRecords(session.companyId),
            api.listProjectCosts(session.companyId),
          ]);

        // Load tasks for all projects
        const taskArrays = await Promise.all(
          (projects as any[]).map((p: any) => api.listTasks(p.id)),
        );
        const allTasks = (taskArrays as any[][]).flat();

        // Cost per project
        const costMap: Record<string, number> = {};
        for (const c of costs as any[]) {
          costMap[c.projectId] = (costMap[c.projectId] || 0) + Number(c.amount);
        }
        const projectCostList = (projects as any[]).map((p: any) => ({
          name: p.name,
          total: costMap[p.id] || 0,
        }));
        projectCostList.sort((a, b) => b.total - a.total);
        const topCostProjects = projectCostList.slice(0, 3);

        setData({
          machineTotal: (machines as any[]).length,
          machineActive: (machines as any[]).filter(
            (m: any) => m.status === "Active",
          ).length,
          machineMaintenance: (machines as any[]).filter(
            (m: any) => m.status === "Maintenance",
          ).length,
          machineIdle: (machines as any[]).filter(
            (m: any) => m.status === "Idle",
          ).length,
          failureTotal: (failures as any[]).length,
          failureOpen: (failures as any[]).filter(
            (f: any) => f.status === "open",
          ).length,
          failureResolved: (failures as any[]).filter(
            (f: any) => f.status === "resolved",
          ).length,
          projectTotal: (projects as any[]).length,
          projectPending: (projects as any[]).filter(
            (p: any) => p.status === "pending" || p.status === "Planlama",
          ).length,
          projectActive: (projects as any[]).filter(
            (p: any) => p.status === "active" || p.status === "Aktif",
          ).length,
          projectCompleted: (projects as any[]).filter(
            (p: any) => p.status === "completed" || p.status === "Tamamlandı",
          ).length,
          projectOnHold: (projects as any[]).filter(
            (p: any) => p.status === "on-hold" || p.status === "Beklemede",
          ).length,
          taskTotal: allTasks.length,
          taskDone: allTasks.filter((t: any) => t.status === "done").length,
          hseOpen: (hseRecords as any[]).filter(
            (h: any) => h.status === "open" || h.status === "Açık",
          ).length,
          shipmentPlanned: (shipments as any[]).filter(
            (s: any) => s.status === "planned" || s.status === "Planlandı",
          ).length,
          shipmentInTransit: (shipments as any[]).filter(
            (s: any) => s.status === "in-transit" || s.status === "Yolda",
          ).length,
          shipmentDelivered: (shipments as any[]).filter(
            (s: any) =>
              s.status === "delivered" || s.status === "Teslim Edildi",
          ).length,
          topCostProjects,
        });
      } catch {
        toast.error("Rapor verileri yüklenirken hata oluştu.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [session.companyId, actor]);

  const taskPct =
    data && data.taskTotal > 0
      ? Math.round((data.taskDone / data.taskTotal) * 100)
      : 0;

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(n);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-64"
        data-ocid="reports.loading_state"
      >
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className="text-center py-16 text-muted-foreground"
        data-ocid="reports.error_state"
      >
        Veri yüklenemedi.
      </div>
    );
  }

  return (
    <div className="space-y-6" data-ocid="reports.page">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Raporlar & İstatistikler
          </h2>
          <p className="text-muted-foreground text-sm">Operasyonel özet</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Makineler */}
        <Card className="border" data-ocid="reports.machines.card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Makine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mb-3">{data.machineTotal}</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-green-700">Aktif</span>
                <span className="font-medium">{data.machineActive}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-green-500 h-1.5 rounded-full transition-all"
                  style={{
                    width: data.machineTotal
                      ? `${(data.machineActive / data.machineTotal) * 100}%`
                      : "0%",
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-yellow-700">Bakımda</span>
                <span className="font-medium">{data.machineMaintenance}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Beklemede</span>
                <span className="font-medium">{data.machineIdle}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Arızalar */}
        <Card className="border" data-ocid="reports.failures.card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Arıza Kayıtları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mb-3">{data.failureTotal}</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-red-600">Açık</span>
                <span className="font-medium">{data.failureOpen}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-red-500 h-1.5 rounded-full transition-all"
                  style={{
                    width: data.failureTotal
                      ? `${(data.failureOpen / data.failureTotal) * 100}%`
                      : "0%",
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-green-700">Çözüldü</span>
                <span className="font-medium">{data.failureResolved}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projeler */}
        <Card className="border" data-ocid="reports.projects.card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Projeler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mb-3">{data.projectTotal}</p>
            <div className="space-y-1">
              {[
                {
                  label: "Planlama",
                  count: data.projectPending,
                  color: "bg-gray-400",
                },
                {
                  label: "Aktif",
                  count: data.projectActive,
                  color: "bg-blue-500",
                },
                {
                  label: "Tamamlandı",
                  count: data.projectCompleted,
                  color: "bg-green-500",
                },
                {
                  label: "Beklemede",
                  count: data.projectOnHold,
                  color: "bg-yellow-500",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 text-xs"
                >
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-muted-foreground flex-1">
                    {item.label}
                  </span>
                  <span className="font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Görev Tamamlanma */}
        <Card className="border" data-ocid="reports.tasks.card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Görev Tamamlanma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mb-1">{taskPct}%</p>
            <p className="text-xs text-muted-foreground mb-3">
              {data.taskDone} / {data.taskTotal} görev
            </p>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${taskPct}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* İSG */}
        <Card className="border" data-ocid="reports.hse.card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Açık İSG Kayıtları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-3xl font-bold ${
                data.hseOpen > 0 ? "text-orange-600" : "text-green-600"
              }`}
            >
              {data.hseOpen}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.hseOpen > 0
                ? "Acil müdahale gerekebilir"
                : "Tüm kayıtlar kapalı"}
            </p>
          </CardContent>
        </Card>

        {/* Lojistik */}
        <Card className="border" data-ocid="reports.logistics.card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lojistik Durumu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mb-3">
              {data.shipmentPlanned +
                data.shipmentInTransit +
                data.shipmentDelivered}
            </p>
            <div className="space-y-1">
              {[
                {
                  label: "Planlandı",
                  count: data.shipmentPlanned,
                  color: "bg-gray-400",
                },
                {
                  label: "Yolda",
                  count: data.shipmentInTransit,
                  color: "bg-blue-500",
                },
                {
                  label: "Teslim Edildi",
                  count: data.shipmentDelivered,
                  color: "bg-green-500",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 text-xs"
                >
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-muted-foreground flex-1">
                    {item.label}
                  </span>
                  <span className="font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Toplam Maliyet - Top 3 projeler */}
        <Card className="border col-span-2" data-ocid="reports.costs.card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En Yüksek Maliyetli Projeler (İlk 3)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topCostProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Henüz maliyet kaydı yok.
              </p>
            ) : (
              <div className="space-y-3">
                {data.topCostProjects.map((proj, i) => {
                  const maxCost = data.topCostProjects[0]?.total || 1;
                  const pct = Math.round((proj.total / maxCost) * 100);
                  return (
                    <div key={proj.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                              i === 0
                                ? "bg-yellow-100 text-yellow-700"
                                : i === 1
                                  ? "bg-gray-100 text-gray-600"
                                  : "bg-orange-100 text-orange-600"
                            }`}
                          >
                            {i + 1}
                          </span>
                          <span className="font-medium truncate max-w-[160px]">
                            {proj.name}
                          </span>
                        </span>
                        <span className="text-muted-foreground font-mono text-xs">
                          {formatCurrency(proj.total)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
