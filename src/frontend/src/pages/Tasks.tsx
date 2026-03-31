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
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@/hooks/useActor";
import { logActivity } from "@/pages/ActivityLog";
import {
  ChevronDown,
  ClipboardList,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  session: Session;
}

interface TaskNote {
  id: string;
  taskId: string;
  companyId: string;
  content: string;
  authorName: string;
  createdAt: bigint;
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
    label: "Tamamland\u0131",
    cls: "bg-green-100 text-green-700 border-green-200",
  },
};

const statusOptions = Object.entries(statusConfig).map(
  ([value, { label }]) => ({ value, label }),
);

const priorityConfig: Record<string, { label: string; cls: string }> = {
  low: {
    label: "D\u00fc\u015f\u00fck",
    cls: "bg-gray-100 text-gray-700 border-gray-200",
  },
  medium: { label: "Orta", cls: "bg-blue-100 text-blue-600 border-blue-200" },
  high: {
    label: "Y\u00fcksek",
    cls: "bg-orange-100 text-orange-600 border-orange-200",
  },
  critical: { label: "Kritik", cls: "bg-red-100 text-red-600 border-red-200" },
};

const priorityOptions = Object.entries(priorityConfig).map(
  ([value, { label }]) => ({ value, label }),
);

export default function Tasks({ session }: Props) {
  const { actor } = useActor();
  const api = actor as any;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [priorityMap, setPriorityMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterProject, setFilterProject] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editAssigneeId, setEditAssigneeId] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editPriority, setEditPriority] = useState("medium");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Notes dialog state
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [notesTask, setNotesTask] = useState<Task | null>(null);
  const [notes, setNotes] = useState<TaskNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    projectId: "",
    assigneeId: "",
    dueDate: "",
    priority: "medium",
  });

  const loadData = async () => {
    if (!session.companyId || !api) {
      setLoading(false);
      return;
    }
    try {
      const [projs, allTasks, priorities] = await Promise.all([
        api.listProjects(session.companyId) as Promise<Project[]>,
        api.listAllTasks(session.companyId) as Promise<Task[]>,
        api.listTaskPriorities(session.companyId) as Promise<
          Array<[bigint, string]>
        >,
      ]);
      setProjects(projs);
      setTasks(allTasks);
      const map: Record<string, string> = {};
      for (const [id, priority] of priorities) {
        map[String(id)] = priority;
      }
      setPriorityMap(map);
    } catch {
      toast.error("G\u00f6revler y\u00fcklenirken hata olu\u015ftu.");
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
      toast.error("Ba\u015fl\u0131k ve proje se\u00e7imi zorunludur.");
      return;
    }
    if (!api) {
      toast.error("Ba\u011flant\u0131 hatas\u0131.");
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
        form.priority,
      );
      toast.success("G\u00f6rev eklendi!");
      logActivity(
        session.companyId,
        session.personnelId,
        "G\u00f6rev Olu\u015fturuldu",
        "task",
        form.title,
      );
      setDialogOpen(false);
      setForm({
        title: "",
        projectId: "",
        assigneeId: "",
        dueDate: "",
        priority: "medium",
      });
      await loadData();
    } catch {
      toast.error("G\u00f6rev eklenirken hata olu\u015ftu.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (task: Task, status: string) => {
    if (!api) return;
    try {
      await api.updateTaskStatus(String(task.id), status);
      toast.success("Durum g\u00fcncellendi.");
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
    setEditPriority(priorityMap[String(task.id)] || "medium");
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
        editPriority,
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
      setPriorityMap((prev) => ({
        ...prev,
        [String(editingTask.id)]: editPriority,
      }));
      toast.success("G\u00f6rev g\u00fcncellendi.");
      setEditDialogOpen(false);
    } catch {
      toast.error("G\u00fcncelleme s\u0131ras\u0131nda hata olu\u015ftu.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (task: Task) => {
    if (
      !window.confirm("Bu g\u00f6revi silmek istedi\u011finizden emin misiniz?")
    )
      return;
    if (!api) return;
    try {
      await api.deleteTask(BigInt(task.id));
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      logActivity(
        session.companyId,
        session.personnelId,
        "G\u00f6rev Silindi",
        "task",
        task.title,
      );
      toast.success("G\u00f6rev silindi.");
    } catch {
      toast.error("G\u00f6rev silinirken hata olu\u015ftu.");
    }
  };

  const handleOpenNotes = async (task: Task) => {
    setNotesTask(task);
    setNotesDialogOpen(true);
    setNoteContent("");
    setNotesLoading(true);
    try {
      const data: TaskNote[] = await api.listTaskNotes(String(task.id));
      setNotes(data);
    } catch {
      toast.error("Notlar y\u00fcklenemedi.");
    } finally {
      setNotesLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim() || !notesTask || !api) return;
    setNoteSubmitting(true);
    try {
      await api.addTaskNote(
        String(notesTask.id),
        session.companyId,
        noteContent,
        session.personnelId || "Bilinmiyor",
      );
      toast.success("Not eklendi.");
      setNoteContent("");
      const data: TaskNote[] = await api.listTaskNotes(String(notesTask.id));
      setNotes(data);
    } catch {
      toast.error("Not eklenirken hata olu\u015ftu.");
    } finally {
      setNoteSubmitting(false);
    }
  };

  const formatNoteDate = (ts: bigint) => {
    const ms = Number(ts) / 1_000_000;
    return new Date(ms).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  const filteredTasks = tasks
    .filter((t) => filterProject === "all" || t.projectId === filterProject)
    .filter(
      (t) =>
        filterPriority === "all" ||
        priorityMap[String(t.id)] === filterPriority,
    );

  const counts = {
    pending: tasks.filter((t) => t.status === "pending").length,
    "in-progress": tasks.filter((t) => t.status === "in-progress").length,
    done: tasks.filter((t) => t.status === "done").length,
    critical: tasks.filter((t) => priorityMap[String(t.id)] === "critical")
      .length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            G\u00f6rev Y\u00f6netimi
          </h2>
          <p className="text-muted-foreground text-sm">
            {tasks.length} g\u00f6rev
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-ocid="tasks.add.open_modal_button">
              <Plus className="w-4 h-4 mr-2" /> G\u00f6rev Ekle
            </Button>
          </DialogTrigger>
          <DialogContent aria-describedby="add-task-desc">
            <DialogHeader>
              <DialogTitle
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Yeni G\u00f6rev
              </DialogTitle>
              <DialogDescription id="add-task-desc">
                G\u00f6rev bilgilerini doldurun ve kaydedin.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={handleAdd}
              className="space-y-3"
              data-ocid="tasks.add.dialog"
            >
              <div className="space-y-1.5">
                <Label>Ba\u015fl\u0131k *</Label>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Makine kurulum kontrol\u00fc"
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
                    <SelectValue placeholder="Proje se\u00e7in" />
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
                  placeholder="Personel ID veya ad\u0131"
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
              <div className="space-y-1.5">
                <Label>\u00d6ncelik</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}
                >
                  <SelectTrigger data-ocid="tasks.priority.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  data-ocid="tasks.add.cancel_button"
                >
                  \u0130ptal
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
              G\u00f6revi D\u00fczenle
            </DialogTitle>
            <DialogDescription id="edit-task-desc">
              G\u00f6rev bilgilerini g\u00fcncelleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Ba\u015fl\u0131k</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="G\u00f6rev ba\u015fl\u0131\u011f\u0131"
                data-ocid="tasks.edit.title.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Atanan Personel</Label>
              <Input
                value={editAssigneeId}
                onChange={(e) => setEditAssigneeId(e.target.value)}
                placeholder="Personel ID veya ad\u0131"
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
              <Label>\u00d6ncelik</Label>
              <Select value={editPriority} onValueChange={setEditPriority}>
                <SelectTrigger data-ocid="tasks.edit.priority.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              \u0130ptal
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

      {/* Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent
          aria-describedby="notes-task-desc"
          data-ocid="tasks.notes.dialog"
        >
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              G\u00f6rev Notlar\u0131
            </DialogTitle>
            <DialogDescription id="notes-task-desc">
              {notesTask?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {notesLoading ? (
              <div
                className="flex items-center justify-center py-6"
                data-ocid="tasks.notes.loading_state"
              >
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : notes.length === 0 ? (
              <p
                className="text-sm text-muted-foreground text-center py-4"
                data-ocid="tasks.notes.empty_state"
              >
                Hen\u00fcz not eklenmemi\u015f.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {notes.map((note) => (
                  <div key={note.id} className="rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground">
                        {note.authorName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatNoteDate(note.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm">{note.content}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <Label>Yeni Not</Label>
              <Textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Notunuzu yaz\u0131n..."
                rows={3}
                data-ocid="tasks.notes.textarea"
              />
              <Button
                onClick={handleAddNote}
                disabled={noteSubmitting || !noteContent.trim()}
                className="w-full"
                data-ocid="tasks.notes.submit_button"
              >
                {noteSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {noteSubmitting ? "Ekleniyor..." : "Ekle"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
        <Card className="border border-red-200 bg-red-50/50">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-red-600 mb-1">Kritik</p>
            <p className="text-2xl font-bold text-red-700">{counts.critical}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <Label className="text-sm text-muted-foreground whitespace-nowrap">
          Proje:
        </Label>
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-48" data-ocid="tasks.filter.select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">T\u00fcm G\u00f6revler</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Label className="text-sm text-muted-foreground whitespace-nowrap">
          \u00d6ncelik:
        </Label>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger
            className="w-36"
            data-ocid="tasks.priority_filter.select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">T\u00fcm\u00fc</SelectItem>
            {priorityOptions.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
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
            <p className="font-medium">Hen\u00fcz g\u00f6rev yok</p>
            <p className="text-muted-foreground text-sm">
              G\u00f6rev eklemek i\u00e7in yukar\u0131daki butonu kullan\u0131n.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile card view */}
          <div className="md:hidden space-y-3">
            {filteredTasks.map((task, idx) => {
              const st = statusConfig[task.status] ?? {
                label: task.status,
                cls: "bg-gray-100 text-gray-700 border-gray-200",
              };
              const priority = priorityMap[String(task.id)] || "medium";
              const pr = priorityConfig[priority] ?? priorityConfig.medium;
              return (
                <div
                  key={String(task.id)}
                  className="bg-white rounded-xl p-4 shadow-sm border border-border"
                  data-ocid={`tasks.item.${idx + 1}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-semibold text-sm flex-1 mr-2">
                      {task.title}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium border flex-shrink-0 ${st.cls}`}
                    >
                      {st.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium border ${pr.cls}`}
                    >
                      {pr.label}
                    </span>
                    {task.projectId && (
                      <span className="text-xs text-muted-foreground truncate">
                        {projectMap[task.projectId] ?? task.projectId}
                      </span>
                    )}
                  </div>
                  {(task.assigneeId || task.dueDate) && (
                    <div className="text-xs text-muted-foreground mb-3 space-y-0.5">
                      {task.assigneeId && <p>👤 {task.assigneeId}</p>}
                      {task.dueDate && <p>📅 {task.dueDate}</p>}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          data-ocid={`tasks.status.${idx + 1}`}
                        >
                          Durum <ChevronDown className="w-3 h-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {statusOptions.map((s) => (
                          <DropdownMenuItem
                            key={s.value}
                            onClick={() => handleStatusChange(task, s.value)}
                          >
                            {s.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={() => handleOpenNotes(task)}
                      data-ocid={`tasks.notes.${idx + 1}`}
                      title="Notlar"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={() => handleOpenEdit(task)}
                      data-ocid={`tasks.edit_button.${idx + 1}`}
                      title="Düzenle"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(task)}
                      data-ocid={`tasks.delete_button.${idx + 1}`}
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="hidden md:block rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Ba\u015fl\u0131k</TableHead>
                  <TableHead className="hidden md:table-cell">
                    \u00d6ncelik
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Proje</TableHead>
                  <TableHead className="hidden md:table-cell">Atanan</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Son Tarih
                  </TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="w-44">\u0130\u015flemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task, idx) => {
                  const st = statusConfig[task.status] ?? {
                    label: task.status,
                    cls: "bg-gray-100 text-gray-700 border-gray-200",
                  };
                  const priority = priorityMap[String(task.id)] || "medium";
                  const pr = priorityConfig[priority] ?? priorityConfig.medium;
                  return (
                    <TableRow
                      key={String(task.id)}
                      data-ocid={`tasks.item.${idx + 1}`}
                    >
                      <TableCell className="font-medium">
                        {task.title}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium border ${pr.cls}`}
                        >
                          {pr.label}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {projectMap[task.projectId] ?? task.projectId}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {task.assigneeId || "\u2014"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {task.dueDate || "\u2014"}
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
                            onClick={() => handleOpenNotes(task)}
                            data-ocid={`tasks.notes.${idx + 1}`}
                            title="Notlar"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs px-2"
                            onClick={() => handleOpenEdit(task)}
                            data-ocid={`tasks.edit_button.${idx + 1}`}
                            title="D\u00fczenle"
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
        </>
      )}
    </div>
  );
}
