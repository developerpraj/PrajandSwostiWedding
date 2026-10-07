// Relation-targeted games + Bride vs Groom team leaderboard.
(async function () {
  const msg = document.getElementById('msg');
  let cfg;
  try { cfg = await App.boot(); } catch (e) { App.msg(msg, e.message, 'err'); return; }
  // Freeze/unfreeze while the page is open: simplest correct thing is a reload (state is server-side).
  document.addEventListener('app:freeze', () => location.reload());
  if (App.frozen(cfg)) {
    document.getElementById('games').innerHTML = '<div class="card paused-card"><div class="paused-ico" aria-hidden="true">🙏</div><p>' + App.esc(I18N.t('freeze.games')) + '</p>' +
      '<a class="btn ghost" href="' + App.withGuest('index.html') + '">' + App.esc(I18N.t('freeze.home')) + '</a></div>';
    return;
  }
  const gid = App.guestId();
  if (!gid) { App.msg(msg, I18N.t('common.invalidLink'), 'err'); return; }
  const d = await App.refreshHousehold();
  if (d && !d.guest.Registered) {
    App.msg(msg, I18N.t('game.registerFirst'), 'err');
    document.getElementById('games').innerHTML = '<a class="btn" href="' + App.withGuest('register.html') + '">' + App.esc(I18N.t('nav.register')) + '</a>';
    return;
  }
  App.profileSwitcher(document.getElementById('whoSwitch'));

  let state = null;
  const box = document.getElementById('games');

  async function load() {
    try { state = await API.call('getGames', App.who()); render(); }
    catch (e) { App.msg(msg, e.message, 'err'); }
  }

  function renderBoard(lb) {
    const t = lb.teams || { Bride: 0, Groom: 0 };
    const total = (t.Bride + t.Groom) || 1;
    document.getElementById('teams').innerHTML =
      '<div class="team-bar"><span class="bride" style="width:' + (t.Bride * 100 / total) + '%"></span><span class="groom" style="width:' + (t.Groom * 100 / total) + '%"></span></div>' +
      '<div class="row-between"><b>' + App.esc(I18N.t('side.Bride')) + ' · ' + t.Bride + '</b><b>' + t.Groom + ' · ' + App.esc(I18N.t('side.Groom')) + '</b></div>';
    document.getElementById('top').innerHTML = (lb.top || []).map(p =>
      '<li><span>' + App.esc(p.name) + ' <small class="muted">' + App.esc(p.side ? I18N.t('side.' + p.side) : '') + '</small></span><b>' + p.points + '</b></li>').join('');
  }

  function render() {
    renderBoard(state.leaderboard);
    if (!state.games.length) { box.innerHTML = '<p class="muted">' + App.esc(I18N.t('game.none')) + '</p>'; return; }
    box.innerHTML = state.games.map(g => {
      const q = I18N.bi(g.questionEn, g.questionNe || g.questionEn);
      const head = '<div class="game card"><div class="row-between"><b>' + App.esc(I18N.bi(g.titleEn, g.titleNe || g.titleEn)) + '</b><span class="pill">+' + g.points + ' ' + App.esc(I18N.t('game.points')) + '</span></div><p>' + App.esc(q) + '</p>';
      if (g.type === 'screenshot' || g.type === 'photo') {
        if (g.proof) return head + '<div class="msg ' + (g.proof === 'Approved' ? 'ok' : '') + '">' + App.esc(I18N.t(g.proof === 'Approved' ? 'proof.approved' : 'proof.pending')) + '</div></div>';
        return head + '<p class="muted">' + App.esc(I18N.t('proof.howto')) + '</p><label class="btn block">📸 ' + App.esc(I18N.t('proof.upload')) +
          '<input type="file" accept="image/*" hidden data-proof="' + App.esc(g.gameId) + '"></label><progress max="100" value="0" hidden></progress></div>';
      }
      const opts = g.optionsEn.map((o, i) => {
        let cls = 'opt';
        if (g.answered && i === g.answer) cls += ' right';
        return '<button type="button" class="' + cls + '" data-game="' + App.esc(g.gameId) + '" data-i="' + i + '"' + (g.answered ? ' disabled' : '') + '>' +
          App.esc(I18N.bi(o, g.optionsNe[i] || o)) + '</button>';
      }).join('');
      const status = g.answered ? '<div class="msg ' + (g.correct ? 'ok' : 'err') + '">' + App.esc(I18N.t(g.correct ? 'game.correct' : 'game.wrong')) + '</div>' : '';
      return '<div class="game card"><div class="row-between"><b>' + App.esc(I18N.bi(g.titleEn, g.titleNe || g.titleEn)) + '</b><span class="pill">+' + g.points + ' ' + App.esc(I18N.t('game.points')) + '</span></div>' +
        '<p>' + App.esc(q) + '</p><div class="opts">' + opts + '</div>' + status + '</div>';
    }).join('');
  }

  box.onclick = async e => {
    const b = e.target.closest('button[data-game]');
    if (!b) return;
    box.querySelectorAll('button[data-game="' + b.dataset.game + '"]').forEach(x => x.disabled = true);
    b.classList.add('picked');
    App.msg(msg, '\u2713 ' + I18N.t('game.submitted'), 'ok');
    try {
      const r = await API.call('submitAnswer', Object.assign(App.who(), { gameId: b.dataset.game, choice: Number(b.dataset.i) }));
      if (navigator.vibrate) navigator.vibrate(r.correct ? 60 : [30, 40, 30]);
      App.msg(msg, I18N.t(r.correct ? 'game.correct' : 'game.wrong'), r.correct ? 'ok' : 'err');
      await load();
    } catch (err) { App.msg(msg, err.message, 'err'); load(); }
  };

  box.addEventListener('change', async e => {
    const input = e.target.closest('input[data-proof]');
    if (!input || !input.files[0]) return;
    const card = input.closest('.game');
    const bar = card.querySelector('progress');
    bar.hidden = false;
    try {
      const up = await App.uploadFile(input.files[0], { eventId: '' }, p => bar.value = p);
      await API.call('submitProof', Object.assign(App.who(), { gameId: input.dataset.proof, mediaId: up.media.id }));
      App.msg(msg, I18N.t('proof.pending'), 'ok');
      load();
    } catch (err) { App.msg(msg, err.message, 'err'); bar.hidden = true; }
  });

  document.addEventListener('langchange', () => state && render());
  document.addEventListener('memberchange', load);
  load();
  setInterval(() => { if (!document.hidden) load(); }, 45000);
})();
