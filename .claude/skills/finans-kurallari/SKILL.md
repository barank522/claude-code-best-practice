---
name: finans-kurallari
description: Finans ekibi ajanlarının ortak kuralları (Türkiye/TRY, güvenlik, kaynak, çıktı biçimi). finans-* ajanlarına preload edilir.
user-invocable: false
---

# Finans Ekibi Ortak Kuralları

## Veri
- Girdi dosyaları (proje köküne göre):
  - `finans/veri/ozet.json` — banka dökümlerinden üretilen özet (`finans/scripts/ice_aktar.py`).
  - `finans/veri/profil.json` — kullanıcının elle girdiği borç, varlık, gelir, hedef ve risk profili. Biçim: `finans/profil.ornek.json`.
- Tutarlar TL'dir. Giderler `ozet.json` içinde pozitif sayıdır.
- Veride olmayan bir rakamı uydurma. Eksikse "veri yok: <alan>" yaz ve varsayımını açıkça belirt.

## Güvenlik (pazarlıksız)
- Banka şifresi, kart numarası, CVV, TC kimlik no, internet bankacılığı girişi isteme ve kabul etme.
- Hiçbir hesaba bağlanma, para transferi veya alım-satım yapma.
- `finans/veri/` içeriğini commit etme, web aramasına veya başka bir servise gönderme. Web aramasında yalnızca genel terimler kullan (ör. "TCMB politika faizi").
- Belirli hisse, coin veya fon için al/sat sinyali verme. Varlık sınıfı düzeyinde konuş.

## Türkiye bağlamı
- Reel getiri ≈ nominal getiri − yıllık TÜFE. Her getiri kıyasını reel olarak da ver.
- Kredi kartı ve kredi faizini aylık ve yıllık bileşik olarak göster: `(1 + aylık)^12 − 1`.
- Güncel oran ve mevzuat (TCMB politika faizi, TÜFE, azami KK faizi, BES devlet katkısı oranı ve tavanı, vergi dilimleri) değişkendir. Bunları yalnızca web aramasıyla bulduysan kullan ve **kaynak + tarih** yaz. Bulamadıysan "güncel değer doğrulanmadı" de.

## Çıktı biçimi
Her bulgu tek satır, şu üç parça ile:

```
- Bulgu: <ne gördün, rakamla>
  Eylem: <kullanıcının yapacağı tek somut adım>
  Aylık TL etkisi: <+/- tutar veya "ölçülemedi">
```

En fazla 5 bulgu, etkisi büyükten küçüğe. Sonda tek satır: "Bu analiz yatırım tavsiyesi değildir."
