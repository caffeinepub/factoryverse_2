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
import { FolderKanban, Loader2, Plus } from "lucide-react";
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({ name: "", description: "", deadline: "" });

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
              className="hover:shadow-md hover:border-primary/40 transition-all cursor-pointer"
              onClick={() => navigateToDetail(p.id)}
              data-ocid={`projects.item.${idx + 1}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
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
    </div>
  );
}
