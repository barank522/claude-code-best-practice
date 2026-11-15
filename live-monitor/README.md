# Claude Canlı

Claude Code'un o an ne yaptığını telefondan canlı izle: hangi aracı çalıştırıyor, hangi alt ajanlar (subagent) açık, her biri ne üzerinde çalışıyor, ne zaman senden izin bekliyor.

Bağımlılık yok. Sadece Node.js (18+) gerekir.

## Kurulum

```bash
git clone -b claude/claude-activity-monitoring-ilsl36 https://github.com/barank522/claude-code-best-practice.git
cd claude-code-best-practice/live-monitor
node install.js   # hook'ları ~/.claude/settings.json'a ekler (önce .bak yedeği alır)
node server.js    # paneli başlatır ve telefon bağlantısını yazar
```

`server.js` şöyle bir bağlantı yazar:

```
Telefondan aç (aynı Wi-Fi ya da Tailscale):
  http://192.168.1.23:7878/#k3m9xq2v7pna
```

Bu bağlantıyı telefonda aç. Kod (`#` sonrası) telefona kaydedilir; sonra sadece `http://192.168.1.23:7878` yeter. Ana ekrana ekleyebilirsin.

Açık Claude Code oturumlarını yeniden başlat; hook'lar yeni oturumlarda devreye girer.

Sunucu kapalıysa her Claude Code oturumu açılışta onu arka planda kendisi başlatır. Terminali kapatsan da panel çalışır. Bağlantıyı tekrar görmek için `node server.js` yeter.

## Bulut oturumları (claude.ai/code)

Ortamın kurulum betiği (setup script) `install.js`'i çalıştırırsa panel her bulut oturumunda kendiliğinden açılır. Telefondan Claude uygulamasının önizleme (preview) bölmesinde, 7878 portunda görünür. Kod sorulursa Claude'a "panel kodu ne" de.

## Telefon nasıl bağlanır

- **Aynı Wi-Fi:** yazılan `192.168…` adresi doğrudan çalışır. Bilgisayarın güvenlik duvarı Node için izin isterse ver.
- **Dışarıdayken:** bilgisayara ve telefona [Tailscale](https://tailscale.com) kur. `server.js` Tailscale adresini de (`100.x.x.x`) yazar; onu aç.

## Panelde ne var

- **Oturum kartı:** proje adı, durum (Çalışıyor / Seni bekliyor / Boşta / Hata / Kapandı), çalışan araç ve süresi, son isteğin, Claude'un son cevabı.
- **Alt ajanlar:** her alt ajan için tipi, görevi, şu anki aracı, kaç araç kullandığı, süresi. Bitince sonucunun özeti.
- **Akış:** son olaylar, saatleriyle.
- Claude izin beklerken kart turuncu yanar, sekme başlığı `⏳ Seni bekliyor` olur.

## Güvenlik

- Panel komutları, dosya adlarını ve isteklerini gösterir. Bağlantıyı (kodu) kimseyle paylaşma.
- Kod olmadan hiçbir veri okunamaz ve olay gönderilemez. Kod `live-monitor/.token` dosyasındadır; silersen yenisi üretilir.
- Bağlantı şifresiz HTTP'dir. Ortak Wi-Fi'da kullanma; dışarıda Tailscale kullan.
- Sadece bu bilgisayarda açmak istersen: `CLAUDE_LIVE_HOST=127.0.0.1 node server.js`.

## Ayarlar

| Değişken | Varsayılan | Ne yapar |
|----------|-----------|----------|
| `CLAUDE_LIVE_PORT` | `7878` | Port. Değiştirirsen Claude Code'u da aynı değişkenle başlat. |
| `CLAUDE_LIVE_HOST` | `0.0.0.0` | Dinlenen adres. |

## Kaldırma

```bash
node install.js --remove
```

## Nasıl çalışır

`install.js`, Claude Code'a 13 hook olayı ekler (`SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest`, `Notification`, `SubagentStart`, `SubagentStop`, `Stop`, `StopFailure`, `PreCompact`, `SessionEnd`). Hook'lar `async` çalışır, Claude'u yavaşlatmaz. Her olayda `hook.js` olayı `server.js`'e gönderir. Sunucu kapalıysa hook sessizce hiçbir şey yapmaz. Alt ajan içindeki araç çağrıları hook verisindeki `agent_id` ile doğru karta bağlanır.

Test: `node --test test.js`
