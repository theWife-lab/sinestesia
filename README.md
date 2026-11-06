# Sinestesia v4: grafica (Elfetto Novecento)

Si apre con doppio clic su `index.html` (file://). Non usa CDN, fetch di file locali o API. I font sono in `fonts/`, copiati da statistiche/novecento/fonts.

## Pagine
- `index.html`: pagina 1 (nome e scelta dello strumento) e pagina 2 (`#modi`: Lo Studio, Il Sole, La Creatura). Lo strumento si salva in `localStorage.v4ins` e passa alle modalità con `?ins=`.
- `studio.html`: **Lo Studio**. È una copia 1:1 di ../index.html, con in più un foglio di stile v4 sul pannello e il link "← modalità". Usa il suo menù ☰ e il suo tasto di registrazione: audio, pitch, impostazioni, prese e export video sono quelli dell'app.
- `sole.html`: **Il Sole**. Layout di statistiche/studio_analisi.html, con le impostazioni in un menù a scomparsa (`impostazioni`) e un tasto di registrazione rotondo, al centro in basso.
- `creatura.html`: **La Creatura**. È Velo di Elfetto Generativo (`generativo/forma-ampia.js`, non modificato). Lo caricano `palco-min.js` (registro PALCO minimo) e `creatura.js` (ponte).

## Motore (Il Sole e La Creatura)
`motore.js` è una copia di statistiche/live/studio_analisi.js. Analisi, YIN, livelli, bordone e metronomo restano uguali. Le patch sono queste:
- La 442/440 viene da `localStorage.v4a4` e la trasposizione dallo strumento scelto.
- Il tasto registra avvia la presa e insieme un MediaRecorder su `canvas.captureStream(30)` + l'audio dell'ingresso (MediaStreamDestination). Il video contiene solo il quadro e l'audio, senza DOM né menù, e si scarica alla fine della presa.
- Hook `window.V4_DRAW(g,W,H,L,livello,kids,rm)` (kids sempre false): se c'è, sostituisce il disegno del Sole (lo usa la Creatura).
- Hook `window.V4_LIV(i)`, chiamato quando cambia il livello di accuratezza.

Ponte della Creatura (L → F): on, Ls = L.L, pitchT = (midi − lo)/(hi − lo) sull'estensione dello strumento, cents, noteId (si incrementa a ogni nuova nota, con onOnset), vib, vibAmt = vibC/50, onCrack quando arriva una rottura. `skin.livello` = livello del menù (0/1/2 = 25/15/8 c). `pal` = {kids:false, rm}, quindi bg, accent e gold restano quelli di Velo. Il velo si compone sul fondo crema della pagina senza rettangoli.

## Una sola versione
Non c'è una modalità bambini (scelta di theWife): fondo crema #FFF6E4, nero #111, grigio #6b6b68, vermiglione #E8452C. Il Sole legge il fondo da `--bg`, quindi il suo canvas è crema. Nello Studio il tasto 🧸 Bambini è nascosto e non si attiva più da localStorage o da ?kids.

## Anteprime
`previews/cattura.py` (Playwright + Chrome headless + ffmpeg): controlla la console in file://, scatta gli screenshot e fa un video con l'audio di presa_vera_18s.wav, iniettato con `?demo=` su un server http locale.
