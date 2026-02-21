# HR Nexus (Backend + Frontend)

Bu proje, işe alımda yaşanan üç temel soruna backend destekli bir uygulama ile çözüm sunar:

- Doğru işe doğru yetkinlikte insanın yerleşememesi
- Adayların etkili CV hazırlayamaması
- İşe alım sürecinin dağınık ve izlenemez ilerlemesi

## Neler Var?

- **Aday yönetimi API'si**: Aday profilini (rol, deneyim, teknik/sosyal yetkinlik) kaydeder.
- **CV üretim API'si**: Seçilen aday için CV taslağı üretir.
- **İlan yönetimi API'si**: İş ilanı açar.
- **Eşleşme API'si**: Teknik (%60) + sosyal (%20) + deneyim (%20) ile uyum skoru hesaplar.
- **Pipeline API'si**: Adayı Başvuru → Ön Görüşme → Teknik Mülakat → Teklif → İşe Alındı aşamalarında ilerletir.
- **Frontend arayüzü**: Tüm işlemleri backend API üzerinden kullanır.

## Çalıştırma

```bash
node server.js
```

Tarayıcı:

```text
http://localhost:4173
```

## API Uç Noktaları

- `GET /api/health`
- `GET /api/state`
- `POST /api/candidates`
- `POST /api/jobs`
- `POST /api/cv/generate`
- `POST /api/match`
- `POST /api/pipeline/move`

## Dosyalar

- `server.js`: Node.js backend (ek bağımlılık yok, in-memory veri)
- `index.html`: Uygulama arayüzü
- `styles.css`: Stil dosyası
- `app.js`: Frontend logic (API çağrıları, render, form yönetimi)
