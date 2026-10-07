(async function () {
  const msg = document.getElementById('msg');
  try { await App.boot(); } catch (e) { App.msg(msg, e.message, 'err'); return; }

  const id = App.guestId();
  if (!id) { App.msg(msg, I18N.t('common.invalidLink'), 'err'); return; }

  let p;
  try { p = await API.call('getPass', { guestId: id }); App.savePassSnapshot(p); }
  catch (e) {
    const snap = App.passSnapshot();
    if (snap && snap.guestId === id) p = snap;
    else { App.msg(msg, I18N.t('common.invalidLink'), 'err'); return; }
  }

  if (!p.registered) {
    msg.innerHTML = App.esc(I18N.t('pass.notRegistered')) + ' <a href="' + App.withGuest('register.html') + '">' + App.esc(I18N.t('nav.register')) + '</a>';
    msg.className = 'msg err';
    msg.hidden = false;
    return;
  }

  App.setSide(p.side);
  App.qr(document.getElementById('pQr'), id, 6);

  function render() {
    document.getElementById('pName').textContent = I18N.bi(p.name, p.nameNe);
    const side = document.getElementById('pSide');
    side.textContent = I18N.t('side.' + (p.side || 'Both'));
    side.className = 'side-tag ' + (p.side || 'Both');
    document.getElementById('pRelation').textContent = I18N.bi(p.relation, p.relationNe);
    document.getElementById('pPeople').textContent = p.attendingCount;
    document.getElementById('pTableRow').hidden = !p.table;
    document.getElementById('pTable').textContent = p.table || '';
    document.getElementById('pRoomRow').hidden = !p.room && !p.accommodationStatus;
    document.getElementById('pRoom').textContent = p.room
      ? p.room.name + ' · ' + (p.room.location || '') + ' (' + String(p.room.checkIn).slice(0, 10) + ' → ' + String(p.room.checkOut).slice(0, 10) + ')'
      : (p.accommodationStatus || '');
    const bandRow = document.getElementById('pBandRow');
    bandRow.hidden = !p.band;
    if (p.band) {
      const b = document.getElementById('pBand');
      b.className = 'band ' + p.band;
      b.textContent = I18N.t('band.' + p.band);
    }
  }
  render();
  document.addEventListener('langchange', render);
  document.getElementById('pass').hidden = false;

  // Family passes: one QR per remembered relative.
  const fam = (p.members || []).filter(m => !m.isPrimary && m.attending);
  if (fam.length) {
    const sec = document.createElement('section');
    sec.className = 'card';
    document.getElementById('pass').after(sec);
    const renderFam = () => {
      sec.innerHTML = '<h2>' + App.esc(I18N.t('fam.title')) + '</h2><div class="hub">' + fam.map(m =>
        '<div class="card center"><div class="qr" data-qr="' + App.esc(id + ':' + m.memberId) + '"></div>' +
        '<b>' + App.esc(I18N.bi(m.name, m.nameNe || m.name)) + '</b><div><span class="side-tag ' + App.esc(m.side || 'Both') + '">' +
        App.esc(I18N.t('side.' + (m.side || 'Both'))) + '</span> ' + App.esc(I18N.bi(m.relation || '', m.relationNe || m.relation || '')) + '</div>' +
        (m.band ? '<div class="band ' + App.esc(m.band) + '">' + App.esc(I18N.t('band.' + m.band)) + '</div>' : '') + '</div>').join('') + '</div>';
      sec.querySelectorAll('[data-qr]').forEach(el => App.qr(el, el.dataset.qr, 4));
    };
    renderFam();
    document.addEventListener('langchange', renderFam);
  }
  App.refreshHousehold();
})();
