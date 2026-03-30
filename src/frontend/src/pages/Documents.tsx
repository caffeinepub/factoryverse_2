import type { Session } from "@/App";
import type { Document } from "@/backend.d";
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
import { useActor } from "@/hooks/useActor";
import { FileText, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  session: Session;
}

const categoryMap: Record<string, { label: string; cls: string }> = {
  teknik: { label: "Teknik", cls: "bg-blue-100 text-blue-700" },
  sözleşme: { label: "Sözleşme", cls: "bg-purple-100 text-purple-700" },
  diğer: { label: "Diğer", cls: "bg-gray-100 text-gray-600" },
};

function formatDate(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("tr-TR");
}

const isAdmin = (role: string) =>
  role === "admin" || role === "companyAdmin" || role === "manager";

export default function Documents({ session }: Props) {
  const { actor } = useActor();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    fileName: "",
    category: "teknik",
  });

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Document | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    fileName: "",
    category: "teknik",
  });
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    if (!actor || !session.companyId) {
      setLoading(false);
      return;
    }
    const a = actor as any;
    a.listDocuments(session.companyId)
      .then((res: Document[]) => setDocs(res))
      .catch(() => toast.error("Dokümanlar yüklenemedi"))
      .finally(() => setLoading(false));
  }, [session.companyId, actor]);

  const reload = async () => {
    if (!actor) return;
    const res: Document[] = await (actor as any).listDocuments(
      session.companyId,
    );
    setDocs(res);
  };

  const handleAdd = async () => {
    if (!actor || !form.title.trim() || !form.fileName.trim()) {
      toast.error("Başlık ve dosya adı zorunludur");
      return;
    }
    setSaving(true);
    try {
      const a = actor as any;
      const uploader =
        session.personnelId && session.personnelId !== ""
          ? session.personnelId
          : "Yönetici";
      await a.addDocument(
        session.companyId,
        form.title.trim(),
        form.fileName.trim(),
        form.category,
        uploader,
      );
      await reload();
      setForm({ title: "", fileName: "", category: "teknik" });
      setDialogOpen(false);
      toast.success("Doküman eklendi");
    } catch {
      toast.error("Doküman eklenemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!actor) return;
    setDeletingId(id);
    try {
      await (actor as any).deleteDocument(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
      toast.success("Doküman silindi");
    } catch {
      toast.error("Silinemedi");
    } finally {
      setDeletingId(null);
    }
  };

  const openEdit = (doc: Document) => {
    setEditTarget(doc);
    setEditForm({
      title: doc.title,
      fileName: doc.fileName,
      category: doc.category,
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!actor || !editTarget) return;
    if (!editForm.title.trim() || !editForm.fileName.trim()) {
      toast.error("Başlık ve dosya adı zorunludur");
      return;
    }
    setEditSaving(true);
    try {
      await (actor as any).updateDocument(
        editTarget.id,
        editForm.title.trim(),
        editForm.fileName.trim(),
        editForm.category,
      );
      await reload();
      setEditOpen(false);
      setEditTarget(null);
      toast.success("Doküman güncellendi");
    } catch {
      toast.error("Güncelleme başarısız");
    } finally {
      setEditSaving(false);
    }
  };

  const canEdit = isAdmin(session.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Doküman Yönetimi
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Şirket dokümanlarını takip edin
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-ocid="documents.open_modal_button">
              <Plus className="w-4 h-4 mr-2" />
              Doküman Ekle
            </Button>
          </DialogTrigger>
          <DialogContent data-ocid="documents.dialog">
            <DialogHeader>
              <DialogTitle>Yeni Doküman</DialogTitle>
              <DialogDescription>
                Doküman bilgilerini doldurun
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="doc-title">Başlık</Label>
                <Input
                  id="doc-title"
                  placeholder="Doküman başlığı"
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  data-ocid="documents.input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-filename">Dosya Adı</Label>
                <Input
                  id="doc-filename"
                  placeholder="örn. sozlesme_2026.pdf"
                  value={form.fileName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, fileName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-category">Kategori</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}
                >
                  <SelectTrigger id="doc-category" data-ocid="documents.select">
                    <SelectValue placeholder="Kategori seç" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teknik">Teknik</SelectItem>
                    <SelectItem value="sözleşme">Sözleşme</SelectItem>
                    <SelectItem value="diğer">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-ocid="documents.cancel_button"
              >
                İptal
              </Button>
              <Button
                onClick={handleAdd}
                disabled={saving}
                data-ocid="documents.submit_button"
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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Dokümanlar ({docs.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div
              className="flex items-center justify-center h-32"
              data-ocid="documents.loading_state"
            >
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : docs.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center h-32 text-muted-foreground"
              data-ocid="documents.empty_state"
            >
              <FileText className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Henüz doküman eklenmedi</p>
            </div>
          ) : (
            <div className="overflow-x-auto" data-ocid="documents.table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Başlık</TableHead>
                    <TableHead>Dosya Adı</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Yükleyen</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead className={canEdit ? "w-24" : "w-16"}>
                      İşlemler
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docs.map((doc, idx) => {
                    const cat = categoryMap[doc.category] ?? {
                      label: doc.category,
                      cls: "bg-gray-100 text-gray-600",
                    };
                    return (
                      <TableRow
                        key={doc.id}
                        data-ocid={`documents.item.${idx + 1}`}
                      >
                        <TableCell className="font-medium">
                          {doc.title}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">
                          {doc.fileName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={cat.cls}>
                            {cat.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {doc.uploadedBy}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(doc.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-primary"
                                onClick={() => openEdit(doc)}
                                data-ocid={`documents.edit_button.${idx + 1}`}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(doc.id)}
                              disabled={deletingId === doc.id}
                              data-ocid={`documents.delete_button.${idx + 1}`}
                            >
                              {deletingId === doc.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
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

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent data-ocid="documents.edit_dialog">
          <DialogHeader>
            <DialogTitle>Dokümanı Düzenle</DialogTitle>
            <DialogDescription>
              Doküman bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Başlık</Label>
              <Input
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, title: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Dosya Adı</Label>
              <Input
                value={editForm.fileName}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, fileName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select
                value={editForm.category}
                onValueChange={(v) =>
                  setEditForm((p) => ({ ...p, category: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teknik">Teknik</SelectItem>
                  <SelectItem value="sözleşme">Sözleşme</SelectItem>
                  <SelectItem value="diğer">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              data-ocid="documents.edit_cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleEdit}
              disabled={editSaving}
              data-ocid="documents.edit_save_button"
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
