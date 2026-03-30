import type { Session } from "@/App";
import type { MaintenancePlan } from "@/backend.d";
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
import { ChevronDown, ClipboardCheck, Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  session: Session;
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  active: {
    label: "Aktif",
    cls: "bg-green-100 text-green-700 border-green-200",
  },
  completed: {
    label: "Tamamlandı",
    cls: "bg-blue-100 text-blue-700 border-blue-200",
  },
  cancelled: { label: "İptal", cls: "bg-red-100 text-red-700 border-red-200" },
};

const frequencyLabels: Record<string, string> = {
  daily: "Günlük",
  weekly: "Haftalık",
  monthly: "Aylık",
  yearly: "Yıllık",
  custom: "Özel",
};

const emptyForm = {
  machineId: "",
  title: "",
  description: "",
  frequency: "monthly",
  nextDate: "",
  assignedTo: "",
};

export default function MaintenancePlanPage({ session }: Props) {
  const { actor } = useActor();
  const api = actor as any;
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadPlans = async () => {
    if (!actor) return;
    try {
      const data = await api.listMaintenancePlans(session.companyId);
      setPlans(data.sort((a, b) => (a.nextDate > b.nextDate ? 1 : -1)));
    } catch {
      toast.error("Planlar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: actor stabilizes after init
  useEffect(() => {
    loadPlans();
  }, [actor]);

  const handleSubmit = async () => {
    if (!actor) return;
    if (!form.title.trim() || !form.nextDate) {
      toast.error("Başlık ve tarih zorunludur.");
      return;
    }
    setSaving(true);
    try {
      await api.addMaintenancePlan(
        session.companyId,
        form.machineId,
        form.title,
        form.description,
        form.frequency,
        form.nextDate,
        form.assignedTo,
      );
      toast.success("Bakım planı eklendi.");
      setOpen(false);
      setForm(emptyForm);
      loadPlans();
    } catch {
      toast.error("Plan eklenemedi.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (planId: string, status: string) => {
    if (!actor) return;
    try {
      await api.updateMaintenancePlanStatus(planId, status);
      toast.success("Durum güncellendi.");
      loadPlans();
    } catch {
      toast.error("Durum güncellenemedi.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Önleyici Bakım Planı
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Planlı bakım görevlerini takip edin
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Yeni Plan
            </Button>
          </DialogTrigger>
          <DialogContent aria-describedby="plan-dialog-desc">
            <DialogHeader>
              <DialogTitle>Bakım Planı Ekle</DialogTitle>
              <DialogDescription id="plan-dialog-desc">
                Yeni bir önleyici bakım planı oluşturun.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Başlık *</Label>
                <Input
                  placeholder="Örn: Aylık yağlama bakımı"
                  maxLength={80}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Makine ID (isteğe bağlı)</Label>
                <Input
                  placeholder="Makine kodu veya adı"
                  value={form.machineId}
                  onChange={(e) =>
                    setForm({ ...form, machineId: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Periyot</Label>
                  <Select
                    value={form.frequency}
                    onValueChange={(v) => setForm({ ...form, frequency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Günlük</SelectItem>
                      <SelectItem value="weekly">Haftalık</SelectItem>
                      <SelectItem value="monthly">Aylık</SelectItem>
                      <SelectItem value="yearly">Yıllık</SelectItem>
                      <SelectItem value="custom">Özel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Sonraki Tarih *</Label>
                  <Input
                    type="date"
                    value={form.nextDate}
                    onChange={(e) =>
                      setForm({ ...form, nextDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Atanan Personel</Label>
                <Input
                  placeholder="Personel adı veya ID"
                  value={form.assignedTo}
                  onChange={(e) =>
                    setForm({ ...form, assignedTo: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Açıklama</Label>
                <Textarea
                  placeholder="Yapılacak işlemler..."
                  maxLength={300}
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Kaydet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <ClipboardCheck className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">
              Henüz bakım planı yok.
            </p>
            <Button size="sm" onClick={() => setOpen(true)} className="gap-1">
              <Plus className="w-4 h-4" /> İlk planı ekle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Başlık</TableHead>
                    <TableHead>Periyot</TableHead>
                    <TableHead>Sonraki Tarih</TableHead>
                    <TableHead>Atanan</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => {
                    const st = statusConfig[plan.status] ?? {
                      label: plan.status,
                      cls: "bg-gray-100 text-gray-600",
                    };
                    const today = new Date().toISOString().split("T")[0];
                    const overdue =
                      plan.status === "active" && plan.nextDate < today;
                    return (
                      <TableRow key={plan.id}>
                        <TableCell>
                          <div className="font-medium text-sm">
                            {plan.title}
                          </div>
                          {plan.machineId && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {plan.machineId}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {frequencyLabels[plan.frequency] ?? plan.frequency}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-sm font-medium ${overdue ? "text-red-600" : ""}`}
                          >
                            {plan.nextDate || "—"}
                            {overdue && (
                              <span className="ml-1 text-xs">(Gecikmiş)</span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {plan.assignedTo || "—"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${st.cls}`}
                          >
                            {st.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => updateStatus(plan.id, "active")}
                              >
                                Aktif
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateStatus(plan.id, "completed")
                                }
                              >
                                Tamamlandı
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateStatus(plan.id, "cancelled")
                                }
                                className="text-red-600"
                              >
                                İptal
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
