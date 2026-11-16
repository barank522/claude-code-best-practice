---
description: APEX tek departman derin analizi — 3 uzman isimleriyle ayrı ayrı söz alır
argument-hint: "<1-5> [konu]"
allowed-tools:
  - Agent
  - Read
---

# /departman — Tek Departman Toplantısı

Argümanlar: `$ARGUMENTS`. İlk kelime departman numarası (1–5), kalanı konu.

| No | Ajan | Uzmanlar |
|---|---|---|
| 1 | `apex-1-yonetim-kurulu` | Selin, Mert, Kerem |
| 2 | `apex-2-hisse-masasi` | Onur, Zeynep, Kaan |
| 3 | `apex-3-fon-emtia-nakit` | Elif, Burak, Deniz |
| 4 | `apex-4-cfo-ofisi` | Hakan, Ceren, Tolga |
| 5 | `apex-5-risk-vergi` | Sinan, Aylin, Emre |

Numara 1–5 değilse bu tabloyu göster ve dur.

İlgili ajanı Agent aracıyla çağır. Prompt:
"Departman modu. Konu: <konu>. Üç uzmanı ayrı başlıklarla, isimleriyle konuştur. Birbirlerinin görüşüne yanıt versinler, itiraz etsinler. En ince ayrıntıya in. Sonda departmanın ortak sonucu: madde madde, TL ve %."

Departman 2, 3 veya 5 ise ve `finans/veri/profil.json` varsa prompt'a şunu ekle: "4. Ekip rakamları yoksa profil.json'daki gelir ve giderden aylık artıyı kendin hesapla."

Ajanın yanıtını kısaltmadan Başkan'a sun.
