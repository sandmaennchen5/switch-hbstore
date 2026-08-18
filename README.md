# switch-hbas

Ein automatisches, statisch hostbares Nintendo-Switch-Homebrew-Repository. Es erzeugt pro Kanal eine `repo.json`, installierbare ZIP-Dateien und eine Website. Die Ausgabe verwendet das öffentliche ForTheUsers-artige `repo.json`-Format und kann als Custom Repository in Sphaira bzw. HB App Store hinterlegt werden.

Die Website kann in `web.config.json` wahlweise `brandMark` als Text oder `brandLogo` als Bild verwenden. Für lokale Logos die Datei unter `web-packages/assets/` ablegen und beispielsweise `"brandLogo": "assets/logo.png"` setzen; alternativ ist eine vollständige HTTPS-Bildadresse möglich.

## Schnellstart

```powershell
npm install
npm run all
```

Danach liegen die veröffentlichbaren Dateien unter `site/`. Die Standardkonfiguration veröffentlicht sie auf `https://hbas.sandybos.eu`; die Kanal-URL lautet beispielsweise `https://hbas.sandybos.eu/stable/repo.json`. Zusätzlich enthält `https://hbas.sandybos.eu/repo.json` alle Kanäle gemeinsam. Ein Paket, das mehreren Kanälen zugeordnet ist, kann darin als eigener Eintrag je Kanal vorkommen.

## Paket anlegen

Ein Paket besteht aus `packages/<id>/pkgbuild.json` (Store-Metadaten) und `updater.json` (Quelle/Installation). Für ein einzelnes NRO:

Die vollständige Paketfeldreferenz steht in [docs/package-format.md](docs/package-format.md). Repository, Website, RSS, Web-Pakete, Endpunkte und Workflows sind in [docs/configuration.md](docs/configuration.md) dokumentiert.

```json
{
  "source": { "type": "github-release", "owner": "OWNER", "repo": "REPO", "asset": "*.nro" },
  "install": [{ "from": "*.nro", "to": "switch/MyApp.nro" }]
}
```

`from: "/"` und `to: "/"` übernehmen eine fertige SD-Kartenstruktur aus ZIP-Dateien. Der Generator unterstützt ZIP, 7z, tar-/gzip-Archive und direkte NRO-Dateien. Die GitHub Action installiert 7-Zip zum Entpacken und für ZIP64-Pakete (nötig bei Dateien über 2 GiB). Lokal muss `7z` im `PATH` verfügbar sein.

Mit `"autoUpdate": false` in der `updater.json` bleibt ein vorhandenes Paket veröffentlicht, wird von allgemeinen und Workflow-Updates aber übersprungen. Eine bewusste manuelle Aktualisierung ist weiterhin mit `npm run update -- <paket-id>` möglich.

Lege dafür einen neuen Ordner `packages/<deine-app>` mit `pkgbuild.json` und `updater.json` an. Vorhandene Pakete dienen als Beispiele.

Optional kann `pkgbuild.json` außerdem `details` (Langbeschreibung), `binary` (SD-Pfad zur Hauptdatei), `appCreated` (`TT/MM/JJJJ`) und `app_dls` enthalten. Der Generator ergänzt `filesize`, `extracted`, Prüfsummen, Aktualisierungsdatum und die Anzahl der Dateien `screen1.png`, `screen2.png` usw. automatisch. `screen.png` dient als Banner, während die nummerierten Dateien in Store und Website als Screenshots erscheinen.

## Befehle

| Befehl | Zweck |
| --- | --- |
| `npm run check` | Konfiguration validieren |
| `npm run update` | Quellen laden; unveränderte Versionen überspringen |
| `npm run update -- <paket-id>` | Ein Paket gezielt aktualisieren, auch bei `autoUpdate: false` |
| `npm run generate` | Indizes, `repo.json` und Website aus dem Cache erzeugen |
| `npm run feeds` | Nur RSS-Feeds aus Paketstatus und Web-Paketen erzeugen |
| `npm run all` | Validieren, aktualisieren und erzeugen |

Nach `npm run build` stehen zusätzlich die internen CLI-Aufrufe `node dist/cli.js validate`, `update [paket-id]`, `generate`, `feeds`, `stage-deploy <remote-manifest> <zielordner>` und `all` zur Verfügung. `stage-deploy` bereitet anhand zweier Inhaltsmanifeste ausschließlich geänderte Upload-Dateien vor und wird vom Publish-Workflow verwendet.

GitHub Releases und direkte HTTP(S)-Downloads sind implementiert. GitHub Actions führt täglich einen Delta-Update-Lauf aus und lädt `site/` per FTPS auf den all-INKL.COM-Webspace. Die großen Dateien in `site/` bleiben bewusst außerhalb von Git; der versionierte Ordner `state/` merkt sich die letzte Quellversion.

Lege dafür unter **Settings → Secrets and variables → Actions** diese Secrets an: `FTPS_HOST`, `FTPS_USER`, `FTPS_PASSWORD` und `FTPS_SERVER_DIR` (für das Webspace-Hauptverzeichnis `/`). Der Upload nutzt `lftp` mit FTPS, Wiederholungen und fortsetzbaren Übertragungen, damit große Pakete bei einem Verbindungsabbruch nicht von vorn starten. Zugangsdaten gehören niemals in die Workflow-Datei oder `repo.config.json`.

Bei HTTP-Quellen wird die Version automatisch aus dem lesbaren HTTP-Änderungsdatum (`Last-Modified`) abgeleitet, beispielsweise `2026-07-15`. Falls der Server keines liefert, dienen `ETag` oder Dateigröße als Fallback. Eine feste `version` ist nur nötig, wenn der Server keine dieser Angaben liefert.

Für stabile Libretro-Versionen kann die URL einen einzelnen `*`-Platzhalter enthalten. Der Generator liest das Verzeichnis, wählt die höchste numerische Version und verwendet diese als Paketversion:

```json
{
  "source": {
    "type": "http",
    "url": "https://buildbot.libretro.com/stable/*/nintendo/switch/libnx/RetroArch.7z"
  },
  "install": [{ "from": "/", "to": "/" }]
}
```

Bei einer festen Stable-URL wie `.../stable/1.22.2/...` wird `1.22.2` direkt als Version übernommen. Bei sonstigen HTTP-URLs bleibt das Datum der Fallback.

### Libretro Nightly

`packages/retroarch-nightly` zeigt die Konfiguration für den dauerhaft gleich benannten Buildbot-Download `RetroArch.7z`. Eine Inhaltsänderung wird über die HTTP-Metadaten erkannt und als neue Nightly-Version verpackt.

## Dashboard und Sicherheit

Das Dashboard ist eine statische Übersichts- und Suchseite und wird zusammen mit den Repository-Dateien per FTPS veröffentlicht. Es verändert keine Pakete im Browser: Metadaten bleiben versioniert in Git und werden per Pull Request oder Commit verwaltet. Dadurch benötigt die veröffentlichte Website kein GitHub-Token und kann nicht unbefugt Pakete ändern.

Das optionale Feedbackformular sendet Meldungen an die mitgelieferte PHP-API. Ein separater, token-geschützter Workflow veröffentlicht neue Meldungen anschließend als GitHub Discussions. Einrichtung und Client-Kompatibilität sind in [`docs/configuration.md`](docs/configuration.md#feedback-und-github-discussions) beschrieben.

Nur Homebrew aus vertrauenswürdigen, rechtmäßigen Quellen aufnehmen. Der Generator prüft Download-Hash und Größe der erzeugten Pakete; die Lizenz und Rechte der aufgenommenen Software bleiben Verantwortung der Paketpflege.
