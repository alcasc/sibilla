---
tags: [guida]
---

# Uso

## Una conversazione

Dalla schermata iniziale scrivi cosa ti serve: «una dashboard degli ordini con l'andamento mensile», «un'app per tracciare le spese del team». Puoi dettare, allegare immagini, PDF o testi, incollare uno screenshot da riprodurre. Sotto la casella ci sono alcuni **suggerimenti** pronti, costruiti sulle tue tabelle: un clic e partono.

- Un account nuovo parte con una **conversazione demo**, «Vault Markdown»: un'app fatta davvero con Sibilla, con la chat che l'ha costruita e i suoi dati di esempio. È una copia tua: puoi usarla, modificarla o eliminarla.
- La conversazione **si salva da sola** al primo messaggio e compare nella barra laterale.
- Ogni interfaccia generata è una **nuova versione**: dal menu delle versioni torni a una precedente e la ripristini.
- Se fai solo una **domanda sui dati** («quanti clienti abbiamo a Milano?») Sibilla risponde a parole, senza toccare l'interfaccia.
- Durante la generazione vedi cosa sta facendo e l'interfaccia che prende forma; il pulsante di invio diventa **Ferma**.
- Le **piccole modifiche sono veloci**: se chiedi di cambiare un titolo, aggiungere una colonna o passare al tema scuro, Sibilla riscrive solo quel pezzo, non tutta l'interfaccia.
- Se il modello è momentaneamente occupato, Sibilla **riprova da sola** un paio di volte prima di mostrarti un errore.
- L'**indirizzo del browser** segue quello che guardi (`/c/12/clienti/7`): puoi ricaricare la pagina, usare avanti e indietro, salvare un punto preciso nei preferiti.
- Sotto ogni risposta ci sono i **token usati e una stima del costo**.

## Due modi di costruire

Sotto la casella di scrittura due schede, ognuna con un disegno di cosa succede:

- **Tutta insieme**: Sibilla costruisce l'app completa in una volta. Più attesa all'inizio, poi è tutta pronta.
- **Passo per passo**: costruisce solo la prima schermata, con link verso le altre. Ogni schermata viene generata la prima volta che ci entri, e poi resta. Parti subito. Vedi [Procedurale](../Architettura/Procedurale.md).

## Modello, impegno, ragionamento

L'**impegno** (quanto lavora il modello su una richiesta) si sceglie messaggio per messaggio con il pulsante di invio: un tocco, o Invio, manda la richiesta all'impegno più basso; **tenendo premuto** il pulsante si riempie e sale di livello (Medio, Alto, … fino a dove arriva il modello scelto), e al rilascio parte. Esc annulla. Più impegno: risultati più curati, ma più tempo e costo. Le richieste che non passano dalla casella (suggerimenti, link, «chiedi di correggere») usano l'impegno medio.

Il pulsante con il nome del modello apre le impostazioni:

- **Modello**: raggruppati per fornitore; quelli di un fornitore non collegato sono disattivati.
- **Mostra il ragionamento**: fa comparire il riassunto del ragionamento sopra la risposta.
- **Accesso ai modelli**: dove si incollano le chiavi API.

## Viste e mini app

- Una **vista** lavora su tabelle che esistono già.
- Una **mini app** ha anche dati propri: quando chiedi qualcosa che il database non copre, Sibilla crea le collezioni che servono e le riempie con qualche esempio. Dal pulsante **Dati** nella barra del titolo le vedi, esporti (JSON, CSV), importi e svuoti.

## Database

In fondo alla barra laterale c'è l'elenco delle tabelle con il numero di record; la schermata iniziale le riassume in una riga, e cliccando un nome chiedi una vista su quella tabella.

- Clicca una tabella per aprirla: aggiungi, modifica ed elimina righe, aggiungi colonne, esporta in CSV, elimina la tabella.
- Il **+** apre il modulo per una nuova tabella.
- Puoi chiederlo a parole, da lì o da qualsiasi conversazione: «crea una tabella fornitori con nome, email e città e inserisci dieci esempi». Dalla chat Sibilla può creare tabelle e inserire righe, non modificare o eliminare quelle esistenti.

## Organizzare e condividere

- **Barra laterale**: le conversazioni sono divise in Mini app, Viste e Domande; con più di sei compare la ricerca. Dalla barra del titolo puoi **fissare** una conversazione in alto, **archiviarla** o **eliminarla** (il cestino si apre in conferma e annulla, senza finestre).
- **Condividi**: crea un link pubblico che apre solo l'app, a tutta pagina e senza account. Chi lo ha può usarne i dati; spegnendolo smette di funzionare.
- **Tema**: chiaro, scuro o quello del dispositivo, dalle tre miniature in fondo alla barra laterale.
