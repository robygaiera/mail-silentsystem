/* Mail offerta — interfaccia, copia negli appunti, apertura nel client di posta. */
(function () {
  'use strict';

  var O = window.OFFERTA;
  var KEY = 'mail-offerta-draft.v1';

  var state = {
    template: 'offerta',
    tipo: 'noleggio',
    origine: 'email',
    cuffie: 0,
    tx: '',
    raggio: '',
    cliente: '',
    nome: '',
    subjectOverride: '',
    ritiroData: '',
    ritiroFascia: 'pomeriggio',
    ritiroModo: 'corriere',
    offerta: '',
    colli: '1',
    indirizzoTipo: 'stesso',
    indirizzoAltro: '',
    serviceTipo: 'stesso',
    servicePoint: '',
  };

  var current = { subject: '', text: '', html: '' };
  var toastTimer = null;
  var previewTimer = null;
  var resizeRaf = null;

  function byId(id) {
    return document.getElementById(id);
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ---------- bozza ---------- */

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return false;
      var saved = JSON.parse(raw);
      if (!saved || typeof saved !== 'object') return false;
      state.origine = typeof saved.origine === 'string' ? saved.origine : state.origine;
      state.template =
        saved.template === 'reso' || saved.template === 'ritiro' || saved.template === 'cauzione'
          ? saved.template
          : 'offerta';
      state.tipo = saved.tipo === 'acquisto' ? 'acquisto' : 'noleggio';
      state.cuffie = typeof saved.cuffie === 'number' ? saved.cuffie : state.cuffie;
      state.tx = typeof saved.tx === 'string' ? saved.tx : '';
      state.raggio = typeof saved.raggio === 'string' ? saved.raggio : '';
      state.cliente = typeof saved.cliente === 'string' ? saved.cliente : '';
      state.nome = typeof saved.nome === 'string' ? saved.nome : '';
      state.subjectOverride = typeof saved.subjectOverride === 'string' ? saved.subjectOverride : '';
      state.ritiroData = typeof saved.ritiroData === 'string' ? saved.ritiroData : '';
      state.ritiroFascia = saved.ritiroFascia === 'mattina' ? 'mattina' : 'pomeriggio';
      state.ritiroModo = saved.ritiroModo === 'servicepoint' ? 'servicepoint' : 'corriere';
      /* Il numero offerta è di questa singola mail: non lo riprendiamo dalla bozza. */
      state.offerta = '';
      state.colli = typeof saved.colli === 'string' ? saved.colli : '1';
      state.indirizzoTipo = saved.indirizzoTipo === 'altro' ? 'altro' : 'stesso';
      state.indirizzoAltro = typeof saved.indirizzoAltro === 'string' ? saved.indirizzoAltro : '';
      state.serviceTipo = saved.serviceTipo === 'altro' ? 'altro' : 'stesso';
      state.servicePoint = typeof saved.servicePoint === 'string' ? saved.servicePoint : '';
      if (state.subjectOverride === 'Prego inviare riscontro di avvenuta ricezione') {
        state.subjectOverride = '';
      }
      return true;
    } catch (err) {
      return false;
    }
  }

  function save() {
    try {
      var draft = Object.assign({}, state);
      /* Il numero offerta non va nella bozza: ogni mail parte vuota. */
      draft.offerta = '';
      localStorage.setItem(KEY, JSON.stringify(draft));
    } catch (err) {
      /* storage pieno o disattivato: si continua comunque */
    }
  }

  /* ---------- tipo di mail ---------- */

  function updateRitiroFields() {
    var corriere = state.ritiroModo !== 'servicepoint';

    byId('ritiroDataField').hidden = !corriere;
    byId('ritiroFasciaField').hidden = !corriere;
    byId('indirizzoTipoField').hidden = !corriere;
    byId('indirizzoAltroField').hidden = !corriere || state.indirizzoTipo !== 'altro';
    byId('serviceTipoField').hidden = corriere;
    byId('servicePointField').hidden = corriere || state.serviceTipo !== 'altro';

    var buttons = document.querySelectorAll('[data-ritiro-modo]');
    Array.prototype.forEach.call(buttons, function (button) {
      button.setAttribute(
        'aria-pressed',
        String(button.getAttribute('data-ritiro-modo') === state.ritiroModo)
      );
    });

    byId('ritiroModoHelp').textContent = corriere
      ? 'DHL passa a ritirare all’indirizzo indicato.'
      : 'Il cliente porta il materiale al DHL Service Point.';
  }

  function applyTemplate() {
    var buttons = document.querySelectorAll('[data-template]');
    Array.prototype.forEach.call(buttons, function (button) {
      button.setAttribute('aria-pressed', String(button.getAttribute('data-template') === state.template));
    });

    var sections = document.querySelectorAll('[data-template-only]');
    Array.prototype.forEach.call(sections, function (section) {
      section.hidden = section.getAttribute('data-template-only') !== state.template;
    });

    var help = {
      offerta: 'Offerta di noleggio o acquisto con il preventivo in allegato.',
      reso: 'Istruzioni per il rientro dei prodotti guasti.',
      ritiro: 'Etichette DHL e istruzioni per il ritiro del noleggio.',
      cauzione: 'Istruzioni per compilare il form della cauzione.',
    };
    byId('templateHelp').textContent = help[state.template] || help.offerta;

    var clienteHelp = {
      offerta: 'Se lo compili, il saluto diventa «Salve Mario Rossi,».',
      reso: 'Se lo compili, il saluto diventa «Gentile Mario Rossi,».',
      ritiro:
        'Se lo compili, il saluto diventa «Buongiorno Mario Rossi,» o «Buonasera Mario Rossi,» a seconda dell’ora.',
      cauzione:
        'Se lo compili, il saluto diventa «Buongiorno Mario Rossi,» o «Buonasera Mario Rossi,» a seconda dell’ora.',
    };
    byId('clienteHelp').textContent = clienteHelp[state.template] || clienteHelp.offerta;

    var offertaVisibile = state.template === 'ritiro' || state.template === 'cauzione';
    byId('offertaField').hidden = !offertaVisibile;
    if (offertaVisibile) {
      byId('offertaHelp').textContent =
        state.template === 'ritiro'
          ? 'Finisce nell’oggetto, dopo OFFERTA.'
          : 'Compare nell’oggetto e nel testo della mail.';
    }

    updateRitiroFields();
  }

  /* ---------- tipo di offerta ---------- */

  function renderTipo() {
    var buttons = document.querySelectorAll('[data-tipo]');
    Array.prototype.forEach.call(buttons, function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.tipo === state.tipo));
    });
  }

  /* ---------- cuffie e trasmettitori ---------- */

  function currentCuffia() {
    return O.CUFFIE[state.cuffie] || O.CUFFIE[0];
  }

  function renderCuffie() {
    var select = byId('cuffie');
    select.innerHTML = O.CUFFIE.map(function (m, index) {
      return '<option value="' + index + '">' + esc(m.label) + '</option>';
    }).join('');
    select.value = String(state.cuffie);
  }

  function renderTx() {
    var cuffia = currentCuffia();
    if (cuffia.tx.indexOf(state.tx) === -1) state.tx = cuffia.tx[0];
    var select = byId('tx');
    select.innerHTML = cuffia.tx.map(function (name) {
      return '<option value="' + esc(name) + '">' + esc(name) + '</option>';
    }).join('');
    select.value = state.tx;
  }

  function setRangeFromTx() {
    var range = O.txRange(state.tx);
    state.raggio = range == null ? '' : String(range);
    byId('raggio').value = state.raggio;
    updateRangeHint();
  }

  function updateRangeHint() {
    var range = O.txRange(state.tx);
    byId('raggioHint').textContent = range != null
      ? 'Distanza dichiarata: ' + range + ' metri. Puoi correggerla.'
      : 'Per questo modello non c’è una distanza dichiarata: lascia vuoto o inseriscila se la conosci.';
  }

  /* ---------- risultato ---------- */

  function previewDoc(html) {
    return (
      '<!doctype html><html lang="it"><head><meta charset="utf-8">' +
      '<style>' +
      'html,body{margin:0}' +
      'body{padding:26px 26px 30px;background:#fff;' +
      'font-family:Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}' +
      'a{color:#0645ad}' +
      'strong{font-weight:700}' +
      '</style></head><body>' + html + '</body></html>'
    );
  }

  function resizePreview() {
    var frame = byId('preview');
    if (!frame || !frame.contentDocument) return;
    try {
      var height = Math.max(360, frame.contentDocument.documentElement.scrollHeight + 2);
      frame.style.height = height + 'px';
    } catch (err) {
      /* iframe non ancora pronto */
    }
  }

  function mailtoUrl(subject, text) {
    var body = text.replace(/\r?\n/g, '\r\n');
    return 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }

  function render() {
    var msg = O.build(state);
    var subject = String(state.subjectOverride || '').trim() || msg.subject;
    current = { subject: subject, text: msg.text, html: msg.html };

    byId('roTipo').textContent = state.tipo === 'acquisto' ? 'ACQUISTO' : 'NOLEGGIO';
    byId('roCuffie').textContent = currentCuffia().label;
    byId('roTx').textContent = state.tx;
    byId('roRaggio').textContent = state.raggio ? state.raggio + ' m' : '—';

    var subjectEl = byId('subject');
    if (document.activeElement !== subjectEl && subjectEl.value !== subject) {
      subjectEl.value = subject;
    }

    byId('plainOut').textContent = msg.text;
    byId('htmlOut').textContent = msg.html;

    clearTimeout(previewTimer);
    previewTimer = setTimeout(function () {
      byId('preview').setAttribute('srcdoc', previewDoc(msg.html));
    }, 100);

    var hint = byId('mailHint');
    hint.textContent =
      'Apri in Mail copia la mail formattata negli appunti e apre il messaggio con il solo oggetto, ' +
      'perché il corpo lo incolli tu: premi ' + incollaShortcut() + ' e grassetti e link restano.';
    hint.classList.remove('hint--warn');
  }

  function renderAll() {
    renderCuffie();
    renderTx();
    render();
  }

  /* ---------- appunti ---------- */

  function toast(message, bad, duration) {
    var el = byId('toast');
    el.textContent = message;
    el.classList.toggle('toast--bad', !!bad);
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove('is-on');
    }, duration || 2800);
  }

  function flash(button, label) {
    if (!button) return;
    if (!button.dataset.label) button.dataset.label = button.innerHTML;
    button.innerHTML = label;
    button.classList.add('is-done');
    clearTimeout(button._flashTimer);
    button._flashTimer = setTimeout(function () {
      button.innerHTML = button.dataset.label;
      button.classList.remove('is-done');
    }, 1600);
  }

  function legacyCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '0';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (err) {
      ok = false;
    }
    area.remove();
    return ok;
  }

  function copyPlain(text, button, okMessage) {
    var done = function () {
      toast(okMessage || 'Copiato negli appunti');
      if (button) flash(button, 'Copiato');
    };
    var fail = function () {
      toast('Copia non riuscita: seleziona il testo e copia a mano', true);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {
        if (legacyCopy(text)) done();
        else fail();
      });
    } else if (legacyCopy(text)) {
      done();
    } else {
      fail();
    }
  }

  function legacyCopyRich(html) {
    var holder = document.createElement('div');
    holder.innerHTML = html;
    holder.style.position = 'fixed';
    holder.style.top = '0';
    holder.style.left = '-9999px';
    holder.style.width = '600px';
    holder.style.background = '#fff';
    document.body.appendChild(holder);

    var range = document.createRange();
    range.selectNodeContents(holder);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    var ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (err) {
      ok = false;
    }
    selection.removeAllRanges();
    holder.remove();
    return ok;
  }

  function copyRich(html, text, button) {
    writeRichClipboard(html, text).then(function (ok) {
      if (ok) {
        toast('HTML formattato copiato: incollalo nel messaggio');
        if (button) flash(button, 'Copiato');
      } else {
        toast('Copia HTML non riuscita: usa «Copia codice HTML»', true);
      }
    });
  }

  function clipboardDocument(html) {
    return (
      '<!doctype html><html><head><meta charset="utf-8"></head><body>' +
      html +
      '</body></html>'
    );
  }

  function writeRichClipboard(html, text) {
    return new Promise(function (resolve) {
      if (navigator.clipboard && window.ClipboardItem) {
        var item = null;
        try {
          item = new ClipboardItem({
            'text/html': new Blob([clipboardDocument(html)], { type: 'text/html' }),
            'text/plain': new Blob([text], { type: 'text/plain' }),
          });
        } catch (err) {
          item = null;
        }
        if (item) {
          navigator.clipboard.write([item]).then(
            function () {
              resolve(true);
            },
            function () {
              resolve(legacyCopyRich(html));
            }
          );
          return;
        }
      }
      resolve(legacyCopyRich(html));
    });
  }

  function incollaShortcut() {
    var platform = navigator.platform || navigator.userAgent || '';
    return /Mac|iPhone|iPad|iPod/i.test(platform) ? '⌘V' : 'Ctrl+V';
  }

  /* mailto non trasporta HTML: copia la versione formattata e apre la mail
     con il solo oggetto, così basta un incolla nel corpo. */
  function openMail() {
    render();
    var shortcut = incollaShortcut();
    var aperto = false;

    function apri(formattato) {
      if (aperto) return;
      aperto = true;
      var body = formattato ? '' : current.text;
      window.location.href = mailtoUrl(current.subject, body);
      if (formattato) {
        toast('HTML formattato copiato: incolla nel corpo con ' + shortcut, false, 5000);
      } else {
        toast('Formattazione non copiata: incolla il testo e sistema a mano', true, 5000);
      }
    }

    writeRichClipboard(current.html, current.text).then(apri);
    setTimeout(function () {
      apri(false);
    }, 2500);
  }

  function handleCopy(kind, button) {
    if (kind === 'text') copyPlain(current.text, button, 'Testo copiato: incollalo nel messaggio');
    else if (kind === 'rich') copyRich(current.html, current.text, button);
    else if (kind === 'source') copyPlain(current.html, button, 'Codice HTML copiato');
  }

  /* ---------- schede ---------- */

  function setTab(name) {
    var tabs = document.querySelectorAll('.tab');
    Array.prototype.forEach.call(tabs, function (tab) {
      var on = tab.dataset.tab === name;
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-selected', String(on));
    });

    var panels = document.querySelectorAll('[data-panel]');
    Array.prototype.forEach.call(panels, function (panel) {
      panel.hidden = panel.dataset.panel !== name;
    });

    if (name === 'preview') {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(resizePreview);
    }
  }

  /* ---------- azzeramento ---------- */

  function resetAll() {
    var hasContent = state.cliente || state.nome || state.raggio || state.subjectOverride ||
      state.origine !== 'email' || state.cuffie !== 0 || state.tipo !== 'noleggio' ||
      state.template !== 'offerta' || state.ritiroData || state.colli !== '1' ||
      state.ritiroModo !== 'corriere' || state.offerta || state.indirizzoTipo !== 'stesso' ||
      state.indirizzoAltro || state.serviceTipo !== 'stesso' || state.servicePoint;
    if (hasContent && !window.confirm('Azzerare i campi e ricominciare da zero?')) return;

    state = {
      template: 'offerta',
      tipo: 'noleggio',
      origine: 'email',
      cuffie: 0,
      tx: '',
      raggio: '',
      cliente: '',
      nome: '',
      subjectOverride: '',
      ritiroData: '',
      ritiroFascia: 'pomeriggio',
      ritiroModo: 'corriere',
      offerta: '',
      colli: '1',
      indirizzoTipo: 'stesso',
      indirizzoAltro: '',
      serviceTipo: 'stesso',
      servicePoint: '',
    };

    try {
      localStorage.removeItem(KEY);
    } catch (err) {
      /* niente da fare */
    }

    byId('origine').value = 'email';
    byId('cliente').value = '';
    byId('nome').value = '';
    byId('subject').value = '';
    byId('ritiroData').value = '';
    byId('ritiroFascia').value = 'pomeriggio';
    byId('offerta').value = '';
    byId('colli').value = '1';
    byId('indirizzoTipo').value = 'stesso';
    byId('indirizzoAltro').value = '';
    byId('serviceTipo').value = 'stesso';
    byId('servicePoint').value = '';

    applyTemplate();
    renderTipo();
    renderCuffie();
    renderTx();
    setRangeFromTx();
    render();
    toast('Tutto azzerato');
  }

  /* ---------- eventi ---------- */

  document.addEventListener('click', function (event) {
    var tab = event.target.closest('[data-tab]');
    if (tab) {
      setTab(tab.dataset.tab);
      return;
    }

    var template = event.target.closest('[data-template]');
    if (template) {
      var templateValue = template.getAttribute('data-template');
      var nextTemplate =
        templateValue === 'reso' || templateValue === 'ritiro' || templateValue === 'cauzione'
          ? templateValue
          : 'offerta';
      if (nextTemplate !== state.template) {
        state.template = nextTemplate;
        state.subjectOverride = '';
        save();
        applyTemplate();
        render();
      }
      return;
    }

    var tipo = event.target.closest('[data-tipo]');
    if (tipo) {
      state.tipo = tipo.dataset.tipo === 'acquisto' ? 'acquisto' : 'noleggio';
      state.subjectOverride = '';
      save();
      renderTipo();
      render();
      return;
    }

    var ritiroModo = event.target.closest('[data-ritiro-modo]');
    if (ritiroModo) {
      state.ritiroModo =
        ritiroModo.getAttribute('data-ritiro-modo') === 'servicepoint' ? 'servicepoint' : 'corriere';
      save();
      updateRitiroFields();
      render();
      return;
    }

    var copy = event.target.closest('[data-copy]');
    if (copy) {
      render();
      handleCopy(copy.dataset.copy, copy);
      return;
    }

    if (event.target.closest('#openMail')) {
      openMail();
      return;
    }

    if (event.target.closest('#copySubject')) {
      render();
      copyPlain(current.subject, null, 'Oggetto copiato');
      return;
    }

    if (event.target.closest('#reset')) {
      resetAll();
    }
  });

  document.addEventListener('input', function (event) {
    var target = event.target;

    if (target.id === 'subject') {
      state.subjectOverride = target.value;
      save();
      render();
      return;
    }

    if (target.id === 'cliente') {
      state.cliente = target.value;
      save();
      render();
      return;
    }

    if (target.id === 'nome') {
      state.nome = target.value;
      save();
      render();
      return;
    }

    if (target.id === 'raggio') {
      state.raggio = target.value;
      save();
      render();
      return;
    }

    if (target.id === 'ritiroData') {
      state.ritiroData = target.value;
      save();
      render();
      return;
    }

    if (target.id === 'colli') {
      state.colli = target.value;
      save();
      render();
      return;
    }

    if (target.id === 'offerta') {
      state.offerta = target.value;
      state.subjectOverride = '';
      save();
      render();
      return;
    }

    if (target.id === 'indirizzoAltro') {
      state.indirizzoAltro = target.value;
      save();
      render();
      return;
    }

    if (target.id === 'servicePoint') {
      state.servicePoint = target.value;
      save();
      render();
    }
  });

  document.addEventListener('change', function (event) {
    var target = event.target;

    if (target.id === 'origine') {
      state.origine = target.value;
      save();
      render();
      return;
    }

    if (target.id === 'cuffie') {
      state.cuffie = Number(target.value) || 0;
      state.tx = currentCuffia().tx[0];
      renderTx();
      setRangeFromTx();
      save();
      render();
      return;
    }

    if (target.id === 'tx') {
      state.tx = target.value;
      setRangeFromTx();
      save();
      render();
      return;
    }

    if (target.id === 'ritiroFascia') {
      state.ritiroFascia = target.value === 'mattina' ? 'mattina' : 'pomeriggio';
      save();
      render();
      return;
    }

    if (target.id === 'indirizzoTipo') {
      state.indirizzoTipo = target.value === 'altro' ? 'altro' : 'stesso';
      updateRitiroFields();
      save();
      render();
      return;
    }

    if (target.id === 'serviceTipo') {
      state.serviceTipo = target.value === 'altro' ? 'altro' : 'stesso';
      updateRitiroFields();
      save();
      render();
      return;
    }
  });

  document.addEventListener('focusout', function (event) {
    if (event.target.id === 'subject' && !event.target.value.trim()) {
      state.subjectOverride = '';
      event.target.value = current.subject;
      save();
    }
  });

  byId('preview').addEventListener('load', resizePreview);

  window.addEventListener('resize', function () {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(resizePreview);
  });

  /* ---------- accesso ---------- */
  /* Password lato browser: ferma chi apre il link senza credenziali,
     non chi legge il codice. Per una protezione reale serve un proxy/backend. */
  var AUTH_KEY = 'mail-silentsystem-auth';
  var AUTH_HASH = '3185bc437cb3eda96fedf3338009d800fe05d9a5a284c59f2fc3300ff1fa5d91';

  function sha256Hex(text) {
    if (!window.crypto || !window.crypto.subtle) return Promise.reject(new Error('no-crypto'));
    var data = new TextEncoder().encode(text);
    return window.crypto.subtle.digest('SHA-256', data).then(function (buffer) {
      return Array.prototype.map
        .call(new Uint8Array(buffer), function (byte) {
          return byte.toString(16).padStart(2, '0');
        })
        .join('');
    });
  }

  function gateUnlock() {
    document.body.classList.remove('is-locked');
    byId('gate').hidden = true;
    byId('gateError').hidden = true;
  }

  function gateLock() {
    document.body.classList.add('is-locked');
    byId('gate').hidden = false;
    byId('gatePassword').value = '';
    byId('gateError').hidden = true;
    byId('gatePassword').focus();
  }

  function gateReject() {
    var error = byId('gateError');
    error.textContent = 'Password non corretta.';
    error.hidden = false;
    byId('gatePassword').select();
  }

  function tryPassword(value) {
    sha256Hex(value).then(
      function (hash) {
        if (hash === AUTH_HASH) {
          try {
            sessionStorage.setItem(AUTH_KEY, '1');
          } catch (err) {
            /* storage disattivato: l'accesso vale per la pagina */
          }
          gateUnlock();
        } else {
          gateReject();
        }
      },
      function () {
        /* Web Crypto serve HTTPS: su GitHub Pages c'è. */
        var error = byId('gateError');
        error.textContent = 'Accesso non disponibile: apri la pagina in HTTPS.';
        error.hidden = false;
      }
    );
  }

  byId('gateForm').addEventListener('submit', function (event) {
    event.preventDefault();
    tryPassword(byId('gatePassword').value);
  });

  byId('lock').addEventListener('click', function () {
    try {
      sessionStorage.removeItem(AUTH_KEY);
    } catch (err) {
      /* niente */
    }
    location.reload();
  });

  var giaAutenticato = false;
  try {
    giaAutenticato = sessionStorage.getItem(AUTH_KEY) === '1';
  } catch (err) {
    giaAutenticato = false;
  }

  if (giaAutenticato) gateUnlock();
  else gateLock();

  /* ---------- avvio ---------- */

  var hadDraft = load();

  if (!O.ORIGINI[state.origine]) state.origine = 'email';
  if (state.template !== 'reso' && state.template !== 'ritiro' && state.template !== 'cauzione') {
    state.template = 'offerta';
  }
  if (state.tipo !== 'acquisto') state.tipo = 'noleggio';
  if (!Number.isInteger(state.cuffie) || state.cuffie < 0 || state.cuffie >= O.CUFFIE.length) {
    state.cuffie = 0;
  }

  byId('origine').value = state.origine;
  byId('cliente').value = state.cliente;
  byId('nome').value = state.nome;
  byId('ritiroData').value = state.ritiroData;
  byId('ritiroFascia').value = state.ritiroFascia;
  byId('offerta').value = state.offerta;
  byId('colli').value = state.colli;
  byId('indirizzoTipo').value = state.indirizzoTipo;
  byId('indirizzoAltro').value = state.indirizzoAltro;
  byId('serviceTipo').value = state.serviceTipo;
  byId('servicePoint').value = state.servicePoint;

  applyTemplate();
  renderTipo();
  renderAll();

  if (hadDraft) {
    byId('raggio').value = state.raggio;
    updateRangeHint();
  } else {
    setRangeFromTx();
  }

  render();
})();
