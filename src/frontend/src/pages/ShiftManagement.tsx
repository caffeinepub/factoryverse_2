import type { Session } from "@/App";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
  CalendarClock,
  Edit2,
  Loader2,
  Moon,
  Plus,
  Sun,
  Sunset,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  session: Session;
}

interface Shift {
  id: string;
  companyId: string;
  personnelId: string;
  shiftType: string;
  date: string;
  note: string;
  createdAt: bigint;
}

interface Personnel {
  id: string;
  name: string;
  role: string;
}

const SHIFT_TYPES = [
  {
    value: "sabah",
    label: "Sabah (06:00–14:00)",
    color: "bg-amber-100 text-amber-800 border-amber-200",
  },
  {
    value: "oglen",
    label: "Öğlen (14:00–22:00)",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    value: "gece",
    label: "Gece (22:00–06:00)",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
];

function ShiftBadge({ type }: { type: string }) {
  const found = SHIFT_TYPES.find((s) => s.value === type);
  const Icon = type === "sabah" ? Sun : type === "oglen" ? Sunset : Moon;
  if (!found) return <Badge variant="outline">{type}</Badge>;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${found.color}`}
    >
      <Icon className="w-3 h-3" />
      {found.label.split(" ")[0]}
    </span>
  );
}

export default function ShiftManagement({ session }: Props) {
  const { actor } = useActor();
  const api = actor as any;

  const isAdmin = session.role === "companyAdmin" || session.role === "admin";

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterShiftType, setFilterShiftType] = useState("all");
  const [filterPersonnel, setFilterPersonnel] = useState("all");

  // Add dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addPersonnelId, setAddPersonnelId] = useState("");
  const [addShiftType, setAddShiftType] = useState("");
  const [addDate, setAddDate] = useState("");
  const [addNote, setAddNote] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editShift, setEditShift] = useState<Shift | null>(null);
  const [editShiftType, setEditShiftType] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: actor stabilizes after init
  useEffect(() => {
    const load = async () => {
      if (!api || !session.companyId) {
        setLoading(false);
        return;
      }
      try {
        const [s, p] = await Promise.all([
          api.listShifts(session.companyId),
          api.listPersonnel(session.companyId),
        ]);
        setShifts(s as Shift[]);
        setPersonnel(p as Personnel[]);
      } catch {
        toast.error("Vardiyalar yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [api]);

  const handleAdd = async () => {
    if (!addPersonnelId || !addShiftType || !addDate) {
      toast.error("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }
    setAddLoading(true);
    try {
      await api.addShift(
        session.companyId,
        addPersonnelId,
        addShiftType,
        addDate,
        addNote,
      );
      const updated = await api.listShifts(session.companyId);
      setShifts(updated as Shift[]);
      toast.success("Vardiya eklendi.");
      setAddOpen(false);
      setAddPersonnelId("");
      setAddShiftType("");
      setAddDate("");
      setAddNote("");
    } catch {
      toast.error("Vardiya eklenemedi.");
    } finally {
      setAddLoading(false);
    }
  };

  const openEdit = (s: Shift) => {
    setEditShift(s);
    setEditShiftType(s.shiftType);
    setEditDate(s.date);
    setEditNote(s.note);
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editShift || !editShiftType || !editDate) {
      toast.error("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }
    setEditLoading(true);
    try {
      await api.updateShift(editShift.id, editShiftType, editDate, editNote);
      const updated = await api.listShifts(session.companyId);
      setShifts(updated as Shift[]);
      toast.success("Vardiya güncellendi.");
      setEditOpen(false);
    } catch {
      toast.error("Vardiya güncellenemedi.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu vardiyayı silmek istediğinizden emin misiniz?")) return;
    try {
      await api.deleteShift(id);
      setShifts((prev) => prev.filter((s) => s.id !== id));
      toast.success("Vardiya silindi.");
    } catch {
      toast.error("Vardiya silinemedi.");
    }
  };

  const getPersonnelName = (id: string) =>
    personnel.find((p) => p.id === id)?.name ?? id;

  const filtered = shifts.filter((s) => {
    const matchType =
      filterShiftType === "all" || s.shiftType === filterShiftType;
    const matchPersonnel =
      filterPersonnel === "all" || s.personnelId === filterPersonnel;
    return matchType && matchPersonnel;
  });

  const sabahCount = shifts.filter((s) => s.shiftType === "sabah").length;
  const oglenCount = shifts.filter((s) => s.shiftType === "oglen").length;
  const geceCount = shifts.filter((s) => s.shiftType === "gece").length;

  if (loading) {
    return (
      <div
        className="flex items-center justify-center py-20"
        data-ocid="shifts.loading_state"
      >
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-ocid="shifts.page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <CalendarClock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2
              className="text-2xl font-bold"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Vardiya Yönetimi
            </h2>
            <p className="text-muted-foreground text-sm">
              {shifts.length} kayıt
            </p>
          </div>
        </div>
        {isAdmin && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button data-ocid="shifts.open_modal_button">
                <Plus className="w-4 h-4 mr-2" />
                Vardiya Ekle
              </Button>
            </DialogTrigger>
            <DialogContent aria-describedby="add-shift-desc">
              <DialogHeader>
                <DialogTitle>Yeni Vardiya Ekle</DialogTitle>
              </DialogHeader>
              <p id="add-shift-desc" className="sr-only">
                Yeni vardiya ekleme formu
              </p>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Personel *</Label>
                  <Select
                    value={addPersonnelId}
                    onValueChange={setAddPersonnelId}
                  >
                    <SelectTrigger data-ocid="shifts.select">
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
                <div className="space-y-1.5">
                  <Label>Vardiya Tipi *</Label>
                  <Select value={addShiftType} onValueChange={setAddShiftType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vardiya seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIFT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Tarih *</Label>
                  <Input
                    type="date"
                    value={addDate}
                    onChange={(e) => setAddDate(e.target.value)}
                    data-ocid="shifts.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Not (opsiyonel)</Label>
                  <Textarea
                    value={addNote}
                    onChange={(e) => setAddNote(e.target.value)}
                    placeholder="Vardiya notu..."
                    rows={2}
                    data-ocid="shifts.textarea"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setAddOpen(false)}
                  data-ocid="shifts.cancel_button"
                >
                  İptal
                </Button>
                <Button
                  onClick={handleAdd}
                  disabled={addLoading}
                  data-ocid="shifts.submit_button"
                >
                  {addLoading && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Kaydet
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-amber-700 flex items-center gap-1">
              <Sun className="w-3.5 h-3.5" /> Sabah
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold text-amber-900">{sabahCount}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-blue-700 flex items-center gap-1">
              <Sunset className="w-3.5 h-3.5" /> Öğlen
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold text-blue-900">{oglenCount}</p>
          </CardContent>
        </Card>
        <Card className="border-indigo-200 bg-indigo-50">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-indigo-700 flex items-center gap-1">
              <Moon className="w-3.5 h-3.5" /> Gece
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold text-indigo-900">{geceCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap gap-3">
            <Select value={filterShiftType} onValueChange={setFilterShiftType}>
              <SelectTrigger className="w-48" data-ocid="shifts.select">
                <SelectValue placeholder="Vardiya tipi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Vardiyalar</SelectItem>
                {SHIFT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label.split(" ")[0]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPersonnel} onValueChange={setFilterPersonnel}>
              <SelectTrigger className="w-48" data-ocid="shifts.select">
                <SelectValue placeholder="Personel filtrele" />
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
        </CardContent>
      </Card>

      {/* Table — desktop */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-ocid="shifts.empty_state"
            >
              Henüz vardiya kaydı yok.
            </div>
          ) : (
            <Table data-ocid="shifts.table">
              <TableHeader>
                <TableRow>
                  <TableHead>Personel</TableHead>
                  <TableHead>Vardiya</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Not</TableHead>
                  {isAdmin && (
                    <TableHead className="text-right">İşlem</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s, idx) => (
                  <TableRow key={s.id} data-ocid={`shifts.item.${idx + 1}`}>
                    <TableCell className="font-medium">
                      {getPersonnelName(s.personnelId)}
                    </TableCell>
                    <TableCell>
                      <ShiftBadge type={s.shiftType} />
                    </TableCell>
                    <TableCell>{s.date}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                      {s.note || "—"}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEdit(s)}
                            data-ocid={`shifts.edit_button.${idx + 1}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(s.id)}
                            data-ocid={`shifts.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cards — mobile */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div
            className="text-center py-12 text-muted-foreground"
            data-ocid="shifts.empty_state"
          >
            Henüz vardiya kaydı yok.
          </div>
        ) : (
          filtered.map((s, idx) => (
            <Card key={s.id} data-ocid={`shifts.item.${idx + 1}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold">
                      {getPersonnelName(s.personnelId)}
                    </p>
                    <ShiftBadge type={s.shiftType} />
                    <p className="text-sm text-muted-foreground">{s.date}</p>
                    {s.note && (
                      <p className="text-xs text-muted-foreground">{s.note}</p>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(s)}
                        data-ocid={`shifts.edit_button.${idx + 1}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDelete(s.id)}
                        data-ocid={`shifts.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent aria-describedby="edit-shift-desc">
          <DialogHeader>
            <DialogTitle>Vardiyayı Düzenle</DialogTitle>
          </DialogHeader>
          <p id="edit-shift-desc" className="sr-only">
            Vardiya düzenleme formu
          </p>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Vardiya Tipi *</Label>
              <Select value={editShiftType} onValueChange={setEditShiftType}>
                <SelectTrigger>
                  <SelectValue placeholder="Vardiya seçin" />
                </SelectTrigger>
                <SelectContent>
                  {SHIFT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tarih *</Label>
              <Input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                data-ocid="shifts.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Not</Label>
              <Textarea
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Vardiya notu..."
                rows={2}
                data-ocid="shifts.textarea"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              data-ocid="shifts.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleEdit}
              disabled={editLoading}
              data-ocid="shifts.save_button"
            >
              {editLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
