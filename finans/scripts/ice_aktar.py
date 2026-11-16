#!/usr/bin/env python3
"""Banka CSV dökümlerini okuyup kategorize eder, finans/veri/ozet.json üretir.

Yalnızca standart kütüphane. Kullanım:
    python3 finans/scripts/ice_aktar.py [--ham DIR] [--kurallar JSON] [--cikti JSON]
"""
import argparse
import csv
import io
import json
import re
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path

FINANS = Path(__file__).resolve().parent.parent

SUTUNLAR = {
    "tarih": {"tarih", "işlem tarihi", "islem tarihi", "valör", "date"},
    "aciklama": {"açıklama", "aciklama", "işlem açıklaması", "islem aciklamasi", "işlem", "description"},
    "tutar": {"tutar", "işlem tutarı", "islem tutari", "tutar (tl)", "amount"},
    "borc": {"borç", "borc", "çıkış", "cikis"},
    "alacak": {"alacak", "giriş", "giris"},
}
TARIH_BICIMLERI = ("%d.%m.%Y", "%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d.%m.%y")


_ASCII = str.maketrans("ıişğüöç", "iisguoc")


def kucuk(metin):
    """Eşleştirme anahtarı: küçük harf + Türkçe harfler ASCII'ye. Bankalar 'MIGROS' da 'MİGROS' da yazar."""
    return metin.replace("İ", "i").replace("I", "ı").lower().translate(_ASCII).replace("̇", "").strip()


def tutar_coz(ham):
    """'1.234,56' / '-45,90 TL' / '1234.56' → float. Çözülemezse ValueError."""
    s = re.sub(r"(?i)\s|tl|try|₺", "", str(ham))
    if not s:
        raise ValueError("boş tutar")
    eksi = s.startswith("-") or (s.startswith("(") and s.endswith(")"))
    s = s.strip("-+()")
    if "," in s and "." in s:
        # son ayraç ondalıktır
        s = s.replace(".", "").replace(",", ".") if s.rfind(",") > s.rfind(".") else s.replace(",", "")
    elif "," in s:
        s = s.replace(",", ".")
    elif re.fullmatch(r"\d{1,3}(\.\d{3})+", s):
        s = s.replace(".", "")
    deger = float(s)
    return -deger if eksi else deger


def tarih_coz(ham):
    parca = str(ham).strip().split(" ")[0]
    for bicim in TARIH_BICIMLERI:
        try:
            return datetime.strptime(parca, bicim).date()
        except ValueError:
            pass
    raise ValueError(f"tarih çözülemedi: {ham!r}")


def metin_oku(yol):
    veri = Path(yol).read_bytes()
    for kod in ("utf-8-sig", "cp1254"):
        try:
            return veri.decode(kod)
        except UnicodeDecodeError:
            pass
    return veri.decode("latin-1")


def baslik_bul(satirlar):
    """Başlık satırının indeksini ve sütun→indeks eşlemesini döndürür."""
    for i, satir in enumerate(satirlar[:30]):
        eslesme = {}
        for j, hucre in enumerate(satir):
            ad = kucuk(hucre)
            for anahtar, adlar in SUTUNLAR.items():
                if ad in {kucuk(x) for x in adlar} and anahtar not in eslesme:
                    eslesme[anahtar] = j
        if "tarih" in eslesme and ({"tutar", "borc", "alacak"} & eslesme.keys()):
            return i, eslesme
    return None, None


def dosya_oku(yol):
    """(islemler, atlanan) döndürür. islem = {tarih, aciklama, tutar}; gider negatiftir."""
    metin = metin_oku(yol)
    for ayrac in (";", "\t", ","):
        satirlar = list(csv.reader(io.StringIO(metin), delimiter=ayrac))
        bas, sut = baslik_bul(satirlar)
        if bas is not None:
            break
    else:
        raise ValueError(f"{yol}: başlık satırı bulunamadı (Tarih + Tutar/Borç/Alacak gerekli)")

    def al(satir, k):
        return satir[sut[k]] if k in sut and sut[k] < len(satir) else ""

    islemler, atlanan = [], 0
    for satir in satirlar[bas + 1:]:
        if not any(h.strip() for h in satir):
            continue
        try:
            if "tutar" in sut:
                tutar = tutar_coz(al(satir, "tutar"))
            else:
                borc = tutar_coz(al(satir, "borc")) if al(satir, "borc").strip() else 0.0
                alacak = tutar_coz(al(satir, "alacak")) if al(satir, "alacak").strip() else 0.0
                tutar = abs(alacak) - abs(borc)
            islemler.append({"tarih": tarih_coz(al(satir, "tarih")),
                             "aciklama": al(satir, "aciklama").strip(), "tutar": tutar})
        except ValueError:
            atlanan += 1
    return islemler, atlanan


def kategorize(aciklama, tutar, kurallar):
    a = kucuk(aciklama)
    for kategori, kelimeler in kurallar.items():
        if any(kucuk(k) in a for k in kelimeler):
            return kategori
    return "Gelir (diğer)" if tutar > 0 else "Kategorisiz"


def ozet_uret(islemler, kurallar, dosyalar=(), atlanan=0):
    aylik = defaultdict(lambda: {"gelir": 0.0, "gider": 0.0})
    kategoriler = defaultdict(float)
    tekrar = defaultdict(set)  # (açıklama, tutar) → aylar
    kategorisiz = []
    for i in islemler:
        ay = i["tarih"].strftime("%Y-%m")
        kat = kategorize(i["aciklama"], i["tutar"], kurallar)
        if i["tutar"] >= 0:
            aylik[ay]["gelir"] += i["tutar"]
        else:
            aylik[ay]["gider"] += -i["tutar"]
            kategoriler[kat] += -i["tutar"]
            tekrar[(kucuk(i["aciklama"]), round(-i["tutar"], 2))].add(ay)
            if kat == "Kategorisiz":
                kategorisiz.append(i)

    aylar = sorted(aylik)
    for ay in aylar:
        aylik[ay]["net"] = aylik[ay]["gelir"] - aylik[ay]["gider"]
    n = len(aylar) or 1

    def yuvarla(d):
        return {k: round(v, 2) for k, v in d.items()}

    return {
        "olusturma": datetime.now().isoformat(timespec="seconds"),
        "dosyalar": [Path(d).name for d in dosyalar],
        "islem_sayisi": len(islemler),
        "atlanan_satir": atlanan,
        "donem": {"baslangic": min(i["tarih"] for i in islemler).isoformat(),
                  "bitis": max(i["tarih"] for i in islemler).isoformat()} if islemler else None,
        "aylik": {ay: yuvarla(aylik[ay]) for ay in aylar},
        "aylik_ort_gelir": round(sum(aylik[a]["gelir"] for a in aylar) / n, 2),
        "aylik_ort_gider": round(sum(aylik[a]["gider"] for a in aylar) / n, 2),
        "kategoriler": dict(sorted(yuvarla(kategoriler).items(), key=lambda kv: -kv[1])),
        "abonelik_adaylari": sorted(
            ({"aciklama": a, "tutar": t, "ay_sayisi": len(m)} for (a, t), m in tekrar.items() if len(m) >= 2),
            key=lambda x: -x["tutar"]),
        "kategorisiz": [{"tarih": i["tarih"].isoformat(), "aciklama": i["aciklama"], "tutar": i["tutar"]}
                        for i in sorted(kategorisiz, key=lambda i: i["tutar"])[:25]],
    }


def main(argv=None):
    p = argparse.ArgumentParser(description="Banka CSV → ozet.json")
    p.add_argument("--ham", default=FINANS / "veri" / "ham", type=Path)
    p.add_argument("--kurallar", default=FINANS / "kategoriler.json", type=Path)
    p.add_argument("--cikti", default=FINANS / "veri" / "ozet.json", type=Path)
    a = p.parse_args(argv)

    dosyalar = sorted(a.ham.glob("*.csv")) if a.ham.is_dir() else []
    if not dosyalar:
        print(f"HATA: {a.ham} içinde .csv yok. Banka dökümünü CSV olarak oraya koyun.", file=sys.stderr)
        return 1
    kurallar = json.loads(a.kurallar.read_text(encoding="utf-8"))
    tum, atlanan = [], 0
    for d in dosyalar:
        try:
            islemler, at = dosya_oku(d)
        except ValueError as e:
            print(f"UYARI: {e}", file=sys.stderr)
            continue
        tum += islemler
        atlanan += at
    if not tum:
        print("HATA: hiçbir dosyadan işlem okunamadı.", file=sys.stderr)
        return 1
    ozet = ozet_uret(tum, kurallar, dosyalar, atlanan)
    a.cikti.parent.mkdir(parents=True, exist_ok=True)
    a.cikti.write_text(json.dumps(ozet, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"OK: {ozet['islem_sayisi']} işlem, {atlanan} satır atlandı → {a.cikti}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
