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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActor } from "@/hooks/useActor";
import {
  AlertTriangle,
  ArrowLeft,
  Cpu,
  Loader2,
  MapPin,
  Package,
  Tag,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  session: Session;
  machineId: string;
  navigate: (p: Page) => void;
}

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
      cls: "bg-gray-100 text-gray-600 border-gray-200",
    },
    Completed: {
      label: "Tamamlandı",
      cls: "bg-gray-100 text-gray-600 border-gray-200",
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
  Idle: { label: "Beklemede", cls: "bg-gray-100 text-gray-600" },
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
    cls: "bg-gray-100 text-gray-600 border-gray-200",
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
  const [loading, setLoading] = useState(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: actor stabilizes after init
  useEffect(() => {
    if (!api || !machineId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const [allMachines, allFailures, allShipments, allPlans] =
          await Promise.all([
            actor!.listMachines(session.companyId),
            api.listFailures(session.companyId) as Promise<Failure[]>,
            api.listShipments(session.companyId) as Promise<Shipment[]>,
            api.listMaintenancePlans(session.companyId) as Promise<
              MaintenancePlan[]
            >,
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
    cls: "bg-gray-100 text-gray-600",
  };

  const today = new Date().toISOString().split("T")[0];

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
    </div>
  );
}
