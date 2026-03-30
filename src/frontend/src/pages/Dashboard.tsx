import type { Page, Session } from "@/App";
import type {
  FailureWithProject as Failure,
  Machine,
  Project,
  Task,
} from "@/backend.d";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useActor } from "@/hooks/useActor";
import {
  AlertTriangle,
  Cpu,
  FolderKanban,
  Loader2,
  PlayCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  session: Session;
  navigate: (p: Page) => void;
}

const projectStatusMap: Record<string, { label: string; cls: string }> = {
  active: { label: "Aktif", cls: "bg-green-100 text-green-700" },
  Active: { label: "Aktif", cls: "bg-green-100 text-green-700" },
  completed: { label: "Tamamlandı", cls: "bg-blue-100 text-blue-700" },
  Completed: { label: "Tamamlandı", cls: "bg-blue-100 text-blue-700" },
  planning: { label: "Planlama", cls: "bg-yellow-100 text-yellow-700" },
  Planning: { label: "Planlama", cls: "bg-yellow-100 text-yellow-700" },
  OnHold: { label: "Beklemede", cls: "bg-orange-100 text-orange-700" },
  paused: { label: "Durduruldu", cls: "bg-gray-100 text-gray-600" },
};

export default function Dashboard({ session, navigate }: Props) {
  const { actor } = useActor();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [failures, setFailures] = useState<Failure[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: actor stabilizes after init
  useEffect(() => {
    if (!session.companyId || !actor) {
      setLoading(false);
      return;
    }
    const anyActor = actor as any;
    Promise.all([
      actor.listMachines(session.companyId),
      actor.listProjects(session.companyId),
      anyActor.listFailures(session.companyId) as Promise<Failure[]>,
      anyActor.listAllTasks(session.companyId) as Promise<Task[]>,
    ])
      .then(([m, p, f, t]) => {
        setMachines(m);
        setProjects(p);
        setFailures(f);
        setTasks(t);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session.companyId, actor]);

  const activeProjects = projects.filter(
    (p) => p.status === "Active" || p.status === "active",
  );
  const openFailures = failures.filter((f) => f.status === "open");

  const kpis = [
    {
      label: "Toplam Makine",
      value: machines.length,
      icon: Cpu,
      color: "text-indigo-600",
    },
    {
      label: "Toplam Proje",
      value: projects.length,
      icon: FolderKanban,
      color: "text-violet-600",
    },
    {
      label: "Aktif Proje",
      value: activeProjects.length,
      icon: PlayCircle,
      color: "text-green-600",
    },
    {
      label: "Açık Arıza",
      value: openFailures.length,
      icon: AlertTriangle,
      color: openFailures.length > 0 ? "text-red-500" : "text-slate-400",
    },
  ];

  const recentProjects = [...projects]
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    .slice(0, 3);

  // Chart data
  const projectStatusCounts: Record<string, number> = {};
  for (const p of projects) {
    const key = p.status || "Planning";
    projectStatusCounts[key] = (projectStatusCounts[key] || 0) + 1;
  }
  const projectStatusLabels: Record<string, string> = {
    Planning: "Planlama",
    Active: "Aktif",
    Completed: "Tamamlandı",
    OnHold: "Beklemede",
  };
  const projectStatusColors: Record<string, string> = {
    Planning: "#6366f1",
    Active: "#22c55e",
    Completed: "#94a3b8",
    OnHold: "#f97316",
  };
  const pieData = Object.entries(projectStatusCounts).map(([key, value]) => ({
    name: projectStatusLabels[key] ?? key,
    value,
    color: projectStatusColors[key] ?? "#6366f1",
  }));

  const failureStatusCounts = {
    open: failures.filter((f) => f.status === "open").length,
    "in-progress": failures.filter((f) => f.status === "in-progress").length,
    resolved: failures.filter((f) => f.status === "resolved").length,
  };
  const barData = [
    { name: "Açık", value: failureStatusCounts.open, color: "#ef4444" },
    {
      name: "İşlemde",
      value: failureStatusCounts["in-progress"],
      color: "#f97316",
    },
    { name: "Çözüldü", value: failureStatusCounts.resolved, color: "#22c55e" },
  ];

  // Project completion rates
  const projectCompletionData = projects
    .map((p) => {
      const projectTasks = tasks.filter((t) => t.projectId === p.id);
      const total = projectTasks.length;
      const done = projectTasks.filter((t) => t.status === "done").length;
      const rate = total === 0 ? 0 : Math.round((done / total) * 100);
      return { project: p, total, done, rate };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .filter((item) => item.total > 0 || projects.length <= 5);

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
        >
          Hoş Geldiniz 👋
        </h2>
        <p className="text-muted-foreground text-sm">
          Şirket ID:{" "}
          <span className="font-mono text-xs">{session.companyId || "—"}</span>
        </p>
      </div>

      {loading ? (
        <div
          className="flex items-center justify-center h-40"
          data-ocid="dashboard.loading_state"
        >
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <Card key={kpi.label}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {kpi.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between">
                      <span
                        className="text-3xl font-bold"
                        style={{
                          fontFamily: "'Bricolage Grotesque', sans-serif",
                        }}
                      >
                        {kpi.value}
                      </span>
                      <Icon className={`w-6 h-6 ${kpi.color}`} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Charts */}
          {projects.length > 0 || failures.length > 0 ? (
            <div>
              <h3
                className="text-base font-semibold mb-3"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                İstatistikler
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Project Status Pie */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Proje Durumu Dağılımı
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pieData.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-8">
                        Veri yok
                      </p>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {pieData.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value, name) => [value, name]}
                            contentStyle={{ fontSize: 12 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {pieData.map((d) => (
                        <div key={d.name} className="flex items-center gap-1.5">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ background: d.color }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {d.name}: {d.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Failure Status Bar */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Arıza Durumu Dağılımı
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={barData}
                        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                      >
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                        <Tooltip contentStyle={{ fontSize: 12 }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {barData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {barData.map((d) => (
                        <div key={d.name} className="flex items-center gap-1.5">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ background: d.color }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {d.name}: {d.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}

          {/* Quick Actions */}
          <div>
            <h3
              className="text-base font-semibold mb-3"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Hızlı İşlemler
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card
                className="border-dashed hover:border-primary/60 hover:bg-primary/5 transition-colors cursor-pointer group"
                onClick={() => navigate("machines")}
                data-ocid="dashboard.machines.card"
              >
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                    <Cpu className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Makine Ekle</p>
                    <p className="text-muted-foreground text-xs">
                      Yeni makine kaydı oluştur
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card
                className="border-dashed hover:border-primary/60 hover:bg-primary/5 transition-colors cursor-pointer group"
                onClick={() => navigate("projects")}
                data-ocid="dashboard.projects.card"
              >
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center group-hover:bg-violet-500 transition-colors">
                    <FolderKanban className="w-5 h-5 text-violet-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Proje Oluştur</p>
                    <p className="text-muted-foreground text-xs">
                      Yeni proje başlat
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Projects */}
          {recentProjects.length > 0 && (
            <div>
              <h3
                className="text-base font-semibold mb-3"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Son Projeler
              </h3>
              <div className="space-y-2">
                {recentProjects.map((p, idx) => {
                  const st = projectStatusMap[p.status] ?? {
                    label: p.status,
                    cls: "bg-gray-100 text-gray-600",
                  };
                  return (
                    <Card
                      key={p.id}
                      data-ocid={`dashboard.projects.item.${idx + 1}`}
                    >
                      <CardContent className="py-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{p.name}</p>
                          {p.deadline && (
                            <p className="text-muted-foreground text-xs">
                              Son tarih: {p.deadline}
                            </p>
                          )}
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${st.cls}`}
                        >
                          {st.label}
                        </span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Project Completion Rates */}
          {projects.length > 0 && (
            <div>
              <h3
                className="text-base font-semibold mb-3"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Proje Tamamlanma Oranları
              </h3>
              <Card data-ocid="dashboard.completion.card">
                <CardContent className="pt-4 space-y-4">
                  {projectCompletionData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Görev verisi bulunan proje yok.
                    </p>
                  ) : (
                    projectCompletionData.map((item, idx) => {
                      const st = projectStatusMap[item.project.status] ?? {
                        label: item.project.status,
                        cls: "bg-gray-100 text-gray-600",
                      };
                      return (
                        <div
                          key={item.project.id}
                          className="space-y-1"
                          data-ocid={`dashboard.completion.item.${idx + 1}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate max-w-[180px]">
                                {item.project.name}
                              </span>
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${st.cls}`}
                              >
                                {st.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {item.done}/{item.total} görev
                              </span>
                              <span className="text-sm font-bold w-10 text-right">
                                {item.rate}%
                              </span>
                            </div>
                          </div>
                          <Progress value={item.rate} className="h-2" />
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Machines */}
          {machines.length > 0 && (
            <div>
              <h3
                className="text-base font-semibold mb-3"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Son Eklenen Makineler
              </h3>
              <div className="space-y-2">
                {machines.slice(0, 3).map((m, idx) => (
                  <Card
                    key={m.id}
                    data-ocid={`dashboard.machines.item.${idx + 1}`}
                  >
                    <CardContent className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{m.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {m.machineType} · {m.location}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          m.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : m.status === "Maintenance"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {m.status}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
