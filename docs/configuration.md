# Repository- und Webkonfiguration

## `repo.config.json`

```json
{
  "title": "switch-hbas",
  "baseUrl": "https://hbas.sandybos.eu",
  "feedbackUrl": "https://hbas.sandybos.eu/api/feedback.php",
  "githubRepositoryUrl": "https://github.com/sandmaennchen5/switch-hbstore",
  "githubBranch": "main",
  "downloadCountsUrl": "https://hbas.sandybos.eu/history/files_Switch.json",
  "generatePackagesJson": false,
  "channels": ["stable", "beta", "nightly"]
}
```

| Feld | Beschreibung |
| --- | --- |
| `title` | Repository- und Seitentitel, sofern `web.config.json` ihn nicht überschreibt. |
| `baseUrl` | Öffentliche Domain ohne abschließenden Slash. Steuert Repository-, Paket-, Bild-, Metadaten- und Feed-URLs. |
| `feedbackUrl` | Feedback-Endpunkt für die Website und für Clients, die künftig das optionale Feld `feedback_url` aus `repo.json` unterstützen. |
| `githubRepositoryUrl` | GitHub-Repository für die Links zum Paketordner und zu dessen Commit-Historie in der Webansicht. |
| `githubBranch` | Branch für GitHub-Paketlinks, standardmäßig `main`. |
| `downloadCountsUrl` | Optionale JSON-Datei mit Gesamtzählern je ZIP-Dateiname. Fehler beim Abruf blockieren den Build nicht. |
| `generatePackagesJson` | Optional; standardmäßig `true`. Mit `false` werden die zusätzlichen rohen `packages.json`-Listen im Root-, Kanal- und Compatible-Verzeichnis nicht erzeugt. `repo.json` bleibt unverändert erhalten. |
| `channels` | Erzeugte Kanäle. Die Paketzuordnung stammt aus `pkgbuild.json`. |

Das Zählerformat ist ein flaches Objekt, beispielsweise `{ "retroarch.zip": 7 }`. Schlüsselnamen werden ohne Beachtung der Groß-/Kleinschreibung ausgewertet; ungültige oder negative Werte werden ignoriert.

## Öffentliche Endpunkte

| Adresse relativ zu `baseUrl` | Inhalt |
| --- | --- |
| `/repo.json` | Alle Store-Kanäle gemeinsam. |
| `/stable/repo.json`, `/beta/repo.json`, `/nightly/repo.json` | Einzelne Kanäle. |
| `/compatible/repo.json` | Nur bestätigte Pakete für AMS 1.10.0+/FW 21+. |
| `/packages/<id>.zip` | Installationsarchiv. |
| `/packages/<id>/info.json` | Paketmetadaten. |
| `/packages/<id>/manifest.install` | Installationsaktionen. |
| `/packages/<id>/icon.png`, `screen.png`, `screenN.png` | Bilder. |
| `/feeds/apps.xml` | Updates aller Store- und Web-Pakete. |
| `/feeds/amsplus.xml` | Erkannte amsPLUS-Aktualisierungen. |
| `/repos.html`, `/rss.html` | Einrichtungs- und Hilfeseiten. |
| `/api/feedback.php` | Nimmt Feedback aus der Website und kompatiblen Store-Clients entgegen. |

Die erzeugte `.htaccess` leitet alte bzw. kanalbezogene `zips/`- und `packages/`-Pfade auf den gemeinsamen Paketordner um. Sie wird bei jedem vollständigen Publish ausdrücklich hochgeladen.

Beim Publish vergleicht der Workflow außerdem das bisherige `.deploy-manifest.json` vom Webspace mit der neu erzeugten Dateiliste. Dateien, die früher vom Generator veröffentlicht wurden, aber im aktuellen Build fehlen, erscheinen im Log als `DELETE`-Kandidaten. Zusätzlich wird für 30 Tage das Workflow-Artefakt `webspace-delete-candidates` bereitgestellt. Der Workflow löscht diese Dateien bewusst nicht automatisch. Die Cronjob-Ordner `/history/*` und `/counting-book/*`, Feedback-Laufzeitdaten unter `/api/data/*` sowie `/api/.feedback-token` sind ausdrücklich geschützt und werden auch dann ignoriert, wenn sie versehentlich in einem alten Manifest vorkommen.

## `web.config.json`

Die Datei steuert die statische Website, ohne Store-Paketmetadaten zu verändern.

### Marke und Hauptseite

| Feld | Beschreibung |
| --- | --- |
| `brand` | Name in der Kopfzeile. |
| `brandMark` | Kurzer Text im Markenfeld, wenn kein Logo gesetzt ist. |
| `brandLogo` | HTTPS-Bildadresse oder lokaler Pfad wie `assets/logo.png`. Lokale Dateien liegen unter `web-packages/assets/`. |
| `eyebrow` | Kleine Zeile oberhalb der Hauptüberschrift. |
| `headline` | Hauptüberschrift. |
| `description` | Einleitung der Appübersicht. |
| `categoryLabels` | Übersetzung interner Kategorien in sichtbare Namen. |

### Farben

Unter `theme` stehen `background`, `surface`, `surfaceSecondary`, `accent` und `accentSecondary`. Zulässig sind sechsstellige Hexfarben wie `#42d3ff`; ungültige Angaben fallen auf Standardfarben zurück.

### Schaltflächen

Unter `buttons` können `copy`, `feedOpen`, `repoOpen`, `back`, `repositorySetup`, `rssSetup`, `feedback`, `installFiles`, `githubContents`, `githubHistory` und `copied` umbenannt werden.

Bei Store-Paketen zeigt die Detailansicht zusätzlich die Installationsdateien aus `manifest.install`. Zwei weitere Schaltflächen öffnen den Paketordner beziehungsweise die auf diesen Ordner gefilterte Commit-Historie auf GitHub. Reine Web-Pakete erhalten diese Funktionen nicht.

### Feedback und GitHub Discussions

Unter `feedback` steuern `enabled`, `endpoint`, `headline`, `description`, `submit` und `success` das Feedbackformular. Die PHP-API akzeptiert sowohl Formulardaten als auch JSON. Für die Kompatibilität mit HB App Store und einer künftigen Sphaira-Erweiterung sind insbesondere `package`, `message`, `name`, `platform`, `package_version` und `hbas_version` vorgesehen.

Neue Meldungen werden zunächst unter `api/data/pending` auf dem Webspace gespeichert. Der Workflow `.github/workflows/feedback.yml` ruft sie alle 15 Minuten ab. Für jede Paket-ID wird genau eine GitHub Discussion angelegt; jede Rückmeldung erscheint darin als eigener Kommentar. Stable- und Nightly-Pakete bleiben durch ihre unterschiedlichen IDs getrennt. Anschließend bestätigt der Workflow die Verarbeitung. Verarbeitete Meldungen liegen unter `api/data/processed`. Beide Verzeichnisse sowie `.feedback-token` werden durch `.htaccess` vor HTTP-Zugriff geschützt.

Einrichtung:

1. GitHub Discussions in den Repository-Einstellungen aktivieren.
2. Eine Discussion-Kategorie namens `Feedback` anlegen. Alternativ die Repository-Variable `FEEDBACK_DISCUSSION_CATEGORY` auf den gewünschten Kategorienamen setzen.
3. Einen langen zufälligen Wert als Actions-Secret `FEEDBACK_API_TOKEN` hinterlegen. Dasselbe Secret wird beim Publish als geschützte `.feedback-token` auf den Webspace übertragen.
4. Den Publish-Workflow einmal ausführen und anschließend `Publish feedback to GitHub Discussions` manuell testen.

Das Feld `feedback_url` wird zusätzlich in allen erzeugten `repo.json`-Varianten ausgegeben. Bestehende Clients ignorieren das unbekannte Feld. Eine angepasste Sphaira-Version kann es bevorzugen und ansonsten auf den bisherigen switchbru-Endpunkt zurückfallen.

### RSS- und Repository-Seite

`rssPage` und `repositoryPage` unterstützen jeweils `brand`, `eyebrow`, `headline`, `intro` und `sections`. Ein Abschnitt kann folgende Felder besitzen:

```json
{
  "title": "Überschrift",
  "description": "Beschreibung",
  "steps": ["Erster Schritt", "Zweiter Schritt"],
  "note": "Zusätzlicher Hinweis"
}
```

RSS-Abschnittsschlüssel sind `all`, `amsplus`, `ios` und `android`. Repository-Schlüssel sind `all`, `stable`, `beta`, `nightly`, `compatible`, `sphaira`, `hbAppStore` und `selection`. Fehlende Werte verwenden die im Generator eingebauten deutschen Standardtexte.

## Web-Pakete

JSON-Dateien direkt unter `web-packages/` erscheinen ausschließlich auf der Website und im allgemeinen RSS-Feed, nicht in den Store-`repo.json`. Dadurch lassen sich CFW-Pakete und PC-Programme mit aktuellen Links darstellen.

Pflichtfelder sind `id`, `title`, `author`, `description`, `category`, `platforms`, `license` und `source`. Optional sind `details`, `icon`, `banner`, `screens`, `compatibility` und `related`.

Lokale Bilder liegen unter `web-packages/assets/`. `icon` erscheint auf der Paketkarte, `banner` oben im Detaildialog und `screens` als Bildergalerie:

```json
"icon": "assets/beispiel-icon.png",
"banner": "assets/beispiel-banner.jpg",
"screens": ["assets/beispiel-screen1.jpg", "assets/beispiel-screen2.jpg"]
```

`related` enthält IDs anderer Store- oder Web-Pakete. Die Website zeigt diese im Detaildialog unter „Passende Programme“ an und kennzeichnet sie als PC-Tool oder Switch-Client:

```json
"related": ["cyberfoil"]
```

GitHub-Quelle:

```json
"source": {
  "type": "github",
  "owner": "OWNER",
  "repo": "REPOSITORY"
}
```

Sie liest den neuesten Release, dessen Assets, Größe, Downloadzähler und Changelog. Ohne Release wird der neueste Commit verwendet.

Manuelle Quelle:

```json
"source": {
  "type": "manual",
  "version": "laufend aktualisiert",
  "url": "https://example.com/project"
}
```

`"scrape": "amsplus"` aktiviert den speziellen Parser für den ersten amsPLUS-Forenbeitrag. Er erkennt Paketversion, ZIP-Build, aktiven beziehungsweise durchgestrichenen Nightly-Build, Aktualisierungszeilen, Downloadlink und – falls der Server sie liefert – Dateigröße.

## Website-Funktionen

Die Übersicht bietet Suche, Kategorien, Kanal- und Sortierfilter sowie die Kompatibilitätsfilter „Alle geprüften“, AMS 1.10.0+/FW 21+, anderer Versionsstand, nicht geprüft und ohne Angabe. Detaildialoge zeigen Größen, Downloads, MD5, SHA-256, Bilder, Projektseite, Changelog und Verknüpfungen zu passenden Programmen. Web-Pakete ohne Archive zeigen nicht verfügbare Prüfsummen bzw. Größen entsprechend an.

## Workflows und Deployment

`publish.yml` läuft manuell, bei Änderungen auf `main` und täglich. Es validiert, aktualisiert und erzeugt Pakete, cached fertige Archive, committet geänderte Statusdateien und lädt nur anhand von SHA-256 geänderte Dateien per FTPS hoch. `.htaccess` wird unabhängig vom Delta immer übertragen. Benötigte Secrets: `FTPS_HOST`, `FTPS_USER`, `FTPS_PASSWORD` und `FTPS_SERVER_DIR`.

`rss.yml` läuft getrennt alle drei Stunden sowie bei relevanten Änderungen. Es erzeugt und überträgt nur die beiden Feeddateien. Beide Workflows verwenden dieselbe Concurrency-Gruppe, damit ihre FTPS-Uploads nicht gleichzeitig laufen.

`state/` enthält kleine, versionierte Buildzustände einschließlich Quellversion, Prüfsummen, Dateiliste und Installationsmanifest. `.cache/` enthält wiederverwendbare Archive und wird in GitHub Actions gecacht. `site/` ist die vollständig erzeugte Veröffentlichungsausgabe und gehört nicht in die Paketquellen.
