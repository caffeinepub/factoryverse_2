import type { Session } from "@/App";
import type { MaintenancePlan } from "@/backend.d";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@/hooks/useActor";
import {
  ChevronDown,
  ClipboardCheck,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  session: Session;
}

interface ProjectItem {
  id: string;
  name: string;
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  active: {
    label: "Aktif",
    cls: "bg-green-100 text-green-700 border-green-200",
  },
  completed: {
    label: "Tamamlandı",
    cls: "bg-blue-100 text-blue-700 border-blue-200",
  },
  cancelled: { label: "İptal", cls: "bg-red-100 text-red-700 border-red-200" },
};

const frequencyLabels: Record<string, string> = {
  daily: "Günlük",
  weekly: "Haftalık",
  monthly: "Aylık",
  yearly: "Yıllık",
  custom: "Özel",
};

const emptyForm = {
  machineId: "",
  title: "",
  description: "",
  frequency: "monthly",
  nextDate: "",
  assignedTo: "",
};

const isAdmin = (role: string) =>
  role === "admin" || role === "companyAdmin" || role === "manager";

export default function MaintenancePlanPage({ session }: Props) {
  const { actor } = useActor();
  const api = actor as any;
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MaintenancePlan | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    frequency: "monthly",
    nextDate: "",
    assignedTo: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Project link state
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [planProjectMap, setPlanProjectMap] = useState<Record<string, string>>(
    {},
  );
  const [linkProjectOpen, setLinkProjectOpen] = useState(false);
  const [linkPlanTarget, setLinkPlanTarget] = useState<MaintenancePlan | null>(
    null,
  );
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [linkProjectSaving, setLinkProjectSaving] = useState(false);

  const loadProjects = async () => {
    if (!actor || !session.companyId) return;
    try {
      const [projs, planProjs] = await Promise.all([
        actor.listProjects(session.companyId) as Promise<ProjectItem[]>,
        api.listMaintenancePlanProjects
          ? api.listMaintenancePlanProjects(session.companyId)
          : Promise.resolve([]),
      ]);
      setProjects(projs);
      // Build map from array of {planId, projectId} or map directly
      if (Array.isArray(planProjs)) {
        const map: Record<string, string> = {};
        for (const item of planProjs as any[]) {
          if (item?.planId && item?.projectId)
            map[item.planId] = item.projectId;
          else if (item?.[0] && item?.[1]) map[item[0]] = item[1];
        }
        setPlanProjectMap(map);
      }
    } catch {
      // ignore
    }
  };

  const loadPlans = async () => {
    if (!actor) return;
    try {
      const data = await api.listMaintenancePlans(session.companyId);
      setPlans(
        data.sort((a: MaintenancePlan, b: MaintenancePlan) =>
          a.nextDate > b.nextDate ? 1 : -1,
        ),
      );
    } catch {
      toast.error("Planlar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: actor stabilizes after init
  useEffect(() => {
    loadPlans();
    loadProjects();
  }, [actor]);

  const handleSubmit = async () => {
    if (!actor) return;
    if (!form.title.trim() || !form.nextDate) {
      toast.error("Başlık ve tarih zorunludur.");
      return;
    }
    setSaving(true);
    try {
      await api.addMaintenancePlan(
        session.companyId,
        form.machineId,
        form.title,
        form.description,
        form.frequency,
        form.nextDate,
        form.assignedTo,
      );
      toast.success("Bakım planı eklendi.");
      setOpen(false);
      setForm(emptyForm);
      loadPlans();
    } catch {
      toast.error("Plan eklenemedi.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (planId: string, status: string) => {
    if (!actor) return;
    try {
      await api.updateMaintenancePlanStatus(planId, status);
      toast.success("Durum güncellendi.");
      loadPlans();
    } catch {
      toast.error("Durum güncellenemedi.");
    }
  };

  const openEdit = (plan: MaintenancePlan) => {
    setEditTarget(plan);
    setEditForm({
      title: plan.title,
      description: plan.description ?? "",
      frequency: plan.frequency,
      nextDate: plan.nextDate,
      assignedTo: plan.assignedTo ?? "",
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!actor || !editTarget) return;
    if (!editForm.title.trim() || !editForm.nextDate) {
      toast.error("Başlık ve tarih zorunludur.");
      return;
    }
    setEditSaving(true);
    try {
      await api.updateMaintenancePlan(
        editTarget.id,
        editForm.title,
        editForm.description,
        editForm.frequency,
        editForm.nextDate,
        editForm.assignedTo,
      );
      toast.success("Plan güncellendi.");
      setEditOpen(false);
      setEditTarget(null);
      loadPlans();
    } catch {
      toast.error("Güncelleme başarısız.");
    } finally {
      setEditSaving(false);
    }
  };

  const openLinkProject = (plan: MaintenancePlan) => {
    setLinkPlanTarget(plan);
    setSelectedProjectId(planProjectMap[plan.id] ?? "");
    setLinkProjectOpen(true);
  };

  const handleLinkProject = async () => {
    if (!linkPlanTarget || !api) return;
    setLinkProjectSaving(true);
    try {
      await api.linkMaintenancePlanToProject(
        linkPlanTarget.id,
        selectedProjectId,
      );
      setPlanProjectMap((prev) => ({
        ...prev,
        [linkPlanTarget.id]: selectedProjectId,
      }));
      toast.success("Bakım planı projeye bağlandı.");
      setLinkProjectOpen(false);
    } catch {
      toast.error("Bağlama sırasında hata oluştu.");
    } finally {
      setLinkProjectSaving(false);
    }
  };

  const handleDelete = async (plan: MaintenancePlan) => {
    if (
      !window.confirm(
        `"${plan.title}" planını silmek istediğinizden emin misiniz?`,
      )
    )
      return;
    setDeletingId(plan.id);
    try {
      await api.deleteMaintenancePlan(plan.id);
      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
      toast.success("Plan silindi.");
    } catch {
      toast.error("Silinemedi.");
    } finally {
      setDeletingId(null);
    }
  };

  const canEdit = isAdmin(session.role);

  const planFormFields = (
    vals: typeof editForm,
    set: (fn: (p: typeof editForm) => typeof editForm) => void,
  ) => (
    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label>Başlık *</Label>
        <Input
          placeholder="Örn: Aylık yağlama bakımı"
          maxLength={80}
          value={vals.title}
          onChange={(e) => set((p) => ({ ...p, title: e.target.value }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Periyot</Label>
          <Select
            value={vals.frequency}
            onValueChange={(v) => set((p) => ({ ...p, frequency: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Günlük</SelectItem>
              <SelectItem value="weekly">Haftalık</SelectItem>
              <SelectItem value="monthly">Aylık</SelectItem>
              <SelectItem value="yearly">Yıllık</SelectItem>
              <SelectItem value="custom">Özel</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Sonraki Tarih *</Label>
          <Input
            type="date"
            value={vals.nextDate}
            onChange={(e) => set((p) => ({ ...p, nextDate: e.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Atanan Personel</Label>
        <Input
          placeholder="Personel adı veya ID"
          value={vals.assignedTo}
          onChange={(e) => set((p) => ({ ...p, assignedTo: e.target.value }))}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Açıklama</Label>
        <Textarea
          placeholder="Yapılacak işlemler..."
          maxLength={300}
          rows={3}
          value={vals.description}
          onChange={(e) => set((p) => ({ ...p, description: e.target.value }))}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Önleyici Bakım Planı
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Planlı bakım görevlerini takip edin
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Yeni Plan
            </Button>
          </DialogTrigger>
          <DialogContent aria-describedby="plan-dialog-desc">
            <DialogHeader>
              <DialogTitle>Bakım Planı Ekle</DialogTitle>
              <DialogDescription id="plan-dialog-desc">
                Yeni bir önleyici bakım planı oluşturun.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Başlık *</Label>
                <Input
                  placeholder="Örn: Aylık yağlama bakımı"
                  maxLength={80}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Makine ID (isteğe bağlı)</Label>
                <Input
                  placeholder="Makine kodu veya adı"
                  value={form.machineId}
                  onChange={(e) =>
                    setForm({ ...form, machineId: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Periyot</Label>
                  <Select
                    value={form.frequency}
                    onValueChange={(v) => setForm({ ...form, frequency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Günlük</SelectItem>
                      <SelectItem value="weekly">Haftalık</SelectItem>
                      <SelectItem value="monthly">Aylık</SelectItem>
                      <SelectItem value="yearly">Yıllık</SelectItem>
                      <SelectItem value="custom">Özel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Sonraki Tarih *</Label>
                  <Input
                    type="date"
                    value={form.nextDate}
                    onChange={(e) =>
                      setForm({ ...form, nextDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Atanan Personel</Label>
                <Input
                  placeholder="Personel adı veya ID"
                  value={form.assignedTo}
                  onChange={(e) =>
                    setForm({ ...form, assignedTo: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Açıklama</Label>
                <Textarea
                  placeholder="Yapılacak işlemler..."
                  maxLength={300}
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Kaydet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <ClipboardCheck className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">
              Henüz bakım planı yok.
            </p>
            <Button size="sm" onClick={() => setOpen(true)} className="gap-1">
              <Plus className="w-4 h-4" />
              İlk planı ekle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Başlık</TableHead>
                    <TableHead>Periyot</TableHead>
                    <TableHead>Sonraki Tarih</TableHead>
                    <TableHead>Atanan</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className={canEdit ? "w-28" : "w-10"} />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => {
                    const st = statusConfig[plan.status] ?? {
                      label: plan.status,
                      cls: "bg-gray-100 text-gray-600",
                    };
                    const today = new Date().toISOString().split("T")[0];
                    const overdue =
                      plan.status === "active" && plan.nextDate < today;
                    return (
                      <TableRow key={plan.id}>
                        <TableCell>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">
                              {plan.title}
                            </span>
                            {planProjectMap[plan.id] &&
                              (() => {
                                const proj = projects.find(
                                  (p) => p.id === planProjectMap[plan.id],
                                );
                                return proj ? (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-medium">
                                    {proj.name}
                                  </span>
                                ) : null;
                              })()}
                          </div>
                          {plan.machineId && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {plan.machineId}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {frequencyLabels[plan.frequency] ?? plan.frequency}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-sm font-medium ${overdue ? "text-red-600" : ""}`}
                          >
                            {plan.nextDate || "—"}
                            {overdue && (
                              <span className="ml-1 text-xs">(Gecikmiş)</span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {plan.assignedTo || "—"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${st.cls}`}
                          >
                            {st.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 justify-end">
                            {canEdit && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                                  onClick={() => openEdit(plan)}
                                  data-ocid="maintenance-plan.edit_button"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => handleDelete(plan)}
                                  disabled={deletingId === plan.id}
                                  data-ocid="maintenance-plan.delete_button"
                                >
                                  {deletingId === plan.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50"
                                  onClick={() => openLinkProject(plan)}
                                  title="Projeye Bağla"
                                  data-ocid="maintenance-plan.link_button"
                                >
                                  <Link2 className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatus(plan.id, "active")
                                  }
                                >
                                  Aktif
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatus(plan.id, "completed")
                                  }
                                >
                                  Tamamlandı
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatus(plan.id, "cancelled")
                                  }
                                  className="text-red-600"
                                >
                                  İptal
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Link to Project Dialog */}
      <Dialog open={linkProjectOpen} onOpenChange={setLinkProjectOpen}>
        <DialogContent aria-describedby="link-project-desc">
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Projeye Bağla
            </DialogTitle>
            <DialogDescription id="link-project-desc">
              "{linkPlanTarget?.title}" bakım planını bir projeye bağlayın.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Proje Seçin</Label>
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
            >
              <SelectTrigger data-ocid="maintenance-plan.link-project.select">
                <SelectValue placeholder="Proje seçin" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLinkProjectOpen(false)}
              data-ocid="maintenance-plan.link-project.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleLinkProject}
              disabled={!selectedProjectId || linkProjectSaving}
              data-ocid="maintenance-plan.link-project.confirm_button"
            >
              {linkProjectSaving && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {linkProjectSaving ? "Bağlanıyor..." : "Bağla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent aria-describedby="edit-plan-desc">
          <DialogHeader>
            <DialogTitle>Bakım Planını Düzenle</DialogTitle>
            <DialogDescription id="edit-plan-desc">
              Plan bilgilerini güncelleyin.
            </DialogDescription>
          </DialogHeader>
          {planFormFields(editForm, setEditForm)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleEdit} disabled={editSaving}>
              {editSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
