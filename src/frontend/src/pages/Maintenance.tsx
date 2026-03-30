import type { Session } from "@/App";
import type { FailureWithProject as Failure } from "@/backend.d";
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
  CheckCircle2,
  ChevronDown,
  FileDown,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  session: Session;
}

interface Project {
  id: string;
  name: string;
}

interface MaintenancePlan {
  id: string;
  title: string;
  machineId: string;
  period: string;
  nextDate: string;
  responsibleId: string;
  status: string;
}

const severityConfig: Record<string, { label: string; cls: string }> = {
  low: { label: "Düşük", cls: "bg-gray-100 text-gray-600 border-gray-200" },
  medium: {
    label: "Orta",
    cls: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  high: {
    label: "Yüksek",
    cls: "bg-orange-100 text-orange-700 border-orange-200",
  },
  critical: { label: "Kritik", cls: "bg-red-100 text-red-700 border-red-200" },
};

const statusConfig: Record<string, { label: string; cls: string }> = {
  open: { label: "Açık", cls: "bg-red-100 text-red-700 border-red-200" },
  "in-progress": {
    label: "İşlemde",
    cls: "bg-blue-100 text-blue-700 border-blue-200",
  },
  resolved: {
    label: "Çözüldü",
    cls: "bg-green-100 text-green-700 border-green-200",
  },
};

const statusOptions = Object.entries(statusConfig).map(
  ([value, { label }]) => ({ value, label }),
);

export default function Maintenance({ session }: Props) {
  const { actor } = useActor();
  const api = actor as any;
  const isAdmin = session.role === "companyAdmin" || session.role === "admin";
  const [failures, setFailures] = useState<Failure[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Resolve dialog
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolvingFailure, setResolvingFailure] = useState<Failure | null>(
    null,
  );
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolveSubmitting, setResolveSubmitting] = useState(false);

  // Bakım bağlama state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkingFailure, setLinkingFailure] = useState<Failure | null>(null);
  const [maintenancePlans, setMaintenancePlans] = useState<MaintenancePlan[]>(
    [],
  );
  const [plansLoading, setPlansLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [linkSubmitting, setLinkSubmitting] = useState(false);
  const [linkedFailures, setLinkedFailures] = useState<Record<string, string>>(
    {},
  );

  // Edit failure state
  const [editFailureOpen, setEditFailureOpen] = useState(false);
  const [editFailureTarget, setEditFailureTarget] = useState<Failure | null>(
    null,
  );
  const [editFailureForm, setEditFailureForm] = useState({
    title: "",
    description: "",
    severity: "medium",
  });
  const [editFailureSaving, setEditFailureSaving] = useState(false);

  // Delete failure state
  const [deleteFailureOpen, setDeleteFailureOpen] = useState(false);
  const [deleteFailureTarget, setDeleteFailureTarget] =
    useState<Failure | null>(null);
  const [deleteFailureSubmitting, setDeleteFailureSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    machineId: "",
    description: "",
    severity: "medium",
    reportedBy: "",
    projectId: "",
  });

  const loadData = async () => {
    if (!session.companyId || !api) {
      setLoading(false);
      return;
    }
    try {
      const [data, projs] = await Promise.all([
        api.listFailures(session.companyId) as Promise<Failure[]>,
        api.listProjects(session.companyId) as Promise<Project[]>,
      ]);
      setFailures(data);
      setProjects(projs);
    } catch {
      toast.error("Veriler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: actor stabilizes after init
  useEffect(() => {
    loadData();
  }, [session.companyId, actor]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      toast.error("Başlık zorunludur.");
      return;
    }
    if (!api) {
      toast.error("Bağlantı hatası.");
      return;
    }
    setSubmitting(true);
    try {
      await api.addFailure(
        form.machineId,
        session.companyId,
        form.title,
        form.description,
        form.severity,
        form.reportedBy,
        form.projectId,
      );
      toast.success("Arıza bildirildi!");
      setDialogOpen(false);
      setForm({
        title: "",
        machineId: "",
        description: "",
        severity: "medium",
        reportedBy: "",
        projectId: "",
      });
      await loadData();
    } catch {
      toast.error("Arıza eklenirken hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (failureId: string, status: string) => {
    if (!api) return;
    if (status === "resolved") {
      // Open resolve dialog
      const failure = failures.find((f) => f.id === failureId);
      if (failure) {
        setResolvingFailure(failure);
        setResolutionNote("");
        setResolveDialogOpen(true);
      }
      return;
    }
    try {
      await api.updateFailureStatus(failureId, status);
      toast.success("Durum güncellendi.");
      setFailures((prev) =>
        prev.map((f) => (f.id === failureId ? { ...f, status } : f)),
      );
    } catch {
      toast.error("Durum güncellenirken hata oluştu.");
    }
  };

  const handleResolveSubmit = async () => {
    if (!resolvingFailure || !api) return;
    setResolveSubmitting(true);
    try {
      await api.resolveFailure(resolvingFailure.id, resolutionNote);
      toast.success("Arıza çözüldü olarak işaretlendi.");
      setFailures((prev) =>
        prev.map((f) =>
          f.id === resolvingFailure.id ? { ...f, status: "resolved" } : f,
        ),
      );
      setResolveDialogOpen(false);
    } catch {
      toast.error("Çözüm kaydedilirken hata oluştu.");
    } finally {
      setResolveSubmitting(false);
    }
  };

  const handleOpenLinkDialog = async (failure: Failure) => {
    setLinkingFailure(failure);
    setSelectedPlanId("");
    setLinkDialogOpen(true);
    setPlansLoading(true);
    try {
      const plans = (await api.listMaintenancePlans(
        session.companyId,
      )) as MaintenancePlan[];
      setMaintenancePlans(plans);
    } catch {
      toast.error("Bakım planları yüklenemedi.");
    } finally {
      setPlansLoading(false);
    }
  };

  const handleLinkSubmit = async () => {
    if (!linkingFailure || !selectedPlanId || !api) return;
    setLinkSubmitting(true);
    try {
      await api.linkFailureMaintenance(linkingFailure.id, selectedPlanId);
      setLinkedFailures((prev) => ({
        ...prev,
        [linkingFailure.id]: selectedPlanId,
      }));
      toast.success("Bakım planı bağlandı!");
      setLinkDialogOpen(false);
    } catch {
      toast.error("Bağlama sırasında hata oluştu.");
    } finally {
      setLinkSubmitting(false);
    }
  };

  const openEditFailure = (f: Failure) => {
    setEditFailureTarget(f);
    setEditFailureForm({
      title: f.title,
      description: f.description ?? "",
      severity: f.severity,
    });
    setEditFailureOpen(true);
  };

  const handleEditFailureSave = async () => {
    if (!editFailureTarget || !api) return;
    setEditFailureSaving(true);
    try {
      await api.updateFailure(
        editFailureTarget.id,
        editFailureForm.title,
        editFailureForm.description,
        editFailureForm.severity,
      );
      toast.success("Arıza güncellendi.");
      setFailures((prev) =>
        prev.map((f) =>
          f.id === editFailureTarget.id ? { ...f, ...editFailureForm } : f,
        ),
      );
      setEditFailureOpen(false);
    } catch {
      toast.error("Güncelleme sırasında hata oluştu.");
    } finally {
      setEditFailureSaving(false);
    }
  };

  const handleDeleteFailure = async () => {
    if (!deleteFailureTarget || !api) return;
    setDeleteFailureSubmitting(true);
    try {
      await api.deleteFailure(deleteFailureTarget.id);
      toast.success("Arıza silindi.");
      setFailures((prev) =>
        prev.filter((f) => f.id !== deleteFailureTarget.id),
      );
      setDeleteFailureOpen(false);
    } catch {
      toast.error("Silme sırasında hata oluştu.");
    } finally {
      setDeleteFailureSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    const sevLabels: Record<string, string> = {
      low: "Düşük",
      medium: "Orta",
      high: "Yüksek",
      critical: "Kritik",
    };
    const stLabels: Record<string, string> = {
      open: "Açık",
      "in-progress": "İşlemde",
      resolved: "Çözüldü",
    };
    const rows = failures.map((f) =>
      [
        f.title,
        f.machineId || "",
        sevLabels[f.severity] || f.severity,
        stLabels[f.status] || f.status,
        new Date(Number(f.reportedAt) / 1_000_000).toLocaleDateString("tr-TR"),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = ["Başlık,Makine,Önem,Durum,Tarih", ...rows].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "arizalar.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (ts: bigint) => {
    try {
      return new Date(Number(ts) / 1_000_000).toLocaleDateString("tr-TR");
    } catch {
      return "—";
    }
  };

  const getResolutionNote = (resolvedAt: any): string | null => {
    if (!resolvedAt) return null;
    const raw =
      typeof resolvedAt === "string" ? resolvedAt : String(resolvedAt);
    if (raw.includes("|")) return raw.split("|")[0];
    return null;
  };

  const getProjectName = (projectId: string) => {
    if (!projectId) return null;
    const p = projects.find((x) => x.id === projectId);
    return p ? p.name : null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Bakım & Arıza
          </h2>
          <p className="text-muted-foreground text-sm">
            {failures.length} kayıt
          </p>
        </div>
        <div className="flex items-center gap-2">
          {failures.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              data-ocid="maintenance.csv.button"
            >
              <FileDown className="w-4 h-4 mr-2" /> CSV İndir
            </Button>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-ocid="maintenance.add.open_modal_button">
                <Plus className="w-4 h-4 mr-2" /> Arıza Bildir
              </Button>
            </DialogTrigger>
            <DialogContent aria-describedby="add-failure-desc">
              <DialogHeader>
                <DialogTitle
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  Arıza Bildir
                </DialogTitle>
                <DialogDescription id="add-failure-desc">
                  Arıza bilgilerini doldurun ve kaydedin.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={handleAdd}
                className="space-y-3"
                data-ocid="maintenance.add.dialog"
              >
                <div className="space-y-1.5">
                  <Label>Başlık *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    placeholder="Pompa arızası"
                    data-ocid="maintenance.title.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Makine ID (opsiyonel)</Label>
                  <Input
                    value={form.machineId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, machineId: e.target.value }))
                    }
                    placeholder="Makine kodu veya adı"
                    data-ocid="maintenance.machine.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>İlgili Proje (opsiyonel)</Label>
                  <Select
                    value={form.projectId}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        projectId: v === "__none" ? "" : v,
                      }))
                    }
                  >
                    <SelectTrigger data-ocid="maintenance.project.select">
                      <SelectValue placeholder="Proje seçin (opsiyonel)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">— Proje bağlama —</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Açıklama</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    rows={3}
                    placeholder="Arıza detayları..."
                    data-ocid="maintenance.description.textarea"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Önem Derecesi</Label>
                    <Select
                      value={form.severity}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, severity: v }))
                      }
                    >
                      <SelectTrigger data-ocid="maintenance.severity.select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Düşük</SelectItem>
                        <SelectItem value="medium">Orta</SelectItem>
                        <SelectItem value="high">Yüksek</SelectItem>
                        <SelectItem value="critical">Kritik</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Bildiren</Label>
                    <Input
                      value={form.reportedBy}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, reportedBy: e.target.value }))
                      }
                      placeholder="Ad Soyad"
                      data-ocid="maintenance.reporter.input"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    data-ocid="maintenance.add.cancel_button"
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    data-ocid="maintenance.add.submit_button"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    {submitting ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent
          aria-describedby="resolve-failure-desc"
          data-ocid="maintenance.resolve.dialog"
        >
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Arızayı Çöz
            </DialogTitle>
            <DialogDescription id="resolve-failure-desc">
              "{resolvingFailure?.title}" arızası için çözüm notu girin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Çözüm Notu</Label>
              <Textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                rows={4}
                placeholder="Yapılan işlemleri, değiştirilen parçaları veya çözüm detaylarını yazın..."
                data-ocid="maintenance.resolve.textarea"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResolveDialogOpen(false)}
              data-ocid="maintenance.resolve.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleResolveSubmit}
              disabled={resolveSubmitting}
              className="bg-green-600 hover:bg-green-700"
              data-ocid="maintenance.resolve.confirm_button"
            >
              {resolveSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              {resolveSubmitting
                ? "Kaydediliyor..."
                : "Çözüldü Olarak İşaretle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bakım Bağlama Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent
          aria-describedby="link-maint-desc"
          data-ocid="maintenance.link.dialog"
        >
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Bakım Planı Bağla
            </DialogTitle>
            <DialogDescription id="link-maint-desc">
              "{linkingFailure?.title}" arızasına bir bakım planı bağlayın.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {plansLoading ? (
              <div
                className="flex items-center justify-center py-6"
                data-ocid="maintenance.link.loading_state"
              >
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : maintenancePlans.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Henüz bakım planı bulunmuyor.
              </p>
            ) : (
              <div className="space-y-1.5">
                <Label>Bakım Planı Seçin</Label>
                <Select
                  value={selectedPlanId}
                  onValueChange={setSelectedPlanId}
                >
                  <SelectTrigger data-ocid="maintenance.link.select">
                    <SelectValue placeholder="Plan seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {maintenancePlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.title} — {plan.machineId || "Genel"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLinkDialogOpen(false)}
              data-ocid="maintenance.link.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleLinkSubmit}
              disabled={!selectedPlanId || linkSubmitting}
              data-ocid="maintenance.link.confirm_button"
            >
              {linkSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {linkSubmitting ? "Bağlanıyor..." : "Bağla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div
          className="flex items-center justify-center h-40"
          data-ocid="maintenance.loading_state"
        >
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : failures.length === 0 ? (
        <Card data-ocid="maintenance.empty_state">
          <CardContent className="pt-12 pb-12 flex flex-col items-center gap-3 text-center">
            <Wrench className="w-12 h-12 text-muted-foreground/40" />
            <p className="font-medium">Henüz arıza kaydı yok</p>
            <p className="text-muted-foreground text-sm">
              Arıza bildirmek için yukarıdaki butonu kullanın.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Başlık</TableHead>
                <TableHead className="hidden md:table-cell">Makine</TableHead>
                <TableHead className="hidden lg:table-cell">Proje</TableHead>
                <TableHead>Önem</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="hidden md:table-cell">Bildiren</TableHead>
                <TableHead className="hidden md:table-cell">Tarih</TableHead>
                <TableHead className="w-36">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {failures.map((f, idx) => {
                const sev = severityConfig[f.severity] ?? {
                  label: f.severity,
                  cls: "bg-gray-100 text-gray-600 border-gray-200",
                };
                const st = statusConfig[f.status] ?? {
                  label: f.status,
                  cls: "bg-gray-100 text-gray-600 border-gray-200",
                };
                const projName = getProjectName(f.projectId);
                const isLinked = !!linkedFailures[f.id];
                const resNote = getResolutionNote((f as any).resolvedAt);
                return (
                  <TableRow
                    key={f.id}
                    data-ocid={`maintenance.item.${idx + 1}`}
                  >
                    <TableCell className="font-medium">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          {f.title}
                          {isLinked && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-medium">
                              Bakıma Bağlı
                            </span>
                          )}
                        </div>
                        {resNote && (
                          <p className="text-xs text-muted-foreground italic">
                            Çözüm: {resNote}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {f.machineId || "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {projName ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                          {projName}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium border ${sev.cls}`}
                      >
                        {sev.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium border ${st.cls}`}
                      >
                        {st.label}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {f.reportedBy || "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {formatDate(f.reportedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              data-ocid={`maintenance.status.${idx + 1}`}
                            >
                              Durum <ChevronDown className="w-3 h-3 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {statusOptions.map((s) => (
                              <DropdownMenuItem
                                key={s.value}
                                onClick={() =>
                                  handleStatusChange(f.id, s.value)
                                }
                              >
                                {s.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs px-2"
                          onClick={() => handleOpenLinkDialog(f)}
                          data-ocid={`maintenance.link_button.${idx + 1}`}
                          title="Bakım Planı Bağla"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                        </Button>
                        {isAdmin && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs px-2"
                              onClick={() => openEditFailure(f)}
                              data-ocid={`maintenance.edit_button.${idx + 1}`}
                              title="Düzenle"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setDeleteFailureTarget(f);
                                setDeleteFailureOpen(true);
                              }}
                              data-ocid={`maintenance.delete_button.${idx + 1}`}
                              title="Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Failure Dialog */}
      <Dialog open={editFailureOpen} onOpenChange={setEditFailureOpen}>
        <DialogContent aria-describedby="edit-failure-desc">
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Arızayı Düzenle
            </DialogTitle>
            <DialogDescription id="edit-failure-desc">
              Arıza bilgilerini güncelleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3" data-ocid="maintenance.edit.dialog">
            <div className="space-y-1.5">
              <Label>Başlık *</Label>
              <Input
                value={editFailureForm.title}
                onChange={(e) =>
                  setEditFailureForm((f) => ({ ...f, title: e.target.value }))
                }
                data-ocid="maintenance.edit.title.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Açıklama</Label>
              <Textarea
                value={editFailureForm.description}
                onChange={(e) =>
                  setEditFailureForm((f) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
                rows={3}
                data-ocid="maintenance.edit.description.textarea"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Önem Derecesi</Label>
              <Select
                value={editFailureForm.severity}
                onValueChange={(v) =>
                  setEditFailureForm((f) => ({ ...f, severity: v }))
                }
              >
                <SelectTrigger data-ocid="maintenance.edit.severity.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Düşük</SelectItem>
                  <SelectItem value="medium">Orta</SelectItem>
                  <SelectItem value="high">Yüksek</SelectItem>
                  <SelectItem value="critical">Kritik</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditFailureOpen(false)}
              data-ocid="maintenance.edit.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleEditFailureSave}
              disabled={editFailureSaving}
              data-ocid="maintenance.edit.save_button"
            >
              {editFailureSaving && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editFailureSaving ? "Kaydediliyor..." : "Güncelle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Failure Dialog */}
      <Dialog open={deleteFailureOpen} onOpenChange={setDeleteFailureOpen}>
        <DialogContent aria-describedby="delete-failure-desc">
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Arızayı Sil
            </DialogTitle>
            <DialogDescription id="delete-failure-desc">
              "{deleteFailureTarget?.title}" kaydını silmek istediğinizden emin
              misiniz?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteFailureOpen(false)}
              data-ocid="maintenance.delete.cancel_button"
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteFailure}
              disabled={deleteFailureSubmitting}
              data-ocid="maintenance.delete.confirm_button"
            >
              {deleteFailureSubmitting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {deleteFailureSubmitting ? "Siliniyor..." : "Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
