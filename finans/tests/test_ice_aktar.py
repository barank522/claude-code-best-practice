import json
import sys
import tempfile
import unittest
from datetime import date
from pathlib import Path

BURASI = Path(__file__).resolve().parent
sys.path.insert(0, str(BURASI.parent / "scripts"))
import ice_aktar as ia  # noqa: E402

FIX = BURASI / "fixtures"
KURALLAR = json.loads((BURASI.parent / "kategoriler.json").read_text(encoding="utf-8"))


class TutarTarih(unittest.TestCase):
    def test_tutar_bicimleri(self):
        for ham, beklenen in [("1.234,56", 1234.56), ("-45,90 TL", -45.90), ("1234.56", 1234.56),
                              ("1.250", 1250.0), ("1,234.56", 1234.56), ("(100,00)", -100.0), ("₺ 7", 7.0)]:
            self.assertAlmostEqual(ia.tutar_coz(ham), beklenen, msg=ham)
        with self.assertRaises(ValueError):
            ia.tutar_coz("")

    def test_tarih(self):
        self.assertEqual(ia.tarih_coz("05.10.2026"), date(2026, 10, 5))
        self.assertEqual(ia.tarih_coz("12/10/2026 14:30"), date(2026, 10, 12))
        self.assertEqual(ia.tarih_coz("2026-10-05"), date(2026, 10, 5))
        with self.assertRaises(ValueError):
            ia.tarih_coz("bozuk")


class Kategori(unittest.TestCase):
    def test_turkce_ve_ascii_buyuk_harf(self):
        self.assertEqual(ia.kategorize("MIGROS KADIKOY", -10, KURALLAR), "Market")
        self.assertEqual(ia.kategorize("MİGROS", -10, KURALLAR), "Market")
        self.assertEqual(ia.kategorize("KREDI KARTI ODEME", -10, KURALLAR), "Kredi kartı ödemesi")
        self.assertEqual(ia.kategorize("xyz", -10, KURALLAR), "Kategorisiz")
        self.assertEqual(ia.kategorize("xyz", 10, KURALLAR), "Gelir (diğer)")


class Dosyalar(unittest.TestCase):
    def test_banka_a_noktali_virgul_onsoz_bozuk_satir(self):
        islemler, atlanan = ia.dosya_oku(FIX / "banka_a.csv")
        self.assertEqual(len(islemler), 8)
        self.assertEqual(atlanan, 1)
        self.assertAlmostEqual(islemler[2]["tutar"], -2345.60)

    def test_banka_b_borc_alacak_virgul(self):
        islemler, atlanan = ia.dosya_oku(FIX / "banka_b.csv")
        self.assertEqual(atlanan, 0)
        self.assertEqual([round(i["tutar"], 2) for i in islemler], [-1250.50, -8000.00, -85.40, 3000.00])

    def test_ozet_uctan_uca(self):
        with tempfile.TemporaryDirectory() as d:
            cikti = Path(d) / "ozet.json"
            self.assertEqual(ia.main(["--ham", str(FIX), "--cikti", str(cikti)]), 0)
            o = json.loads(cikti.read_text(encoding="utf-8"))
        self.assertEqual(o["islem_sayisi"], 12)
        self.assertEqual(o["aylik"]["2026-10"], {"gelir": 48000.0, "gider": 27411.49, "net": 20588.51})
        self.assertEqual(o["aylik"]["2026-11"]["gider"], 15229.99)
        self.assertEqual(o["kategoriler"]["Kira"], 30000.0)
        self.assertEqual(o["kategoriler"]["Faiz / komisyon"], 85.4)
        # Kira açıklamaları ay adıyla değiştiği için aday değil; yalnızca Netflix tekrar ediyor.
        self.assertEqual(o["abonelik_adaylari"], [{"aciklama": "netflix.com", "tutar": 229.99, "ay_sayisi": 2}])
        self.assertEqual(o["kategorisiz"][0]["aciklama"], "BİLİNMEYEN DÜKKAN")

    def test_bos_klasor_hata(self):
        with tempfile.TemporaryDirectory() as d:
            self.assertEqual(ia.main(["--ham", d, "--cikti", str(Path(d) / "o.json")]), 1)


if __name__ == "__main__":
    unittest.main()
