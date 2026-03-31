# FactoryVerse

## Current State
Uygulama giriş sonrası panelde çok sayıda sayfada metin okunabilirlik sorunu var. Arka plan ve yazı rengi uyumsuzluğu nedeniyle bazı yazılar görünmüyor ya da zor okunuyor.

## Requested Changes (Diff)

### Add
- Yok

### Modify
- Tüm sayfalarda renk kontrast sorunlarını gider: `bg-gray-100 text-gray-600` badge'leri daha koyu text rengine çevir (`text-gray-700`)
- `text-muted-foreground` kullanımlarını yeterli kontrast sağlamayan yerlerde `text-foreground` veya daha koyu tonlarla değiştir
- Tablo başlıklarının (`TableHead`) fon rengi açık muted arka plana karşı koyu renkte kalmasını garantile
- `bg-secondary text-secondary-foreground` kullanan badge/tab elementlerini kontrol et
- `text-gray-500` yetersiz kontrast olan yerlerde `text-gray-700` kullan
- Reports.tsx içindeki `text-gray-500` (Beklemede) gibi ifadeleri `text-gray-700` veya `text-muted-foreground` olarak düzelt
- GanttCalendar.tsx içindeki `bg-slate-100 text-slate-700` kontrast kontrolü
- Tüm sayfalarda sayfa başlık bölümlerinde icon container'lar `bg-primary/10 text-primary` kullanıyor, bu oklch primary rengiyle uyumlu
- Attendance sayfasındaki `text-white/80` opacity değerlerinin gradient arka planda yeterli kontrast sağlamasını garantile
- Notifications sayfasında aktif filtre tab badge'i `bg-white/20 text-white` → daha belirgin yap
- ProjectDetail ve ProjectCosts gradient kartlarında metinlerin okunabilirliğini doğrula

### Remove
- Yok

## Implementation Plan
1. Her page dosyasını oku ve kontrast sorunlarını tespit et
2. Renk sınıflarını WCAG AA standardına uygun şekilde düzelt:
   - `text-gray-500` → `text-gray-700` (açık arka planlarda)
   - `text-gray-600` → koyu kalabilir (bg-gray-100 üzerinde yeterli)
   - `text-white/80`, `text-white/70` → `text-white/90` veya `text-white` yap
   - Badge bg-white/20 → bg-white/30 kontrast artır
3. Tüm pages/*.tsx dosyalarını tara ve düzeltmeleri uygula
4. Validate et
