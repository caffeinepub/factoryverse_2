import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActor } from "@/hooks/useActor";
import { Info, Loader2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Personnel() {
  const { actor } = useActor();
  const [adminCode, setAdminCode] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminCode || !inviteCode || !role) {
      toast.error("Tüm alanlar zorunludur.");
      return;
    }
    if (!actor) {
      toast.error("Bağlantı hatası.");
      return;
    }
    setLoading(true);
    try {
      await actor.addPersonnelToCompany(adminCode, inviteCode, role);
      toast.success("Personel şirkete başarıyla eklendi!");
      setAdminCode("");
      setInviteCode("");
      setRole("");
    } catch {
      toast.error("Personel eklenirken hata oluştu. Kodları kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
        >
          Personel Yönetimi
        </h2>
        <p className="text-muted-foreground text-sm">
          Personelleri şirkete ekleyin ve rol atayın.
        </p>
      </div>

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
              {loading ? "Ekleniyor..." : "Personeli Şirkete Ekle"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
