---
tags: [storia, demo]
aliases: [Sessione demo]
---

# Una sessione con Claude Code — 18 novembre 2026

Questa nota racconta una sessione di lavoro su Sibilla fatta conversando con Claude Code: le richieste così come sono state scritte, e cosa ne è uscito. È una demo del metodo, non una specifica: lo stato attuale del progetto è nelle altre note.

È una versione curata, non la trascrizione: mancano i passaggi intermedi (letture di file, comandi, tentativi) e ogni dato personale.

## Come si è lavorato

- Ogni modifica è stata verificata prima di dirla fatta: controllo dei tipi, test, lint e, per l'interfaccia, prove nel browser con Playwright in tema chiaro e scuro, su desktop e a 390 px.
- Le prove nel browser hanno girato su un secondo server con un database a perdere e senza login, mai sui dati veri (vedi [Test](../../Sviluppo/Test.md)).
- La generazione è stata simulata: nella sessione non c'era una chiave API. Quello che riguarda il comportamento di un modello vero resta da provare, ed è scritto in [Limiti](../../Sviluppo/Limiti.md).

## Le richieste, una per una

### 1. «utilizza questo orb in sibilla e avviami i dev server»

Con il comando `npx shadcn@latest add zzzzshawn/orbkit/shdr-21`.

- La sfera in CSS è diventata lo shader WebGL SHDR-21 di orbkit, dietro lo stesso componente `Orb`: i cinque punti che la usano non sono cambiati.
- `npm run dev` su Windows falliva con `spawn EINVAL`; i due server sono stati avviati separatamente.

### 2. «controlla con playwright i bug e fixali, se non c'è scaricalo»

- Trovato un difetto vero: la sfera ignorava la dimensione e si disegnava sempre a 280 px (nel login era 3,5 volte troppo grande). Il componente di orbkit imposta la misura in linea, che vince sulle classi; `Orb` ora usa direttamente il motore dello shader.

### 3. «usa i colori ambra di Sibilla per l'orb»

- Tre stati, tre coppie luce/ombra prese dalla palette del marchio.
- La prima versione dello stato «sta lavorando» (crema su laguna) spariva sul tema chiaro a 20 px: sostituita con un ambra più acceso, dopo averla guardata ingrandita nei due temi.

### 4. «utilizziamo rareui … e anche gli altri componenti»

- Il sito blocca i client automatici; i componenti sono stati presi dal sorgente pubblico, dopo aver letto la licenza (uso consentito con attribuzione, niente rivendita dei componenti).
- Due domande prima di procedere: quali componenti, e come far convivere «tieni premuto per ragionare di più» con l'impostazione dell'impegno. Scelte: nove componenti, e l'impegno deciso dalla pressione sul pulsante di invio.
- Nove componenti integrati (casella dei messaggi, stato di lavoro, risposte, notifiche, eliminazione, barra laterale, contatori, password, tema), tradotti in italiano e portati sui colori del tema.
- Crediti nel README e licenze in `THIRD_PARTY_NOTICES.md`.

### 5. «dobbiamo più contraddistinguere la generazione procedurale dell'interfaccia e la generazione totale»

- Il selettore a due voci è diventato due schede, ognuna con un disegno di tre schermate: tutte piene insieme, oppure la prima piena e le altre da generare.
- Il testo della casella cambia con il modo scelto.

### 6. «da dove partire magari sono i suggerimenti che potremmo fare a chips e il db non lo metterei così evidente»

- I suggerimenti sono chip sotto la casella; i dati una riga sommessa in fondo, con l'elenco completo nella barra laterale.

### 7. «commit e pusha in dev»

- Tre commit separati (sfera, Rare UI, schermata iniziale) su un nuovo ramo `dev`.

### 8. «Migliora l'applicazione, l'intento di questo esperimento è dare delle webapp generative (che si generano al momento del need) veloci e flessibili»

Una richiesta aperta. Dopo aver letto [Da fare](../../Sviluppo/Todo.md), [Limiti](../../Sviluppo/Limiti.md) e il ciclo di generazione, sono stati scelti tre interventi:

- **Modifiche a patch**: per una richiesta piccola il modello manda solo ciò che cambia, invece di riscrivere l'interfaccia. Vedi [Generazione](../../Architettura/Generazione.md).
- **Nuovi tentativi automatici** quando il fornitore è momentaneamente occupato.
- **Conversazione e schermata nell'indirizzo del browser**: ricaricare, avanti e indietro, preferiti. Vedi [Procedurale](../../Architettura/Procedurale.md).

Lungo la strada è emerso e corretto un difetto: modificando una schermata con parametri mentre si guardava un record, il valore di quel record poteva restare salvato nella schermata.

### 9. «cosa potremmo aggiungere e migliorare?»

La risposta, in breve: misurare la velocità con modelli veri, modifica diretta senza chat, azioni sulle righe. Le proposte sono in [Da fare](../../Sviluppo/Todo.md).

## Cosa si porta a casa

- Chiedere in poche parole funziona se chi esegue verifica: quasi ogni richiesta ha prodotto almeno una correzione nata da una prova, non dalla richiesta.
- Le scelte di prodotto (quali componenti, cosa fa il tocco sul pulsante) sono state chieste, non indovinate; le scelte tecniche sono state prese e poi dichiarate.
- Quello che non si è potuto provare è scritto, qui e nei limiti, invece di essere dato per buono.
