import type { Page, Session } from "@/App";
import type {
  FailureWithProject as Failure,
  Machine,
  MaintenancePlan,
  Shipment,
} from "@/backend.d";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  AlertTriangle,
  ArrowLeft,
  Cpu,
  Loader2,
  MapPin,
  Package,
  Pencil,
  Plus,
  Tag,
  Trash2,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  session: Session;
  machineId: string;
  navigate: (p: Page) => void;
}

interface SparePart {
  id: string;
  companyId: string;
  machineId: string;
  name: string;
  partCode: string;
  quantity: bigint;
  unit: string;
  minStock: bigint;
  supplier: string;
  notes: string;
  createdAt: bigint;
}

const emptyPartForm = {
  name: "",
  partCode: "",
  quantity: "0",
  unit: "adet",
  minStock: "0",
  supplier: "",
  notes: "",
};

const severityConfig: Record<string, { label: string; cls: string }> = {
  Low: { label: "Düşük", cls: "bg-blue-100 text-blue-700 border-blue-200" },
  low: { label: "Düşük", cls: "bg-blue-100 text-blue-700 border-blue-200" },
  Medium: {
    label: "Orta",
    cls: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  medium: {
    label: "Orta",
    cls: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  High: {
    label: "Yüksek",
    cls: "bg-orange-100 text-orange-700 border-orange-200",
  },
  high: {
    label: "Yüksek",
    cls: "bg-orange-100 text-orange-700 border-orange-200",
  },
  Critical: { label: "Kritik", cls: "bg-red-100 text-red-700 border-red-200" },
  critical: { label: "Kritik", cls: "bg-red-100 text-red-700 border-red-200" },
};

const failureStatusConfig: Record<string, { label: string; cls: string }> = {
  open: { label: "Açık", cls: "bg-red-100 text-red-700 border-red-200" },
  Open: { label: "Açık", cls: "bg-red-100 text-red-700 border-red-200" },
  "in-progress": {
    label: "Devam Ediyor",
    cls: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  "In Progress": {
    label: "Devam Ediyor",
    cls: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  resolved: {
    label: "Çözüldü",
    cls: "bg-green-100 text-green-700 border-green-200",
  },
  Resolved: {
    label: "Çözüldü",
    cls: "bg-green-100 text-green-700 border-green-200",
  },
};

const shipmentStatusConfig: Record<string, { label: string; cls: string }> = {
  Planned: {
    label: "Planlandı",
    cls: "bg-blue-100 text-blue-700 border-blue-200",
  },
  "In Transit": {
    label: "Yolda",
    cls: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  Delivered: {
    label: "Teslim Edildi",
    cls: "bg-green-100 text-green-700 border-green-200",
  },
};

const maintenanceStatusConfig: Record<string, { label: string; cls: string }> =
  {
    active: {
      label: "Aktif",
      cls: "bg-green-100 text-green-700 border-green-200",
    },
    Active: {
      label: "Aktif",
      cls: "bg-green-100 text-green-700 border-green-200",
    },
    completed: {
      label: "Tamamlandı",
      cls: "bg-gray-100 text-gray-700 border-gray-200",
    },
    Completed: {
      label: "Tamamlandı",
      cls: "bg-gray-100 text-gray-700 border-gray-200",
    },
    pending: {
      label: "Bekliyor",
      cls: "bg-yellow-100 text-yellow-700 border-yellow-200",
    },
    Pending: {
      label: "Bekliyor",
      cls: "bg-yellow-100 text-yellow-700 border-yellow-200",
    },
  };

const frequencyLabel: Record<string, string> = {
  daily: "Günlük",
  weekly: "Haftalık",
  monthly: "Aylık",
  yearly: "Yıllık",
};

const machineStatusConfig: Record<string, { label: string; cls: string }> = {
  Active: { label: "Aktif", cls: "bg-green-100 text-green-700" },
  Maintenance: { label: "Bakımda", cls: "bg-yellow-100 text-yellow-700" },
  Idle: { label: "Beklemede", cls: "bg-gray-100 text-gray-700" },
  Decommissioned: { label: "Hizmet Dışı", cls: "bg-red-100 text-red-700" },
};

function StatusPill({
  status,
  config,
}: {
  status: string;
  config: Record<string, { label: string; cls: string }>;
}) {
  const cfg = config[status] ?? {
    label: status,
    cls: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full font-medium border ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}

export default function MachineDetail({ session, machineId, navigate }: Props) {
  const { actor } = useActor();
  // Cast to any to access backend methods not yet reflected in generated types
  const api = actor as any;
  const [machine, setMachine] = useState<Machine | null>(null);
  const [failures, setFailures] = useState<Failure[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [maintenancePlans, setMaintenancePlans] = useState<MaintenancePlan[]>(
    [],
  );
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);

  // Spare parts dialog state
  const [partAddOpen, setPartAddOpen] = useState(false);
  const [partAddForm, setPartAddForm] = useState(emptyPartForm);
  const [partAddSubmitting, setPartAddSubmitting] = useState(false);
  const [partEditOpen, setPartEditOpen] = useState(false);
  const [partEditTarget, setPartEditTarget] = useState<SparePart | null>(null);
  const [partEditForm, setPartEditForm] = useState(emptyPartForm);
  const [partEditSubmitting, setPartEditSubmitting] = useState(false);
  const [partDeleteOpen, setPartDeleteOpen] = useState(false);
  const [partDeleteTarget, setPartDeleteTarget] = useState<SparePart | null>(
    null,
  );
  const [partDeleteSubmitting, setPartDeleteSubmitting] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: actor stabilizes after init
  useEffect(() => {
    if (!api || !machineId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const [allMachines, allFailures, allShipments, allPlans, allParts] =
          await Promise.all([
            actor!.listMachines(session.companyId),
            api.listFailures(session.companyId) as Promise<Failure[]>,
            api.listShipments(session.companyId) as Promise<Shipment[]>,
            api.listMaintenancePlans(session.companyId) as Promise<
              MaintenancePlan[]
            >,
            api.listSpareParts(session.companyId) as Promise<SparePart[]>,
          ]);
        const found = allMachines.find((m) => m.id === machineId);
        if (!found) {
          toast.error("Makine bulunamadı.");
        } else {
          setMachine(found);
        }
        setFailures(allFailures.filter((f) => f.machineId === machineId));
        setShipments(allShipments.filter((s) => s.machineId === machineId));
        setMaintenancePlans(allPlans.filter((p) => p.machineId === machineId));
        setSpareParts(allParts.filter((p) => p.machineId === machineId));
      } catch {
        toast.error("Makine bilgileri yüklenirken hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [api, machineId, session.companyId]);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-60"
        data-ocid="machine-detail.loading_state"
      >
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("machines")}
          data-ocid="machine-detail.back.button"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Makinelere Dön
        </Button>
        <Card data-ocid="machine-detail.error_state">
          <CardContent className="pt-12 pb-12 flex flex-col items-center gap-3 text-center">
            <Cpu className="w-12 h-12 text-muted-foreground/40" />
            <p className="font-medium">Makine bulunamadı</p>
            <p className="text-muted-foreground text-sm">
              Bu ID ile kayıtlı makine yok ya da erişim yetkiniz bulunmuyor.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusCfg = machineStatusConfig[machine.status] ?? {
    label: machine.status,
    cls: "bg-gray-100 text-gray-700",
  };

  const today = new Date().toISOString().split("T")[0];
  const isAdmin = session.role === "admin" || session.role === "companyAdmin";

  const handlePartAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partAddForm.name || !api) return;
    setPartAddSubmitting(true);
    try {
      await api.addSparePart(
        session.companyId,
        machineId,
        partAddForm.name,
        partAddForm.partCode,
        BigInt(Number(partAddForm.quantity) || 0),
        partAddForm.unit,
        BigInt(Number(partAddForm.minStock) || 0),
        partAddForm.supplier,
        partAddForm.notes,
      );
      toast.success("Yedek parça eklendi!");
      setPartAddOpen(false);
      setPartAddForm(emptyPartForm);
      const allParts: SparePart[] = await api.listSpareParts(session.companyId);
      setSpareParts(allParts.filter((p) => p.machineId === machineId));
    } catch {
      toast.error("Parça eklenirken hata oluştu.");
    } finally {
      setPartAddSubmitting(false);
    }
  };

  const handlePartEditOpen = (p: SparePart) => {
    setPartEditTarget(p);
    setPartEditForm({
      name: p.name,
      partCode: p.partCode,
      quantity: String(Number(p.quantity)),
      unit: p.unit,
      minStock: String(Number(p.minStock)),
      supplier: p.supplier,
      notes: p.notes,
    });
    setPartEditOpen(true);
  };

  const handlePartEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partEditTarget || !api) return;
    setPartEditSubmitting(true);
    try {
      await api.updateSparePart(
        partEditTarget.id,
        partEditForm.name,
        partEditForm.partCode,
        BigInt(Number(partEditForm.quantity) || 0),
        partEditForm.unit,
        BigInt(Number(partEditForm.minStock) || 0),
        partEditForm.supplier,
        partEditForm.notes,
      );
      toast.success("Parça güncellendi.");
      setSpareParts((prev) =>
        prev.map((p) =>
          p.id === partEditTarget.id
            ? {
                ...p,
                name: partEditForm.name,
                partCode: partEditForm.partCode,
                quantity: BigInt(Number(partEditForm.quantity) || 0),
                unit: partEditForm.unit,
                minStock: BigInt(Number(partEditForm.minStock) || 0),
                supplier: partEditForm.supplier,
                notes: partEditForm.notes,
              }
            : p,
        ),
      );
      setPartEditOpen(false);
    } catch {
      toast.error("Güncelleme sırasında hata oluştu.");
    } finally {
      setPartEditSubmitting(false);
    }
  };

  const handlePartDeleteConfirm = async () => {
    if (!partDeleteTarget || !api) return;
    setPartDeleteSubmitting(true);
    try {
      await api.deleteSparePart(partDeleteTarget.id);
      toast.success("Parça silindi.");
      setSpareParts((prev) => prev.filter((p) => p.id !== partDeleteTarget.id));
      setPartDeleteOpen(false);
    } catch {
      toast.error("Silme sırasında hata oluştu.");
    } finally {
      setPartDeleteSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" data-ocid="machine-detail.panel">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("machines")}
        data-ocid="machine-detail.back.button"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Makinelere Dön
      </Button>

      {/* Machine Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2
                  className="text-2xl font-bold"
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  {machine.name}
                </h2>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusCfg.cls}`}
                >
                  {statusCfg.label}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <Tag className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs">Tip</p>
                    <p className="font-medium">{machine.machineType || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="font-mono text-xs mt-0.5">
                    {machine.serialNumber || "—"}
                  </Badge>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs">Konum</p>
                    <p className="font-medium">{machine.location || "—"}</p>
                  </div>
                </div>
                {machine.notes && (
                  <div className="col-span-2 sm:col-span-3">
                    <p className="text-muted-foreground text-xs mb-1">Notlar</p>
                    <p className="text-sm">{machine.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Open Failures */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle
            className="text-base flex items-center gap-2"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Arızalar
            {failures.length > 0 && (
              <span className="ml-1 text-xs bg-muted rounded-full px-2 py-0.5 text-muted-foreground font-normal">
                {failures.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {failures.length === 0 ? (
            <div
              className="flex flex-col items-center gap-2 py-8 text-center"
              data-ocid="machine-detail.failures.empty_state"
            >
              <AlertTriangle className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Bu makineye ait arıza kaydı yok.
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Başlık</TableHead>
                    <TableHead>Önem</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Bildiren
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {failures.map((f, idx) => (
                    <TableRow
                      key={f.id}
                      data-ocid={`machine-detail.failures.item.${idx + 1}`}
                    >
                      <TableCell className="font-medium">{f.title}</TableCell>
                      <TableCell>
                        <StatusPill
                          status={f.severity}
                          config={severityConfig}
                        />
                      </TableCell>
                      <TableCell>
                        <StatusPill
                          status={f.status}
                          config={failureStatusConfig}
                        />
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {f.reportedBy || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Related Shipments */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle
            className="text-base flex items-center gap-2"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            <Package className="w-4 h-4 text-blue-500" />
            Sevkiyatlar
            {shipments.length > 0 && (
              <span className="ml-1 text-xs bg-muted rounded-full px-2 py-0.5 text-muted-foreground font-normal">
                {shipments.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {shipments.length === 0 ? (
            <div
              className="flex flex-col items-center gap-2 py-8 text-center"
              data-ocid="machine-detail.shipments.empty_state"
            >
              <Package className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Bu makineye ait sevkiyat kaydı yok.
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Başlık</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Çıkış
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Varış
                    </TableHead>
                    <TableHead>Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.map((s, idx) => (
                    <TableRow
                      key={s.id}
                      data-ocid={`machine-detail.shipments.item.${idx + 1}`}
                    >
                      <TableCell className="font-medium">{s.title}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {s.fromLocation || "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {s.toLocation || "—"}
                      </TableCell>
                      <TableCell>
                        <StatusPill
                          status={s.status}
                          config={shipmentStatusConfig}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Maintenance Plans */}
      <Card data-ocid="machine-detail.maintenance-plans.section">
        <CardHeader className="pb-3">
          <CardTitle
            className="text-base flex items-center gap-2"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            <Wrench className="w-4 h-4 text-indigo-500" />
            Bakım Planları
            {maintenancePlans.length > 0 && (
              <span className="ml-1 text-xs bg-muted rounded-full px-2 py-0.5 text-muted-foreground font-normal">
                {maintenancePlans.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {maintenancePlans.length === 0 ? (
            <div
              className="flex flex-col items-center gap-2 py-8 text-center"
              data-ocid="machine-detail.maintenance-plans.empty_state"
            >
              <Wrench className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Bu makineye ait bakım planı yok.
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Başlık</TableHead>
                    <TableHead>Periyot</TableHead>
                    <TableHead>Sonraki Tarih</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Sorumlu
                    </TableHead>
                    <TableHead>Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenancePlans.map((plan, idx) => {
                    const isOverdue =
                      plan.nextDate < today &&
                      plan.status.toLowerCase() !== "completed";
                    return (
                      <TableRow
                        key={plan.id}
                        className={isOverdue ? "bg-red-50" : ""}
                        data-ocid={`machine-detail.maintenance-plans.item.${idx + 1}`}
                      >
                        <TableCell className="font-medium">
                          {plan.title}
                        </TableCell>
                        <TableCell className="text-sm">
                          {frequencyLabel[plan.frequency] || plan.frequency}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1.5">
                            <span>{plan.nextDate || "—"}</span>
                            {isOverdue && (
                              <span className="text-xs text-red-600 font-medium">
                                Gecikmiş
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                          {plan.assignedTo || "—"}
                        </TableCell>
                        <TableCell>
                          <StatusPill
                            status={plan.status}
                            config={maintenanceStatusConfig}
                          />
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
      {/* Spare Parts Dialogs */}
      <Dialog open={partAddOpen} onOpenChange={setPartAddOpen}>
        <DialogContent
          aria-describedby="add-part-desc"
          data-ocid="machine-detail.parts.add.dialog"
        >
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Yedek Parça Ekle
            </DialogTitle>
            <DialogDescription id="add-part-desc">
              Bu makine için yedek parça bilgisi girin.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePartAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>Parça Adı *</Label>
                <Input
                  value={partAddForm.name}
                  onChange={(e) =>
                    setPartAddForm({ ...partAddForm, name: e.target.value })
                  }
                  placeholder="Parça adı"
                  data-ocid="machine-detail.parts.add.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Kod</Label>
                <Input
                  value={partAddForm.partCode}
                  onChange={(e) =>
                    setPartAddForm({ ...partAddForm, partCode: e.target.value })
                  }
                  placeholder="P-001"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Birim</Label>
                <Input
                  value={partAddForm.unit}
                  onChange={(e) =>
                    setPartAddForm({ ...partAddForm, unit: e.target.value })
                  }
                  placeholder="adet"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Miktar</Label>
                <Input
                  type="number"
                  min="0"
                  value={partAddForm.quantity}
                  onChange={(e) =>
                    setPartAddForm({ ...partAddForm, quantity: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Min. Stok</Label>
                <Input
                  type="number"
                  min="0"
                  value={partAddForm.minStock}
                  onChange={(e) =>
                    setPartAddForm({ ...partAddForm, minStock: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Tedarikçi</Label>
                <Input
                  value={partAddForm.supplier}
                  onChange={(e) =>
                    setPartAddForm({ ...partAddForm, supplier: e.target.value })
                  }
                  placeholder="Tedarikçi adı"
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Notlar</Label>
                <Textarea
                  value={partAddForm.notes}
                  onChange={(e) =>
                    setPartAddForm({ ...partAddForm, notes: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPartAddOpen(false)}
                data-ocid="machine-detail.parts.add.cancel_button"
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={partAddSubmitting}
                data-ocid="machine-detail.parts.add.submit_button"
              >
                {partAddSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {partAddSubmitting ? "Kaydediliyor..." : "Ekle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={partEditOpen} onOpenChange={setPartEditOpen}>
        <DialogContent
          aria-describedby="edit-part-desc"
          data-ocid="machine-detail.parts.edit.dialog"
        >
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Parça Düzenle
            </DialogTitle>
            <DialogDescription id="edit-part-desc">
              Yedek parça bilgilerini güncelleyin.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePartEditSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>Parça Adı *</Label>
                <Input
                  value={partEditForm.name}
                  onChange={(e) =>
                    setPartEditForm({ ...partEditForm, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Kod</Label>
                <Input
                  value={partEditForm.partCode}
                  onChange={(e) =>
                    setPartEditForm({
                      ...partEditForm,
                      partCode: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Birim</Label>
                <Input
                  value={partEditForm.unit}
                  onChange={(e) =>
                    setPartEditForm({ ...partEditForm, unit: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Miktar</Label>
                <Input
                  type="number"
                  min="0"
                  value={partEditForm.quantity}
                  onChange={(e) =>
                    setPartEditForm({
                      ...partEditForm,
                      quantity: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Min. Stok</Label>
                <Input
                  type="number"
                  min="0"
                  value={partEditForm.minStock}
                  onChange={(e) =>
                    setPartEditForm({
                      ...partEditForm,
                      minStock: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Tedarikçi</Label>
                <Input
                  value={partEditForm.supplier}
                  onChange={(e) =>
                    setPartEditForm({
                      ...partEditForm,
                      supplier: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Notlar</Label>
                <Textarea
                  value={partEditForm.notes}
                  onChange={(e) =>
                    setPartEditForm({ ...partEditForm, notes: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPartEditOpen(false)}
                data-ocid="machine-detail.parts.edit.cancel_button"
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={partEditSubmitting}
                data-ocid="machine-detail.parts.edit.submit_button"
              >
                {partEditSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {partEditSubmitting ? "Kaydediliyor..." : "Güncelle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={partDeleteOpen} onOpenChange={setPartDeleteOpen}>
        <DialogContent
          aria-describedby="delete-part-desc"
          data-ocid="machine-detail.parts.delete.dialog"
        >
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Parçayı Sil
            </DialogTitle>
            <DialogDescription id="delete-part-desc">
              <strong>{partDeleteTarget?.name}</strong> adlı parçayı silmek
              istediğinizden emin misiniz?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPartDeleteOpen(false)}
              data-ocid="machine-detail.parts.delete.cancel_button"
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handlePartDeleteConfirm}
              disabled={partDeleteSubmitting}
              data-ocid="machine-detail.parts.delete.confirm_button"
            >
              {partDeleteSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {partDeleteSubmitting ? "Siliniyor..." : "Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Spare Parts Section */}
      <Card data-ocid="machine-detail.spare-parts.section">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle
              className="text-base flex items-center gap-2"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              <Package className="w-4 h-4 text-emerald-500" />
              Yedek Parçalar
              {spareParts.length > 0 && (
                <span className="ml-1 text-xs bg-muted rounded-full px-2 py-0.5 text-muted-foreground font-normal">
                  {spareParts.length}
                </span>
              )}
            </CardTitle>
            {isAdmin && (
              <Button
                size="sm"
                onClick={() => {
                  setPartAddForm(emptyPartForm);
                  setPartAddOpen(true);
                }}
                data-ocid="machine-detail.parts.add.open_modal_button"
              >
                <Plus className="w-4 h-4 mr-1" /> Parça Ekle
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {spareParts.length === 0 ? (
            <div
              className="flex flex-col items-center gap-2 py-8 text-center"
              data-ocid="machine-detail.spare-parts.empty_state"
            >
              <Package className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Bu makineye ait yedek parça kaydı yok.
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Parça Adı</TableHead>
                    <TableHead>Kod</TableHead>
                    <TableHead>Miktar</TableHead>
                    <TableHead>Min. Stok</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Tedarikçi
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Notlar
                    </TableHead>
                    {isAdmin && (
                      <TableHead className="w-24">İşlemler</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {spareParts.map((part, idx) => {
                    const isLow =
                      Number(part.quantity) <= Number(part.minStock);
                    return (
                      <TableRow
                        key={part.id}
                        className={isLow ? "bg-red-50" : ""}
                        data-ocid={`machine-detail.spare-parts.item.${idx + 1}`}
                      >
                        <TableCell className="font-medium">
                          {part.name}
                        </TableCell>
                        <TableCell className="text-sm font-mono text-muted-foreground">
                          {part.partCode || "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          <span
                            className={
                              isLow ? "text-red-600 font-semibold" : ""
                            }
                          >
                            {isLow ? "⚠️ " : ""}
                            {String(Number(part.quantity))} {part.unit}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {String(Number(part.minStock))} {part.unit}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {part.supplier || "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {part.notes || "—"}
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="px-2"
                                onClick={() => handlePartEditOpen(part)}
                                data-ocid={`machine-detail.spare-parts.edit_button.${idx + 1}`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  setPartDeleteTarget(part);
                                  setPartDeleteOpen(true);
                                }}
                                data-ocid={`machine-detail.spare-parts.delete_button.${idx + 1}`}
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
        </CardContent>
      </Card>
    </div>
  );
}
