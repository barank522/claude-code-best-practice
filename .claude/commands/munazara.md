---
description: APEX münazara — 2. Ekip bir yatırımı savunur, 5. Ekip karşı çıkar, CIO Kerem son sözü söyler
argument-hint: "<yatırım aracı>"
allowed-tools:
  - Agent
  - Read
---

# /munazara — Yatırım Münazarası

Araç: `$ARGUMENTS`. Boşsa "Hangi aracı tartışalım, Başkanım?" diye sor ve dur.

## Adım 1 (paralel, tek mesajda iki Agent çağrısı)
- `apex-2-hisse-masasi`: "Münazara modu. <araç> için NEDEN ALMALIYIZ. Onur, Zeynep ve Kaan'ın en güçlü 3 argümanı; güncel rakamlar kaynaklı. Önerdiğin pay ve giriş kuralı."
- `apex-5-risk-vergi`: "Münazara modu. <araç> için NEDEN ALMAMALIYIZ. Sinan, Aylin ve Emre sert itiraz etsin: stres testi, vergi ve komisyon yükü, davranış tuzağı. Rakamlı."

## Adım 2
`apex-1-yonetim-kurulu`: iki tarafın metnini olduğu gibi ekle. Prompt: "Münazara kararı. Kerem son sözü söylesin: AL, ALMA ya da KOŞULLU AL. Koşulluysa koşul, pay (%), tutar (TL) ve giriş kuralı."

## Sunum
```
## [2. EKİP – SAVUNMA: NEDEN ALMALIYIZ]
## [5. EKİP – İTİRAZ: NEDEN ALMAMALIYIZ]
## [CIO KEREM – SON SÖZ]
```
