import type { Page } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronRight,
  ClipboardList,
  Factory,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react";

interface Props {
  navigate: (p: Page) => void;
}

const features = [
  {
    icon: <Factory className="w-6 h-6" />,
    title: "Makine Yönetimi",
    desc: "Tüm makinelerinizi tek platformda kayıt altına alın, durumlarını takip edin, bakım planlarınızı yönetin.",
  },
  {
    icon: <ClipboardList className="w-6 h-6" />,
    title: "Proje Takibi",
    desc: "Fabrika taşıma ve kurulum projelerinizi zaman çizelgesiyle yönetin, görevleri ekibinize atayın.",
  },
  {
    icon: <Wrench className="w-6 h-6" />,
    title: "Bakım Planlaması",
    desc: "Planlı ve arıza bakımlarını kayıt altına alın, öncelik seviyelerine göre sıralayın.",
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "HSE Güvenliği",
    desc: "İş sağlığı ve güvenliği risk değerlendirmelerini dijitalleştirin, uyumsuzlukları takip edin.",
  },
  {
    icon: <Truck className="w-6 h-6" />,
    title: "Lojistik & Taşıma",
    desc: "Sefer planlaması, araç ve yük takibini merkezi sistemden yönetin.",
  },
  {
    icon: <Factory className="w-6 h-6" />,
    title: "Çok Şirketli Yapı",
    desc: "Her şirket kendi izole ekosisteminde çalışır. Veri güvenliği garantiyle çok kiracılı mimari.",
  },
];

export default function Landing({ navigate }: Props) {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm font-display">
                F
              </span>
            </div>
            <span
              className="font-bold text-lg"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              FactoryVerse
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate("login")}
              data-ocid="nav.login.button"
            >
              Giriş Yap
            </Button>
            <Button
              onClick={() => navigate("register")}
              data-ocid="nav.register.button"
            >
              Şirket Kur
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="w-full px-4 sm:px-6 lg:px-8 py-24 md:py-36"
          style={{
            background:
              "linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #4338ca 100%)",
          }}
        >
          <div className="max-w-4xl mx-auto text-center">
            <h1
              className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              FactoryVerse ile Üretimin Geleceğini Yönetin
            </h1>
            <p className="text-white/75 text-lg md:text-xl max-w-2xl mx-auto mb-10">
              Fabrika taşıma ve sıfırdan kurulum operasyonlarınızı tek
              platformda yönetin. Kalıcı veri, çok cihaz erişimi, tam güvenlik.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-indigo-700 hover:bg-white/90 font-semibold text-base"
                onClick={() => navigate("register")}
                data-ocid="hero.register.button"
              >
                Şirket Kur
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10 font-semibold text-base"
                onClick={() => navigate("login")}
                data-ocid="hero.login.button"
              >
                Giriş Yap
              </Button>
            </div>
          </div>
        </div>
        {/* Wave separator */}
        <div
          className="absolute bottom-0 left-0 right-0 h-16 bg-background"
          style={{ clipPath: "ellipse(55% 100% at 50% 100%)" }}
        />
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Tüm Operasyonlarınız Tek Platformda
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Makine, proje, bakım ve güvenlik süreçlerinizi dijitalleştirin.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card
              key={f.title}
              className="border border-border hover:border-primary/40 hover:shadow-md transition-all group"
            >
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {f.icon}
                </div>
                <h3
                  className="font-semibold text-base mb-2"
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  {f.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {f.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div
          className="rounded-2xl p-10 text-center text-white"
          style={{ background: "linear-gradient(135deg, #4338ca, #6d28d9)" }}
        >
          <h2
            className="text-3xl font-bold mb-4"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Hemen Başlayın
          </h2>
          <p className="text-white/80 mb-8 max-w-md mx-auto">
            Şirketinizi kaydedin, personellerinizi ekleyin ve operasyonlarınızı
            dijitalleştirin.
          </p>
          <Button
            size="lg"
            className="bg-white text-indigo-700 hover:bg-white/90 font-semibold"
            onClick={() => navigate("register")}
            data-ocid="cta.register.button"
          >
            Şirket Kur — Ücretsiz
          </Button>
        </div>
      </section>
    </div>
  );
}
