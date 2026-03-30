import type { Page, Session } from "@/App";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActor } from "@/hooks/useActor";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  navigate: (p: Page) => void;
  onLogin: (s: Session) => void;
}

function LoginForm({
  description,
  onSubmit,
  loading,
  code,
  setCode,
  tabId,
}: {
  description: string;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  code: string;
  setCode: (v: string) => void;
  tabId: string;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="space-y-2">
        <Label htmlFor={`code-${tabId}`}>Giriş Kodu</Label>
        <Input
          id={`code-${tabId}`}
          placeholder="Örn: AB12CD34EF56"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={24}
          className="font-mono tracking-widest text-center text-lg"
          autoComplete="off"
          data-ocid="login.input"
        />
      </div>
      <Button
        type="submit"
        className="w-full text-white"
        disabled={loading}
        data-ocid="login.submit_button"
      >
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
      </Button>
    </form>
  );
}

export default function Login({ navigate, onLogin }: Props) {
  const { actor } = useActor();
  const [companyCode, setCompanyCode] = useState("");
  const [personnelCode, setPersonnelCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("company");

  const handleSubmit = async (e: React.FormEvent, code: string) => {
    e.preventDefault();
    if (code.trim().length < 4) {
      toast.error("Lütfen geçerli bir giriş kodu girin.");
      return;
    }
    if (!actor) {
      toast.error("Bağlantı kuruluyor, lütfen bekleyin.");
      return;
    }
    setLoading(true);
    try {
      const result = await actor.authenticate(code.trim());
      if (!result) {
        toast.error("Geçersiz giriş kodu. Lütfen tekrar deneyin.");
        return;
      }
      const session: Session = {
        companyId: result.companyId ?? "",
        personnelId: result.personnelId ?? "",
        role: result.role ?? "user",
      };
      toast.success("Giriş başarılı! Hoş geldiniz.");
      onLogin(session);
    } catch {
      toast.error("Bağlantı hatası. Lütfen tekrar deneyin.");
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
          data-ocid="login.back.button"
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

        <Card>
          <CardHeader>
            <CardTitle
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              {activeTab === "company" ? "Şirket Girişi" : "Personel Girişi"}
            </CardTitle>
            <CardDescription>
              Hesap tipinizi seçerek giriş yapın
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList
                className="grid w-full grid-cols-2 mb-6"
                data-ocid="login.tab"
              >
                <TabsTrigger value="company" data-ocid="login.company.tab">
                  Şirket Girişi
                </TabsTrigger>
                <TabsTrigger value="personnel" data-ocid="login.personnel.tab">
                  Personel Girişi
                </TabsTrigger>
              </TabsList>

              <TabsContent value="company">
                <LoginForm
                  tabId="company"
                  description="Şirket yönetici kodunuzu girin"
                  onSubmit={(e) => handleSubmit(e, companyCode)}
                  loading={loading}
                  code={companyCode}
                  setCode={setCompanyCode}
                />
              </TabsContent>

              <TabsContent value="personnel">
                <LoginForm
                  tabId="personnel"
                  description="Personel giriş kodunuzu girin"
                  onSubmit={(e) => handleSubmit(e, personnelCode)}
                  loading={loading}
                  code={personnelCode}
                  setCode={setPersonnelCode}
                />
              </TabsContent>
            </Tabs>

            <div className="mt-6 pt-6 border-t border-border text-sm text-center space-y-2">
              <p className="text-muted-foreground">
                Hesabınız yok mu?{" "}
                <button
                  type="button"
                  onClick={() => navigate("register")}
                  className="text-primary hover:underline font-medium"
                  data-ocid="login.register.link"
                >
                  Şirket Kur
                </button>
              </p>
              <p className="text-muted-foreground">
                Yeni personel misiniz?{" "}
                <button
                  type="button"
                  onClick={() => navigate("personnel-register")}
                  className="text-primary hover:underline font-medium"
                  data-ocid="login.personnel_register.link"
                >
                  Self Kayıt
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
