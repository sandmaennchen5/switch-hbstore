# Web-Pakete

Web-Pakete erscheinen nur in Website und RSS, nicht in den Store-Repositories. Das vollständige Format für GitHub-, manuelle und amsPLUS-Quellen steht in [`docs/configuration.md`](../docs/configuration.md#web-pakete).

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
