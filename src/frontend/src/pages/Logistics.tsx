import type { Session } from "@/App";
import type { Shipment } from "@/backend.d";
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
import { ArrowRight, Loader2, Pencil, Plus, Trash2, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  session: Session;
}

type StatusFilter =
  | "all"
  | "planned"
  | "in-transit"
  | "delivered"
  | "cancelled";

const statusMap: Record<string, { label: string; cls: string }> = {
  planned: { label: "Planlandı", cls: "bg-blue-100 text-blue-700" },
  "in-transit": { label: "Yolda", cls: "bg-orange-100 text-orange-700" },
  delivered: { label: "Teslim Edildi", cls: "bg-green-100 text-green-700" },
  cancelled: { label: "İptal", cls: "bg-red-100 text-red-700" },
};

const emptyForm = {
  title: "",
  machineId: "",
  fromLocation: "",
  toLocation: "",
  carrier: "",
  shipDate: "",
  estimatedDelivery: "",
  notes: "",
};

function formatDate(str: string): string {
  if (!str) return "—";
  try {
    return new Date(str).toLocaleDateString("tr-TR");
  } catch {
    return str;
  }
}

const isAdmin = (role: string) =>
  role === "admin" || role === "companyAdmin" || role === "manager";

export default function Logistics({ session }: Props) {
  const { actor } = useActor();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [form, setForm] = useState(emptyForm);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Shipment | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editSaving, setEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!actor || !session.companyId) {
      setLoading(false);
      return;
    }
    const a = actor as any;
    a.listShipments(session.companyId)
      .then((res: Shipment[]) => setShipments(res))
      .catch(() => toast.error("Sevkiyatlar yüklenemedi"))
      .finally(() => setLoading(false));
  }, [session.companyId, actor]);

  const reload = async () => {
    if (!actor) return;
    const res: Shipment[] = await (actor as any).listShipments(
      session.companyId,
    );
    setShipments(res);
  };

  const handleAdd = async () => {
    if (!actor || !form.title.trim()) {
      toast.error("Başlık zorunludur");
      return;
    }
    setSaving(true);
    try {
      const a = actor as any;
      await a.addShipment(
        session.companyId,
        form.title.trim(),
        form.machineId.trim(),
        form.fromLocation.trim(),
        form.toLocation.trim(),
        form.carrier.trim(),
        form.shipDate,
        form.estimatedDelivery,
        form.notes.trim(),
      );
      await reload();
      setForm(emptyForm);
      setDialogOpen(false);
      toast.success("Sevkiyat eklendi");
    } catch {
      toast.error("Sevkiyat eklenemedi");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (ship: Shipment) => {
    setEditTarget(ship);
    setEditForm({
      title: ship.title,
      machineId: ship.machineId ?? "",
      fromLocation: ship.fromLocation ?? "",
      toLocation: ship.toLocation ?? "",
      carrier: ship.carrier ?? "",
      shipDate: ship.shipDate ?? "",
      estimatedDelivery: ship.estimatedDelivery ?? "",
      notes: ship.notes ?? "",
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
      await (actor as any).updateShipment(
        editTarget.id,
        editForm.title.trim(),
        editForm.machineId.trim(),
        editForm.fromLocation.trim(),
        editForm.toLocation.trim(),
        editForm.carrier.trim(),
        editForm.shipDate,
        editForm.estimatedDelivery,
        editForm.notes.trim(),
      );
      await reload();
      setEditOpen(false);
      setEditTarget(null);
      toast.success("Sevkiyat güncellendi");
    } catch {
      toast.error("Güncelleme başarısız");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (ship: Shipment) => {
    if (
      !window.confirm(
        `"${ship.title}" sevkiyatını silmek istediğinizden emin misiniz?`,
      )
    )
      return;
    setDeletingId(ship.id);
    try {
      await (actor as any).deleteShipment(ship.id);
      setShipments((prev) => prev.filter((s) => s.id !== ship.id));
      toast.success("Sevkiyat silindi");
    } catch {
      toast.error("Silinemedi");
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (shipment: Shipment, newStatus: string) => {
    if (!actor) return;
    setUpdatingId(shipment.id);
    try {
      await (actor as any).updateShipmentStatus(shipment.id, newStatus);
      setShipments((prev) =>
        prev.map((s) =>
          s.id === shipment.id ? { ...s, status: newStatus } : s,
        ),
      );
      toast.success("Durum güncellendi");
    } catch {
      toast.error("Durum güncellenemedi");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered =
    filter === "all" ? shipments : shipments.filter((s) => s.status === filter);

  const counts = {
    all: shipments.length,
    planned: shipments.filter((s) => s.status === "planned").length,
    "in-transit": shipments.filter((s) => s.status === "in-transit").length,
    delivered: shipments.filter((s) => s.status === "delivered").length,
    cancelled: shipments.filter((s) => s.status === "cancelled").length,
  };

  const filterTabs: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "Tümü" },
    { key: "planned", label: "Planlandı" },
    { key: "in-transit", label: "Yolda" },
    { key: "delivered", label: "Teslim Edildi" },
  ];

  const formFields = (
    vals: typeof emptyForm,
    set: (fn: (p: typeof emptyForm) => typeof emptyForm) => void,
    prefix: string,
  ) => (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-title`}>Başlık *</Label>
        <Input
          id={`${prefix}-title`}
          placeholder="Sevkiyat başlığı"
          value={vals.title}
          onChange={(e) => set((p) => ({ ...p, title: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-machine`}>Makine ID (opsiyonel)</Label>
        <Input
          id={`${prefix}-machine`}
          placeholder="Makine kodu"
          value={vals.machineId}
          onChange={(e) => set((p) => ({ ...p, machineId: e.target.value }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Çıkış Noktası</Label>
          <Input
            placeholder="Örn. İstanbul"
            value={vals.fromLocation}
            onChange={(e) =>
              set((p) => ({ ...p, fromLocation: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Varış Noktası</Label>
          <Input
            placeholder="Örn. Ankara"
            value={vals.toLocation}
            onChange={(e) => set((p) => ({ ...p, toLocation: e.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Taşıyıcı / Nakliyeci</Label>
        <Input
          placeholder="Nakliye firması"
          value={vals.carrier}
          onChange={(e) => set((p) => ({ ...p, carrier: e.target.value }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Sevk Tarihi</Label>
          <Input
            type="date"
            value={vals.shipDate}
            onChange={(e) => set((p) => ({ ...p, shipDate: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Tahmini Teslim</Label>
          <Input
            type="date"
            value={vals.estimatedDelivery}
            onChange={(e) =>
              set((p) => ({ ...p, estimatedDelivery: e.target.value }))
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Notlar</Label>
        <Textarea
          placeholder="Ek notlar"
          rows={2}
          value={vals.notes}
          onChange={(e) => set((p) => ({ ...p, notes: e.target.value }))}
        />
      </div>
    </div>
  );

  const canEdit = isAdmin(session.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Lojistik & Sevkiyat
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Makine ve ekipman sevkiyatlarını takip edin
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-ocid="logistics.open_modal_button">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Sevkiyat
            </Button>
          </DialogTrigger>
          <DialogContent data-ocid="logistics.dialog" className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Yeni Sevkiyat Ekle</DialogTitle>
              <DialogDescription>
                Sevkiyat bilgilerini doldurun
              </DialogDescription>
            </DialogHeader>
            {formFields(form, setForm, "add")}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-ocid="logistics.cancel_button"
              >
                İptal
              </Button>
              <Button
                onClick={handleAdd}
                disabled={saving}
                data-ocid="logistics.submit_button"
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

      {/* Summary cards */}
      {!loading && shipments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(["planned", "in-transit", "delivered", "cancelled"] as const).map(
            (key) => (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {statusMap[key].label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <span
                    className="text-3xl font-bold"
                    style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    {counts[key]}
                  </span>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {filterTabs.map(({ key, label }) => (
          <button
            type="button"
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
            data-ocid="logistics.filter.tab"
          >
            {label}
            {counts[key] > 0 && (
              <span className="ml-1.5 text-xs opacity-70">({counts[key]})</span>
            )}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Sevkiyatlar ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div
              className="flex items-center justify-center h-32"
              data-ocid="logistics.loading_state"
            >
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center h-32 text-muted-foreground"
              data-ocid="logistics.empty_state"
            >
              <Truck className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">
                {filter === "all"
                  ? "Henüz sevkiyat eklenmedi"
                  : "Bu filtrede sevkiyat yok"}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="md:hidden p-4 space-y-3">
                {filtered.map((ship, idx) => {
                  const st = statusMap[ship.status] ?? {
                    label: ship.status,
                    cls: "bg-gray-100 text-gray-600",
                  };
                  return (
                    <div
                      key={ship.id}
                      className="bg-white rounded-xl p-4 shadow-sm border border-border"
                      data-ocid={`logistics.item.${idx + 1}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 mr-2">
                          <p className="font-semibold text-sm">{ship.title}</p>
                          {ship.machineId && (
                            <p className="text-xs font-mono text-muted-foreground">
                              {ship.machineId}
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary" className={st.cls}>
                          {st.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <span>{ship.fromLocation || "—"}</span>
                        <ArrowRight className="w-3 h-3 flex-shrink-0" />
                        <span>{ship.toLocation || "—"}</span>
                      </div>
                      {ship.carrier && (
                        <p className="text-xs text-muted-foreground mb-1">
                          🚛 {ship.carrier}
                        </p>
                      )}
                      {ship.shipDate && (
                        <p className="text-xs text-muted-foreground mb-3">
                          📅 {formatDate(ship.shipDate)}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <Select
                          value={ship.status}
                          onValueChange={(v) => handleStatusChange(ship, v)}
                          disabled={updatingId === ship.id}
                        >
                          <SelectTrigger
                            className="h-7 text-xs w-32"
                            data-ocid={`logistics.select.${idx + 1}`}
                          >
                            {updatingId === ship.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planned">Planlandı</SelectItem>
                            <SelectItem value="in-transit">Yolda</SelectItem>
                            <SelectItem value="delivered">
                              Teslim Edildi
                            </SelectItem>
                            <SelectItem value="cancelled">İptal</SelectItem>
                          </SelectContent>
                        </Select>
                        {canEdit && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                              onClick={() => openEdit(ship)}
                              data-ocid={`logistics.edit_button.${idx + 1}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(ship)}
                              disabled={deletingId === ship.id}
                              data-ocid={`logistics.delete_button.${idx + 1}`}
                            >
                              {deletingId === ship.id ? (
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
                data-ocid="logistics.table"
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Başlık</TableHead>
                      <TableHead>Güzergah</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Taşıyıcı
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Sevk Tarihi
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Tah. Teslim
                      </TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="w-36">Durum Güncelle</TableHead>
                      {canEdit && <TableHead className="w-20">İşlem</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((ship, idx) => {
                      const st = statusMap[ship.status] ?? {
                        label: ship.status,
                        cls: "bg-gray-100 text-gray-600",
                      };
                      return (
                        <TableRow
                          key={ship.id}
                          data-ocid={`logistics.item.${idx + 1}`}
                        >
                          <TableCell className="font-medium">
                            {ship.title}
                            {ship.machineId && (
                              <span className="block text-xs text-muted-foreground font-mono">
                                {ship.machineId}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <span>{ship.fromLocation || "—"}</span>
                              <ArrowRight className="w-3 h-3 flex-shrink-0" />
                              <span>{ship.toLocation || "—"}</span>
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            {ship.carrier || "—"}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                            {formatDate(ship.shipDate)}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                            {formatDate(ship.estimatedDelivery)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={st.cls}>
                              {st.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={ship.status}
                              onValueChange={(v) => handleStatusChange(ship, v)}
                              disabled={updatingId === ship.id}
                            >
                              <SelectTrigger
                                className="h-8 text-xs w-32"
                                data-ocid={`logistics.select.${idx + 1}`}
                              >
                                {updatingId === ship.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <SelectValue />
                                )}
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="planned">
                                  Planlandı
                                </SelectItem>
                                <SelectItem value="in-transit">
                                  Yolda
                                </SelectItem>
                                <SelectItem value="delivered">
                                  Teslim Edildi
                                </SelectItem>
                                <SelectItem value="cancelled">İptal</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          {canEdit && (
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                                  onClick={() => openEdit(ship)}
                                  data-ocid={`logistics.edit_button.${idx + 1}`}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => handleDelete(ship)}
                                  disabled={deletingId === ship.id}
                                  data-ocid={`logistics.delete_button.${idx + 1}`}
                                >
                                  {deletingId === ship.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
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
            </>
          )}
        </CardContent>
      </Card>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg" data-ocid="logistics.edit_dialog">
          <DialogHeader>
            <DialogTitle>Sevkiyatı Düzenle</DialogTitle>
            <DialogDescription>
              Sevkiyat bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>
          {formFields(editForm, setEditForm, "edit")}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              data-ocid="logistics.edit_cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleEdit}
              disabled={editSaving}
              data-ocid="logistics.edit_save_button"
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
