import type { Page, Session } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Loader2, Pencil, Plus, Trash2, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  session: Session;
  navigate: (path: Page) => void;
}

interface AttendanceRecord {
  id: string;
  companyId: string;
  personnelId: string;
  date: string;
  status: string;
  note: string;
  createdAt: bigint;
}

interface Personnel {
  id: string;
  name: string;
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  present: {
    label: "Mevcut",
    cls: "bg-green-100 text-green-700 border-green-200",
  },
  absent: { label: "Devamsız", cls: "bg-red-100 text-red-700 border-red-200" },
  late: {
    label: "Geç",
    cls: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  excused: {
    label: "İzinli",
    cls: "bg-blue-100 text-blue-700 border-blue-200",
  },
};

const emptyForm = {
  personnelId: "",
  date: new Date().toISOString().split("T")[0],
  status: "present",
  note: "",
};

export default function Attendance({ session }: Props) {
  const { actor } = useActor();
  const api = actor as any;
  const isAdmin =
    session.role === "admin" ||
    session.role === "module_admin" ||
    session.role === "companyAdmin";

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterDate, setFilterDate] = useState("");
  const [filterPersonnel, setFilterPersonnel] = useState("all");

  // Add dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [addSubmitting, setAddSubmitting] = useState(false);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AttendanceRecord | null>(null);
  const [editForm, setEditForm] = useState({ status: "present", note: "" });
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AttendanceRecord | null>(
    null,
  );
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const loadData = async () => {
    if (!api || !session.companyId) {
      setLoading(false);
      return;
    }
    try {
      const [recs, pers] = await Promise.all([
        api.listAttendance(session.companyId) as Promise<AttendanceRecord[]>,
        api.listCompanyPersonnel(session.companyId) as Promise<Personnel[]>,
      ]);
      setRecords(recs);
      setPersonnel(pers);
    } catch {
      toast.error("Yoklama verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: actor stabilizes after init
  useEffect(() => {
    loadData();
  }, [session.companyId, actor]);

  const getPersonnelName = (id: string) =>
    personnel.find((p) => p.id === id)?.name ?? id;

  const filtered = records.filter((r) => {
    if (filterDate && r.date !== filterDate) return false;
    if (filterPersonnel !== "all" && r.personnelId !== filterPersonnel)
      return false;
    return true;
  });

  const countByStatus = (status: string) =>
    filtered.filter((r) => r.status === status).length;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.personnelId) {
      toast.error("Personel seçimi zorunludur.");
      return;
    }
    if (!api) return;
    setAddSubmitting(true);
    try {
      await api.addAttendance(
        session.companyId,
        addForm.personnelId,
        addForm.date,
        addForm.status,
        addForm.note,
      );
      toast.success("Yoklama kaydedildi!");
      setAddOpen(false);
      setAddForm(emptyForm);
      await loadData();
    } catch {
      toast.error("Yoklama eklenirken hata oluştu.");
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleOpenEdit = (r: AttendanceRecord) => {
    setEditTarget(r);
    setEditForm({ status: r.status, note: r.note });
    setEditOpen(true);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget || !api) return;
    setEditSubmitting(true);
    try {
      await api.updateAttendance(editTarget.id, editForm.status, editForm.note);
      toast.success("Yoklama güncellendi.");
      setRecords((prev) =>
        prev.map((r) => (r.id === editTarget.id ? { ...r, ...editForm } : r)),
      );
      setEditOpen(false);
    } catch {
      toast.error("Güncelleme sırasında hata oluştu.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !api) return;
    setDeleteSubmitting(true);
    try {
      await api.deleteAttendance(deleteTarget.id);
      toast.success("Kayıt silindi.");
      setRecords((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteOpen(false);
    } catch {
      toast.error("Silme sırasında hata oluştu.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2
                className="text-2xl font-bold"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Yoklama Takibi
              </h2>
              <p className="text-white text-sm">{records.length} kayıt</p>
            </div>
          </div>
          {isAdmin && (
            <Button
              variant="secondary"
              onClick={() => setAddOpen(true)}
              data-ocid="attendance.add.open_modal_button"
            >
              <Plus className="w-4 h-4 mr-2" /> Yoklama Ekle
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Tarih:</Label>
          <Input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-40"
            data-ocid="attendance.date.input"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Personel:</Label>
          <Select value={filterPersonnel} onValueChange={setFilterPersonnel}>
            <SelectTrigger
              className="w-44"
              data-ocid="attendance.personnel.select"
            >
              <SelectValue placeholder="Tüm Personel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Personel</SelectItem>
              {personnel.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(filterDate || filterPersonnel !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterDate("");
              setFilterPersonnel("all");
            }}
          >
            Filtreyi Temizle
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-green-200">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Mevcut</p>
            <p className="text-2xl font-bold text-green-600">
              {countByStatus("present")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Devamsız</p>
            <p className="text-2xl font-bold text-red-600">
              {countByStatus("absent")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Geç</p>
            <p className="text-2xl font-bold text-yellow-600">
              {countByStatus("late")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">İzinli</p>
            <p className="text-2xl font-bold text-blue-600">
              {countByStatus("excused")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent
          aria-describedby="add-attendance-desc"
          data-ocid="attendance.add.dialog"
        >
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Yoklama Ekle
            </DialogTitle>
            <DialogDescription id="add-attendance-desc">
              Personel yoklama kaydı oluşturun.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Personel *</Label>
              <Select
                value={addForm.personnelId}
                onValueChange={(v) =>
                  setAddForm({ ...addForm, personnelId: v })
                }
              >
                <SelectTrigger data-ocid="attendance.add.personnel.select">
                  <SelectValue placeholder="Personel seçin" />
                </SelectTrigger>
                <SelectContent>
                  {personnel.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tarih</Label>
                <Input
                  type="date"
                  value={addForm.date}
                  onChange={(e) =>
                    setAddForm({ ...addForm, date: e.target.value })
                  }
                  data-ocid="attendance.add.date.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Durum</Label>
                <Select
                  value={addForm.status}
                  onValueChange={(v) => setAddForm({ ...addForm, status: v })}
                >
                  <SelectTrigger data-ocid="attendance.add.status.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Mevcut</SelectItem>
                    <SelectItem value="absent">Devamsız</SelectItem>
                    <SelectItem value="late">Geç</SelectItem>
                    <SelectItem value="excused">İzinli</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Not</Label>
              <Textarea
                value={addForm.note}
                onChange={(e) =>
                  setAddForm({ ...addForm, note: e.target.value })
                }
                rows={2}
                placeholder="Opsiyonel not..."
                data-ocid="attendance.add.textarea"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
                data-ocid="attendance.add.cancel_button"
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={addSubmitting}
                data-ocid="attendance.add.submit_button"
              >
                {addSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {addSubmitting ? "Kaydediliyor..." : "Ekle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent
          aria-describedby="edit-attendance-desc"
          data-ocid="attendance.edit.dialog"
        >
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Yoklama Düzenle
            </DialogTitle>
            <DialogDescription id="edit-attendance-desc">
              Yoklama durumunu ve notunu güncelleyin.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSave} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Durum</Label>
              <Select
                value={editForm.status}
                onValueChange={(v) => setEditForm({ ...editForm, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Mevcut</SelectItem>
                  <SelectItem value="absent">Devamsız</SelectItem>
                  <SelectItem value="late">Geç</SelectItem>
                  <SelectItem value="excused">İzinli</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Not</Label>
              <Textarea
                value={editForm.note}
                onChange={(e) =>
                  setEditForm({ ...editForm, note: e.target.value })
                }
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                data-ocid="attendance.edit.cancel_button"
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={editSubmitting}
                data-ocid="attendance.edit.submit_button"
              >
                {editSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {editSubmitting ? "Kaydediliyor..." : "Güncelle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent
          aria-describedby="delete-attendance-desc"
          data-ocid="attendance.delete.dialog"
        >
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Kaydı Sil
            </DialogTitle>
            <DialogDescription id="delete-attendance-desc">
              Bu yoklama kaydını silmek istediğinizden emin misiniz?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              data-ocid="attendance.delete.cancel_button"
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteSubmitting}
              data-ocid="attendance.delete.confirm_button"
            >
              {deleteSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {deleteSubmitting ? "Siliniyor..." : "Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table */}
      {loading ? (
        <div
          className="flex items-center justify-center h-40"
          data-ocid="attendance.loading_state"
        >
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card data-ocid="attendance.empty_state">
          <CardContent className="pt-12 pb-12 flex flex-col items-center gap-3 text-center">
            <UserCheck className="w-12 h-12 text-muted-foreground/40" />
            <p className="font-medium">Yoklama kaydı bulunamadı</p>
            <p className="text-muted-foreground text-sm">
              Filtre kriterlerine uygun kayıt yok veya henüz kayıt girilmemiş.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Tarih</TableHead>
                <TableHead>Personel Adı</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="hidden md:table-cell">Not</TableHead>
                {isAdmin && <TableHead className="w-24">İşlemler</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r, idx) => {
                const scfg = statusConfig[r.status] ?? {
                  label: r.status,
                  cls: "bg-gray-100 text-gray-700 border-gray-200",
                };
                return (
                  <TableRow key={r.id} data-ocid={`attendance.item.${idx + 1}`}>
                    <TableCell className="font-medium">{r.date}</TableCell>
                    <TableCell>{getPersonnelName(r.personnelId)}</TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium border ${scfg.cls}`}
                      >
                        {scfg.label}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {r.note || "—"}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-2"
                            onClick={() => handleOpenEdit(r)}
                            data-ocid={`attendance.edit_button.${idx + 1}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setDeleteTarget(r);
                              setDeleteOpen(true);
                            }}
                            data-ocid={`attendance.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
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
