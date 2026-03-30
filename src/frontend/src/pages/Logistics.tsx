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
import { ArrowRight, Loader2, Plus, Truck } from "lucide-react";
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

function formatDate(str: string): string {
  if (!str) return "—";
  try {
    return new Date(str).toLocaleDateString("tr-TR");
  } catch {
    return str;
  }
}

export default function Logistics({ session }: Props) {
  const { actor } = useActor();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");

  const [form, setForm] = useState({
    title: "",
    machineId: "",
    fromLocation: "",
    toLocation: "",
    carrier: "",
    shipDate: "",
    estimatedDelivery: "",
    notes: "",
  });

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
      const updated: Shipment[] = await a.listShipments(session.companyId);
      setShipments(updated);
      setForm({
        title: "",
        machineId: "",
        fromLocation: "",
        toLocation: "",
        carrier: "",
        shipDate: "",
        estimatedDelivery: "",
        notes: "",
      });
      setDialogOpen(false);
      toast.success("Sevkiyat eklendi");
    } catch {
      toast.error("Sevkiyat eklenemedi");
    } finally {
      setSaving(false);
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
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="ship-title">Başlık *</Label>
                <Input
                  id="ship-title"
                  placeholder="Sevkiyat başlığı"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  data-ocid="logistics.input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ship-machine">Makine ID (opsiyonel)</Label>
                <Input
                  id="ship-machine"
                  placeholder="Makine kodu veya boş bırakın"
                  value={form.machineId}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, machineId: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="ship-from">Çıkış Noktası</Label>
                  <Input
                    id="ship-from"
                    placeholder="Örn. İstanbul"
                    value={form.fromLocation}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        fromLocation: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ship-to">Varış Noktası</Label>
                  <Input
                    id="ship-to"
                    placeholder="Örn. Ankara"
                    value={form.toLocation}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        toLocation: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ship-carrier">Taşıyıcı / Nakliyeci</Label>
                <Input
                  id="ship-carrier"
                  placeholder="Nakliye firması"
                  value={form.carrier}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, carrier: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="ship-date">Sevk Tarihi</Label>
                  <Input
                    id="ship-date"
                    type="date"
                    value={form.shipDate}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, shipDate: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ship-est">Tahmini Teslim</Label>
                  <Input
                    id="ship-est"
                    type="date"
                    value={form.estimatedDelivery}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        estimatedDelivery: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ship-notes">Notlar</Label>
                <Textarea
                  id="ship-notes"
                  placeholder="Ek notlar"
                  rows={2}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  data-ocid="logistics.textarea"
                />
              </div>
            </div>
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
          {(
            [
              { key: "planned", label: "Planlandı", color: "text-blue-600" },
              { key: "in-transit", label: "Yolda", color: "text-orange-600" },
              {
                key: "delivered",
                label: "Teslim Edildi",
                color: "text-green-600",
              },
              { key: "cancelled", label: "İptal", color: "text-red-500" },
            ] as const
          ).map(({ key, label, color }) => (
            <Card key={key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span
                  className={`text-3xl font-bold ${color}`}
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  {counts[key]}
                </span>
              </CardContent>
            </Card>
          ))}
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
            <div className="overflow-x-auto" data-ocid="logistics.table">
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
                    <TableHead className="w-36">İşlemler</TableHead>
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
                              <SelectItem value="planned">Planlandı</SelectItem>
                              <SelectItem value="in-transit">Yolda</SelectItem>
                              <SelectItem value="delivered">
                                Teslim Edildi
                              </SelectItem>
                              <SelectItem value="cancelled">İptal</SelectItem>
                            </SelectContent>
                          </Select>
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
