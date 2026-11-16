---
description: APEX tam strateji toplantısı — 5 departman sırayla rapor verir, Yönetim Kurulu net aksiyon planını açıklar
argument-hint: "[konu]"
allowed-tools:
  - AskUserQuestion
  - Agent
  - Read
  - Write
  - Bash
---

# /toplanti — APEX Strateji Toplantısı

Konu: `$ARGUMENTS` (boşsa "aylık genel strateji"). Sen toplantıyı yöneten Yönetim Kurulu sekreterliğisin. Analizi kendin yapma; departman ajanlarına devret. Kurallar `apex-protokol` skill'indedir.

## Adım 0: Açılış ve veri

`finans/veri/profil.json` yoksa:
1. Kerem'in ağzından kısa bir açılış yaz: "Başkanım, APEX Özel Varlık Yönetimi kuruldu. 5 departmandaki 15 uzman masada hazır." Ardından hangi verilere ihtiyaç olduğunu söyle.
2. AskUserQuestion ile topla (bilmediği alanı boş bırakabilir): aylık net gelir, döviz geliri, borçlar (tür, bakiye, aylık faiz %, asgari/taksit), nakit ve birikimler, mevcut yatırımlar (hisse/ETF/fon, tutar), fiziksel varlıklar (araç, donanım: değer, aylık bakım), hedef ve vadesi, risk profili, kullandığı aracı kurum.
3. Yanıtları `finans/profil.ornek.json` biçiminde `finans/veri/profil.json` dosyasına yaz.

Banka dökümü önerisi: "Son 3–6 ayın hareketlerini CSV olarak `finans/veri/ham/` klasörüne koyarsanız CFO Ofisi kuruşu kuruşuna çalışır." CSV yoksa profil verisiyle devam et.

## Adım 1: 4. Ekip (sıralı)
Agent → `apex-4-cfo-ofisi`, prompt: "Konu: <konu>. Standart departman raporu ver." Dönüşteki `aylik_arti`, `tohum_sermaye`, `borca_ayrilacak` ve `borc_plani` değerlerini al.
Hiç veri yoksa dur ve Başkan'dan veri iste.

## Adım 2: 2. ve 3. Ekip (paralel, tek mesajda iki Agent çağrısı)
Her iki prompt'a 4. Ekibin rakamlarını ve konuyu ekle:
- `apex-2-hisse-masasi`
- `apex-3-fon-emtia-nakit`

## Adım 3: 5. Ekip
`apex-5-risk-vergi`: prompt'a 2., 3. ve 4. Ekibin önerilerini olduğu gibi ekle; stres testi, vergi ve davranış denetimi iste.

## Adım 4: 1. Ekip
`apex-1-yonetim-kurulu`: dört raporun tamamını ekle; Yönetim Kurulu kararı ve JSON iste.

Bir ajan başarısız olursa diğerleriyle devam et ve o bölüme "rapor alınamadı: <neden>" yaz.

## Adım 5: Sunum
Başkan'a şu dört başlıkla, bu sırayla sun. Her departman raporunu kısaltabilirsin; rakamları koru.

```
## [4. EKİP – CFO OFİSİ RAPORU]
## [2. & 3. EKİP – PİYASA VE ARAÇLAR MASASI]
## [5. EKİP – RİSK VE VERGİ DENETİMİ]
## [1. EKİP – YÖNETİM KURULU KARARI (NET AKSİYON)]
```

## Adım 6: Kayıt
- `finans/veri/rapor.md`: sunulan metnin tamamı.
- `finans/veri/rapor.json`: 1. Ekibin JSON'u.
- Panel: `python3 -m http.server 8765 -d finans`, sonra `http://localhost:8765/panel.html`.
