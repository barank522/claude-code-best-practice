# APEX Özel Varlık Yönetimi A.Ş.

Tek bir müşterinin, yani sizin, servetinizi büyütmek için kurulmuş bir Claude Code ekibi. Siz Yönetim Kurulu Başkanısınız. Şirkette 5 departman ve 15 uzman çalışır. Her toplantının sonunda TL ve yüzde bazında, bu ay uygulayacağınız bir aksiyon planı çıkar. Türkiye ve TL için ayarlıdır.

## Departmanlar

| Departman | Uzmanlar | Ajan |
|-----------|----------|------|
| 1. Makro Strateji ve Yönetim Kurulu | Kerem (CIO), Selin (makroekonomi), Mert (varlık dağılımı) | `apex-1-yonetim-kurulu` |
| 2. Küresel ve Yerel Hisse Masası | Onur (Wall Street), Zeynep (BIST temel analiz), Kaan (teknik analiz) | `apex-2-hisse-masasi` |
| 3. Fon, Emtia ve Sabit Getiri | Elif (TEFAS), Burak (altın ve emtia), Deniz (nakit park ve döviz) | `apex-3-fon-emtia-nakit` |
| 4. CFO Ofisi | Hakan (bütçe ve borç), Ceren (gelir ve döviz akışı), Tolga (fiziksel varlıklar) | `apex-4-cfo-ofisi` |
| 5. Risk, Denetim ve Vergi | Sinan (stres testi), Aylin (vergi ve komisyon), Emre (davranış koçu) | `apex-5-risk-vergi` |

Ortak kurallar: `.claude/skills/apex-protokol/SKILL.md`.

## Komutlar

Komut adları Türkçe karakter içermez.

| Komut | Ne yapar |
|-------|----------|
| `/toplanti [konu]` | Tam toplantı. Rapor sırası: 4. Ekip, 2. ve 3. Ekip, 5. Ekip, en son Yönetim Kurulu kararı |
| `/departman <1-5> [konu]` | Tek departman. Üç uzman isimleriyle ayrı ayrı konuşur |
| `/munazara <araç>` | 2. Ekip "alalım", 5. Ekip "almayalım" der; son sözü Kerem söyler |
| `/butce [gelir/gider]` | CFO Ofisi harcamaları sıkılaştırır; 3. Ekip artan parayı TL TL park eder |

Her mesajın APEX formatında gelmesini isterseniz Claude Code'da `/output-style apex` yazın. Kapatmak için başka bir stil seçin.

## Başlarken

1. İnternet bankacılığından son 3–6 ayın hesap ve kredi kartı hareketlerini **CSV** olarak indirin. Excel ise "Farklı Kaydet → CSV" yapın.
2. Dosyaları `finans/veri/ham/` klasörüne koyun. Bu adım isteğe bağlıdır ama CFO Ofisi'nin kuruşu kuruşuna çalışmasını sağlar.
3. `/toplanti` yazın. İlk seferde Kerem şirketi tanıtır ve gelir, döviz geliri, borç, birikim, yatırım ve fiziksel varlıklarınızı sorar. Yanıtlar `finans/veri/profil.json` dosyasına yazılır. Biçim için `finans/profil.ornek.json` dosyasına bakın.
4. Paneli açın:
   ```
   python3 -m http.server 8765 -d finans
   ```
   Sonra tarayıcıda `http://localhost:8765/panel.html` adresine gidin.

Kurulum gerektirmeyen web sürümü: `finans/site/index.html` (claude.ai artifact olarak yayınlanır).

## Ekibin iki sabit kuralı

- **Uydurma rakam yok.** Güncel fiyat, F/K, RSI, faiz, kur ve stopaj oranı web aramasından, kaynak ve tarihle gelir. Ekip bulamadığı rakam için "güncel veri yok" der ve koşullu kural verir, ör. "RSI 30 altına inerse üç kademede al".
- **Hesaba dokunulmaz.** Ajanlar alım-satım yapmaz, bankaya bağlanmaz, şifre veya kart numarası istemez. Planı siz uygularsınız.

## Gizlilik

- `finans/veri/` klasörü `.gitignore` içindedir. Dökümleriniz, profiliniz ve raporlarınız asla commit edilmez.
- Web aramalarında yalnızca genel terimler kullanılır. Kişisel rakamlarınız aramaya eklenmez.

## Kategoriler

Harcamalar `finans/kategoriler.json` içindeki anahtar kelimelerle sınıflanır. CFO Ofisi "Kategorisiz" kalemler için yeni kelime önerir; dosyaya siz eklersiniz.

## Test

```
python3 -m unittest discover -s finans/tests
```
