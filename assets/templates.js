/* Mail offerta Silentsystem — modelli, testi e composizione del messaggio.
   La configurazione di cuffie e trasmettitori sta qui: modificarla non richiede
   di toccare l'interfaccia. */
window.OFFERTA = (function () {
  'use strict';

  /* Oggetto: dipende dal tipo di offerta. */
  var SUBJECT_NOLEGGIO = 'PREVENTIVO NOLEGGIO SILENTSYSTEM';
  var SUBJECT_ACQUISTO = 'PREVENTIVO ACQUISTO SILENTSYSTEM';
  var SUBJECT_RESO = 'PROCEDURA DI RESO GUASTI';
  var SUBJECT_RITIRO = 'Ritiro Noleggio Cuffie - OFFERTA';
  var SUBJECT_CAUZIONE = 'Restituzione cauzione - OFFERTA';
  var BANNER = 'Prego inviare riscontro di avvenuta ricezione';
  var LINK_VIDEO = 'https://silentsystem.it/video-eventi/';
  var LINK_FOTO = 'https://silentsystem.it/foto-eventi/';
  var RESO_URL = 'https://silentsystem.it/reso-guasti/';
  var CAUZIONE_URL = 'https://silentsystem.it/cauzioni/';
  var DHL_LOCATOR = 'https://mydhl.express.dhl/it/it/locator.html#/find-locations';
  var EMAIL_FONT = 'Helvetica, Arial, sans-serif';
  var EMAIL_SIZE = '14px';
  /* Da che ora si passa da «Buongiorno» a «Buonasera». */
  var SERA_DALLE = 18;

  function subjectFor(tipo) {
    return tipo === 'acquisto' ? SUBJECT_ACQUISTO : SUBJECT_NOLEGGIO;
  }

  /* Da dove arriva la richiesta: cambia solo la prima frase. */
  var ORIGINI = {
    email:
      'facendo seguito alla comunicazione ricevuta invio in allegato la nostra migliore offerta per i servizi richiesti.',
    form:
      'facendo seguito alla richiesta inviata tramite il modulo del nostro sito, invio in allegato la nostra migliore offerta per i servizi richiesti.',
    telefono:
      'facendo seguito alla telefonata intercorsa, invio in allegato la nostra migliore offerta per i servizi richiesti.',
    whatsapp:
      'facendo seguito ai messaggi scambiati su WhatsApp, invio in allegato la nostra migliore offerta per i servizi richiesti.',
    cliente:
      'grazie per averci scelto di nuovo. Facendo seguito alla Sua richiesta, invio in allegato la nostra migliore offerta per i servizi richiesti.',
  };

  /* Ogni cuffia ha solo i trasmettitori compatibili. Il primo è quello proposto. */
  var CUFFIE = [
    {
      label: 'SX 839 V2 HiFi ®',
      tx: ['TX-350 CH3', 'TX-150 POR', 'TX-330 MOBI CH3', 'TX-450 MOBI CH3', 'TX-400 MOBI CH3'],
    },
    { label: 'SX 839 V2 CH10', tx: ['TX-700-CH10', 'TX-700-CH10 XLR', 'TX-330 MOBI CH10'] },
    { label: 'SX 839 V2 CH60', tx: ['TX-700 CH60 500 MHz', 'TX-700 CH60 600 MHz'] },
    { label: 'SX-553 Evo HiFi', tx: ['TX-350 CH5', 'TX-350 CH5 BT', 'TX-400 MOBI CH5'] },
    { label: 'SX-809 PRG', tx: ['TX-600 45CH'] },
    { label: 'SX-707', tx: ['TX-330 MOBI CH3', 'TX-300 MOBI'] },
    { label: 'SX-808', tx: ['TX-500', 'TX-300 MOBI', 'TX-100 POR'] },
    { label: 'SX-858', tx: ['TX-300 fisso 10CH', 'TX-300 MOBI 10CH'] },
    { label: 'SX-610', tx: ['TX-300 fisso 10CH', 'TX-300 MOBI 10CH'] },
    { label: 'SX 809 V3', tx: ['TX-500', 'TX-300 MOBI'] },
  ];

  /* Portata dichiarata, in metri. null = non dichiarata. */
  var RAGGI = {
    'TX-350 CH3': 500,
    'TX-100 POR': 100,
    'TX-330 MOBI CH3': 300,
    'TX-330 MOBI CH3 per Hylis': 300,
    'TX-330 MOBI CH10': 300,
    'TX-450 MOBI CH3': 100,
  };

  function txRange(name) {
    return Object.prototype.hasOwnProperty.call(RAGGI, name) ? RAGGI[name] : null;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* Pulsante arancione condiviso dalle mail di reso e di ritiro. */
  function buttonHtml(label, url) {
    return (
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 14px;">' +
      '<tr><td bgcolor="#FF7200" style="background-color:#FF7200;border-radius:4px;padding:10px 18px;">' +
      '<a href="' +
      url +
      '" target="_blank" rel="noopener" style="color:#ffffff;font-family:' +
      EMAIL_FONT +
      ';font-size:13px;font-weight:bold;line-height:1.2;text-decoration:none;display:inline-block;letter-spacing:0.02em;">' +
      esc(label) +
      '</a>' +
      '</td></tr></table>'
    );
  }

  function toDate(iso) {
    if (!iso) return null;
    var date = new Date(iso + 'T12:00:00');
    return isNaN(date.getTime()) ? null : date;
  }

  function dateLong(iso) {
    var date = toDate(iso);
    if (!date) return '';
    return new Intl.DateTimeFormat('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date);
  }

  function greetingFor(hour) {
    return hour < SERA_DALLE ? 'Buongiorno' : 'Buonasera';
  }

  function buildOfferta(state) {
    var cuffia = CUFFIE[state.cuffie] || CUFFIE[0];
    var tx = state.tx || cuffia.tx[0];
    var raggio = String(state.raggio || '').trim();
    var cliente = String(state.cliente || '').trim();
    var nome = String(state.nome || '').trim();
    var origine = ORIGINI[state.origine] || ORIGINI.email;
    var subject = String(state.subjectOverride || '').trim() || subjectFor(state.tipo);
    var saluto = cliente ? 'Salve ' + cliente + ',' : 'Salve,';

    var testo = [
      BANNER,
      '',
      saluto,
      '',
      origine,
      '',
      'L’attrezzatura arriverà carica, igienizzata, e pronta per l’uso. I nostri processi di igienizzazione delle cuffie sono certificati dal CSI di Bollate.',
      '',
      'Colgo l’occasione per ricordare che il modello di cuffie messo a disposizione è l’' +
        cuffia.label +
        ', mentre il trasmettitore è il ' +
        tx +
        (raggio ? ', ' + raggio + ' metri di raggio d’azione' : '') +
        '.',
      '',
      'Attendo Sue',
      '',
      'Cordiali Saluti',
      '',
      nome || '[Nome]',
      '',
      'Video Eventi · ' + LINK_VIDEO,
      'Foto Eventi · ' + LINK_FOTO,
    ].join('\n');

    var P = '<p style="margin:0 0 12px;">';
    var html =
      '<div style="font-family:' +
      EMAIL_FONT +
      ';font-size:' +
      EMAIL_SIZE +
      ';line-height:1.5;color:#000000;">' +
      '<p style="margin:0 0 12px;text-align:center;color:#FF2600;font-weight:bold;"><b>' +
      esc(BANNER) +
      '</b></p>' +
      P +
      esc(saluto) +
      '</p>' +
      P +
      esc(origine) +
      '</p>' +
      P +
      'L’attrezzatura arriverà <b>carica, igienizzata, e pronta per l’uso</b>. I nostri <b>processi di igienizzazione</b> delle cuffie sono <b><u>certificati dal CSI di Bollate.</u></b></p>' +
      P +
      'Colgo l’occasione per ricordare che il modello di cuffie messo a disposizione è l’<b>' +
      esc(cuffia.label) +
      '</b>, mentre il trasmettitore è il <b>' +
      esc(tx) +
      '</b>' +
      (raggio ? ', <b>' + esc(raggio) + ' metri di raggio d’azione</b>' : '') +
      '.</p>' +
      P +
      'Attendo Sue</p>' +
      P +
      'Cordiali Saluti</p>' +
      P +
      esc(nome || '[Nome]') +
      '<br><br><a href="' +
      LINK_VIDEO +
      '" style="color:#0645AD;text-decoration:underline">Video Eventi</a>' +
      '<br><a href="' +
      LINK_FOTO +
      '" style="color:#0645AD;text-decoration:underline">Foto Eventi</a></p>' +
      '</div>';

    return { subject: subject, text: testo, html: html };
  }

  function buildReso(state) {
    var cliente = String(state.cliente || '').trim();
    var nome = String(state.nome || '').trim();
    var saluto = cliente ? 'Gentile ' + cliente + ',' : 'Gentile cliente,';
    var subject = String(state.subjectOverride || '').trim() || SUBJECT_RESO;

    var testo = [
      saluto,
      '',
      'per avviare la procedura di reso dei prodotti che presentano guasti o malfunzionamenti elettrici e/o elettronici, clicchi sul pulsante sottostante e acceda al form dedicato.',
      '',
      'RESO GUASTI: ' + RESO_URL,
      '',
      'Una volta completata la procedura di reso, potrà spedire i prodotti guasti al nostro magazzino di Milano con spedizione tracciata.',
      '',
      'LEM International S.r.l.',
      'Via Monviso, 5A',
      '20008 Bareggio, Milano',
      'Tel. 02 87168124',
      '',
      'Ricordiamo di rimandare i prodotti per la verifica nello stesso stato in cui sono stati consegnati. I prodotti con riparazioni e/o modifiche (come ad esempio la sostituzione delle batterie, l’applicazione di adesivi, la sostituzione delle antenne, il cambio dei pulsanti, ecc.) effettuate autonomamente non saranno controllati.',
      '',
      'Cordiali saluti',
      '',
      nome || '[Nome]',
    ].join('\n');

    var P = '<p style="margin:0 0 12px;">';
    var html =
      '<div style="font-family:' +
      EMAIL_FONT +
      ';font-size:' +
      EMAIL_SIZE +
      ';line-height:1.5;color:#181c32;max-width:600px;">' +
      P +
      esc(saluto) +
      '</p>' +
      P +
      'per avviare la procedura di reso dei prodotti che presentano guasti o malfunzionamenti elettrici e/o elettronici, clicchi sul pulsante sottostante e acceda al form dedicato.</p>' +
      buttonHtml('RESO GUASTI', RESO_URL) +
      P +
      'Una volta completata la procedura di reso, potrà spedire i prodotti guasti al nostro magazzino di Milano con spedizione tracciata.</p>' +
      '<div style="margin:0 0 12px;"><strong>LEM International S.r.l.</strong><br>' +
      '<strong>Via Monviso, 5A</strong><br>' +
      '<strong>20008 Bareggio, Milano</strong><br>' +
      '<strong>Tel. 02 87168124</strong></div>' +
      P +
      'Ricordiamo di rimandare i prodotti per la verifica nello stesso stato in cui sono stati consegnati. I prodotti con riparazioni e/o modifiche (come ad esempio la sostituzione delle batterie, l’applicazione di adesivi, la sostituzione delle antenne, il cambio dei pulsanti, ecc.) effettuate autonomamente non saranno controllati.</p>' +
      P +
      'Cordiali saluti</p>' +
      P +
      esc(nome || '[Nome]') +
      '</p>' +
      '</div>';

    return { subject: subject, text: testo, html: html };
  }

  function buildRitiro(state) {
    var cliente = String(state.cliente || '').trim();
    var nome = String(state.nome || '').trim();
    var now = new Date();
    var saluto = greetingFor(now.getHours()) + (cliente ? ' ' + cliente : '') + ',';

    var colli = parseInt(state.colli, 10);
    if (!colli || colli < 1) colli = 1;
    var plurale = colli > 1;
    var collo = plurale ? 'i colli' : 'il collo';
    var modo = state.ritiroModo === 'servicepoint' ? 'servicepoint' : 'corriere';
    var serviceTipo = state.serviceTipo === 'altro' ? 'altro' : 'stesso';
    var servicePoint = String(state.servicePoint || '').trim();
    var serviceOrari = String(state.serviceOrari || '').trim();
    var orariTesto = serviceOrari ? ' (orari: ' + serviceOrari + ')' : '';
    var orariHtml = serviceOrari ? ' (orari: ' + esc(serviceOrari) + ')' : '';

    var etichette = plurale
      ? 'allego qui le etichette di ritiro delle cuffie, da far stampare e attaccare sui colli chiusi.'
      : 'allego qui l’etichetta di ritiro delle cuffie, da far stampare e attaccare sul collo chiuso.';

    var dataRitiro = dateLong(state.ritiroData);
    var fascia = state.ritiroFascia === 'mattina' ? '10:00 e le 13:00' : '14:00 e le 17:30';
    var quando = (dataRitiro ? dataRitiro + ' ' : '') + 'tra le ' + fascia;

    var indirizzoTipo = state.indirizzoTipo === 'altro' ? 'altro' : 'stesso';
    var indirizzo = String(state.indirizzoAltro || '').trim();
    var righeIndirizzo =
      indirizzoTipo === 'altro' && indirizzo
        ? indirizzo
            .split('\n')
            .map(function (line) {
              return line.trim();
            })
            .filter(Boolean)
        : [];

    var dove;
    if (righeIndirizzo.length) {
      dove = 'presso il seguente indirizzo:';
    } else if (indirizzoTipo === 'altro') {
      dove = 'presso l’indirizzo che ci ha indicato.';
    } else {
      dove = 'presso lo stesso indirizzo di consegna.';
    }

    var chiusura = now.getDay() === 5 ? 'Cordiali saluti e buon weekend,' : 'Cordiali saluti,';
    var offerta = String(state.offerta || '').trim();
    var subject =
      String(state.subjectOverride || '').trim() ||
      SUBJECT_RITIRO + (offerta ? ' ' + offerta : '');

    var testo = [saluto, '', etichette, ''];
    if (modo === 'servicepoint') {
      if (serviceTipo === 'altro') {
        testo.push(
          'Può riportare ' +
            collo +
            ' presso il seguente DHL Service Point: ' +
            (servicePoint || '[service point]') +
            orariTesto +
            '.'
        );
        testo.push('');
        testo.push(
          'In alternativa può scegliere un altro DHL Service Point a questo link: ' + DHL_LOCATOR
        );
      } else {
        testo.push(
          'Può riportare ' +
            collo +
            ' presso lo stesso DHL Service Point dove l’ha ritirato' +
            orariTesto +
            '.'
        );
      }
    } else {
      testo.push('Un corriere DHL passerà ' + quando + ' ' + dove);
      if (righeIndirizzo.length) {
        testo.push('');
        Array.prototype.push.apply(testo, righeIndirizzo);
      }
    }
    testo = testo.concat([
      '',
      'Chiedo gentilmente di dare conferma di ricezione della presente mail.',
      '',
      'Qualora aveste versato una cauzione, questo è il modulo da compilare per la restituzione:',
      'CAUZIONE: ' + CAUZIONE_URL,
      '',
      chiusura,
      '',
      nome || '[Nome]',
    ]);

    var P = '<p style="margin:0 0 12px;">';
    var html =
      '<div style="font-family:' +
      EMAIL_FONT +
      ';font-size:' +
      EMAIL_SIZE +
      ';line-height:1.5;color:#181c32;max-width:600px;">' +
      P +
      esc(saluto) +
      '</p>' +
      P +
      esc(etichette) +
      '</p>';

    if (modo === 'servicepoint') {
      if (serviceTipo === 'altro') {
        html +=
          P +
          'Può riportare ' +
          collo +
          ' presso il seguente DHL Service Point: ' +
          esc(servicePoint || '[service point]') +
          orariHtml +
          '.</p>';
        html +=
          P +
          'In alternativa può scegliere un altro DHL Service Point a questo link: <a href="' +
          DHL_LOCATOR +
          '" style="color:#0645AD;text-decoration:underline">DHL Service Point</a></p>';
      } else {
        html +=
          P +
          'Può riportare ' +
          collo +
          ' presso lo stesso DHL Service Point dove l’ha ritirato' +
          orariHtml +
          '.</p>';
      }
    } else {
      html +=
        P +
        'Un corriere DHL passerà <b>' +
        esc(quando) +
        '</b> ' +
        esc(dove) +
        '</p>';

      if (righeIndirizzo.length) {
        html +=
          '<div style="margin:0 0 12px;">' +
          righeIndirizzo
            .map(function (line) {
              return '<strong>' + esc(line) + '</strong>';
            })
            .join('<br>') +
          '</div>';
      }
    }

    html +=
      P +
      '<i><u>Chiedo gentilmente di dare conferma di ricezione della presente mail.</u></i></p>' +
      P +
      'Qualora aveste versato una cauzione, questo è il modulo da compilare per la restituzione:</p>' +
      buttonHtml('CAUZIONE', CAUZIONE_URL) +
      P +
      esc(chiusura) +
      '</p>' +
      P +
      esc(nome || '[Nome]') +
      '</p>' +
      '</div>';

    return { subject: subject, text: testo.join('\n'), html: html };
  }

  function buildCauzione(state) {
    var cliente = String(state.cliente || '').trim();
    var nome = String(state.nome || '').trim();
    var offerta = String(state.offerta || '').trim();
    var now = new Date();
    var saluto = greetingFor(now.getHours()) + (cliente ? ' ' + cliente : '') + ',';
    var subject =
      String(state.subjectOverride || '').trim() ||
      SUBJECT_CAUZIONE + (offerta ? ' ' + offerta : '');

    var testo = [saluto, ''];
    testo.push(
      'Ho fatto una verifica rapida e non mi risulta che abbiate compilato il form per la restituzione della cauzione accessibile qui:'
    );
    testo.push('CAUZIONE: ' + CAUZIONE_URL);
    testo.push('');
    testo.push('Le ricordo l’offerta di riferimento:' + (offerta ? ' ' + offerta + '.' : ''));
    testo.push('');
    testo.push(
      'Cortesemente, a compilazione avvenuta ci avvisa?'
    );
    testo.push('');
    testo.push('Grazie mille');
    testo.push('');
    testo.push('Cordiali saluti');
    testo.push('');
    testo.push(nome || '[Nome]');

    var P = '<p style="margin:0 0 12px;">';
    var html =
      '<div style="font-family:' +
      EMAIL_FONT +
      ';font-size:' +
      EMAIL_SIZE +
      ';line-height:1.5;color:#181c32;max-width:600px;">' +
      P +
      esc(saluto) +
      '</p>';

    html +=
      P +
      'Ho fatto una verifica rapida e non mi risulta che abbiate compilato il form per la restituzione della cauzione accessibile qui:</p>' +
      buttonHtml('CAUZIONE', CAUZIONE_URL) +
      P +
      'Le ricordo l’offerta di riferimento:' +
      (offerta ? ' ' + esc(offerta) + '.' : '') +
      '</p>' +
      P +
      'Cortesemente, a compilazione avvenuta ci avvisa?</p>' +
      P +
      'Grazie mille</p>' +
      P +
      'Cordiali saluti</p>' +
      P +
      esc(nome || '[Nome]') +
      '</p>' +
      '</div>';

    return { subject: subject, text: testo.join('\n'), html: html };
  }

  function build(state) {
    if (state.template === 'reso') return buildReso(state);
    if (state.template === 'ritiro') return buildRitiro(state);
    if (state.template === 'cauzione') return buildCauzione(state);
    return buildOfferta(state);
  }

  return {
    subjectFor: subjectFor,
    CUFFIE: CUFFIE,
    ORIGINI: ORIGINI,
    LINK_VIDEO: LINK_VIDEO,
    LINK_FOTO: LINK_FOTO,
    txRange: txRange,
    build: build,
  };
})();
