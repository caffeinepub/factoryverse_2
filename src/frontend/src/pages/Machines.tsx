import type { Session } from "@/App";
import type { Machine } from "@/backend.d";
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
  Cpu,
  Download,
  FileDown,
  Loader2,
  Pencil,
  Plus,
  QrCode,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  session: Session;
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  Active: {
    label: "Aktif",
    cls: "bg-green-100 text-green-700 border-green-200",
  },
  Maintenance: {
    label: "Bakımda",
    cls: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  Idle: {
    label: "Beklemede",
    cls: "bg-gray-100 text-gray-700 border-gray-200",
  },
  Decommissioned: {
    label: "Hizmet Dışı",
    cls: "bg-red-100 text-red-700 border-red-200",
  },
};

const statusOptions = Object.entries(statusConfig).map(
  ([value, { label }]) => ({ value, label }),
);

function buildQrUrl(machineId: string): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  const data = encodeURIComponent(`${base}?machineId=${machineId}`);
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&ecc=M&data=${data}`;
}

function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const csvEsc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = [
    headers.map(csvEsc).join(","),
    ...rows.map((r) => r.map(csvEsc).join(",")),
  ].join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Machines({ session }: Props) {
  const { actor } = useActor();
  const api = actor as any;
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [qrMachine, setQrMachine] = useState<Machine | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Edit machine state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    machineType: "",
    serialNumber: "",
    location: "",
    notes: "",
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    machineType: "",
    serialNumber: "",
    location: "",
    notes: "",
  });

  const loadMachines = async () => {
    if (!session.companyId || !actor) {
      setLoading(false);
      return;
    }
    try {
      const data = await actor.listMachines(session.companyId);
      setMachines(data);
    } catch {
      toast.error("Makineler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: actor stabilizes after init
  useEffect(() => {
    loadMachines();
  }, [session.companyId, actor]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.machineType) {
      toast.error("Ad ve Tip zorunludur.");
      return;
    }
    if (!actor) {
      toast.error("Bağlantı hatası.");
      return;
    }
    setSubmitting(true);
    try {
      await actor.addMachine(
        session.companyId,
        form.name,
        form.machineType,
        form.serialNumber,
        form.location,
        form.notes,
      );
      toast.success("Makine eklendi!");
      logActivity(
        session.companyId,
        session.personnelId,
        "Makine Eklendi",
        "machine",
        form.name,
      );
      setDialogOpen(false);
      setForm({
        name: "",
        machineType: "",
        serialNumber: "",
        location: "",
        notes: "",
      });
      await loadMachines();
    } catch {
      toast.error("Makine eklenirken hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (machineId: string, status: string) => {
    if (!actor) return;
    try {
      await actor.updateMachineStatus(machineId, status);
      toast.success("Durum güncellendi.");
      setMachines((prev) =>
        prev.map((m) => (m.id === machineId ? { ...m, status } : m)),
      );
    } catch {
      toast.error("Durum güncellenirken hata oluştu.");
    }
  };

  const handleOpenEdit = (machine: Machine) => {
    setEditingMachine(machine);
    setEditForm({
      name: machine.name,
      machineType: machine.machineType,
      serialNumber: machine.serialNumber || "",
      location: machine.location || "",
      notes: machine.notes || "",
    });
    setEditDialogOpen(true);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMachine || !api) return;
    if (!editForm.name || !editForm.machineType) {
      toast.error("Ad ve Tip zorunludur.");
      return;
    }
    setEditSubmitting(true);
    try {
      await api.updateMachine(
        editingMachine.id,
        editForm.name,
        editForm.machineType,
        editForm.serialNumber,
        editForm.location,
        editForm.notes,
      );
      setMachines((prev) =>
        prev.map((m) =>
          m.id === editingMachine.id ? { ...m, ...editForm } : m,
        ),
      );
      toast.success("Makine güncellendi!");
      setEditDialogOpen(false);
    } catch {
      toast.error("Güncelleme sırasında hata oluştu.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (machine: Machine) => {
    if (
      !window.confirm(
        `"${machine.name}" makinesini silmek istediğinizden emin misiniz?`,
      )
    )
      return;
    if (!api) return;
    try {
      await api.deleteMachine(machine.id);
      setMachines((prev) => prev.filter((m) => m.id !== machine.id));
      logActivity(
        session.companyId,
        session.personnelId,
        "Makine Silindi",
        "machine",
        machine.name,
      );
      toast.success("Makine silindi.");
    } catch {
      toast.error("Makine silinirken hata oluştu.");
    }
  };

  const handleOpenQr = (machine: Machine) => {
    setQrMachine(machine);
    setQrDialogOpen(true);
  };

  const handleDownloadQr = async () => {
    if (!qrMachine) return;
    setDownloading(true);
    try {
      const url = buildQrUrl(qrMachine.id);
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `qr-${qrMachine.name.replace(/\s+/g, "-")}.png`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error("QR kod indirilirken hata oluştu.");
    } finally {
      setDownloading(false);
    }
  };

  const handleExportCsv = () => {
    downloadCsv(
      "makineler.csv",
      ["Ad", "Tip", "Seri No", "Konum", "Durum"],
      machines.map((m) => [
        m.name,
        m.machineType,
        m.serialNumber || "",
        m.location || "",
        statusConfig[m.status]?.label ?? m.status,
      ]),
    );
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const cfg = statusConfig[status] ?? {
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
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Makineler
          </h2>
          <p className="text-muted-foreground text-sm">
            {machines.length} makine kayıtlı
          </p>
        </div>
        <div className="flex items-center gap-2">
          {machines.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              data-ocid="machines.csv.button"
            >
              <FileDown className="w-4 h-4 mr-2" /> CSV İndir
            </Button>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-ocid="machines.add.open_modal_button">
                <Plus className="w-4 h-4 mr-2" /> Makine Ekle
              </Button>
            </DialogTrigger>
            <DialogContent aria-describedby="add-machine-desc">
              <DialogHeader>
                <DialogTitle
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  Yeni Makine Ekle
                </DialogTitle>
                <DialogDescription id="add-machine-desc">
                  Makine bilgilerini doldurun ve kaydedin.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={handleAdd}
                className="space-y-3"
                data-ocid="machines.add.dialog"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Ad *</Label>
                    <Input
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      placeholder="CNC Torna"
                      data-ocid="machines.name.input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tip *</Label>
                    <Input
                      value={form.machineType}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, machineType: e.target.value }))
                      }
                      placeholder="CNC"
                      data-ocid="machines.type.input"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Seri No</Label>
                    <Input
                      value={form.serialNumber}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, serialNumber: e.target.value }))
                      }
                      placeholder="SN-001"
                      data-ocid="machines.serial.input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Konum</Label>
                    <Input
                      value={form.location}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, location: e.target.value }))
                      }
                      placeholder="A Hattı"
                      data-ocid="machines.location.input"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Notlar</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, notes: e.target.value }))
                    }
                    rows={2}
                    placeholder="Ek notlar..."
                    data-ocid="machines.notes.textarea"
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    data-ocid="machines.add.cancel_button"
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    data-ocid="machines.add.submit_button"
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
      </div>

      {/* Edit Machine Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent
          aria-describedby="edit-machine-desc"
          data-ocid="machines.edit.dialog"
        >
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Makine Düzenle
            </DialogTitle>
            <DialogDescription id="edit-machine-desc">
              Makine bilgilerini güncelleyin.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ad *</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, name: e.target.value }))
                  }
                  data-ocid="machines.edit.name.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tip *</Label>
                <Input
                  value={editForm.machineType}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, machineType: e.target.value }))
                  }
                  data-ocid="machines.edit.type.input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Seri No</Label>
                <Input
                  value={editForm.serialNumber}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, serialNumber: e.target.value }))
                  }
                  data-ocid="machines.edit.serial.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Konum</Label>
                <Input
                  value={editForm.location}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, location: e.target.value }))
                  }
                  data-ocid="machines.edit.location.input"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notlar</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={2}
                data-ocid="machines.edit.notes.textarea"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                data-ocid="machines.edit.cancel_button"
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={editSubmitting}
                data-ocid="machines.edit.save_button"
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

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent
          aria-describedby="qr-dialog-desc"
          className="max-w-sm"
          data-ocid="machines.qr.dialog"
        >
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              QR Kod — {qrMachine?.name}
            </DialogTitle>
            <DialogDescription id="qr-dialog-desc">
              Bu QR kodu tarayarak makine detayına hızlıca erişebilirsiniz.
            </DialogDescription>
          </DialogHeader>

          {qrMachine && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="w-full grid grid-cols-2 gap-2 text-sm bg-muted/40 rounded-lg p-3">
                <div>
                  <p className="text-muted-foreground text-xs">Tip</p>
                  <p className="font-medium">{qrMachine.machineType || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Seri No</p>
                  <p className="font-medium font-mono text-xs">
                    {qrMachine.serialNumber || "—"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">Konum</p>
                  <p className="font-medium">{qrMachine.location || "—"}</p>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-border shadow-sm">
                <img
                  src={buildQrUrl(qrMachine.id)}
                  alt={`QR Kod: ${qrMachine.name}`}
                  width={220}
                  height={220}
                  className="block"
                />
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Makine ID: <span className="font-mono">{qrMachine.id}</span>
              </p>
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setQrDialogOpen(false)}
              data-ocid="machines.qr.close_button"
            >
              Kapat
            </Button>
            <Button
              onClick={handleDownloadQr}
              disabled={downloading}
              data-ocid="machines.qr.download_button"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              PNG İndir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div
          className="flex items-center justify-center h-40"
          data-ocid="machines.loading_state"
        >
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : machines.length === 0 ? (
        <Card data-ocid="machines.empty_state">
          <CardContent className="pt-12 pb-12 flex flex-col items-center gap-3 text-center">
            <Cpu className="w-12 h-12 text-muted-foreground/40" />
            <p className="font-medium">Henüz makine eklenmemiş</p>
            <p className="text-muted-foreground text-sm">
              Makine eklemek için yukarıdaki butonu kullanın.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile card view */}
          <div className="md:hidden space-y-3">
            {machines.map((m, idx) => (
              <div
                key={m.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-border"
                data-ocid={`machines.item.${idx + 1}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">{m.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {m.machineType}
                    </p>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
                {(m.location || m.serialNumber) && (
                  <div className="text-xs text-muted-foreground mb-3 space-y-0.5">
                    {m.location && <p>📍 {m.location}</p>}
                    {m.serialNumber && (
                      <p className="font-mono">S/N: {m.serialNumber}</p>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        data-ocid={`machines.status.${idx + 1}`}
                      >
                        Durum <ChevronDown className="w-3 h-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {statusOptions.map((s) => (
                        <DropdownMenuItem
                          key={s.value}
                          onClick={() => handleStatusChange(m.id, s.value)}
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
                    onClick={() => handleOpenQr(m)}
                    title="QR Kod"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() => handleOpenEdit(m)}
                    data-ocid={`machines.edit_button.${idx + 1}`}
                    title="Düzenle"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(m)}
                    data-ocid={`machines.delete_button.${idx + 1}`}
                    title="Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden md:block rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Ad</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Seri No
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Konum</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="w-44">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {machines.map((m, idx) => (
                  <TableRow key={m.id} data-ocid={`machines.item.${idx + 1}`}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.machineType}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground font-mono text-xs">
                      {m.serialNumber || "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {m.location || "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={m.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              data-ocid={`machines.status.${idx + 1}`}
                            >
                              Durum <ChevronDown className="w-3 h-3 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {statusOptions.map((s) => (
                              <DropdownMenuItem
                                key={s.value}
                                onClick={() =>
                                  handleStatusChange(m.id, s.value)
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
                          onClick={() => handleOpenQr(m)}
                          data-ocid={`machines.qr.${idx + 1}`}
                          title="QR Kod"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs px-2"
                          onClick={() => handleOpenEdit(m)}
                          data-ocid={`machines.edit_button.${idx + 1}`}
                          title="Düzenle"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(m)}
                          data-ocid={`machines.delete_button.${idx + 1}`}
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
