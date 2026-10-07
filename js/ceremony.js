// Pocket Pandit: guests follow the rituals; the one the admin marks "Now" flips to the top.
(async function () {
  const msg = document.getElementById('msg'), list = document.getElementById('rituals');
  let cfg, items = [], lastNow = '';
  try { cfg = await App.boot(); } catch (e) { App.msg(msg, e.message, 'err'); return; }
  if (!App.on(cfg, 'feature.rituals')) { App.msg(msg, I18N.t('common.error'), 'err'); return; }

  function render() {
    const rank = { now: 0, upcoming: 1, done: 2 };
    const sorted = items.slice().sort((a, b) => (rank[a.status] ?? 1) - (rank[b.status] ?? 1));
    const nextId = items.some(r => r.status === 'now') ? '' : (sorted.find(r => r.status !== 'done') || {}).id;
    list.innerHTML = sorted.map(r =>
      '<li class="rit-card ' + App.esc(r.status) + '"><span class="rit-ico">' + App.esc(r.icon || '✦') + '</span><div>' +
      (r.id === nextId && nextId ? '<span class="rit-badge next">' + App.esc(I18N.t('rit.next')) + '</span>' : '') +
      (r.status === 'now' ? '<span class="rit-badge">● ' + App.esc(I18N.t('rit.now')) + '</span>' : r.status === 'done' ? '<span class="rit-done">✓</span>' : '') +
      '<h3>' + I18N.biHtml(r.nameEn, r.nameNe) + '</h3><p>'
    ).join('') || '<p class="muted center">' + App.esc(I18N.t('rit.empty')) + '</p>';
  }
  async function load() {
    try {
      items = await API.call('getRituals', {});
      const now = (items.find(r => r.status === 'now') || {}).id || '';
      render();
      if (now && now !== lastNow && lastNow !== '' && navigator.vibrate) navigator.vibrate([40, 60, 40]);
      lastNow = now || lastNow || '-';
    } catch (e) { /* keep last view on weak signal */ }
  }
  document.addEventListener('langchange', render);
  await load();
  // live.json tells us when the admin taps "Now"; only then re-read the full list.
  let lastRitual = null;
  App.liveFeed(d => {
    if (d.fallback) { load(); return; }
    const id = (d.ritual && d.ritual.id) || '';
    if (lastRitual !== null && id !== lastRitual) load();
    lastRitual = id;
  });
  setInterval(() => { if (!document.hidden) load(); }, 120000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });
})();
