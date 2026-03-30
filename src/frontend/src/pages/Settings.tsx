import type { Session } from "@/App";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useActor } from "@/hooks/useActor";
import {
  Building2,
  Check,
  Copy,
  Cpu,
  Folder,
  Lock,
  Shield,
  User,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  session: Session;
}

const roleLabelMap: Record<string, string> = {
  companyAdmin: "Şirket Yöneticisi",
  admin: "Yönetici",
  manager: "Müdür",
  user: "Personel",
  guest: "Misafir",
};

const roleBadgeColor: Record<string, string> = {
  companyAdmin: "bg-purple-100 text-purple-700",
  admin: "bg-indigo-100 text-indigo-700",
  manager: "bg-blue-100 text-blue-700",
  user: "bg-green-100 text-green-700",
  guest: "bg-gray-100 text-gray-600",
};

export default function Settings({ session }: Props) {
  const { actor } = useActor();
  const api = actor as any;
  const roleLabel = roleLabelMap[session.role] ?? session.role;
  const roleCls = roleBadgeColor[session.role] ?? "bg-gray-100 text-gray-600";

  const [copied, setCopied] = useState(false);
  const [machineCount, setMachineCount] = useState<number | null>(null);
  const [personnelCount, setPersonnelCount] = useState<number | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: actor stabilizes after init
  useEffect(() => {
    if (!actor || !session.companyId) return;
    Promise.all([
      actor.listMachines(session.companyId),
      api.listCompanyPersonnel(session.companyId),
    ])
      .then(([m, p]) => {
        setMachineCount((m as any[]).length);
        setPersonnelCount((p as any[]).length);
      })
      .catch(() => {});
  }, [session.companyId, actor]);

  const handleCopyCode = () => {
    if (!session.personnelId) return;
    navigator.clipboard.writeText(session.personnelId).then(() => {
      setCopied(true);
      toast.success("Giriş kodu kopyalandı!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
        >
          Ayarlar
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Hesap ve şirket bilgilerinizi görüntüleyin
        </p>
      </div>

      {/* Genel Bakış */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Folder className="w-4 h-4 text-primary" />
            Genel Bakış
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-4 flex items-center gap-3">
              <Cpu className="w-5 h-5 text-indigo-600" />
              <div>
                <p
                  className="text-2xl font-bold text-indigo-700"
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  {machineCount ?? "—"}
                </p>
                <p className="text-xs text-indigo-600">Toplam Makine</p>
              </div>
            </div>
            <div className="rounded-lg bg-violet-50 border border-violet-100 p-4 flex items-center gap-3">
              <Users className="w-5 h-5 text-violet-600" />
              <div>
                <p
                  className="text-2xl font-bold text-violet-700"
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  {personnelCount ?? "—"}
                </p>
                <p className="text-xs text-violet-600">Toplam Personel</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card data-ocid="settings.panel">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Hesap Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Personel ID</span>
            <span className="text-sm font-mono font-medium">
              {session.personnelId || "—"}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Rol</span>
            <Badge variant="secondary" className={roleCls}>
              {roleLabel}
            </Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Giriş Kodu</span>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 font-mono text-xs"
              onClick={handleCopyCode}
              data-ocid="settings.copy.button"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied
                ? "Kopyalandı"
                : session.personnelId
                  ? `${session.personnelId.slice(0, 4)}••••`
                  : "—"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Company Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            Şirket Bilgisi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Şirket ID</span>
            <span className="text-sm font-mono font-medium">
              {session.companyId || "—"}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Platform</span>
            <span className="text-sm font-medium">FactoryVerse</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Altyapı</span>
            <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">
              ICP Blockchain
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Güvenlik
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <Lock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-800">
                Giriş Kodunuzu Koruyun
              </p>
              <p className="text-xs text-amber-700">
                Giriş kodunuzu kimseyle paylaşmayın. Şirket yöneticisi dahil hiç
                kimse kodunuzu istememeli.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-800">
                Hesap Güvenliği
              </p>
              <p className="text-xs text-blue-700">
                Kodunuzun başkalarının eline geçtiğini düşünüyorsanız şirket
                yöneticinize başvurun.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
