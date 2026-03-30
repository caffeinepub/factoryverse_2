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
import { Loader2, Plus, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

export default function HSE({ session }: Props) {
  const { actor } = useActor();
  const [records, setRecords] = useState<HseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    hseType: "kaza",
    title: "",
    description: "",
    severity: "orta",
    reportedBy: "",
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: actor stabilizes after init
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
      const updated: HseRecord[] = await a.listHseRecords(session.companyId);
      setRecords(updated);
      setForm({
        hseType: "kaza",
        title: "",
        description: "",
        severity: "orta",
        reportedBy: "",
      });
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

  const openCount = records.filter((r) => r.status === "açık").length;

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
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, hseType: v }))
                  }
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
                    setForm((prev) => ({ ...prev, title: e.target.value }))
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
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  data-ocid="hse.textarea"
                />
              </div>
              <div className="space-y-2">
                <Label>Önem Derecesi</Label>
                <Select
                  value={form.severity}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, severity: v }))
                  }
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
                    setForm((prev) => ({ ...prev, reportedBy: e.target.value }))
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
                className={`text-3xl font-bold ${
                  openCount > 0 ? "text-red-600" : "text-slate-400"
                }`}
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
            <div className="overflow-x-auto" data-ocid="hse.table">
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
                    <TableHead className="w-24">İşlemler</TableHead>
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
                      <TableRow key={rec.id} data-ocid={`hse.item.${idx + 1}`}>
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
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
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
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
