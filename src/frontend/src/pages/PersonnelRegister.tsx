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
import { useActor } from "@/hooks/useActor";
import { ArrowLeft, CheckCircle2, Copy, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  navigate: (p: Page) => void;
}

export default function PersonnelRegister({ navigate }: Props) {
  const { actor, isFetching: actorFetching } = useActor();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    loginCode: string;
    inviteCode: string;
  } | null>(null);
  const [copiedLogin, setCopiedLogin] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const handleCopy = async (text: string, type: "login" | "invite") => {
    await navigator.clipboard.writeText(text);
    if (type === "login") {
      setCopiedLogin(true);
      setTimeout(() => setCopiedLogin(false), 2000);
    } else {
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    }
    toast.success("Kod kopyalandı!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Ad Soyad gereklidir.");
      return;
    }
    if (!title.trim()) {
      toast.error("Unvan gereklidir.");
      return;
    }
    if (!actor || actorFetching) {
      toast.error("Bağlantı kuruluyor, lütfen bekleyin.");
      return;
    }
    setLoading(true);
    try {
      const res = await actor.selfRegisterPersonnel(
        name.trim(),
        "user",
        title.trim(),
      );
      setResult(res);
      toast.success("Kayıt başarılı! Kodlarınız hazır.");
    } catch (err) {
      console.error("selfRegisterPersonnel error:", err);
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
          data-ocid="personnel_register.back.button"
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
                Personel Kaydı
              </CardTitle>
              <CardDescription>
                Kendinizi sisteme kaydedin ve kodlarınızı alın
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-blue-800 text-sm">
                    ℹ️ Kaydınız tamamlandıktan sonra sistem size 2 kod verecek.{" "}
                    <strong>Davet kodunuzu</strong> yöneticinize iletin;
                    yöneticiniz sizi şirkete ekleyecektir.
                  </AlertDescription>
                </Alert>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullname">Ad Soyad</Label>
                    <Input
                      id="fullname"
                      placeholder="Ahmet Yılmaz"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      data-ocid="personnel_register.name.input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Unvan *</Label>
                    <Input
                      id="title"
                      placeholder="Örn: Üretim Mühendisi, Saha Teknisyeni..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      data-ocid="personnel_register.title.input"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || actorFetching}
                    data-ocid="personnel_register.submit_button"
                  >
                    {loading || actorFetching ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    {loading
                      ? "Kaydediliyor..."
                      : actorFetching
                        ? "Hazırlanıyor..."
                        : "Kayıt Ol"}
                  </Button>
                </form>
                <p className="text-center text-sm text-muted-foreground">
                  Giriş kodunuz var mı?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("login")}
                    className="text-primary hover:underline font-medium"
                    data-ocid="personnel_register.login.link"
                  >
                    Giriş Yap
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card
            className="border-green-200"
            data-ocid="personnel_register.success_state"
          >
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                <CardTitle
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  Kayıt Tamamlandı!
                </CardTitle>
              </div>
              <CardDescription>
                Kodlarınızı güvenli bir yerde saklayın.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-amber-50 border-amber-200">
                <AlertDescription className="text-amber-800 text-sm">
                  ⚠️ <strong>Davet kodunuzu yöneticinize verin.</strong>{" "}
                  Yöneticiniz bu kodu kullanarak sizi şirkete ekleyecek ve rol
                  atayacaktır.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                  Giriş Kodunuz
                </Label>
                <div className="flex gap-2">
                  <p className="font-mono text-base font-bold bg-primary/10 text-primary px-4 py-2.5 rounded-md flex-1 tracking-widest text-center">
                    {result.loginCode}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(result.loginCode, "login")}
                    data-ocid="personnel_register.copy_login.button"
                  >
                    {copiedLogin ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                  Davet Kodunuz (Yöneticiye Verin)
                </Label>
                <div className="flex gap-2">
                  <p className="font-mono text-base font-bold bg-green-50 text-green-700 border border-green-200 px-4 py-2.5 rounded-md flex-1 tracking-widest text-center">
                    {result.inviteCode}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(result.inviteCode, "invite")}
                    data-ocid="personnel_register.copy_invite.button"
                  >
                    {copiedInvite ? (
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
                data-ocid="personnel_register.goto_login.button"
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
