import type { Page } from "@/App";
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
import { ArrowLeft, CheckCircle2, Copy, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  navigate: (p: Page) => void;
}

export default function CompanyRegister({ navigate }: Props) {
  const { actor } = useActor();
  const [name, setName] = useState("");
  const [mode, setMode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    id: string;
    adminCode: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.adminCode);
    setCopied(true);
    toast.success("Yönetici kodu kopyalandı!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Şirket adı gereklidir.");
      return;
    }
    if (!mode) {
      toast.error("Lütfen bir mod seçin.");
      return;
    }
    if (!actor) {
      toast.error("Bağlantı kuruluyor, lütfen bekleyin.");
      return;
    }
    setLoading(true);
    try {
      const res = await actor.registerCompany(name.trim(), mode);
      setResult(res);
      toast.success("Şirket başarıyla kaydedildi!");
    } catch {
      toast.error("Kayıt sırasında hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => navigate("landing")}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
          data-ocid="company_register.back.button"
        >
          <ArrowLeft className="w-4 h-4" /> Ana Sayfaya Dön
        </button>

        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <span
              className="text-primary-foreground font-bold"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              F
            </span>
          </div>
          <span
            className="font-bold text-xl"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            FactoryVerse
          </span>
        </div>

        {!result ? (
          <Card>
            <CardHeader>
              <CardTitle
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Şirket Kur
              </CardTitle>
              <CardDescription>
                Şirketinizi kaydedin ve yönetici kodunuzu alın
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Şirket Adı</Label>
                  <Input
                    id="company-name"
                    placeholder="FactoryTech A.Ş."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    data-ocid="company_register.name.input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Operasyon Modu</Label>
                  <Select onValueChange={setMode}>
                    <SelectTrigger data-ocid="company_register.mode.select">
                      <SelectValue placeholder="Mod seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relocation">
                        Taşıma (Relocation)
                      </SelectItem>
                      <SelectItem value="greenfield">
                        Kurulum (Greenfield)
                      </SelectItem>
                      <SelectItem value="hybrid">Hibrit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                  data-ocid="company_register.submit_button"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {loading ? "Kaydediliyor..." : "Şirket Kur"}
                </Button>
              </form>
              <p className="text-center text-sm text-muted-foreground mt-4">
                Zaten hesabınız var mı?{" "}
                <button
                  type="button"
                  onClick={() => navigate("login")}
                  className="text-primary hover:underline font-medium"
                  data-ocid="company_register.login.link"
                >
                  Giriş Yap
                </button>
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card
            className="border-green-200"
            data-ocid="company_register.success_state"
          >
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                <CardTitle
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  Şirket Oluşturuldu!
                </CardTitle>
              </div>
              <CardDescription>
                Aşağıdaki bilgileri güvenli bir yerde saklayın.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-amber-50 border-amber-200">
                <AlertDescription className="text-amber-800 text-sm">
                  ⚠️ <strong>Önemli:</strong> Bu kodları güvenli bir yerde
                  saklayın. Yönetici giriş kodunuzu kaybederseniz hesabınıza
                  erişemezsiniz.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                  Şirket ID
                </Label>
                <p className="font-mono text-sm bg-muted px-3 py-2 rounded-md">
                  {result.id}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                  Yönetici Giriş Kodu
                </Label>
                <div className="flex gap-2">
                  <p className="font-mono text-lg font-bold bg-primary/10 text-primary px-4 py-3 rounded-md flex-1 tracking-widest text-center">
                    {result.adminCode}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    data-ocid="company_register.copy.button"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => navigate("login")}
                data-ocid="company_register.goto_login.button"
              >
                Giriş Yap
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
