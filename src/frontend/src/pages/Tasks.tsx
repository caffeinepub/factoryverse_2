import type { Session } from "@/App";
import type { Project, Task } from "@/backend.d";
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
import { useActor } from "@/hooks/useActor";
import {
  ChevronDown,
  ClipboardList,
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

const statusConfig: Record<string, { label: string; cls: string }> = {
  pending: {
    label: "Bekliyor",
    cls: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  "in-progress": {
    label: "Devam Ediyor",
    cls: "bg-blue-100 text-blue-700 border-blue-200",
  },
  done: {
    label: "Tamamlandı",
    cls: "bg-green-100 text-green-700 border-green-200",
  },
};

const statusOptions = Object.entries(statusConfig).map(
  ([value, { label }]) => ({
    value,
    label,
  }),
);

export default function Tasks({ session }: Props) {
  const { actor } = useActor();
  const api = actor as any;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterProject, setFilterProject] = useState<string>("all");

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editAssigneeId, setEditAssigneeId] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    projectId: "",
    assigneeId: "",
    dueDate: "",
  });

  const loadData = async () => {
    if (!session.companyId || !api) {
      setLoading(false);
      return;
    }
    try {
      const projs: Project[] = await api.listProjects(session.companyId);
      setProjects(projs);

      const allTasks: Task[] = await api.listAllTasks(session.companyId);
      setTasks(allTasks);
    } catch {
      toast.error("Görevler yüklenirken hata oluştu.");
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
    if (!form.title || !form.projectId) {
      toast.error("Başlık ve proje seçimi zorunludur.");
      return;
    }
    if (!api) {
      toast.error("Bağlantı hatası.");
      return;
    }
    setSubmitting(true);
    try {
      await api.addTask(
        form.projectId,
        session.companyId,
        form.title,
        form.assigneeId,
        form.dueDate,
      );
      toast.success("Görev eklendi!");
      setDialogOpen(false);
      setForm({ title: "", projectId: "", assigneeId: "", dueDate: "" });
      await loadData();
    } catch {
      toast.error("Görev eklenirken hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (task: Task, status: string) => {
    if (!api) return;
    try {
      await api.updateTaskStatus(String(task.id), status);
      toast.success("Durum güncellendi.");
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status } : t)),
      );
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status } : t)),
      );
    }
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setEditStatus(task.status);
    setEditTitle(task.title);
    setEditAssigneeId(task.assigneeId || "");
    setEditDueDate(task.dueDate || "");
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingTask || !api) return;
    setEditSubmitting(true);
    try {
      await api.updateTask(
        BigInt(editingTask.id),
        editTitle,
        editAssigneeId,
        editDueDate,
      );
      await api.updateTaskStatus(String(editingTask.id), editStatus);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                title: editTitle,
                assigneeId: editAssigneeId,
                dueDate: editDueDate,
                status: editStatus,
              }
            : t,
        ),
      );
      toast.success("Görev güncellendi.");
      setEditDialogOpen(false);
    } catch {
      toast.error("Güncelleme sırasında hata oluştu.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (task: Task) => {
    if (!window.confirm("Bu görevi silmek istediğinizden emin misiniz?"))
      return;
    if (!api) return;
    try {
      await api.deleteTask(BigInt(task.id));
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      toast.success("Görev silindi.");
    } catch {
      toast.error("Görev silinirken hata oluştu.");
    }
  };

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  const filteredTasks =
    filterProject === "all"
      ? tasks
      : tasks.filter((t) => t.projectId === filterProject);

  const counts = {
    pending: tasks.filter((t) => t.status === "pending").length,
    "in-progress": tasks.filter((t) => t.status === "in-progress").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Görev Yönetimi
          </h2>
          <p className="text-muted-foreground text-sm">{tasks.length} görev</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-ocid="tasks.add.open_modal_button">
              <Plus className="w-4 h-4 mr-2" /> Görev Ekle
            </Button>
          </DialogTrigger>
          <DialogContent aria-describedby="add-task-desc">
            <DialogHeader>
              <DialogTitle
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Yeni Görev
              </DialogTitle>
              <DialogDescription id="add-task-desc">
                Görev bilgilerini doldurun ve kaydedin.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={handleAdd}
              className="space-y-3"
              data-ocid="tasks.add.dialog"
            >
              <div className="space-y-1.5">
                <Label>Başlık *</Label>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Makine kurulum kontrolü"
                  data-ocid="tasks.title.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Proje *</Label>
                <Select
                  value={form.projectId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, projectId: v }))
                  }
                >
                  <SelectTrigger data-ocid="tasks.project.select">
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
              <div className="space-y-1.5">
                <Label>Atanan Personel</Label>
                <Input
                  value={form.assigneeId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, assigneeId: e.target.value }))
                  }
                  placeholder="Personel ID veya adı"
                  data-ocid="tasks.assignee.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Son Tarih</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dueDate: e.target.value }))
                  }
                  data-ocid="tasks.due_date.input"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  data-ocid="tasks.add.cancel_button"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  data-ocid="tasks.add.submit_button"
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

      {/* Full Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent
          aria-describedby="edit-task-desc"
          data-ocid="tasks.edit.dialog"
        >
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Görevi Düzenle
            </DialogTitle>
            <DialogDescription id="edit-task-desc">
              Görev bilgilerini güncelleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Başlık</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Görev başlığı"
                data-ocid="tasks.edit.title.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Atanan Personel</Label>
              <Input
                value={editAssigneeId}
                onChange={(e) => setEditAssigneeId(e.target.value)}
                placeholder="Personel ID veya adı"
                data-ocid="tasks.edit.assignee.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Son Tarih</Label>
              <Input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                data-ocid="tasks.edit.due_date.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Durum</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger data-ocid="tasks.edit.status.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              data-ocid="tasks.edit.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={editSubmitting}
              data-ocid="tasks.edit.save_button"
            >
              {editSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {editSubmitting ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(statusConfig).map(([key, { label }]) => (
          <Card key={key} className="border">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className="text-2xl font-bold">
                {counts[key as keyof typeof counts] ?? 0}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Label className="text-sm text-muted-foreground whitespace-nowrap">
          Proje:
        </Label>
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-52" data-ocid="tasks.filter.select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Görevler</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div
          className="flex items-center justify-center h-40"
          data-ocid="tasks.loading_state"
        >
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card data-ocid="tasks.empty_state">
          <CardContent className="pt-12 pb-12 flex flex-col items-center gap-3 text-center">
            <ClipboardList className="w-12 h-12 text-muted-foreground/40" />
            <p className="font-medium">Henüz görev yok</p>
            <p className="text-muted-foreground text-sm">
              Görev eklemek için yukarıdaki butonu kullanın.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Başlık</TableHead>
                <TableHead className="hidden md:table-cell">Proje</TableHead>
                <TableHead className="hidden md:table-cell">Atanan</TableHead>
                <TableHead className="hidden md:table-cell">
                  Son Tarih
                </TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="w-32">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task, idx) => {
                const st = statusConfig[task.status] ?? {
                  label: task.status,
                  cls: "bg-gray-100 text-gray-600 border-gray-200",
                };
                return (
                  <TableRow
                    key={String(task.id)}
                    data-ocid={`tasks.item.${idx + 1}`}
                  >
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {projectMap[task.projectId] ?? task.projectId}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {task.assigneeId || "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {task.dueDate || "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium border ${st.cls}`}
                      >
                        {st.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              data-ocid={`tasks.status.${idx + 1}`}
                            >
                              Durum <ChevronDown className="w-3 h-3 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {statusOptions.map((s) => (
                              <DropdownMenuItem
                                key={s.value}
                                onClick={() =>
                                  handleStatusChange(task, s.value)
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
                          onClick={() => handleOpenEdit(task)}
                          data-ocid={`tasks.edit_button.${idx + 1}`}
                          title="Düzenle"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(task)}
                          data-ocid={`tasks.delete_button.${idx + 1}`}
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
