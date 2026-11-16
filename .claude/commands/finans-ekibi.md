---
description: Kişisel finans ekibini çalıştır — banka dökümlerini analiz et, borç/yatırım/gelir-vergi uzmanlarından plan al, rapor ve panel üret
argument-hint: "[odak: borç | birikim | gelir | genel]"
allowed-tools:
  - AskUserQuestion
  - Agent
  - Read
  - Write
  - Bash
---

# Finans Ekibi Orkestratörü

Kullanıcının finansal durumunu iyileştirmek için dört uzman alt-ajanı yönetirsin ve sonuçları tek bir eylem planında birleştirirsin. Odak argümanı: `$ARGUMENTS` (boşsa "genel").

## Execution Contract (pazarlıksız)

- Analizi kendin yapma; her alanı ilgili `finans-*` ajanına devret.
- Banka şifresi, kart numarası, TC kimlik no isteme. Kullanıcı yapıştırırsa kullanma ve silmesini söyle.
- `finans/veri/` altındaki hiçbir dosyayı commit etme veya başka bir servise gönderme.
- Agent aracını çağıramazsan dur ve hatayı bildir. Doğaçlama yapma.

## Akış

### Adım 1: Veri kontrolü

1. `finans/veri/ham/` içinde `.csv` yoksa dur ve kullanıcıya söyle: "İnternet bankacılığından son 3–6 ayın hesap ve kredi kartı hareketlerini CSV olarak indirip `finans/veri/ham/` klasörüne koyun. Excel ise 'Farklı Kaydet → CSV' yapın."
2. `finans/veri/profil.json` yoksa AskUserQuestion ile şunları topla: çalışma şekli, aylık net gelir, borçlar (tür, bakiye, aylık faiz %, asgari ödeme/taksit), varlıklar (nakit, altın gram, döviz, BES), en önemli hedef, risk profili (muhafazakâr/dengeli/büyüme), beceriler ve haftada ayırabileceği saat. Bilmediği alanı boş bırak. `finans/profil.ornek.json` biçiminde `finans/veri/profil.json` dosyasına yaz.

### Adım 2: Bütçe analizi (sıralı)

Agent aracı ile:
- subagent_type: `finans-butce-analisti`
- description: Banka dökümlerini analiz et
- prompt: "Banka dökümlerini içe aktar ve bütçe analizi yap. Odak: <odak>."

**Fail-closed:** Ajan `ozet.json` üretemediyse veya `aylik_arti` döndürmediyse dur, hatayı kullanıcıya göster.

### Adım 3: Uzmanlar (paralel)

Tek mesajda üç Agent çağrısı yap. Her prompt'a bütçe analistinin `aylik_ort_gelir`, `aylik_ort_gider`, `aylik_arti` değerlerini ve odağı ekle:
- `finans-borc-uzmani` — borca ayrılabilecek aylık tutar = `aylik_arti` (yatırım danışmanı mini acil fonu ayrı ister; bunu belirt).
- `finans-yatirim-danismani`
- `finans-gelir-vergi-uzmani`

Bir ajan başarısız olursa diğerleriyle devam et ve raporda o alanı "analiz edilemedi" olarak işaretle.

### Adım 4: Sentez

Ajan çıktılarını birleştir:
1. Çelişkileri çöz. Kural: faizi yüksek borç > mini acil fon (1 aylık gider) > kalan borç > tam acil fon (3–6 ay) > uzun vadeli yatırım. Aylık artı tutarı birden fazla yere dağıtılıyorsa toplamın `aylik_arti` değerini aşmadığını kontrol et.
2. Tüm bulguları aylık TL etkisine göre sırala, en fazla 7 eylem seç.
3. Her eylem tek cümle, somut, bu ay yapılabilir.

### Adım 5: Çıktı dosyaları

- `finans/veri/rapor.md` — okunur rapor: özet cümle, net varlık, öncelikli eylemler, her uzmanın bulguları, doğrulanamayan bilgiler, uyarı.
- `finans/veri/rapor.json` — panel için; biçim `finans/rapor.ornek.json` ile birebir aynı alanlar (`tarih`, `ozet_cumle`, `net_varlik`, `eylemler[]`, `borc_plani[]`, `uyari`). Sayılar sayı tipinde olmalı, metin değil.

### Adım 6: Kullanıcıya sun

- İlk 3 eylemi ve toplam aylık TL etkisini göster.
- Paneli açma komutu:
  ```
  python3 -m http.server 8765 -d finans
  ```
  Sonra tarayıcıda `http://localhost:8765/panel.html`.
- Son satır: "Bu analiz yatırım tavsiyesi değildir; vergi konularında mali müşavire danışın."
