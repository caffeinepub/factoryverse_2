import type { Session } from "@/App";
import type { Project } from "@/backend.d";
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
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@/hooks/useActor";
import { FolderKanban, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  session: Session;
  navigateToDetail: (projectId: string) => void;
}

const projectStatusConfig: Record<string, { label: string; cls: string }> = {
  Planning: { label: "Planlama", cls: "bg-blue-100 text-blue-700" },
  Active: { label: "Aktif", cls: "bg-green-100 text-green-700" },
  Completed: { label: "Tamamlandı", cls: "bg-gray-100 text-gray-600" },
  OnHold: { label: "Beklemede", cls: "bg-orange-100 text-orange-700" },
};

function StatusBadge({
  status,
  cfg,
}: { status: string; cfg: Record<string, { label: string; cls: string }> }) {
  const c = cfg[status] ?? { label: status, cls: "bg-gray-100 text-gray-600" };
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${c.cls}`}>
      {c.label}
    </span>
  );
}

export default function Projects({ session, navigateToDetail }: Props) {
  const { actor } = useActor();
  const api = actor as any;
  const isAdmin = session.role === "companyAdmin" || session.role === "admin";
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({ name: "", description: "", deadline: "" });

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    deadline: "",
  });
  const [editSaving, setEditSaving] = useState(false);

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProjects = async () => {
    if (!session.companyId || !actor) {
      setLoading(false);
      return;
    }
    try {
      const data = await actor.listProjects(session.companyId);
      setProjects(data);
    } catch {
      toast.error("Projeler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: actor stabilizes after init
  useEffect(() => {
    loadProjects();
  }, [session.companyId, actor]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast.error("Proje adı zorunludur.");
      return;
    }
    if (!actor) {
      toast.error("Bağlantı hatası.");
      return;
    }
    setSubmitting(true);
    try {
      await actor.createProject(
        session.companyId,
        form.name,
        form.description,
        form.deadline,
      );
      toast.success("Proje oluşturuldu!");
      setDialogOpen(false);
      setForm({ name: "", description: "", deadline: "" });
      await loadProjects();
    } catch {
      toast.error("Proje oluşturulurken hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (p: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTarget(p);
    setEditForm({
      name: p.name,
      description: p.description ?? "",
      deadline: p.deadline ?? "",
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editTarget || !api) return;
    if (!editForm.name.trim()) {
      toast.error("Proje adı zorunludur.");
      return;
    }
    setEditSaving(true);
    try {
      await api.updateProject(
        editTarget.id,
        editForm.name,
        editForm.description,
        editForm.deadline,
      );
      toast.success("Proje güncellendi.");
      setEditOpen(false);
      setEditTarget(null);
      await loadProjects();
    } catch {
      toast.error("Güncelleme sırasında hata oluştu.");
    } finally {
      setEditSaving(false);
    }
  };

  const openDeleteDialog = (p: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(p);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget || !api) return;
    setDeleting(true);
    try {
      await api.deleteProject(deleteTarget.id);
      toast.success("Proje silindi.");
      setDeleteOpen(false);
      setDeleteTarget(null);
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    } catch {
      toast.error("Silme sırasında hata oluştu.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Projeler
          </h2>
          <p className="text-muted-foreground text-sm">
            {projects.length} proje kayıtlı
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-ocid="projects.add.open_modal_button">
              <Plus className="w-4 h-4 mr-2" /> Proje Oluştur
            </Button>
          </DialogTrigger>
          <DialogContent aria-describedby="add-project-desc">
            <DialogHeader>
              <DialogTitle
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Yeni Proje Oluştur
              </DialogTitle>
              <DialogDescription id="add-project-desc">
                Proje bilgilerini doldurun.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={handleCreateProject}
              className="space-y-3"
              data-ocid="projects.add.dialog"
            >
              <div className="space-y-1.5">
                <Label>Proje Adı *</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Fabrika Taşıma 2026"
                  data-ocid="projects.name.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Açıklama</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={3}
                  placeholder="Proje açıklaması..."
                  data-ocid="projects.description.textarea"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Son Tarih</Label>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, deadline: e.target.value }))
                  }
                  data-ocid="projects.deadline.input"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  data-ocid="projects.add.cancel_button"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  data-ocid="projects.add.submit_button"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {submitting ? "Oluşturuluyor..." : "Oluştur"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div
          className="flex items-center justify-center h-40"
          data-ocid="projects.loading_state"
        >
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length === 0 ? (
        <Card data-ocid="projects.empty_state">
          <CardContent className="pt-12 pb-12 flex flex-col items-center gap-3 text-center">
            <FolderKanban className="w-12 h-12 text-muted-foreground/40" />
            <p className="font-medium">Henüz proje oluşturulmamış</p>
            <p className="text-muted-foreground text-sm">
              Proje oluşturmak için yukarıdaki butonu kullanın.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p, idx) => (
            <Card
              key={p.id}
              className="hover:shadow-md hover:border-primary/40 transition-all cursor-pointer relative"
              onClick={() => navigateToDetail(p.id)}
              data-ocid={`projects.item.${idx + 1}`}
            >
              {isAdmin && (
                <div
                  className="absolute top-3 right-3 flex gap-1 z-10"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={(e) => openEditDialog(p, e)}
                    data-ocid={`projects.edit_button.${idx + 1}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => openDeleteDialog(p, e)}
                    data-ocid={`projects.delete_button.${idx + 1}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2 pr-14">
                  <CardTitle
                    className="text-base leading-snug"
                    style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    {p.name}
                  </CardTitle>
                  <StatusBadge status={p.status} cfg={projectStatusConfig} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                  {p.description || "Açıklama yok"}
                </p>
                {p.deadline && (
                  <p className="text-xs text-muted-foreground">
                    📅 Son tarih:{" "}
                    <span className="font-medium">{p.deadline}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent aria-describedby="edit-project-desc">
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Projeyi Düzenle
            </DialogTitle>
            <DialogDescription id="edit-project-desc">
              Proje bilgilerini güncelleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3" data-ocid="projects.edit.dialog">
            <div className="space-y-1.5">
              <Label>Proje Adı *</Label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, name: e.target.value }))
                }
                data-ocid="projects.edit.name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Açıklama</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
                data-ocid="projects.edit.description.textarea"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Son Tarih</Label>
              <Input
                type="date"
                value={editForm.deadline}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, deadline: e.target.value }))
                }
                data-ocid="projects.edit.deadline.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              data-ocid="projects.edit.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleEdit}
              disabled={editSaving}
              data-ocid="projects.edit.save_button"
            >
              {editSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editSaving ? "Kaydediliyor..." : "Güncelle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent aria-describedby="delete-project-desc">
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Projeyi Sil
            </DialogTitle>
            <DialogDescription id="delete-project-desc">
              "{deleteTarget?.name}" projesini silmek istediğinizden emin
              misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              data-ocid="projects.delete.cancel_button"
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              data-ocid="projects.delete.confirm_button"
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {deleting ? "Siliniyor..." : "Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
