---
description: APEX bütçe masası — CFO Ofisi harcamaları optimize eder, 3. Ekip artan parayı TL TL park eder
argument-hint: "[gelir/gider verisi]"
allowed-tools:
  - Agent
  - Read
  - Bash
---

# /butce — Bütçe Masası

Veri: `$ARGUMENTS`. Boşsa `finans/veri/ham/*.csv` ve `finans/veri/profil.json` kullanılır. İkisi de yoksa Başkan'dan aylık gelir ve gider kalemlerini iste ve dur.

## Adım 1
`apex-4-cfo-ofisi`: "Bütçe modu. Veri: <$ARGUMENTS veya 'dosyalardan'>. Hakan sızıntıları kapatsın, Ceren gelir ve döviz akışını, Tolga fiziksel varlıkları incelesin. Her kesinti için TL. Sonda aylik_arti ve tohum_sermaye."

## Adım 2
`apex-3-fon-emtia-nakit`: 4. Ekibin raporunu ekle. Prompt: "Bütçe modu. Artan paranın kuruşu kuruşuna nereye park edileceği: yedek akçe, nakit park, fon, altın. Her kalem için TL ve %."

## Sunum
```
## [4. EKİP – CFO OFİSİ RAPORU]
## [3. EKİP – PARK PLANI]
```
Sonda tek tablo: kalem, aylık TL, araç. Toplam aylık artıya eşit olur.
