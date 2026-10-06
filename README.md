# Parlami

Impara l'inglese e lo spagnolo con lezioni brevi, ogni giorno. Un percorso di unità e lezioni,
esercizi rapidi, XP, serie di giorni, cuori e ripasso degli errori.

Costruita con il metodo [replica-skill](https://github.com/Jakeschincariol/replica-skill)
(recon → architect → design → build → test → diff → brand): rifà le funzioni e il flusso di una
app per lingue, scritto da zero, con nome, colori, logo e contenuti propri.

## Cosa c'è

- **18 corsi** per chi parla italiano: Inglese (12 lezioni), Spagnolo, Francese, Tedesco, Portoghese, Polacco,
  Cinese, Giapponese, Coreano, Russo, Ucraino, Greco, Arabo, Hindi, Olandese, Svedese, Turco e Rumeno (6 lezioni ciascuno)
- cinese, giapponese, coreano, russo, ucraino, greco, arabo e hindi mostrano la pronuncia in lettere latine;
  l'arabo si compone da destra a sinistra

### Migliorie rispetto all'originale (vedi `replica/fixes.md`)

- **nessun limite**: i cuori sono spenti di default; si accendono come "modalità sfida"
- **suggerimenti di grammatica** prima di ogni lezione (114 schede), sempre riapribili con 💡
- **esercizio di pronuncia** con il riconoscimento vocale del telefono, saltabile
- **serie gentile**: un giorno saltato a settimana non la interrompe; nessuna notifica, nessuna pubblicità
- **"Segnala un errore"** su ogni risposta, che apre una segnalazione precompilata su GitHub
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
npm test           # Vitest: 51 test sulla logica e su tutti i corsi
npm run e2e        # Playwright: 15 flussi × desktop e mobile (anche polacco, cinese, arabo, hindi)
SCREENS=1 npx playwright test screens   # screenshot in replica/clone-screens/
```

## Struttura

```
src/data/courses.ts    corsi di inglese e spagnolo, elenco dei corsi
src/data/syllabus.ts   programma comune (in italiano) delle altre lingue
src/data/languages.ts  traduzioni del programma nelle altre 16 lingue
src/data/tips.ts       suggerimenti di grammatica per ogni lezione
src/lib/speech.ts      riconoscimento vocale per l'esercizio di pronuncia
src/lib/answers.ts     correzione delle risposte
src/lib/lesson.ts      generazione esercizi e coda della lezione
src/lib/store.ts       XP, serie, cuori, salvataggio
src/screens/           le schermate
replica/               recon, architettura, design token, piano test, bug, parità, brand
```

## Prossimi passi

Account e sincronizzazione (Supabase), classifiche settimanali, più unità per le nuove lingue,
revisione dei contenuti da parte di madrelingua.
