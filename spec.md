# FactoryVerse – Sürüm 23

## Current State
MVP kapsamlı modüller içeriyor: kimlik doğrulama, makine, proje, personel, bakım/arıza, görev, doküman, İSG, lojistik, bildirimler, takvim, QR kod, bakım planı, performans, maliyet takibi, personel detay, proje detay, proje ekibi, proje-arıza bağlantısı, proje durum yönetimi, raporlar, tedarikçiler, personel düzenleme/silme, görev düzenleme/silme, makine düzenleme/silme.

Eksik: Lojistik/İSG/BakımPlanı/Doküman/Maliyet kayıtları için düzenleme ve silme, Ayarlar sayfası.

## Requested Changes (Diff)

### Add
- Backend: `updateShipment`, `deleteShipment` fonksiyonları
- Backend: `updateHseRecord`, `deleteHseRecord` fonksiyonları  
- Backend: `updateMaintenancePlan`, `deleteMaintenancePlan` fonksiyonları
- Backend: `updateDocument` fonksiyonu (deleteDocument zaten var)
- Backend: `updateProjectCost` fonksiyonu (deleteProjectCost zaten var)
- Frontend: Lojistik sayfasında düzenle (edit dialog) ve sil butonları
- Frontend: İSG sayfasında düzenle ve sil butonları
- Frontend: Bakım Planı sayfasında düzenle ve sil butonları
- Frontend: Dokümanlar sayfasında düzenle butonu
- Frontend: Maliyet Takibi sayfasında düzenle butonu
- Frontend: Yeni Ayarlar sayfası (Settings) – şirket bilgisi, mevcut kullanıcı profili, kodu göster/gizle

### Modify
- backend.d.ts: yeni fonksiyon imzaları eklenir
- AppShell: `case "settings"` bağlanır

### Remove
- Yok

## Implementation Plan
1. main.mo sonuna 8 yeni backend fonksiyonu ekle
2. backend.d.ts'e yeni imzalar ekle
3. Logistics.tsx: her satıra edit dialog + delete butonu ekle
4. HSE.tsx: her satıra edit dialog + delete butonu ekle
5. MaintenancePlan.tsx: her plana edit dialog + delete butonu ekle
6. Documents.tsx: her dokümana edit dialog ekle
7. ProjectCosts.tsx: her maliyete edit dialog ekle
8. Settings.tsx sayfası oluştur: şirket adı/modu, personel adı/rolü/kodu göster, değiştirme formu
9. AppShell.tsx: settings case ekle
