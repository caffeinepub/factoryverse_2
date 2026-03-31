import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Cpu,
  DollarSign,
  Download,
  Eye,
  FileText,
  FolderKanban,
  KeyRound,
  LogIn,
  Monitor,
  PieChart,
  QrCode,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Truck,
  UserCheck,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react";

export default function Help() {
  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Page header */}
      <div
        className="rounded-2xl p-8 mb-10 text-white"
        style={{
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #4338ca 100%)",
        }}
      >
        <h1
          className="text-3xl font-extrabold mb-2"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
        >
          FactoryVerse Kullanım Kılavuzu
        </h1>
        <p className="text-white/90 text-base max-w-xl">
          Başlangıç rehberi, modül açıklamaları, rol tablosu ve sık sorulan
          sorularla uygulamayı hızlıca öğrenin.
        </p>
      </div>

      {/* Section 1: Başlangıç Rehberi */}
      <div className="mb-10" data-ocid="help.start.panel">
        <h2
          className="text-xl font-bold mb-4 flex items-center gap-2"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
        >
          <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
            1
          </span>
          Başlangıç Rehberi
        </h2>
        <Accordion
          type="multiple"
          className="border border-border rounded-xl overflow-hidden"
        >
          <AccordionItem value="start-1" data-ocid="help.start.item.1">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="font-medium text-left">
                  Şirket nasıl kaydedilir?
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-muted-foreground text-sm leading-relaxed">
              Ana sayfadan{" "}
              <strong className="text-foreground">"Şirket Kur"</strong> butonuna
              tıklayın, şirket adı ve sektörünüzü girin. Size özel{" "}
              <strong className="text-foreground">
                12 karakterli giriş kodu
              </strong>{" "}
              oluşturulur. Bu kodu güvenli bir yerde saklayın — sisteme her
              girişte bu kod kullanılır.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="start-2" data-ocid="help.start.item.2">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-4 h-4" />
                </div>
                <span className="font-medium text-left">
                  Personel nasıl eklenir?
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-muted-foreground text-sm leading-relaxed">
              İki yöntem mevcuttur:{" "}
              <span className="font-medium text-foreground">(1)</span> Admin
              panelinde <em>Personel</em> sayfasından{" "}
              <strong className="text-foreground">"Personel Ekle"</strong>{" "}
              butonu ile yönetici personeli sisteme alabilir.{" "}
              <span className="font-medium text-foreground">(2)</span>{" "}
              Personeliniz ana sayfadan{" "}
              <strong className="text-foreground">"Self Kayıt"</strong> formuyla
              kendi giriş kodunu alabilir ve doğrudan sisteme katılabilir.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="start-3" data-ocid="help.start.item.3">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <LogIn className="w-4 h-4" />
                </div>
                <span className="font-medium text-left">
                  Sisteme nasıl giriş yapılır?
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-muted-foreground text-sm leading-relaxed">
              <strong className="text-foreground">Giriş Yap</strong> sayfasında
              iki sekme bulunur:{" "}
              <em className="text-foreground">Şirket Girişi</em> veya{" "}
              <em className="text-foreground">Personel Girişi</em>. İlgili
              sekmeyi seçin ve size verilmiş olan{" "}
              <strong className="text-foreground">12 karakterli kodu</strong>{" "}
              girin. Kod doğrulandıktan sonra dashboard'a yönlendirilirsiniz.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Section 2: Modüller */}
      <div className="mb-10" data-ocid="help.module.panel">
        <h2
          className="text-xl font-bold mb-4 flex items-center gap-2"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
        >
          <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
            2
          </span>
          Modüller
        </h2>
        <Accordion
          type="multiple"
          className="border border-border rounded-xl overflow-hidden"
        >
          <AccordionItem value="mod-makineler" data-ocid="help.module.item.1">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <span className="font-medium text-left">Makineler</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-muted-foreground text-sm leading-relaxed">
              Fabrikadaki tüm makine ve ekipmanları kayıt altına alın. Her
              makineye QR kod oluşturulabilir; kodu tarayarak doğrudan makine
              detay sayfasına erişebilirsiniz. Detay sayfasında yedek parça
              stoku ve geçmiş bakım kayıtları görüntülenir.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="mod-projeler" data-ocid="help.module.item.2">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <span className="font-medium text-left">Projeler</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-muted-foreground text-sm leading-relaxed">
              Fabrika taşıma ve kurulum projelerinizi yönetin. Proje detay
              sayfasında ekip ataması (Lider/Üye/Gözlemci), bütçe takibi ve
              durum güncellemeleri (Planlama → Aktif → Tamamlandı → Beklemede)
              yapılabilir. Admin, bütçe sınırını aşan projelerde otomatik uyarı
              alır.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="mod-gorevler" data-ocid="help.module.item.3">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <span className="font-medium text-left">Görevler</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-muted-foreground text-sm leading-relaxed">
              Projeye bağlı veya bağımsız görevler oluşturun. Öncelik seviyesi
              (Düşük / Orta / Yüksek / Kritik) belirleyin, personele atayın ve
              kısa notlar ekleyin. Görev atandığında ilgili personele otomatik
              bildirim gönderilir.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="mod-bakim" data-ocid="help.module.item.4">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Wrench className="w-4 h-4" />
                </div>
                <span className="font-medium text-left">Bakım &amp; Arıza</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-muted-foreground text-sm leading-relaxed">
              Planlı bakım ve beklenmedik arıza kayıtlarını tutun. Kayıtları
              bakım planı veya projeyle ilişkilendirin, sorumlu personel atayın.
              Arıza bildirimi oluşturulduğunda otomatik bildirim tetiklenir.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="mod-bakim-plan" data-ocid="help.module.item.5">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <ClipboardCheck className="w-4 h-4" />
                </div>
                <span className="font-medium text-left">Bakım Planı</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-muted-foreground text-sm leading-relaxed">
              Önleyici bakım planları oluşturun. Makine ve proje bazlı planlama
              yaparak bakım döngülerini önceden tanımlayın. Planlara arıza ve
              bakım kayıtları bağlanabilir.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="mod-maliyet" data-ocid="help.module.item.6">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-4 h-4" />
                </div>
                <span className="font-medium text-left">Maliyet Takibi</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-muted-foreground text-sm leading-relaxed">
              Proje bazlı maliyet girişleri yapın. Kategori, tedarikçi ve tarih
              bilgileriyle harcamalarınızı izleyin. Raporlar sayfasından
              kategori bazlı pasta grafik ve proje karşılaştırma grafiklerine
              erişin.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="mod-raporlar" data-ocid="help.module.item.7">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <PieChart className="w-4 h-4" />
                </div>
                <span className="font-medium text-left">Raporlar</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-muted-foreground text-sm leading-relaxed">
              KPI kartları, grafikler ve istatistiklerle genel operasyon
              görünümü elde edin. Makine, arıza, proje, görev, yoklama ve stok
              özetleri tek sayfada listelenir. Sayfanın sağ üst köşesindeki{" "}
              <strong className="text-foreground">"Yazdır / PDF"</strong> butonu
              ile raporları yazdırabilir ya da PDF olarak kaydedebilirsiniz.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="mod-dokuman" data-ocid="help.module.item.8">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="font-medium text-left">Dokümanlar</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-muted-foreground text-sm leading-relaxed">
              Dosya adlarını kategorilere göre kayıt altına alın. Kategori
              filtresiyle hızlıca arama yapın. Mevcut sürümde yalnızca dosya
              adları saklanmakta olup uygulamayı hafif tutmak için tam dosya
              yükleme özelliği bulunmamaktadır.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="mod-isg" data-ocid="help.module.item.9">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <span className="font-medium text-left">
                  İSG (İş Sağlığı ve Güvenliği)
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-muted-foreground text-sm leading-relaxed">
              Risk değerlendirmeleri, kazalar ve uygunsuzluk kayıtlarını
              dijitalleştirin. Aylık trend grafiğiyle olay sayısını takip edin,
              kayıtları düzenleyin veya silin.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="mod-lojistik" data-ocid="help.module.item.10">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <span className="font-medium text-left">Lojistik</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-muted-foreground text-sm leading-relaxed">
              Sefer planlaması, araç ve yük takibini merkezi sistemden yönetin.
              Tedarikçilerle ilişkilendirin, kayıtları CSV olarak dışa aktarın.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="mod-tedarkci" data-ocid="help.module.item.11">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="font-medium text-left">Tedarikçiler</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-muted-foreground text-sm leading-relaxed">
              Tedarikçi bilgilerini kayıt altına alın. 1-5 yıldız puanlama
              sistemiyle tedarikçi performansını değerlendirin ve yorumlarınızı
              kaydedin. Tüm listeyi CSV olarak dışa aktarabilirsiniz.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="mod-yoklama" data-ocid="help.module.item.12">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <span className="font-medium text-left">Yoklama Takibi</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-muted-foreground text-sm leading-relaxed">
              Günlük personel devam/devamsızlık kayıtları oluşturun. Renk kodlu
              durum rozetleriyle (Geldi / Gelmedi / İzinli / Geç) anlık görünüm
              elde edin. Raporlar sayfasından devamsızlık istatistiklerine
              erişin.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="mod-vardiya" data-ocid="help.module.item.13">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <span className="font-medium text-left">Vardiya Yönetimi</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-muted-foreground text-sm leading-relaxed">
              Personele Sabah / Öğlen / Gece vardiyası atayın. Renk kodlu özet
              kartlar ve personel/tip bazlı filtrelerle vardiya dağılımınızı
              görün. Takvim görünümüyle haftalık/aylık planlama yapın.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="mod-takvim" data-ocid="help.module.item.14">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <span className="font-medium text-left">Takvim</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-muted-foreground text-sm leading-relaxed">
              Görevler ve vardiyaları aylık takvim üzerinde renkli chip'lerle
              görün. Sağ üst köşeden Gantt görünümüne geçiş yaparak proje zaman
              çizelgelerini analiz edin.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="mod-bildirimler"
            data-ocid="help.module.item.15"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <span className="font-medium text-left">Bildirimler</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-muted-foreground text-sm leading-relaxed">
              Görev ataması, arıza bildirimi ve düşük stok uyarıları otomatik
              olarak oluşturulur. Tümü / Okunmamış / Görev / Arıza / Stok
              sekmelerini kullanarak filtreleme yapın, tek tıkla okundu/okunmadı
              durumunu değiştirin.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="mod-aktivite" data-ocid="help.module.item.16">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="font-medium text-left">Aktivite Logu</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-muted-foreground text-sm leading-relaxed">
              Sistemde gerçekleştirilen tüm önemli işlemlerin zaman damgalı
              kaydını görün. Görev oluşturma, arıza bildirimi, personel ekleme
              gibi olaylar otomatik olarak loglanır ve kimin ne zaman ne
              yaptığını izlemenizi sağlar.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="mod-ayarlar" data-ocid="help.module.item.17">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Settings className="w-4 h-4" />
                </div>
                <span className="font-medium text-left">Ayarlar</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-muted-foreground text-sm leading-relaxed">
              Şirket profil bilgilerini (ad, sektör, iletişim) güncelleyin.
              Personel sayısı ve proje istatistiklerini özet kartlar hâlinde
              görüntüleyin. Admin ayrıca şirket genelinde profil düzenlemesi
              yapabilir.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Section 3: Roller ve Yetkiler */}
      <div className="mb-10" data-ocid="help.roles.panel">
        <h2
          className="text-xl font-bold mb-4 flex items-center gap-2"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
        >
          <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
            3
          </span>
          Roller ve Yetkiler
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border border-border">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Şirket Admin</p>
                  <Badge variant="secondary" className="text-xs mt-0.5">
                    Tam Yetki
                  </Badge>
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Tüm modüllere tam erişim. Personel ekleme, düzenleme ve silme;
                giriş kodlarını sıfırlama; şirket bilgilerini güncelleme
                yetkisine sahiptir.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Modül Admin</p>
                  <Badge variant="secondary" className="text-xs mt-0.5">
                    Kısmi Yetki
                  </Badge>
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Atandığı modüllerde kayıt oluşturma, düzenleme ve silme yetkisi
                vardır. Personel yönetimi ve giriş kodu sıfırlama yapamaz.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Saha Personeli</p>
                  <Badge variant="secondary" className="text-xs mt-0.5">
                    Temel Yetki
                  </Badge>
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Kayıt oluşturma ve kendi oluşturduğu kayıtları düzenleme
                yetkisine sahiptir. Başkalarının kayıtlarını düzenleyemez veya
                silemez.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Salt Okunur</p>
                  <Badge variant="secondary" className="text-xs mt-0.5">
                    Görüntüleme
                  </Badge>
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Sadece görüntüleme yetkisi. Hiçbir kayıt ekleyemez, düzenleyemez
                veya silemez. Raporları ve verileri okuyabilir.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section 4: SSS */}
      <div className="mb-10" data-ocid="help.faq.panel">
        <h2
          className="text-xl font-bold mb-4 flex items-center gap-2"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
        >
          <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
            4
          </span>
          Sık Sorulan Sorular
        </h2>
        <Accordion
          type="multiple"
          className="border border-border rounded-xl overflow-hidden"
        >
          <AccordionItem value="faq-1" data-ocid="help.faq.item.1">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <KeyRound className="w-4 h-4" />
                </div>
                <span className="font-medium text-left">
                  Giriş kodumu kaybettim, ne yapmalıyım?
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-muted-foreground text-sm leading-relaxed">
              Şirket yöneticinizden yeni bir kod talep edin. Admin,{" "}
              <em className="text-foreground">Personel</em> sayfasından tek
              tıkla yeni bir giriş kodu oluşturabilir ve size iletebilir.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-2" data-ocid="help.faq.item.2">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Monitor className="w-4 h-4" />
                </div>
                <span className="font-medium text-left">
                  Birden fazla cihazdan giriş yapabilir miyim?
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-muted-foreground text-sm leading-relaxed">
              Evet, giriş kodunuz tüm cihazlarda çalışır. Verileriniz ICP
              blockchain altyapısında güvenle saklanır; telefon, tablet veya
              bilgisayardan aynı veriye erişebilirsiniz.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-3" data-ocid="help.faq.item.3">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <span className="font-medium text-left">
                  Personel sayısı sınırı var mı?
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-muted-foreground text-sm leading-relaxed">
              Hayır, istediğiniz kadar personel ekleyebilirsiniz. Sisteme
              eklenen her personel kendi 12 karakterli koduyla giriş yapar.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-4" data-ocid="help.faq.item.4">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <span className="font-medium text-left">
                  Verileri dışa aktarabilir miyim?
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-muted-foreground text-sm leading-relaxed">
              Evet. Makineler, Projeler, Personel, Lojistik ve Tedarikçiler
              sayfalarında{" "}
              <strong className="text-foreground">CSV dışa aktarma</strong>{" "}
              butonu bulunur. Raporlar sayfasından da{" "}
              <strong className="text-foreground">Yazdır / PDF</strong>{" "}
              özelliğiyle tüm KPI raporunu çıktı olarak alabilirsiniz.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-5" data-ocid="help.faq.item.5">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                  <QrCode className="w-4 h-4" />
                </div>
                <span className="font-medium text-left">
                  QR kod nasıl çalışır?
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-muted-foreground text-sm leading-relaxed">
              Makineler sayfasında her makinenin kartında{" "}
              <strong className="text-foreground">QR kod butonu</strong>{" "}
              bulunur. Koda tıklayarak QR'ı görüntüleyebilir veya
              yazdırabilirsiniz. Sahadaki herhangi bir cihazla QR'ı tarayarak
              doğrudan ilgili makine detay sayfasına erişebilirsiniz.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
