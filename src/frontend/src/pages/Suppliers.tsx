import type { Session } from "@/App";
import type { Supplier } from "@/backend.d";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Building2,
  Loader2,
  Pencil,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  session: Session;
}

const categories = ["Malzeme", "Hizmet", "Ekipman", "Nakliye", "Diğer"];

const emptyForm = {
  name: "",
  category: "Malzeme",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  address: "",
  notes: "",
};

export default function Suppliers({ session }: Props) {
  const { actor } = useActor();
  const api = actor as any;
  const isAdmin = session.role === "companyAdmin" || session.role === "admin";

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Add dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [addSubmitting, setAddSubmitting] = useState(false);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Supplier | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const loadSuppliers = async () => {
    if (!session.companyId || !api) {
      setLoading(false);
      return;
    }
    try {
      const data: Supplier[] = await api.listSuppliers(session.companyId);
      setSuppliers(data);
    } catch {
      toast.error("Tedarikçiler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: actor stabilizes after init
  useEffect(() => {
    loadSuppliers();
  }, [session.companyId, actor]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name) {
      toast.error("Tedarikçi adı zorunludur.");
      return;
    }
    if (!api) return;
    setAddSubmitting(true);
    try {
      await api.addSupplier(
        session.companyId,
        addForm.name,
        addForm.category,
        addForm.contactName,
        addForm.contactPhone,
        addForm.contactEmail,
        addForm.address,
        addForm.notes,
      );
      toast.success("Tedarikçi eklendi!");
      setAddOpen(false);
      setAddForm(emptyForm);
      await loadSuppliers();
    } catch {
      toast.error("Tedarikçi eklenirken hata oluştu.");
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditTarget(s);
    setEditForm({
      name: s.name,
      category: s.category,
      contactName: s.contactName,
      contactPhone: s.contactPhone,
      contactEmail: s.contactEmail,
      address: s.address,
      notes: s.notes,
    });
    setEditOpen(true);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget || !api) return;
    setEditSubmitting(true);
    try {
      await api.updateSupplier(
        editTarget.id,
        editForm.name,
        editForm.category,
        editForm.contactName,
        editForm.contactPhone,
        editForm.contactEmail,
        editForm.address,
        editForm.notes,
      );
      toast.success("Tedarikçi güncellendi.");
      setSuppliers((prev) =>
        prev.map((s) => (s.id === editTarget.id ? { ...s, ...editForm } : s)),
      );
      setEditOpen(false);
    } catch {
      toast.error("Güncelleme sırasında hata oluştu.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleToggleStatus = async (s: Supplier) => {
    if (!api) return;
    const newStatus = s.status === "active" ? "passive" : "active";
    try {
      await api.updateSupplierStatus(s.id, newStatus);
      setSuppliers((prev) =>
        prev.map((sup) =>
          sup.id === s.id ? { ...sup, status: newStatus } : sup,
        ),
      );
      toast.success(
        `Durum ${newStatus === "active" ? "Aktif" : "Pasif"} olarak güncellendi.`,
      );
    } catch {
      toast.error("Durum güncellenemedi.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !api) return;
    setDeleteSubmitting(true);
    try {
      await api.deleteSupplier(deleteTarget.id);
      toast.success("Tedarikçi silindi.");
      setSuppliers((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteOpen(false);
    } catch {
      toast.error("Silme sırasında hata oluştu.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const SupplierForm = ({
    form,
    setForm,
    onSubmit,
    submitting,
    submitLabel,
    onCancel,
    cancelOcid,
    submitOcid,
  }: {
    form: typeof emptyForm;
    setForm: (f: typeof emptyForm) => void;
    onSubmit: (e: React.FormEvent) => void;
    submitting: boolean;
    submitLabel: string;
    onCancel: () => void;
    cancelOcid: string;
    submitOcid: string;
  }) => (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label>Ad *</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Tedarikçi adı"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Kategori</Label>
          <Select
            value={form.category}
            onValueChange={(v) => setForm({ ...form, category: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Yetkili Kişi</Label>
          <Input
            value={form.contactName}
            onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            placeholder="Ad Soyad"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Telefon</Label>
          <Input
            value={form.contactPhone}
            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            placeholder="+90 5xx xxx xx xx"
          />
        </div>
        <div className="space-y-1.5">
          <Label>E-posta</Label>
          <Input
            type="email"
            value={form.contactEmail}
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            placeholder="info@tedarikci.com"
          />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Adres</Label>
          <Input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Şehir, İlçe"
          />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Notlar</Label>
          <Textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            placeholder="Ek notlar..."
          />
        </div>
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          data-ocid={cancelOcid}
        >
          İptal
        </Button>
        <Button type="submit" disabled={submitting} data-ocid={submitOcid}>
          {submitting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : null}
          {submitting ? "Kaydediliyor..." : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Tedarikçiler
          </h2>
          <p className="text-muted-foreground text-sm">
            {suppliers.length} tedarikçi kayıtlı
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setAddOpen(true)}
            data-ocid="suppliers.add.open_modal_button"
          >
            <Plus className="w-4 h-4 mr-2" /> Tedarikçi Ekle
          </Button>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent
          aria-describedby="add-supplier-desc"
          data-ocid="suppliers.add.dialog"
        >
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Tedarikçi Ekle
            </DialogTitle>
            <DialogDescription id="add-supplier-desc">
              Yeni tedarikçi bilgilerini doldurun.
            </DialogDescription>
          </DialogHeader>
          <SupplierForm
            form={addForm}
            setForm={setAddForm}
            onSubmit={handleAdd}
            submitting={addSubmitting}
            submitLabel="Ekle"
            onCancel={() => setAddOpen(false)}
            cancelOcid="suppliers.add.cancel_button"
            submitOcid="suppliers.add.submit_button"
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent
          aria-describedby="edit-supplier-desc"
          data-ocid="suppliers.edit.dialog"
        >
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Tedarikçiyi Düzenle
            </DialogTitle>
            <DialogDescription id="edit-supplier-desc">
              Tedarikçi bilgilerini güncelleyin.
            </DialogDescription>
          </DialogHeader>
          <SupplierForm
            form={editForm}
            setForm={setEditForm}
            onSubmit={handleEditSave}
            submitting={editSubmitting}
            submitLabel="Güncelle"
            onCancel={() => setEditOpen(false)}
            cancelOcid="suppliers.edit.cancel_button"
            submitOcid="suppliers.edit.submit_button"
          />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent
          aria-describedby="delete-supplier-desc"
          data-ocid="suppliers.delete.dialog"
        >
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Tedarikçiyi Sil
            </DialogTitle>
            <DialogDescription id="delete-supplier-desc">
              <strong>{deleteTarget?.name}</strong> adlı tedarikçiyi silmek
              istediğinizden emin misiniz?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              data-ocid="suppliers.delete.cancel_button"
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteSubmitting}
              data-ocid="suppliers.delete.confirm_button"
            >
              {deleteSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {deleteSubmitting ? "Siliniyor..." : "Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div
          className="flex items-center justify-center h-40"
          data-ocid="suppliers.loading_state"
        >
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : suppliers.length === 0 ? (
        <Card data-ocid="suppliers.empty_state">
          <CardContent className="pt-12 pb-12 flex flex-col items-center gap-3 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground/40" />
            <p className="font-medium">Henüz tedarikçi yok</p>
            <p className="text-muted-foreground text-sm">
              Tedarikçi eklemek için yukarıdaki butonu kullanın.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Ad</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="hidden md:table-cell">Yetkili</TableHead>
                <TableHead className="hidden md:table-cell">Telefon</TableHead>
                <TableHead>Durum</TableHead>
                {isAdmin && <TableHead className="w-32">İşlemler</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((s, idx) => (
                <TableRow key={s.id} data-ocid={`suppliers.item.${idx + 1}`}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                      {s.category}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {s.contactName || "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {s.contactPhone || "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium border ${
                        s.status === "active"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {s.status === "active" ? "Aktif" : "Pasif"}
                    </span>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-2"
                          onClick={() => handleToggleStatus(s)}
                          title={
                            s.status === "active" ? "Pasif Yap" : "Aktif Yap"
                          }
                          data-ocid={`suppliers.toggle.${idx + 1}`}
                        >
                          {s.status === "active" ? (
                            <ToggleRight className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <ToggleLeft className="w-3.5 h-3.5 text-gray-400" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-2"
                          onClick={() => handleOpenEdit(s)}
                          data-ocid={`suppliers.edit_button.${idx + 1}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setDeleteTarget(s);
                            setDeleteOpen(true);
                          }}
                          data-ocid={`suppliers.delete_button.${idx + 1}`}
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
        </div>
      )}
    </div>
  );
}
