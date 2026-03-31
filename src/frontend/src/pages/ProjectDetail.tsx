import type { Page, Session } from "@/App";
import type {
  FailureWithProject,
  Personnel,
  ProjectAssignment,
  Task,
} from "@/backend.d";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActor } from "@/hooks/useActor";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  Loader2,
  PiggyBank,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ProjectCostData {
  id: string;
  companyId: string;
  projectId: string;
  title: string;
  category: string;
  amount: number;
  currency: string;
  description: string;
  createdBy: string;
  createdAt: bigint;
}

interface Project {
  id: string;
  name: string;
  companyId: string;
  status: string;
  deadline: string;
  createdAt: bigint;
  description: string;
}

interface Props {
  session: Session;
  projectId: string;
  navigate: (p: Page) => void;
}

const projectStatusConfig: Record<string, { label: string; cls: string }> = {
  Planning: { label: "Planlama", cls: "bg-blue-100 text-blue-700" },
  Active: { label: "Aktif", cls: "bg-green-100 text-green-700" },
  Completed: { label: "Tamamlandı", cls: "bg-gray-100 text-gray-700" },
  OnHold: { label: "Beklemede", cls: "bg-orange-100 text-orange-700" },
};

const taskStatusConfig: Record<string, { label: string; cls: string }> = {
  Todo: { label: "Yapılacak", cls: "bg-gray-100 text-gray-700" },
  InProgress: { label: "Devam Ediyor", cls: "bg-blue-100 text-blue-700" },
  Done: { label: "Tamamlandı", cls: "bg-green-100 text-green-700" },
  pending: { label: "Bekliyor", cls: "bg-gray-100 text-gray-700" },
  "in-progress": { label: "Devam Ediyor", cls: "bg-blue-100 text-blue-700" },
  completed: { label: "Tamamlandı", cls: "bg-green-100 text-green-700" },
};

const assignmentRoleConfig: Record<string, { label: string; cls: string }> = {
  Lider: { label: "Lider", cls: "bg-indigo-100 text-indigo-700" },
  Üye: { label: "Üye", cls: "bg-blue-100 text-blue-700" },
  Gözlemci: { label: "Gözlemci", cls: "bg-gray-100 text-gray-700" },
};

const severityConfig: Record<string, { label: string; cls: string }> = {
  low: { label: "Düşük", cls: "bg-gray-100 text-gray-700" },
  medium: { label: "Orta", cls: "bg-yellow-100 text-yellow-700" },
  high: { label: "Yüksek", cls: "bg-orange-100 text-orange-700" },
  critical: { label: "Kritik", cls: "bg-red-100 text-red-700" },
};

const failureStatusConfig: Record<string, { label: string; cls: string }> = {
  open: { label: "Açık", cls: "bg-red-100 text-red-700" },
  "in-progress": { label: "İşlemde", cls: "bg-blue-100 text-blue-700" },
  resolved: { label: "Çözüldü", cls: "bg-green-100 text-green-700" },
};

function StatusBadge({
  status,
  cfg,
}: { status: string; cfg: Record<string, { label: string; cls: string }> }) {
  const c = cfg[status] ?? { label: status, cls: "bg-gray-100 text-gray-700" };
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${c.cls}`}>
      {c.label}
    </span>
  );
}

export default function ProjectDetail({ session, projectId, navigate }: Props) {
  const { actor } = useActor();
  const api = actor as any;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [costs, setCosts] = useState<ProjectCostData[]>([]);
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([]);
  const [companyPersonnel, setCompanyPersonnel] = useState<Personnel[]>([]);
  const [failures, setFailures] = useState<FailureWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Budget state
  const [budget, setBudget] = useState(0);
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [budgetSaving, setBudgetSaving] = useState(false);

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedPersonnelId, setSelectedPersonnelId] = useState("");
  const [selectedRole, setSelectedRole] = useState("Üye");
  const [assigning, setAssigning] = useState(false);

  const isAdmin = session.role === "companyAdmin" || session.role === "admin";

  async function handleStatusChange(newStatus: string) {
    if (!project) return;
    setStatusUpdating(true);
    try {
      await api.updateProjectStatus(project.id, newStatus);
      setProject({ ...project, status: newStatus });
      toast.success("Proje durumu güncellendi.");
    } catch {
      toast.error("Durum güncellenemedi.");
    } finally {
      setStatusUpdating(false);
    }
  }

  const load = async () => {
    if (!api || !projectId) return;
    setLoading(true);
    try {
      const [
        allProjects,
        allTasks,
        allCosts,
        allAssignments,
        allPersonnel,
        allFailures,
      ] = await Promise.all([
        api.listProjects(session.companyId),
        api.listTasks(projectId),
        api.listProjectCosts(session.companyId),
        api.listProjectAssignments(projectId),
        api.listCompanyPersonnel(session.companyId),
        api.listFailures(session.companyId),
      ]);
      const found = (allProjects as Project[]).find((p) => p.id === projectId);
      setProject(found ?? null);
      setTasks((allTasks as Task[]) ?? []);
      setCosts(
        ((allCosts as ProjectCostData[]) ?? []).filter(
          (c) => c.projectId === projectId,
        ),
      );
      setAssignments((allAssignments as ProjectAssignment[]) ?? []);
      setCompanyPersonnel((allPersonnel as Personnel[]) ?? []);
      setFailures(
        ((allFailures as FailureWithProject[]) ?? []).filter(
          (f) => f.projectId === projectId,
        ),
      );
    } catch {
      toast.error("Proje verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: actor stabilizes after init
  useEffect(() => {
    load();
  }, [session.companyId, projectId, api]);

  // Load budget separately after actor ready
  // biome-ignore lint/correctness/useExhaustiveDependencies: actor stabilizes after init
  useEffect(() => {
    if (!api || !projectId) return;
    setBudgetLoading(true);
    api
      .getProjectBudget(projectId)
      .then((val: number | null) => {
        const b = val ?? 0;
        setBudget(b);
        setBudgetInput(b > 0 ? String(b) : "");
      })
      .catch(() => {})
      .finally(() => setBudgetLoading(false));
  }, [projectId, api]);

  const handleSaveBudget = async () => {
    const val = Number.parseFloat(budgetInput);
    if (!budgetInput || Number.isNaN(val) || val < 0) {
      toast.error("Geçerli bir bütçe miktarı girin.");
      return;
    }
    setBudgetSaving(true);
    try {
      await api.setProjectBudget(projectId, val);
      setBudget(val);
      toast.success("Bütçe kaydedildi.");
    } catch {
      toast.error("Bütçe kaydedilemedi.");
    } finally {
      setBudgetSaving(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedPersonnelId) {
      toast.error("Personel seçiniz.");
      return;
    }
    setAssigning(true);
    try {
      await api.assignPersonnelToProject(
        session.companyId,
        projectId,
        selectedPersonnelId,
        selectedRole,
      );
      toast.success("Personel projeye atandı.");
      setAssignDialogOpen(false);
      setSelectedPersonnelId("");
      setSelectedRole("Üye");
      await load();
    } catch (err: any) {
      const msg = String(err);
      if (msg.includes("already assigned")) {
        toast.error("Bu personel zaten bu projeye atanmış.");
      } else {
        toast.error("Atama sırasında hata oluştu.");
      }
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      await api.removePersonnelFromProject(assignmentId);
      toast.success("Personel projeden çıkarıldı.");
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    } catch {
      toast.error("Çıkarma işlemi başarısız.");
    }
  };

  const completedTasks = tasks.filter(
    (t) => t.status === "Done" || t.status === "completed",
  ).length;
  const completionRate =
    tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const sum = (cat?: string) =>
    costs
      .filter((c) => !cat || c.category === cat)
      .reduce((acc, c) => acc + c.amount, 0);

  const fmt = (v: number) =>
    `₺${v.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const summaryCards = [
    {
      label: "Toplam Maliyet",
      value: sum(),
      color: "from-indigo-500 to-purple-600",
    },
    {
      label: "Malzeme",
      value: sum("Malzeme"),
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "İşçilik",
      value: sum("İşçilik"),
      color: "from-orange-400 to-orange-500",
    },
    {
      label: "Ekipman",
      value: sum("Ekipman"),
      color: "from-purple-500 to-purple-600",
    },
  ];

  const assignedIds = new Set(assignments.map((a) => a.personnelId));
  const availablePersonnel = companyPersonnel.filter(
    (p) => !assignedIds.has(p.id),
  );

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-64"
        data-ocid="project-detail.loading_state"
      >
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div
        className="flex flex-col items-center justify-center h-64 gap-4"
        data-ocid="project-detail.error_state"
      >
        <p className="text-muted-foreground">Proje bulunamadı.</p>
        <Button variant="outline" onClick={() => navigate("projects")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Projelere Dön
        </Button>
      </div>
    );
  }

  const statusCfg = projectStatusConfig[project.status] ?? {
    label: project.status,
    cls: "bg-gray-100 text-gray-700",
  };

  const totalCost = sum();
  const budgetPct = budget > 0 ? Math.min((totalCost / budget) * 100, 100) : 0;
  const budgetExceeded = budget > 0 && totalCost > budget;
  const barColor =
    budget === 0
      ? "bg-gray-300"
      : budgetExceeded
        ? "bg-red-500"
        : budgetPct >= 80
          ? "bg-yellow-400"
          : "bg-green-500";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("projects")}
          data-ocid="project-detail.back.button"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h2
              className="text-2xl font-bold"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              {project.name}
            </h2>
            {isAdmin ? (
              <div className="relative flex items-center gap-2">
                <Select
                  value={project.status}
                  onValueChange={handleStatusChange}
                  disabled={statusUpdating}
                >
                  <SelectTrigger
                    data-ocid="project-detail.status.select"
                    className={`h-7 text-sm px-3 py-0 rounded-full font-medium border-0 ${statusCfg.cls} w-auto gap-1`}
                  >
                    <SelectValue />
                    {statusUpdating && (
                      <Loader2 className="w-3 h-3 animate-spin ml-1" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planning">Planlama</SelectItem>
                    <SelectItem value="Active">Aktif</SelectItem>
                    <SelectItem value="Completed">Tamamlandı</SelectItem>
                    <SelectItem value="OnHold">Beklemede</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <span
                className={`text-sm px-3 py-1 rounded-full font-medium ${statusCfg.cls}`}
              >
                {statusCfg.label}
              </span>
            )}
          </div>
          {project.description && (
            <p className="text-muted-foreground text-sm mb-1">
              {project.description}
            </p>
          )}
          {project.deadline && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" />
              Son tarih: <span className="font-medium">{project.deadline}</span>
            </p>
          )}
        </div>
      </div>

      {/* Cost summary cards */}
      <div>
        <h3
          className="text-base font-semibold mb-3 flex items-center gap-2"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
        >
          <DollarSign className="w-4 h-4 text-primary" />
          Maliyet Özeti
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className={`rounded-xl bg-gradient-to-br ${card.color} p-4 text-white shadow`}
            >
              <p className="text-xs font-medium opacity-80 mb-1">
                {card.label}
              </p>
              <p
                className="text-lg font-bold"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                {fmt(card.value)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Budget widget */}
      <Card data-ocid="project-detail.budget.card">
        <CardHeader className="pb-3">
          <CardTitle
            className="text-base flex items-center gap-2"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            <PiggyBank className="w-4 h-4 text-primary" />
            Bütçe Durumu
            {budgetLoading && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground ml-1" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {budget > 0 ? (
            <div className="space-y-3">
              {/* Budget exceeded warning */}
              {budgetExceeded && (
                <div
                  className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2"
                  data-ocid="project-detail.budget.error_state"
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-semibold">Bütçe aşıldı!</span>
                  <span className="text-xs ml-auto">
                    +{fmt(totalCost - budget)}
                  </span>
                </div>
              )}

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Kullanım</span>
                  <span
                    className={
                      budgetExceeded ? "text-red-600 font-semibold" : ""
                    }
                  >
                    %{Math.round((totalCost / budget) * 100)}
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${budgetPct}%` }}
                  />
                </div>
              </div>

              {/* Amounts row */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-gray-50 px-2 py-2">
                  <p className="text-xs text-muted-foreground mb-0.5">Bütçe</p>
                  <p
                    className="text-sm font-bold text-foreground"
                    style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    {fmt(budget)}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 px-2 py-2">
                  <p className="text-xs text-muted-foreground mb-0.5">
                    Harcanan
                  </p>
                  <p
                    className={`text-sm font-bold ${
                      budgetExceeded ? "text-red-600" : "text-foreground"
                    }`}
                    style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    {fmt(totalCost)}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 px-2 py-2">
                  <p className="text-xs text-muted-foreground mb-0.5">Kalan</p>
                  <p
                    className={`text-sm font-bold ${
                      budgetExceeded ? "text-red-600" : "text-green-600"
                    }`}
                    style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    {budgetExceeded ? "-" : ""}
                    {fmt(Math.abs(budget - totalCost))}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            !isAdmin && (
              <p
                className="text-sm text-muted-foreground"
                data-ocid="project-detail.budget.empty_state"
              >
                Bütçe belirlenmemiş
              </p>
            )
          )}

          {/* Admin: set/update budget */}
          {isAdmin && (
            <div className="flex items-center gap-2 pt-1 border-t border-border">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-1 block">
                  {budget > 0 ? "Bütçeyi Güncelle" : "Bütçe Belirle"} (₺)
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Örn: 500000"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="h-8 text-sm"
                  data-ocid="project-detail.budget.input"
                />
              </div>
              <Button
                size="sm"
                className="mt-5"
                onClick={handleSaveBudget}
                disabled={budgetSaving || !budgetInput}
                data-ocid="project-detail.budget.save_button"
              >
                {budgetSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Kaydet"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Team section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3
            className="text-base font-semibold flex items-center gap-2"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            <Users className="w-4 h-4 text-primary" />
            Proje Ekibi
            <span className="text-xs font-normal text-muted-foreground ml-1">
              ({assignments.length} kişi)
            </span>
          </h3>
          {isAdmin && (
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  data-ocid="project-detail.assign.open_button"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Personel Ata
                </Button>
              </DialogTrigger>
              <DialogContent aria-describedby="assign-desc">
                <DialogHeader>
                  <DialogTitle
                    style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    Projeye Personel Ata
                  </DialogTitle>
                  <DialogDescription id="assign-desc">
                    Şirket personelinden birini bu projeye ekleyin.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label>Personel *</Label>
                    <Select
                      value={selectedPersonnelId}
                      onValueChange={setSelectedPersonnelId}
                    >
                      <SelectTrigger data-ocid="project-detail.assign.personnel_select">
                        <SelectValue placeholder="Personel seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePersonnel.length === 0 ? (
                          <SelectItem value="__none" disabled>
                            Atanabilecek personel yok
                          </SelectItem>
                        ) : (
                          availablePersonnel.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} ({p.id.slice(0, 8)}...)
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Rol</Label>
                    <Select
                      value={selectedRole}
                      onValueChange={setSelectedRole}
                    >
                      <SelectTrigger data-ocid="project-detail.assign.role_select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Lider">Lider</SelectItem>
                        <SelectItem value="Üye">Üye</SelectItem>
                        <SelectItem value="Gözlemci">Gözlemci</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setAssignDialogOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={handleAssign}
                    disabled={
                      assigning ||
                      !selectedPersonnelId ||
                      selectedPersonnelId === "__none"
                    }
                    data-ocid="project-detail.assign.submit_button"
                  >
                    {assigning ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    {assigning ? "Atanıyor..." : "Ata"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {assignments.length === 0 ? (
          <Card data-ocid="project-detail.team.empty_state">
            <CardContent className="py-8 flex flex-col items-center gap-2 text-center">
              <Users className="w-10 h-10 text-muted-foreground/40" />
              <p className="font-medium text-sm">Henüz personel atanmamış</p>
              {isAdmin && (
                <p className="text-muted-foreground text-xs">
                  "Personel Ata" butonuyla ekip üyelerini ekleyin.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {assignments.map((a, idx) => (
              <Card
                key={a.id}
                data-ocid={`project-detail.team.item.${idx + 1}`}
              >
                <CardContent className="py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span
                      className="text-xs font-bold text-primary"
                      style={{
                        fontFamily: "'Bricolage Grotesque', sans-serif",
                      }}
                    >
                      {a.personnelName
                        ? a.personnelName.slice(0, 2).toUpperCase()
                        : a.personnelId.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {a.personnelName || a.personnelId}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      ID: {a.personnelId.slice(0, 10)}...
                    </p>
                  </div>
                  <StatusBadge status={a.role} cfg={assignmentRoleConfig} />
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-red-500"
                      onClick={() => handleRemoveAssignment(a.id)}
                      data-ocid={`project-detail.team.remove.${idx + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Linked Failures section */}
      <div>
        <h3
          className="text-base font-semibold mb-3 flex items-center gap-2"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
        >
          <AlertTriangle className="w-4 h-4 text-primary" />
          Bağlı Arızalar
          <span className="text-xs font-normal text-muted-foreground ml-1">
            ({failures.length})
          </span>
        </h3>
        {failures.length === 0 ? (
          <Card data-ocid="project-detail.failures.empty_state">
            <CardContent className="py-8 flex flex-col items-center gap-2 text-center">
              <AlertTriangle className="w-10 h-10 text-muted-foreground/40" />
              <p className="font-medium text-sm">Bu projeye bağlı arıza yok</p>
              <p className="text-muted-foreground text-xs">
                Arıza bildirirken bu projeyi seçerek bağlayabilirsiniz.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {failures.map((f, idx) => {
              const sev = severityConfig[f.severity] ?? {
                label: f.severity,
                cls: "bg-gray-100 text-gray-700",
              };
              const st = failureStatusConfig[f.status] ?? {
                label: f.status,
                cls: "bg-gray-100 text-gray-700",
              };
              return (
                <Card
                  key={f.id}
                  data-ocid={`project-detail.failure.item.${idx + 1}`}
                >
                  <CardContent className="py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{f.title}</p>
                      {f.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {f.description}
                        </p>
                      )}
                      {f.machineId && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Makine: {f.machineId}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${sev.cls}`}
                      >
                        {sev.label}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.cls}`}
                      >
                        {st.label}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Tasks section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3
            className="text-base font-semibold flex items-center gap-2"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            <ClipboardList className="w-4 h-4 text-primary" />
            Görevler
          </h3>
          {tasks.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="font-medium text-green-600">
                {completedTasks}/{tasks.length}
              </span>
              <span className="text-muted-foreground">tamamlandı</span>
              <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                %{completionRate}
              </span>
            </div>
          )}
        </div>

        {tasks.length === 0 ? (
          <Card data-ocid="project-detail.tasks.empty_state">
            <CardContent className="py-10 flex flex-col items-center gap-2 text-center">
              <ClipboardList className="w-10 h-10 text-muted-foreground/40" />
              <p className="font-medium text-sm">Henüz görev eklenmemiş</p>
              <p className="text-muted-foreground text-xs">
                Görev Yönetimi modülünden bu projeye görev ekleyebilirsiniz.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {tasks.map((t, idx) => (
              <Card
                key={String(t.id)}
                data-ocid={`project-detail.task.item.${idx + 1}`}
              >
                <CardContent className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{t.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {t.assigneeId ? `Atanan: ${t.assigneeId}` : "Atanmamış"}
                      {t.dueDate ? ` · ${t.dueDate}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={t.status} cfg={taskStatusConfig} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Cost detail table */}
      {costs.length > 0 && (
        <div>
          <h3
            className="text-base font-semibold mb-3 flex items-center gap-2"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            <DollarSign className="w-4 h-4 text-primary" />
            Maliyet Detayları
          </h3>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                {costs.length} kayıt
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {costs.map((c, idx) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between px-4 py-3 gap-3"
                    data-ocid={`project-detail.cost.item.${idx + 1}`}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{c.title}</p>
                      {c.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {c.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          c.category === "Malzeme"
                            ? "bg-blue-100 text-blue-700"
                            : c.category === "İşçilik"
                              ? "bg-orange-100 text-orange-700"
                              : c.category === "Ekipman"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {c.category}
                      </span>
                      <span className="font-semibold text-sm">
                        ₺
                        {c.amount.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
