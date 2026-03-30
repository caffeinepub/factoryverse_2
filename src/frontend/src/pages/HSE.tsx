import type { Session } from "@/App";
import type { HseRecord } from "@/backend.d";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, Pencil, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
interface Props {
  session: Session;
}

const typeMap: Record<string, { label: string; cls: string }> = {
  kaza: { label: "Kaza", cls: "bg-red-100 text-red-700" },
  denetim: { label: "Denetim", cls: "bg-blue-100 text-blue-700" },
  risk: { label: "Risk", cls: "bg-orange-100 text-orange-700" },
};

const severityMap: Record<string, { label: string; cls: string }> = {
  düşük: { label: "Düşük", cls: "bg-green-100 text-green-700" },
  orta: { label: "Orta", cls: "bg-yellow-100 text-yellow-700" },
  yüksek: { label: "Yüksek", cls: "bg-red-100 text-red-700" },
};

function formatDate(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("tr-TR");
}

const isAdmin = (role: string) =>
  role === "admin" || role === "companyAdmin" || role === "manager";

const emptyForm = {
  hseType: "kaza",
  title: "",
  description: "",
  severity: "orta",
  reportedBy: "",
};

export default function HSE({ session }: Props) {
  const { actor } = useActor();
  const [records, setRecords] = useState<HseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<HseRecord | null>(null);
  const [editForm, setEditForm] = useState({
    hseType: "kaza",
    title: "",
    description: "",
    severity: "orta",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!actor || !session.companyId) {
      setLoading(false);
      return;
    }
    const a = actor as any;
    a.listHseRecords(session.companyId)
      .then((res: HseRecord[]) => setRecords(res))
      .catch(() => toast.error("İSG kayıtları yüklenemedi"))
      .finally(() => setLoading(false));
  }, [session.companyId, actor]);

  const reload = async () => {
    if (!actor) return;
    const res: HseRecord[] = await (actor as any).listHseRecords(
      session.companyId,
    );
    setRecords(res);
  };

  const handleAdd = async () => {
    if (!actor || !form.title.trim()) {
      toast.error("Başlık zorunludur");
      return;
    }
    setSaving(true);
    try {
      const a = actor as any;
      const reporter =
        form.reportedBy.trim() !== ""
          ? form.reportedBy.trim()
          : session.personnelId && session.personnelId !== ""
            ? session.personnelId
            : "Yönetici";
      await a.addHseRecord(
        session.companyId,
        form.hseType,
        form.title.trim(),
        form.description.trim(),
        form.severity,
        reporter,
      );
      await reload();
      setForm(emptyForm);
      setDialogOpen(false);
      toast.success("İSG kaydı eklendi");
    } catch {
      toast.error("Kayıt eklenemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (record: HseRecord) => {
    if (!actor) return;
    setTogglingId(record.id);
    const newStatus = record.status === "açık" ? "kapalı" : "açık";
    try {
      await (actor as any).updateHseStatus(record.id, newStatus);
      setRecords((prev) =>
        prev.map((r) => (r.id === record.id ? { ...r, status: newStatus } : r)),
      );
      toast.success(`Durum güncellendi: ${newStatus}`);
    } catch {
      toast.error("Durum güncellenemedi");
    } finally {
      setTogglingId(null);
    }
  };

  const openEdit = (rec: HseRecord) => {
    setEditTarget(rec);
    setEditForm({
      hseType: rec.hseType,
      title: rec.title,
      description: rec.description ?? "",
      severity: rec.severity,
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!actor || !editTarget) return;
    if (!editForm.title.trim()) {
      toast.error("Başlık zorunludur");
      return;
    }
    setEditSaving(true);
    try {
      await (actor as any).updateHseRecord(
        editTarget.id,
        editForm.hseType,
        editForm.title.trim(),
        editForm.description.trim(),
        editForm.severity,
      );
      await reload();
      setEditOpen(false);
      setEditTarget(null);
      toast.success("Kayıt güncellendi");
    } catch {
      toast.error("Güncelleme başarısız");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (rec: HseRecord) => {
    if (
      !window.confirm(
        `"${rec.title}" kaydını silmek istediğinizden emin misiniz?`,
      )
    )
      return;
    setDeletingId(rec.id);
    try {
      await (actor as any).deleteHseRecord(rec.id);
      setRecords((prev) => prev.filter((r) => r.id !== rec.id));
      toast.success("Kayıt silindi");
    } catch {
      toast.error("Silinemedi");
    } finally {
      setDeletingId(null);
    }
  };

  const openCount = records.filter((r) => r.status === "açık").length;
  const canEdit = isAdmin(session.role);

  const monthNames = [
    "Oca",
    "\u015eub",
    "Mar",
    "Nis",
    "May",
    "Haz",
    "Tem",
    "A\u011fu",
    "Eyl",
    "Eki",
    "Kas",
    "Ara",
  ];
  const now = new Date();
  const trendData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = monthNames[d.getMonth()];
    const count = records.filter((r) => {
      const rd = new Date(Number(r.createdAt) / 1_000_000);
      return (
        rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth()
      );
    }).length;
    return { month: label, count };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            İSG Modülü
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            İş sağlığı, güvenliği ve çevre kayıtları
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-ocid="hse.open_modal_button">
              <Plus className="w-4 h-4 mr-2" />
              Kayıt Ekle
            </Button>
          </DialogTrigger>
          <DialogContent data-ocid="hse.dialog">
            <DialogHeader>
              <DialogTitle>Yeni İSG Kaydı</DialogTitle>
              <DialogDescription>Olay bilgilerini girin</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Tür</Label>
                <Select
                  value={form.hseType}
                  onValueChange={(v) => setForm((p) => ({ ...p, hseType: v }))}
                >
                  <SelectTrigger data-ocid="hse.select">
                    <SelectValue placeholder="Tür seç" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kaza">Kaza</SelectItem>
                    <SelectItem value="denetim">Denetim</SelectItem>
                    <SelectItem value="risk">Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hse-title">Başlık</Label>
                <Input
                  id="hse-title"
                  placeholder="Olay başlığı"
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  data-ocid="hse.input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hse-desc">Açıklama</Label>
                <Textarea
                  id="hse-desc"
                  placeholder="Olay açıklaması"
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  data-ocid="hse.textarea"
                />
              </div>
              <div className="space-y-2">
                <Label>Önem Derecesi</Label>
                <Select
                  value={form.severity}
                  onValueChange={(v) => setForm((p) => ({ ...p, severity: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Önem seç" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="düşük">Düşük</SelectItem>
                    <SelectItem value="orta">Orta</SelectItem>
                    <SelectItem value="yüksek">Yüksek</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hse-reporter">Bildiren (opsiyonel)</Label>
                <Input
                  id="hse-reporter"
                  placeholder="Bildiren kişi"
                  value={form.reportedBy}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, reportedBy: e.target.value }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-ocid="hse.cancel_button"
              >
                İptal
              </Button>
              <Button
                onClick={handleAdd}
                disabled={saving}
                data-ocid="hse.submit_button"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Ekle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {records.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle
              className="text-base flex items-center gap-2"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Aylu0131k u0130SG Trendi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={trendData}
                margin={{ top: 8, right: 16, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Kayu0131t"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      {/* Summary */}
      {!loading && records.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Toplam Kayıt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span
                className="text-3xl font-bold"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                {records.length}
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Açık
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span
                className={`text-3xl font-bold ${openCount > 0 ? "text-red-600" : "text-slate-400"}`}
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                {openCount}
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Kapalı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span
                className="text-3xl font-bold text-green-600"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                {records.length - openCount}
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            İSG Kayıtları ({records.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div
              className="flex items-center justify-center h-32"
              data-ocid="hse.loading_state"
            >
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : records.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center h-32 text-muted-foreground"
              data-ocid="hse.empty_state"
            >
              <ShieldAlert className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Henüz İSG kaydı eklenmedi</p>
            </div>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="md:hidden p-4 space-y-3">
                {records.map((rec, idx) => {
                  const t = typeMap[rec.hseType] ?? {
                    label: rec.hseType,
                    cls: "bg-gray-100 text-gray-600",
                  };
                  const s = severityMap[rec.severity] ?? {
                    label: rec.severity,
                    cls: "bg-gray-100 text-gray-600",
                  };
                  return (
                    <div
                      key={rec.id}
                      className="bg-white rounded-xl p-4 shadow-sm border border-border"
                      data-ocid={`hse.item.${idx + 1}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 mr-2">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge variant="secondary" className={t.cls}>
                              {t.label}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className={
                                rec.status === "açık"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-green-100 text-green-700"
                              }
                            >
                              {rec.status}
                            </Badge>
                          </div>
                          <p className="font-semibold text-sm">{rec.title}</p>
                        </div>
                        <Badge variant="secondary" className={s.cls}>
                          {s.label}
                        </Badge>
                      </div>
                      {rec.description && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {rec.description}
                        </p>
                      )}
                      <div className="text-xs text-muted-foreground mb-3 space-y-0.5">
                        {rec.reportedBy && <p>👤 {rec.reportedBy}</p>}
                        <p>📅 {formatDate(rec.createdAt)}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => handleToggleStatus(rec)}
                          disabled={togglingId === rec.id}
                          data-ocid={`hse.toggle.${idx + 1}`}
                        >
                          {togglingId === rec.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : rec.status === "açık" ? (
                            "Kapat"
                          ) : (
                            "Aç"
                          )}
                        </Button>
                        {canEdit && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                              onClick={() => openEdit(rec)}
                              data-ocid={`hse.edit_button.${idx + 1}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(rec)}
                              disabled={deletingId === rec.id}
                              data-ocid={`hse.delete_button.${idx + 1}`}
                            >
                              {deletingId === rec.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Desktop table */}
              <div
                className="hidden md:block overflow-x-auto"
                data-ocid="hse.table"
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tür</TableHead>
                      <TableHead>Başlık</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Açıklama
                      </TableHead>
                      <TableHead>Önem</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Bildiren
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Tarih
                      </TableHead>
                      <TableHead className={canEdit ? "w-32" : "w-24"}>
                        İşlemler
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((rec, idx) => {
                      const t = typeMap[rec.hseType] ?? {
                        label: rec.hseType,
                        cls: "bg-gray-100 text-gray-600",
                      };
                      const s = severityMap[rec.severity] ?? {
                        label: rec.severity,
                        cls: "bg-gray-100 text-gray-600",
                      };
                      return (
                        <TableRow
                          key={rec.id}
                          data-ocid={`hse.item.${idx + 1}`}
                        >
                          <TableCell>
                            <Badge variant="secondary" className={t.cls}>
                              {t.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {rec.title}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-[200px] truncate">
                            {rec.description || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={s.cls}>
                              {s.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                rec.status === "açık"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-green-100 text-green-700"
                              }
                            >
                              {rec.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                            {rec.reportedBy}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                            {formatDate(rec.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => handleToggleStatus(rec)}
                                disabled={togglingId === rec.id}
                                data-ocid={`hse.toggle.${idx + 1}`}
                              >
                                {togglingId === rec.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : rec.status === "açık" ? (
                                  "Kapat"
                                ) : (
                                  "Aç"
                                )}
                              </Button>
                              {canEdit && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                                    onClick={() => openEdit(rec)}
                                    data-ocid={`hse.edit_button.${idx + 1}`}
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => handleDelete(rec)}
                                    disabled={deletingId === rec.id}
                                    data-ocid={`hse.delete_button.${idx + 1}`}
                                  >
                                    {deletingId === rec.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3.5 h-3.5" />
                                    )}
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
            </>
          )}
        </CardContent>
      </Card>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent data-ocid="hse.edit_dialog">
          <DialogHeader>
            <DialogTitle>İSG Kaydını Düzenle</DialogTitle>
            <DialogDescription>Kayıt bilgilerini güncelleyin</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tür</Label>
              <Select
                value={editForm.hseType}
                onValueChange={(v) =>
                  setEditForm((p) => ({ ...p, hseType: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kaza">Kaza</SelectItem>
                  <SelectItem value="denetim">Denetim</SelectItem>
                  <SelectItem value="risk">Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Başlık</Label>
              <Input
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, title: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Textarea
                rows={3}
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Önem Derecesi</Label>
              <Select
                value={editForm.severity}
                onValueChange={(v) =>
                  setEditForm((p) => ({ ...p, severity: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="düşük">Düşük</SelectItem>
                  <SelectItem value="orta">Orta</SelectItem>
                  <SelectItem value="yüksek">Yüksek</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              data-ocid="hse.edit_cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleEdit}
              disabled={editSaving}
              data-ocid="hse.edit_save_button"
            >
              {editSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
