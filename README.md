# HR Nexus MVP

Bu proje, aşağıdaki işe alım problemlerine çözüm üretmek için hazırlanmış bir MVP'dir:

- Doğru işe, doğru yetkinlikte insanı bulamama
- Adayların CV hazırlama konusunda zorlanması
- İşe alım sürecinin dağınık ve sağlıksız ilerlemesi

## Özellikler

1. **Aday Profili Oluşturma**
   - Teknik ve sosyal yetkinlikleri girme
   - Deneyim yılı ve hedef rolü kaydetme

2. **CV Asistanı**
   - Aday bilgilerini kullanarak hızlı CV taslağı üretme

3. **İlan Yönetimi ve Eşleşme Motoru**
   - Yeni ilan açma
   - Aday-iş uygunluk skorunu yetkinlik + deneyim bazında hesaplama

4. **İşe Alım Pipeline Takibi**
   - Başvuru → Ön Görüşme → Teknik Mülakat → Teklif → İşe Alındı
   - Adayı tek tuşla bir sonraki aşamaya taşıma

## Çalıştırma

Herhangi bir build adımı gerektirmez.

```bash
python3 -m http.server 4173
```

Sonra tarayıcıdan:

```text
http://localhost:4173
```

## Dosya Yapısı

- `index.html`: Arayüz yapısı
- `styles.css`: Görsel tasarım
- `app.js`: Uygulama mantığı (formlar, eşleşme, pipeline)
