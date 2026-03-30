import type { Page, Session } from "@/App";
import type { Failure, Machine, Project } from "@/backend.d";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActor } from "@/hooks/useActor";
import {
  AlertTriangle,
  Cpu,
  FolderKanban,
  Loader2,
  PlayCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  session: Session;
  navigate: (p: Page) => void;
}

const projectStatusMap: Record<string, { label: string; cls: string }> = {
  active: { label: "Aktif", cls: "bg-green-100 text-green-700" },
  Active: { label: "Aktif", cls: "bg-green-100 text-green-700" },
  completed: { label: "Tamamland\u0131", cls: "bg-blue-100 text-blue-700" },
  Completed: { label: "Tamamland\u0131", cls: "bg-blue-100 text-blue-700" },
  planning: { label: "Planlama", cls: "bg-yellow-100 text-yellow-700" },
  Planning: { label: "Planlama", cls: "bg-yellow-100 text-yellow-700" },
  paused: { label: "Durduruldu", cls: "bg-gray-100 text-gray-600" },
};

export default function Dashboard({ session, navigate }: Props) {
  const { actor } = useActor();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [failures, setFailures] = useState<Failure[]>([]);
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
    ])
      .then(([m, p, f]) => {
        setMachines(m);
        setProjects(p);
        setFailures(f);
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
      label: "A\u00e7\u0131k Ar\u0131za",
      value: openFailures.length,
      icon: AlertTriangle,
      color: openFailures.length > 0 ? "text-red-500" : "text-slate-400",
    },
  ];

  const recentProjects = [...projects]
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
        >
          Ho\u015f Geldiniz \ud83d\udc4b
        </h2>
        <p className="text-muted-foreground text-sm">
          \u015eirket ID:{" "}
          <span className="font-mono text-xs">
            {session.companyId || "\u2014"}
          </span>
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

          {/* Quick Actions */}
          <div>
            <h3
              className="text-base font-semibold mb-3"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              H\u0131zl\u0131 \u0130\u015flemler
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
                      Yeni makine kayd\u0131 olu\u015ftur
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
                    <p className="font-semibold text-sm">Proje Olu\u015ftur</p>
                    <p className="text-muted-foreground text-xs">
                      Yeni proje ba\u015flat
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
                          {m.machineType} \u00b7 {m.location}
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
