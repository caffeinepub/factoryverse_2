# FactoryVerse — Sürüm 28

## Current State
- Sürüm 27 tamamlandı: personel düzenleme/silme, tedarikçi yıldız puanlama (localStorage), HSE trend grafiği, ayarlar profil düzenleme
- Tedarikçi puanları şu an localStorage'da, çok cihaz desteği yok
- Personel devam/yoklama takibi yok
- Makine yedek parça/stok takibi yok
- Bildirim merkezi temel düzeyde

## Requested Changes (Diff)

### Add
- **Tedarikçi puanlama (backend):** `SupplierRating` tipi (supplierId, companyId, rating 1-5, comment, createdAt). `addSupplierRating`, `getSupplierRatings`, `getSupplierAverageRating` backend fonksiyonları. Tedarikçi listesinde ortalama puan gösterimi.
- **Personel yoklama takibi:** `Attendance` tipi (id, companyId, personnelId, date, status: present/absent/late/excused, note). `addAttendance`, `listAttendance`, `updateAttendance`, `deleteAttendance` backend fonksiyonları. Yeni "Yoklama" sayfası sidebar'da.
- **Makine yedek parça takibi:** `SparePart` tipi (id, companyId, machineId, name, partCode, quantity, unit, minStock, supplier, notes). `addSparePart`, `listSpareParts`, `updateSparePart`, `deleteSparePart` backend fonksiyonları. Makine detay sayfasına "Yedek Parçalar" bölümü; düşük stok uyarısı (quantity <= minStock).
- **Bildirim merkezi geliştirme:** Bildirim tiplerine öncelik (low/medium/high) ve okundu/okunmadı state ekleme; `markNotificationRead`, `markAllNotificationsRead` fonksiyonları.

### Modify
- Tedarikçiler sayfası: localStorage puanlama kaldırılıp backend'den ortalama puan gösterilecek, yorum ekleme formu
- Makine detay sayfası: Yedek Parçalar bölümü ekleniyor
- Sidebar: "Yoklama" menü öğesi ekleniyor
- Notifications sayfası: okundu/okunmadı + öncelik badge'leri

### Remove
- Tedarikçi puanlama localStorage kullanımı

## Implementation Plan
1. Backend: SupplierRating, Attendance, SparePart tipleri ve CRUD fonksiyonları; Notification güncellemesi
2. backend.d.ts ve backend.did.js güncelleme
3. Frontend: Yoklama sayfası (yeni), Tedarikçiler sayfası güncelleme, Makine detay güncelleme, Bildirimler güncelleme, Sidebar güncelleme
