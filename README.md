# Mail Silentsystem

Il composer delle mail Silentsystem. Quattro tipi di messaggio: l'offerta che accompagna il preventivo, la procedura di reso guasti, il ritiro del noleggio e il promemoria per la cauzione. Compili i campi, controlli l'anteprima e ottieni il messaggio pronto: testo, HTML formattato o direttamente nel programma di posta.

Niente backend, niente dipendenze, niente build: file statici che girano anche offline.

## Cosa fa

- **Quattro mail**: Offerta (noleggio o acquisto), Reso guasti, Ritiro noleggio e Cauzione. Il selettore «Tipo di mail» cambia campi, oggetto e corpo.
- **Tipo di offerta**: Noleggio o Acquisto. L'oggetto diventa `PREVENTIVO NOLEGGIO SILENTSYSTEM` oppure `PREVENTIVO ACQUISTO SILENTSYSTEM`.
- **Cuffie e trasmettitore abbinati**: nel menu dei trasmettitori ci sono solo i modelli compatibili con le cuffie scelte.
- **Raggio automatico**: la distanza si compila da sola in base al trasmettitore (500 m per il TX-350 CH3, 300 m per il TX-330, 100 m per il TX-450 e il TX-100 POR) e resta correggibile.
- **Saluto personalizzato**: con il nome del cliente la mail parte con «Salve Mario Rossi,» (offerta), «Gentile Mario Rossi,» (reso) o «Buongiorno/Buonasera Mario Rossi,» (ritiro e cauzione).
- **Origine della richiesta**: email, modulo del sito, telefonata, WhatsApp o cliente che torna. Cambia solo la prima frase.
- **Reso guasti**: testo, indirizzo del magazzino e pulsante arancione «RESO GUASTI» verso il form, senza barra di citazione.
- **Ritiro noleggio**: numero offerta che finisce nell'oggetto «Ritiro Noleggio Cuffie - OFFERTA …», corriere DHL o consegna al DHL Service Point (lo stesso del ritiro o uno specifico, con link al locator e orari personalizzabili), data e fascia DHL, numero di colli (singolare/plurale automatico), indirizzo di consegna o alternativo in grassetto, pulsante «CAUZIONE». Il saluto diventa «Buonasera» dopo le 18 e il venerdì chiude con «buon weekend».
- **Cauzione**: promemoria per chi non ha compilato il form della restituzione, con numero offerta nell'oggetto e nel testo e pulsante «CAUZIONE».
- **Oggetto** modificabile, con copia dedicata.
- **Anteprima**, **testo** e **codice HTML** affiancati.
- **Copia testo**, **Copia HTML formattato** (incolli in Gmail, Outlook o Apple Mail e grassetti e link restano) e **Copia codice HTML**.
- **Apri in Mail**: copia l'HTML formattato e apre il messaggio con l'oggetto.
- **Bozza salvata** nel browser, nome per la firma compreso.

## Come si usa

1. Apri `index.html` (doppio clic) oppure la pagina pubblicata.
2. Scegli il tipo di mail: Offerta, Reso guasti, Ritiro noleggio o Cauzione.
3. Per l'offerta: scegli noleggio o acquisto, la provenienza e, se lo hai, il nome del cliente; poi cuffie e trasmettitore. Il raggio si compila da solo.
4. Per il reso: basta il nome del cliente, se lo hai. Testo e pulsante sono già pronti.
5. Per il ritiro: inserisci il numero offerta (va nell'oggetto), scegli corriere DHL o service point, poi data e fascia, numero di colli, indirizzo (stesso o alternativo) e orari del service point. Saluto e weekend si calcolano dall'ora e dal giorno.
6. Per la cauzione: inserisci il numero offerta. Il resto è già scritto.
7. Scrivi il tuo nome: compare dopo i saluti in tutte le mail. Controlla oggetto e anteprima.
8. Copia il messaggio o aprilo nel programma di posta. Per l'offerta allega il PDF del preventivo; per il ritiro allega le etichette DHL.

## Accesso

All'apertura la pagina chiede una password:

```
cataldobaglio2012
```

L'accesso resta valido per la sessione del browser (ricaricando non la richiede). Il pulsante **Blocca** in alto a destra esce e riporta al login.

**Attenzione:** è una protezione lato browser. Ferma chi apre il link senza password, ma non chi legge il codice sorgente: i file sono pubblici su GitHub Pages. Per una protezione reale serve Cloudflare Access, Netlify/Vercel con password, o un backend. Non mettere dati riservati dentro il tool.

La password non è scritta in chiaro in `app.js`: c'è solo l'hash SHA-256. Serve HTTPS per il controllo (GitHub Pages va bene). Per cambiarla:

```bash
printf 'nuovapassword' | shasum -a 256
```

e aggiorna `AUTH_HASH` in `assets/app.js`.

Resta un deterrente, non una sicurezza: con un repository pubblico chiunque può leggere il codice e aggirare il login. Non usarlo per dati riservati.

## Pubblicazione su GitHub Pages

I file devono stare nella **root** del repository, con `index.html` in primo livello.

```bash
cd mail-offerta
git init
git add .
git commit -m "Mail Silentsystem: offerta, reso e ritiro"
git branch -M main
git remote add origin https://github.com/UTENTE/mail-offerta.git
git push -u origin main
```

Poi, su GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main / (root) → Save**.

Dopo un minuto la pagina è su `https://UTENTE.github.io/mail-offerta/`.

## Struttura

```
mail-offerta/
├── index.html          # struttura della pagina
├── assets/
│   ├── styles.css      # stile, responsive
│   ├── templates.js    # modelli, portate e testi della mail
│   ├── app.js          # interfaccia, copia, mailto, bozza
│   └── img/
│       └── silentsystem.png
└── README.md
```

**Per cambiare le frasi o i modelli** basta `assets/templates.js`:

- `CUFFIE` elenca ogni modello con i trasmettitori compatibili, nell'ordine in cui compaiono nel menu.
- `RAGGI` contiene la portata dichiarata in metri. Un modello assente da questo elenco non mostra distanza.
- `ORIGINI` contiene la prima frase per ogni provenienza della richiesta.
- `SUBJECT_NOLEGGIO` e `SUBJECT_ACQUISTO` sono i due oggetti dell'offerta; `SUBJECT_RESO` è quello del reso, mentre `SUBJECT_RITIRO` e `SUBJECT_CAUZIONE` sono le basi degli oggetti di ritiro e cauzione, completate dal numero offerta.
- `RESO_URL` e `CAUZIONE_URL` sono i link dei pulsanti; `DHL_LOCATOR` è il locator dei service point.
- `SERA_DALLE` è l'ora da cui il saluto diventa «Buonasera».
- `buildReso` e `buildRitiro` contengono testo e HTML delle rispettive mail.

## Note

- «Apri in Mail» non può trasportare HTML via `mailto:`: il tool copia la versione formattata negli appunti e apre il messaggio con il solo oggetto. Incolla nel corpo con ⌘V (Ctrl+V su Windows) e grassetti e link arrivano. Se il browser non consente la copia, apre il messaggio con il testo semplice.
- Alcuni client troncano i `mailto:` oltre i 2000 caratteri circa. Il tool avvisa quando succede.
- La copia HTML usa gli appunti del browser: serve una pagina in HTTPS o su `localhost` (GitHub Pages va bene). Su `file://` il tool ripiega su un metodo alternativo.
- Nessun dato esce dal browser. La bozza sta in `localStorage`, quindi resta su quel computer e su quel browser.
