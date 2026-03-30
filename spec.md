# FactoryVerse — Sürüm 27

## Current State
- Personnel.tsx: Edit/delete dialog kodu mevcut, backend'de `updatePersonnel(id, name, role)` ve `deletePersonnel(id)` API'leri var.
- Settings.tsx: Sadece bilgi gösterimi var (rol, giriş kodu, sayım kartları). Düzenleme yok. Backend'de `saveCallerUserProfile(UserProfile)` ve `getCallerUserProfile()` mevcut.
- Suppliers.tsx: Tam CRUD + CSV export var. Puanlama (rating) yok. Backend'de supplier rating API'si yok.
- HSE.tsx: Tam CRUD var. Grafik/trend yok.

## Requested Changes (Diff)

### Add
- Settings sayfasına profil düzenleme formu: kullanıcı adını ve emailini `saveCallerUserProfile` ile kaydedebilsin, `getCallerUserProfile` ile mevcut bilgileri çeksin.
- Tedarikçiler sayfasına frontend-only yıldız puanı (1-5) UI: localStorage tabanlı, her tedarikçi için görsel yıldız gösterimi ve not alanı. Multi-device sync dışı, görsel kolaylık için.
- HSE sayfasına aylık trend grafiği: mevcut records'tan aylık kaza/olay sayısını hesaplayarak recharts LineChart ile göster.
- Personnel.tsx'e edit/delete butonlarının doğru çalıştığını doğrulayın — mevcutsa herhangi bir bug/eksiklik giderin.

### Modify
- Settings.tsx: Mevcut bilgi kartlarını koru, yeni bölüm olarak "Profil Düzenle" formu ekle (ad ve email).
- HSE.tsx: Sayfanın üstüne istatistik grafiği bölümü ekle, kaydı altına mevcut tablo.
- Suppliers.tsx: Her tedarikçi satırına görsel yıldız puanı ekle (1-5, tıklayarak seçilebilir).

### Remove
- Hiçbir şey kaldırılmıyor.

## Implementation Plan
1. Settings.tsx: `getCallerUserProfile` ile profil yükle, ad/email formu + kaydet butonu + `saveCallerUserProfile` çağrısı ekle.
2. Suppliers.tsx: Her tedarikçi için `supplierRatings` state objesi tut (localStorage'dan başlat), tablo hücresine 5 yıldız bileşeni ekle (tıklanabilir, sarı dolgu).
3. HSE.tsx: Records yüklenince aylık grupla (son 6 ay), recharts ResponsiveContainer+LineChart ile göster. Import: recharts.
4. Personnel.tsx: Edit/delete zaten kodda var; `updatePersonnel` ve `deletePersonnel` API çağrıları doğru mu kontrol et. Gerekirse düzelt.
