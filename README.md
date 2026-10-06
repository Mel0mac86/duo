# Parlami

Impara l'inglese e lo spagnolo con lezioni brevi, ogni giorno. Un percorso di unità e lezioni,
esercizi rapidi, XP, serie di giorni, cuori e ripasso degli errori.

Costruita con il metodo [replica-skill](https://github.com/Jakeschincariol/replica-skill)
(recon → architect → design → build → test → diff → brand): rifà le funzioni e il flusso di una
app per lingue, scritto da zero, con nome, colori, logo e contenuti propri.

## Cosa c'è

- **2 corsi** per chi parla italiano: Inglese (3 unità, 12 lezioni) e Spagnolo (2 unità, 6 lezioni)
- **5 tipi di esercizio**: scegli la parola, componi la frase, scrivi la traduzione, abbina le coppie, ascolta e scrivi
- correzione tollerante: maiuscole, punteggiatura, contrazioni inglesi, accenti e piccoli errori di battitura (segnalati)
- gli errori tornano a fine lezione finché non li azzecchi
- **cuori** (5, uno ogni 30 minuti), **XP**, **serie di giorni**, **obiettivo giornaliero**
- **ripasso** degli errori (+1 cuore), **profilo** con grafico degli ultimi 7 giorni e traguardi, **impostazioni**
- voce del browser per l'ascolto (con testo di riserva), effetti sonori sintetizzati
- tastiera: `1`–`3` per scegliere, `Invio` per verificare e continuare
- funziona su mobile e desktop; i progressi restano nel browser (localStorage)

## Avvio

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # sito statico in dist/ (base relativa: va su qualsiasi hosting statico)
```

## Test

```bash
npm test           # Vitest: 25 test sulla logica
npm run e2e        # Playwright: 7 flussi × desktop e mobile
SCREENS=1 npx playwright test screens   # screenshot in replica/clone-screens/
```

## Struttura

```
src/data/courses.ts    contenuti dei corsi (originali)
src/lib/answers.ts     correzione delle risposte
src/lib/lesson.ts      generazione esercizi e coda della lezione
src/lib/store.ts       XP, serie, cuori, salvataggio
src/screens/           le schermate
replica/               recon, architettura, design token, piano test, bug, parità, brand
```

## Prossimi passi

Account e sincronizzazione (Supabase), classifiche settimanali, più unità, app icon 1024px.
