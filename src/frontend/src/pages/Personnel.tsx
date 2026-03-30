import type { Session } from "@/App";
import type { Personnel } from "@/backend.d";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useActor } from "@/hooks/useActor";
import { FileDown, Info, Loader2, Pencil, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  session: Session;
}

const roleLabelMap: Record<string, string> = {
  companyAdmin: "Yönetici",
  admin: "Yönetici",
  manager: "Müdür",
  user: "Personel",
  guest: "Misafir",
};

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

export default function PersonnelPage({ session }: Props) {
  const { actor } = useActor();
  const api = actor as any;
  const isAdmin = session.role === "companyAdmin" || session.role === "admin";

  // Add form state
  const [adminCode, setAdminCode] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  // List state
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [listLoading, setListLoading] = useState(true);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Personnel | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Personnel | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const loadPersonnel = async () => {
    if (!session.companyId || !api) {
      setListLoading(false);
      return;
    }
    try {
      const data: Personnel[] = await api.listCompanyPersonnel(
        session.companyId,
      );
      setPersonnel(data);
    } catch {
      toast.error("Personel listesi yüklenemedi.");
    } finally {
      setListLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: actor stabilizes after init
  useEffect(() => {
    loadPersonnel();
  }, [session.companyId, actor]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminCode || !inviteCode || !role) {
      toast.error("Tüm alanlar zorunludur.");
      return;
    }
    if (!api) {
      toast.error("Bağlantı hatası.");
      return;
    }
    setLoading(true);
    try {
      await api.addPersonnelToCompany(adminCode, inviteCode, role);
      toast.success("Personel şirkete başarıyla eklendi!");
      setAdminCode("");
      setInviteCode("");
      setRole("");
      await loadPersonnel();
    } catch {
      toast.error("Personel eklenirken hata oluştu. Kodları kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (p: Personnel) => {
    setEditTarget(p);
    setEditName(p.name);
    setEditRole(p.role);
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editTarget || !api) return;
    setEditSubmitting(true);
    try {
      await api.updatePersonnel(editTarget.id, editName, editRole);
      toast.success("Personel güncellendi.");
      setPersonnel((prev) =>
        prev.map((p) =>
          p.id === editTarget.id ? { ...p, name: editName, role: editRole } : p,
        ),
      );
      setEditOpen(false);
    } catch {
      toast.error("Güncelleme sırasında hata oluştu.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !api) return;
    setDeleteSubmitting(true);
    try {
      await api.deletePersonnel(deleteTarget.id);
      toast.success("Personel silindi.");
      setPersonnel((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteOpen(false);
    } catch {
      toast.error("Silme sırasında hata oluştu.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    downloadCsv(
      "personel.csv",
      ["Ad Soyad", "Rol", "Giriş Kodu", "Davet Kodu"],
      personnel.map((p) => [
        p.name || "",
        roleLabelMap[p.role] ?? p.role,
        p.loginCode || "",
        p.inviteCode || "",
      ]),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Personel Yönetimi
          </h2>
          <p className="text-muted-foreground text-sm">
            Şirket personellerini yönetin.
          </p>
        </div>
        {personnel.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            data-ocid="personnel.csv.button"
          >
            <FileDown className="w-4 h-4 mr-2" /> CSV İndir
          </Button>
        )}
      </div>

      {/* Personnel List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Personel Listesi
          </CardTitle>
          <CardDescription>{personnel.length} personel kayıtlı</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {listLoading ? (
            <div
              className="flex items-center justify-center py-10"
              data-ocid="personnel.loading_state"
            >
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : personnel.length === 0 ? (
            <div
              className="text-center py-10 text-muted-foreground"
              data-ocid="personnel.empty_state"
            >
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Henüz personel eklenmemiş.</p>
            </div>
          ) : (
            <div className="rounded-b-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Ad Soyad</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Giriş Kodu
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Davet Kodu
                    </TableHead>
                    {isAdmin && (
                      <TableHead className="w-24">İşlemler</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {personnel.map((p, idx) => (
                    <TableRow
                      key={p.id}
                      data-ocid={`personnel.item.${idx + 1}`}
                    >
                      <TableCell className="font-medium">
                        {p.name || "—"}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                          {roleLabelMap[p.role] ?? p.role}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-sm text-muted-foreground">
                        {p.loginCode}
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-sm text-muted-foreground">
                        {p.inviteCode}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="px-2"
                              onClick={() => handleOpenEdit(p)}
                              data-ocid={`personnel.edit_button.${idx + 1}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setDeleteTarget(p);
                                setDeleteOpen(true);
                              }}
                              data-ocid={`personnel.delete_button.${idx + 1}`}
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
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent
          aria-describedby="edit-personnel-desc"
          data-ocid="personnel.edit.dialog"
        >
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Personeli Düzenle
            </DialogTitle>
            <DialogDescription id="edit-personnel-desc">
              Ad ve rol bilgilerini güncelleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Ad Soyad</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Ad Soyad"
                data-ocid="personnel.edit.name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rol</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger data-ocid="personnel.edit.role.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="companyAdmin">
                    Şirket Yöneticisi
                  </SelectItem>
                  <SelectItem value="manager">Modül Yöneticisi</SelectItem>
                  <SelectItem value="user">Saha Personeli</SelectItem>
                  <SelectItem value="guest">Salt Okunur Misafir</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              data-ocid="personnel.edit.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={editSubmitting}
              data-ocid="personnel.edit.save_button"
            >
              {editSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {editSubmitting ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent
          aria-describedby="delete-personnel-desc"
          data-ocid="personnel.delete.dialog"
        >
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Personeli Sil
            </DialogTitle>
            <DialogDescription id="delete-personnel-desc">
              <strong>{deleteTarget?.name}</strong> adlı personeli silmek
              istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              data-ocid="personnel.delete.cancel_button"
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteSubmitting}
              data-ocid="personnel.delete.confirm_button"
            >
              {deleteSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {deleteSubmitting ? "Siliniyor..." : "Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            <CardTitle
              className="text-base text-blue-800"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Personel Kayıt Akışı
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-blue-800">
            <li>Personel self-kayıt sayfasına gider ve kaydını tamamlar.</li>
            <li>
              Sistem personele bir <strong>Davet Kodu</strong> verir.
            </li>
            <li>Personel bu davet kodunu size (yöneticiye) iletir.</li>
            <li>
              Siz aşağıdaki formu doldurarak personeli şirkete ekler ve rol
              atarsınız.
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Add Personnel Form */}
      <Card>
        <CardHeader>
          <CardTitle
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Personel Ekle
          </CardTitle>
          <CardDescription>
            Personelin davet kodunu ve atayacağınız rolü girin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <Alert className="bg-amber-50 border-amber-200">
              <AlertDescription className="text-amber-800 text-sm">
                ⚠️ Yönetici kodunuz giriş kodunuzla aynıdır. Şirket kaydı
                sırasında aldığınız kodu kullanın.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="admin-code">
                Yönetici Kodunuz (Admin Kodu) *
              </Label>
              <Input
                id="admin-code"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value.toUpperCase())}
                placeholder="Yönetici giriş kodunuz"
                className="font-mono tracking-wider"
                data-ocid="personnel.admin_code.input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-code">Personel Davet Kodu *</Label>
              <Input
                id="invite-code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Personelin size ilettiği davet kodu"
                className="font-mono tracking-wider"
                data-ocid="personnel.invite_code.input"
              />
            </div>

            <div className="space-y-2">
              <Label>Rol *</Label>
              <Select onValueChange={setRole}>
                <SelectTrigger data-ocid="personnel.role.select">
                  <SelectValue placeholder="Rol seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="companyAdmin">
                    Şirket Yöneticisi
                  </SelectItem>
                  <SelectItem value="manager">Modül Yöneticisi</SelectItem>
                  <SelectItem value="user">Saha Personeli</SelectItem>
                  <SelectItem value="guest">Salt Okunur Misafir</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              data-ocid="personnel.submit_button"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Users className="w-4 h-4 mr-2" />
              )}
              {loading ? "Ekleniyor..." : "Personeli şirkete Ekle"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
