import type { Session } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { DollarSign, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ProjectCost {
  id: string;
  companyId: string;
  projectId: string;
  title: string;
  category: string;
  amount: number;
  currency: string;
  description: string;
  createdBy: string;
  createdAt: bigint;
}

interface Project {
  id: string;
  name: string;
  companyId: string;
  status: string;
  deadline: string;
  createdAt: bigint;
  description: string;
}

const CATEGORIES = ["Malzeme", "İşçilik", "Ekipman", "Diğer"];
const CURRENCIES = ["TRY", "USD", "EUR"];

const categoryColor: Record<string, string> = {
  Malzeme: "bg-blue-100 text-blue-700",
  İşçilik: "bg-orange-100 text-orange-700",
  Ekipman: "bg-purple-100 text-purple-700",
  Diğer: "bg-gray-100 text-gray-600",
};

const currencySymbol: Record<string, string> = {
  TRY: "₺",
  USD: "$",
  EUR: "€",
};

function formatAmount(amount: number, currency: string) {
  const sym = currencySymbol[currency] ?? currency;
  return `${sym}${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ProjectCosts({ session }: { session: Session }) {
  const { actor } = useActor();
  const api = actor as any;

  const [costs, setCosts] = useState<ProjectCost[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [form, setForm] = useState({
    projectId: "",
    title: "",
    category: "Malzeme",
    amount: "",
    currency: "TRY",
    description: "",
  });

  const loadData = async () => {
    if (!api) return;
    setLoading(true);
    try {
      const [rawCosts, rawProjects] = await Promise.all([
        api.listProjectCosts(session.companyId),
        api.listProjects(session.companyId),
      ]);
      setCosts((rawCosts as ProjectCost[]) ?? []);
      setProjects((rawProjects as Project[]) ?? []);
    } catch {
      toast.error("Veriler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: actor stabilizes after init
  useEffect(() => {
    loadData();
  }, [session.companyId, api]);

  const filteredCosts = (
    selectedProject === "all"
      ? costs
      : costs.filter((c) => c.projectId === selectedProject)
  ).sort((a, b) => Number(b.createdAt - a.createdAt));

  const sum = (cat?: string) =>
    filteredCosts
      .filter((c) => !cat || c.category === cat)
      .reduce((acc, c) => acc + c.amount, 0);

  const handleSubmit = async () => {
    if (!form.projectId || !form.title || !form.amount) {
      toast.error("Lütfen zorunlu alanları doldurun.");
      return;
    }
    const amt = Number.parseFloat(form.amount);
    if (Number.isNaN(amt) || amt <= 0) {
      toast.error("Geçerli bir tutar girin.");
      return;
    }
    setSaving(true);
    try {
      await api.addProjectCost(
        session.companyId,
        form.projectId,
        form.title,
        form.category,
        amt,
        form.currency,
        form.description,
        session.personnelId,
      );
      toast.success("Maliyet kaydedildi.");
      setDialogOpen(false);
      setForm({
        projectId: "",
        title: "",
        category: "Malzeme",
        amount: "",
        currency: "TRY",
        description: "",
      });
      loadData();
    } catch {
      toast.error("Maliyet kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await api.deleteProjectCost(id);
      toast.success("Kayıt silindi.");
      loadData();
    } catch {
      toast.error("Silinemedi.");
    } finally {
      setDeleting(null);
    }
  };

  const projectName = (id: string) =>
    projects.find((p) => p.id === id)?.name ?? id;

  const totalAll = sum();

  const summaryCards = [
    {
      label: "Toplam Maliyet",
      value: totalAll,
      color: "from-indigo-500 to-purple-600",
    },
    {
      label: "Malzeme",
      value: sum("Malzeme"),
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "İşçilik",
      value: sum("İşçilik"),
      color: "from-orange-400 to-orange-500",
    },
    {
      label: "Ekipman",
      value: sum("Ekipman"),
      color: "from-purple-500 to-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl bg-gradient-to-br ${card.color} p-4 text-white shadow`}
          >
            <p className="text-xs font-medium opacity-80 mb-1">{card.label}</p>
            <p
              className="text-xl font-bold"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              ₺
              {card.value.toLocaleString("tr-TR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        ))}
      </div>

      {/* Controls row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger
            className="w-64"
            data-ocid="project-costs.filter.select"
          >
            <SelectValue placeholder="Proje seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Projeler</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white"
          data-ocid="project-costs.open_modal_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Maliyet Ekle
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            Maliyet Kayıtları
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div
              className="flex justify-center py-12"
              data-ocid="project-costs.loading_state"
            >
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredCosts.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-ocid="project-costs.empty_state"
            >
              Henüz maliyet kaydı eklenmemiş.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Başlık</TableHead>
                    <TableHead>Proje</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead className="w-10">Sil</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCosts.map((cost, idx) => (
                    <TableRow
                      key={cost.id}
                      data-ocid={`project-costs.item.${idx + 1}`}
                    >
                      <TableCell className="font-medium">
                        {cost.title}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {projectName(cost.projectId)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            categoryColor[cost.category] ??
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {cost.category}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatAmount(cost.amount, cost.currency)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                        {cost.description || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {new Date(
                          Number(cost.createdAt) / 1_000_000,
                        ).toLocaleDateString("tr-TR")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(cost.id)}
                          disabled={deleting === cost.id}
                          data-ocid={`project-costs.delete_button.${idx + 1}`}
                        >
                          {deleting === cost.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md" data-ocid="project-costs.dialog">
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Yeni Maliyet Ekle
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Proje *</Label>
              <Select
                value={form.projectId}
                onValueChange={(v) => setForm((f) => ({ ...f, projectId: v }))}
              >
                <SelectTrigger data-ocid="project-costs.select">
                  <SelectValue placeholder="Proje seçin" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Başlık *</Label>
              <Input
                placeholder="Maliyet başlığı"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                data-ocid="project-costs.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Kategori</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Para Birimi</Label>
                <Select
                  value={form.currency}
                  onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tutar *</Label>
              <Input
                type="number"
                placeholder="0.00"
                min={0}
                step={0.01}
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Açıklama</Label>
              <Textarea
                placeholder="İsteğe bağlı açıklama"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                data-ocid="project-costs.textarea"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-ocid="project-costs.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              data-ocid="project-costs.submit_button"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
