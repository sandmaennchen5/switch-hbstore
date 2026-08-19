# Web-Pakete

Web-Pakete erscheinen nur in Website und RSS, nicht in den Store-Repositories. Das vollständige Format für GitHub-, manuelle und amsPLUS-Quellen steht in [`docs/configuration.md`](../docs/configuration.md#web-pakete).

Für Bilder werden `icon`, `banner` und die Liste `screens` unterstützt. Die Dateien werden unter `web-packages/assets/` abgelegt und in der JSON-Datei beispielsweise als `assets/app-icon.png` referenziert.

Web-Pakete können optional dieselben Kompatibilitätsangaben wie Store-Pakete enthalten:

```json
"compatibility": {
  "libnx": "4.10.0-1 oder höher",
  "atmosphere": "1.10.0 oder höher",
  "firmware": "21.x.x oder höher",
  "minimumAtmosphere": "1.10.0",
  "minimumFirmware": "21",
  "verified": true
}
```

`minimumAtmosphere` und `minimumFirmware` sind maschinenlesbare Mindestversionen für Filter und spezielle Repository-Dateien. `verified: true` markiert den Eintrag als bestätigt. Mit `false` wird er als „Nicht geprüft“ angezeigt. Fehlt das Objekt, erscheint er unter „Keine Angabe“.

Mit `"related": ["paket-id"]` werden passende Store- oder Web-Pakete im Detaildialog verknüpft. So kann beispielsweise ein PC-Server auf seinen Switch-Client und der Client zurück auf seine kompatiblen Server verweisen.
