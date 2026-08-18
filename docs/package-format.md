# Paketformat

Jede App liegt in `packages/<id>/` und benötigt zwei Dateien:

- `pkgbuild.json` beschreibt die Anzeige im Store.
- `updater.json` beschreibt Download, Entpacken und Zielpfade auf der SD-Karte.

Optional gehören Bilder in denselben Ordner: `icon.png`, `screen.png` (Banner) sowie `screen1.png`, `screen2.png` usw. (Screenshots).

## `pkgbuild.json`

Minimalbeispiel:

```json
{
  "id": "my-app",
  "title": "My App",
  "author": "Name",
  "description": "Kurze Beschreibung für die Paketliste.",
  "category": "tool",
  "license": "MIT"
}
```

| Feld | Pflicht | Beschreibung |
| --- | --- | --- |
| `id` | Ja | Eindeutige Paket-ID. Erlaubt sind Buchstaben, Ziffern, `-`, `_` und `.`. Der Generator hängt keinen Kanalnamen automatisch an; IDs wie `retroarch-stable` oder `retroarch-nightly` müssen bei Bedarf selbst gesetzt werden. |
| `title` | Ja | Sichtbarer Name im Store. |
| `author` | Ja | Autor oder Projekt. |
| `description` | Ja | Kurze Beschreibung für Liste und Suche. |
| `category` | Ja | Kategorie, zum Beispiel `tool`, `game`, `emu` oder `utility`. |
| `license` | Ja | Lizenzbezeichnung, zum Beispiel `MIT` oder `GPL-3.0-or-later`. |
| `homepage` | Nein | Projekt- oder Quellcode-URL. |
| `details` | Nein | Lange Beschreibung für die Detailansicht der Website. Ohne Angabe wird `description` verwendet. |
| `binary` | Nein | Hauptdatei auf der SD-Karte, etwa `switch/MyApp/MyApp.nro`. Wird nicht angegeben, versucht der Generator den ersten NRO-Zielpfad zu erkennen. |
| `appCreated` | Nein | Erstellungsdatum im Format `TT/MM/JJJJ`. Ohne Angabe wird das Datum des letzten erfolgreichen Downloads verwendet. |
| `app_dls` | Nein | Startwert des Downloadzählers. Ohne Angabe `0`. Dieser Generator zählt Downloads nicht selbst. |
| `channels` | Nein | Liste der Kanäle, zum Beispiel `["stable"]`, `["nightly"]` oder `["stable", "beta"]`. Standard ist `["stable"]`. |
| `compatibility` | Nein | Kompatibilitätsanzeige und Grundlage des gefilterten `compatible`-Repos; siehe unten. |

### Kompatibilität

```json
"compatibility": {
  "libnx": "4.10.0-1+",
  "atmosphere": "1.10.0+",
  "firmware": "21.x.x+",
  "minimumAtmosphere": "1.10.0",
  "minimumFirmware": "21",
  "verified": true
}
```

`libnx`, `atmosphere` und `firmware` sind die sichtbaren Angaben. `minimumAtmosphere` und `minimumFirmware` enthalten ausschließlich numerische, maschinenlesbare Mindestversionen. Nur bestätigte Pakete mit `verified: true`, deren Mindestwerte zu AMS 1.10.0/FW 21 passen, erscheinen in `compatible/repo.json`. `false` wird auf der Website als „Nicht geprüft“ angezeigt.

Vollständiges Beispiel:

```json
{
  "id": "my-app",
  "title": "My App",
  "author": "Name",
  "description": "Kurze Beschreibung.",
  "details": "Lange Beschreibung mit Bedienhinweisen.\n\nMehrere Absätze sind möglich.",
  "category": "tool",
  "license": "MIT",
  "homepage": "https://github.com/example/my-app",
  "binary": "switch/MyApp/MyApp.nro",
  "appCreated": "15/07/2026",
  "app_dls": 0,
  "channels": ["stable", "beta"]
}
```

## Bilder

| Datei | Verwendung |
| --- | --- |
| `icon.png` | Store-Icon und Icon auf der Website. |
| `screen.png` | Banner/älteres Vorschauformat. |
| `screen1.png` bis `screenN.png` | Screenshots. Die Anzahl wird automatisch in `screens` eingetragen. |

Die Bilder werden beim Generieren in den gemeinsamen Ordner `site/packages/<id>/` kopiert und über absolute URLs aus allen Kanälen verwendet. `screen.png` zählt nicht als Screenshot.

## `updater.json`

### GitHub Release

```json
{
  "source": {
    "type": "github-release",
    "owner": "OWNER",
    "repo": "REPOSITORY",
    "asset": "*.nro"
  },
  "install": [
    { "from": "*.nro", "to": "switch/MyApp.nro" }
  ]
}
```

| Feld | Pflicht | Beschreibung |
| --- | --- | --- |
| `source.type` | Ja | `github-release` oder `http`. |
| `source.owner` | Für GitHub | GitHub-Organisation oder Benutzername. |
| `source.repo` | Für GitHub | GitHub-Repository. |
| `source.asset` | Für GitHub | Name oder Muster eines Release-Assets. `*` ist ein Platzhalter, zum Beispiel `*switch*.zip`. |
| `source.prerelease` | Nein | `true` soll eine Vorabversion statt des neuesten stabilen Releases verwenden. |
| `source.direct` | Nein | Behandelt die Quelle als fertiges SD-Karten-Archiv, etwa eine `.7z`, und baut daraus ein HB-Store-kompatibles ZIP. Erfordert die Installationsregel `from: "/"` nach `to: "/"`. |
| `source.url` | Für HTTP | Direkte Download-URL. |
| `source.version` | Nein, HTTP | Feste Versionsnummer, falls der Server keine brauchbaren Versionsdaten liefert. |
| `autoUpdate` | Nein | Bei `false` in allgemeinen Updates und `npm run all` überspringen. `npm run update -- <id>` aktualisiert das Paket trotzdem gezielt. |
| `patchNroVersion` | Nein | Schreibt die erkannte Version in den NACP-Bereich der unter `pkgbuild.binary` angegebenen NRO. Erfordert `binary`; maximal 15 UTF-8-Bytes. |
| `changelog` | Nein | Externe Changelog-Quelle; Details im folgenden Abschnitt. |

### Direkter HTTP-Download

```json
{
  "source": {
    "type": "http",
    "url": "https://example.org/releases/MyApp.zip"
  },
  "install": [
    { "from": "release/MyApp.nro", "to": "switch/MyApp/MyApp.nro" }
  ]
}
```

Bei HTTP übernimmt der Generator die Version aus dem URL-Pfad (bei `.../stable/1.2.3/...`), ansonsten aus `Last-Modified`, `ETag` oder Dateigröße. Eine URL darf einen einzelnen `*`-Platzhalter für eine Versionsnummer enthalten, zum Beispiel `.../stable/*/MyApp.zip`.

### Changelog

```json
"changelog": {
  "url": "https://raw.githubusercontent.com/OWNER/REPO/master/CHANGES.md",
  "section": "version",
  "history": 10,
  "excludeFile": "changelog/exclude.json"
}
```

| Feld | Beschreibung |
| --- | --- |
| `url` | Markdown-/Textquelle des Changelogs. |
| `section` | `version` liest die Überschrift der aktuellen Version; `future` liest den Abschnitt `Future`. |
| `history` | Bei `version`: Anzahl aufeinanderfolgender Releaseabschnitte, 1 bis 20. |
| `previousReleases` | Bei `future`: zusätzliche frühere Releaseabschnitte nach `Future`. |
| `excludeFile` | JSON-Liste nicht relevanter Kategorien, etwa `ANDROID` oder `3DS`. |
| `githubHistory` | Optionaler GitHub-Commitvergleich für hinzugefügte, geänderte und entfernte Future-Zeilen. |

`githubHistory` enthält `owner`, `repo`, `path`, optional `branch` und `commits` (1 bis 30). Für GitHub-Abfragen verwendet der Workflow `GITHUB_TOKEN`, falls vorhanden. Kann die Changelog-Quelle nicht geladen werden, bleibt der Changelog der eigentlichen Downloadquelle erhalten.

### Installationsregeln

`install` ist eine nicht leere Liste von Kopierregeln. Der linke Wert (`from`) bezieht sich auf den entpackten Download, der rechte (`to`) auf den Zielpfad im erzeugten ZIP bzw. auf der SD-Karte. Führende `/` sind optional; `..` ist nicht erlaubt.

| Regel | Ergebnis |
| --- | --- |
| `{ "from": "*.nro", "to": "switch/MyApp.nro" }` | Kopiert eine NRO direkt an diesen Zielpfad. |
| `{ "from": "assets/*", "to": "switch/MyApp/" }` | Kopiert passende Dateien in einen Zielordner; der Dateiname bleibt erhalten. |
| `{ "from": "/", "to": "/" }` | Übernimmt die komplette SD-Kartenstruktur aus dem Archiv. |

`exclude` ist eine optionale Liste von Pfadmustern innerhalb einer Regel. Damit lassen sich beispielsweise `retroarch/cores/*` aus einer ansonsten vollständig übernommenen SD-Struktur ausschließen. Spätere Regeln können einzelne ausgeschlossene Dateien gezielt wieder hinzufügen.

Jede Regel kann optional einen Installationsmodus erhalten:

```json
"install": [
  { "from": "MyApp.nro", "to": "switch/MyApp/MyApp.nro", "mode": "overwrite" },
  { "from": "config.ini", "to": "switch/MyApp/config.ini", "mode": "if-missing" }
]
```

| `mode` | Manifest | Verhalten in Sphaira und HB App Store |
| --- | --- | --- |
| nicht angegeben oder `overwrite` | `U:` | Immer installieren und eine vorhandene Datei überschreiben. Die Datei wird als Paketbestandteil verwaltet. |
| `if-missing` | `G:` | Nur installieren, wenn am Ziel noch keine Datei existiert. Geeignet für eine erstmalige Standardkonfiguration. |

### Vergleich der Manifestbefehle

| Befehl | Sphaira | HB App Store/libget | Empfehlung |
| --- | --- | --- | --- |
| `U:` | Immer entpacken; beim Update und Deinstallieren verwaltet | Immer entpacken; beim Update und Deinstallieren verwaltet | Voll unterstützt (`overwrite`) |
| `G:` | Nur entpacken, wenn die Datei fehlt | Nur entpacken, wenn die Datei fehlt | Unterstützt (`if-missing`); Eintrag dauerhaft im Manifest belassen |
| `E:` | Immer entpacken und beim Deinstallieren löschen | Immer entpacken, aber beim Deinstallieren behalten | Nicht erzeugen: Verhalten ist zwischen den Clients unterschiedlich |
| `L:` | Wird ignoriert | Wird geparst, aber nicht als normale gemeinsame Installationsaktion behandelt | Nicht erzeugen |
| `D:` | Nicht vorhanden | Nicht vorhanden | Nicht unterstützt |

Alte, zuvor mit `U:` verwaltete Dateien werden von beiden Clients beim Update entfernt, sobald sie im neuen Manifest nicht mehr vorkommen. Es gibt keinen gemeinsamen direkten Löschbefehl für beliebige, zuvor nicht vom Paket verwaltete Dateien. Bei `G:` unterscheidet sich die spätere Bereinigung: Sphaira kann einen aus dem neuen Manifest entfernten Eintrag löschen, während HB App Store ihn beim Update normalerweise behält. Deshalb sollte ein `G:`-Eintrag für Benutzerkonfigurationen in zukünftigen Versionen weitergeführt werden.

Unterstützte Quellen sind direkte Dateien sowie ZIP-, TAR-, GZIP-, XZ- und 7z-Archive. Bei mehreren passenden Dateien wird jede passende Datei kopiert.

Das veröffentlichte Paket ist unabhängig vom Quellformat immer eine ZIP-Datei mit normalem Deflate und ZIP64-Unterstützung. Dadurch bleibt es mit Sphaira und HB App Store kompatibel; 7z/LZMA-Archive werden nur als Quelle akzeptiert, nicht als Store-Download ausgegeben. `manifest.install` und `info.json` liegen an der ZIP-Wurzel, werden aber nicht als SD-Zieldateien in das Manifest aufgenommen.

## Automatisch erzeugte Store-Felder

`repo.json` erhält zusätzlich automatisch `version`, `updated`, `filesize` (KiB), `extracted` (KiB), `md5`, `sha256` und `screens`. Diese Werte müssen nicht in `pkgbuild.json` stehen.

Pro Paket wird außerdem `packages/<id>/info.json` erzeugt. Diese Datei folgt dem ForTheUsers-Format und enthält die Detail-Metadaten (`title`, `description`, `author`, `version`, `license`, `url`, `category`, `details`, `changelog`). Daneben wird `packages/<id>/manifest.install` mit der installierten Dateiliste geschrieben. Die Pfade im Manifest sind relativ zur SD-Karten-Wurzel und besitzen keinen führenden `/`. Beide Metadateien werden zusätzlich an der Wurzel des Download-Archivs `packages/<id>.zip` abgelegt, damit Sphaira sie direkt aus dem ZIP lesen kann. Die Kanal-Repos (`stable/repo.json`, `nightly/repo.json`, `beta/repo.json`) sind nur gefilterte Ansichten dieser Hauptdaten und erzeugen keine eigenen Paketordner.
