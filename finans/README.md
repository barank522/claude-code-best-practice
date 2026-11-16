# Finans Ekibi

Banka dökümlerinizi okuyan ve dört uzmandan oluşan bir Claude Code ekibi. Ekip harcamanızı, borcunuzu, birikiminizi ve gelirinizi analiz eder. Sonuçta bu ay yapabileceğiniz somut adımlar ve bir panel çıkar. Türkiye ve TL için ayarlıdır.

> Bu araç yatırım tavsiyesi vermez. Vergi konularında mali müşavire danışın.

## Ekip

| Üye | İş |
|-----|----|
| `finans-butce-analisti` | Dökümleri içe aktarır; harcama, abonelik ve faiz/komisyon kayıplarını bulur |
| `finans-borc-uzmani` | Kredi kartı ve kredi için en ucuz geri ödeme planını kurar |
| `finans-yatirim-danismani` | Acil durum fonu ve enflasyona karşı varlık dağılımı önerir |
| `finans-gelir-vergi-uzmani` | Ek gelir fikirleri, BES devlet katkısı ve vergi avantajları |
| `/finans-ekibi` | Hepsini sırayla çalıştırır, raporu ve paneli üretir |

Ortak kurallar: `.claude/skills/finans-kurallari/SKILL.md`.

## Kullanım

1. İnternet bankacılığından son 3–6 ayın hesap ve kredi kartı hareketlerini **CSV** olarak indirin. Excel ise "Farklı Kaydet → CSV" yapın.
2. Dosyaları `finans/veri/ham/` klasörüne koyun.
3. Claude Code'da çalıştırın:
   ```
   /finans-ekibi
   ```
   İlk seferde gelir, borç ve varlıklarınız sorulur ve `finans/veri/profil.json` dosyasına yazılır. Biçim için `finans/profil.ornek.json` dosyasına bakın.
4. Paneli açın:
   ```
   python3 -m http.server 8765 -d finans
   ```
   Tarayıcıda `http://localhost:8765/panel.html` adresine gidin.

Odaklı çalıştırma: `/finans-ekibi borç`, `/finans-ekibi birikim`, `/finans-ekibi gelir`.

## Gizlilik

- `finans/veri/` klasörü `.gitignore` içindedir. Dökümleriniz, profiliniz ve raporlarınız asla commit edilmez.
- Ajanlar şifre, kart numarası veya TC kimlik no istemez. Hiçbir hesaba bağlanmaz, para göndermez, alım-satım yapmaz.
- Web aramaları yalnızca genel bilgi içindir (faiz, enflasyon, mevzuat). Kişisel verileriniz aramaya eklenmez.

## Kategoriler

Harcamalar `finans/kategoriler.json` içindeki anahtar kelimelerle sınıflanır. Bütçe analisti "Kategorisiz" kalemler için yeni kelime önerir; dosyaya siz eklersiniz.

## Test

```
python3 -m unittest discover -s finans/tests
```
