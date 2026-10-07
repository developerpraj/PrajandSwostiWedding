// Admin-only Brahma Bibaha planner: vibe engineering, traditions, scenarios, venues.
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => App.esc(s);
  const yes = v => v === true || String(v).toUpperCase() === 'TRUE';
  const msg = (t, type) => App.msg($('msg'), t, type);
  let data = null, venues = [];

  async function call(action, d) {
    try { return await API.call(action, d); }
    catch (e) {
      if (e.message === 'unauthorized') { sessionStorage.removeItem('adminKey'); location.reload(); }
      msg(e.message, 'err'); throw e;
    }
  }

  // Generic editable table: cols = [{k, t:'text'|'num'|'sel'|'chk'|'area', o:[...], w}], computed = [{h, f(row)}]
  function table(el, rows, keyCol, cols, computed, saveAction, delAction) {
    $(el).innerHTML = '<tr>' + cols.map(c => '<th>' + esc(c.h || c.k) + '</th>').join('') + (computed || []).map(c => '<th>' + esc(c.h) + '</th>').join('') + '<th></th></tr>' +
      rows.map(r => '<tr data-id="' + esc(r[keyCol] || '') + '">' + cols.map(c => {
        const v = r[c.k] == null ? '' : r[c.k];
        let i;
        if (c.t === 'chk') i = '<input type="checkbox" data-k="' + c.k + '"' + (yes(v) ? ' checked' : '') + '>';
        else if (c.t === 'sel') i = '<select data-k="' + c.k + '"><option></option>' + c.o.map(o => '<option' + (String(o) === String(v) ? ' selected' : '') + '>' + esc(o) + '</option>').join('') + '</select>';
        else if (c.t === 'area') i = '<textarea data-k="' + c.k + '" rows="2" style="min-width:' + (c.w || 180) + 'px">' + esc(v) + '</textarea>';
        else i = '<input data-k="' + c.k + '"' + (c.t === 'num' ? ' type="number" step="any"' : '') + ' value="' + esc(v) + '" style="width:' + (c.w || 110) + 'px">';
        return '<td>' + i + '</td>';
      }).join('') + (computed || []).map(c => '<td class="score">' + esc(c.f(r)) + '</td>').join('') +
        '<td><button class="btn ghost sm" data-del>✕</button></td></tr>').join('');
    const t = $(el);
    t.onchange = async e => {
      const tr = e.target.closest('tr[data-id]');
      if (!tr) return;
      const row = {}; row[keyCol] = tr.dataset.id;
      tr.querySelectorAll('[data-k]').forEach(x => row[x.dataset.k] = x.type === 'checkbox' ? x.checked : x.value);
      const saved = await call(saveAction, row);
      tr.dataset.id = saved[keyCol];
      load();
    };
    t.onclick = async e => {
      if (!e.target.closest('[data-del]')) return;
      const tr = e.target.closest('tr[data-id]');
      if (tr.dataset.id && confirm('Delete this row?')) await call(delAction, { id: tr.dataset.id });
      load();
    };
  }

  function render() {
    const d = data;
    const sideNames = Object.keys(d.sides);
    $('kpis').innerHTML = [
      [d.totals.people, 'People planned'],
      [d.totals.vibePerPerson, 'Vibe per person (/5)'],
      [d.totals.traditionBoost, 'Tradition boost'],
      [d.totals.forecast + '/10', 'Vibe forecast']
    ].concat(sideNames.map(k => [d.sides[k].confirmed + ' / ' + d.sides[k].people, k + ' confirmed']))
      .map(x => '<div class="card kpi"><div class="n">' + esc(x[0]) + '</div><div class="l">' + esc(x[1]) + '</div></div>').join('');
    $('forecastBar').style.width = (d.totals.forecast * 10) + '%';
    $('forecastTxt').textContent = d.totals.forecast >= 8 ? '🔥 Electric' : d.totals.forecast >= 6 ? '😊 Warm & lively' : d.totals.forecast >= 4 ? '🙂 Pleasant — add energy' : '😐 Needs engineering';
    $('tips').innerHTML = (d.tips.length ? d.tips : ['Looks balanced. Keep seating mixed and put high-fun people near the dance floor.']).map(t => '<li>' + esc(t) + '</li>').join('');

    $('sides').innerHTML = sideNames.map(k => {
      const s = d.sides[k];
      return '<div class="card"><h3>' + esc(k) + '</h3><table>' +
        '<tr><td>People (confirmed / unconfirmed)</td><td><b>' + s.confirmed + ' / ' + s.unconfirmed + '</b></td></tr>' +
        '<tr><td>Avg fun</td><td><b>' + s.funAvg + '</b> / 5</td></tr>' +
        '<tr><td>Avg age energy</td><td><b>' + s.ageAvg + '</b> / 5</td></tr>' +
        '<tr><td>Avg Edu/Prof responsibility</td><td><b>' + s.eprAvg + '</b> / 9</td></tr>' +
        '<tr><td>Vibe per person</td><td><b>' + s.vibeAvg + '</b> / 5</td></tr>' +
        '<tr><td>Good / Okay / Boring vibe</td><td>' + s.funMix.good + ' / ' + s.funMix.okay + ' / ' + s.funMix.boring + '</td></tr>' +
        '<tr><td>Best / Average / Okay EPR</td><td>' + s.eprMix.Best + ' / ' + s.eprMix.Average + ' / ' + s.eprMix.Okay + '</td></tr>' +
        '<tr><td>Circles</td><td>' + Object.keys(s.circles).map(c => esc(c) + ': ' + s.circles[c]).join(', ') + '</td></tr></table></div>';
    }).join('');

    const sf = $('sideFilter'), cur = sf.value;
    const allSides = ['Bride', 'Groom'].concat(sideNames.filter(x => x !== 'Bride' && x !== 'Groom'));
    sf.innerHTML = '<option value="">All sides</option>' + allSides.map(s => '<option' + (s === cur ? ' selected' : '') + '>' + esc(s) + '</option>').join('');
    const people = d.people.filter(p => !sf.value || p.Side === sf.value);
    table('people', people, 'PersonId', [
      { k: 'Label', h: 'Nickname', w: 120 }, { k: 'Side', t: 'sel', o: allSides }, { k: 'Circle', h: 'Circle (core/family/friends…)', w: 110 },
      { k: 'Attendance', h: 'Count', t: 'num', w: 55 }, { k: 'AgeBand', h: 'Age', t: 'sel', o: ['A', 'B', 'C', 'D', 'E', 'F'] },
      { k: 'EduProf', h: 'Edu/Prof', w: 60 }, { k: 'Fun', t: 'sel', o: ['A', 'B', 'C', 'D', 'E', 'F'] },
      { k: 'Confirmed', t: 'chk' }, { k: 'Notes', w: 140 }
    ], [{ h: 'Age', f: r => r.age }, { h: 'EPR', f: r => r.epr }, { h: 'Fun', f: r => r.fun }, { h: 'Vibe', f: r => r.vibe }],
      'admin.saveVibe', 'admin.deleteVibe');

    table('trads', d.traditions, 'TraditionId', [
      { k: 'Include', t: 'chk' }, { k: 'Name', w: 160 }, { k: 'Origin', w: 100 }, { k: 'Description', t: 'area', w: 220 },
      { k: 'OurVersion', h: 'Our version', t: 'area', w: 200 },
      { k: 'Phase', t: 'sel', o: ['Pre-wedding', 'Janti', 'Ceremony', 'Reception', 'Post-wedding'] },
      { k: 'VibeBoost', h: 'Boost', t: 'num', w: 50 }, { k: 'Owner', w: 90 }
    ], null, 'admin.saveTradition', 'admin.deleteTradition');

    table('scens', d.scenarios, 'ScenarioId', [
      { k: 'Chosen', t: 'chk' }, { k: 'Name', w: 170 }, { k: 'Region', w: 120 }, { k: 'Window', h: 'Dates', w: 110 },
      { k: 'Weeks', t: 'num', w: 50 }, { k: 'Condition', w: 160 }, { k: 'Budget', t: 'num', w: 80 }, { k: 'Currency', w: 50 },
      { k: 'Pros', t: 'area', w: 150 }, { k: 'Cons', t: 'area', w: 150 }
    ], [{ h: 'Per person', f: r => d.totals.people ? Math.round((Number(r.Budget) || 0) / d.totals.people) : '—' }],
      'admin.saveScenario', 'admin.deleteScenario');

    table('venues', venues, 'VenueId', [
      { k: 'Selectable', t: 'chk' }, { k: 'NameEn', h: 'Name', w: 140 }, { k: 'NameNe', h: 'नाम', w: 120 }, { k: 'Address', w: 200 },
      { k: 'Country', w: 80 }, { k: 'Lat', w: 70 }, { k: 'Lng', w: 70 }, { k: 'MapLink', h: 'Map link', w: 160 }, { k: 'Notes', w: 140 },
      { k: 'Order', t: 'num', w: 50 }
    ], [{ h: 'Test', f: () => '🧭' }], 'admin.saveVenue', 'admin.deleteVenue');
  }

  async function load() {
    const r = await Promise.all([call('admin.planner'), call('admin.venues')]);
    data = r[0]; venues = r[1];
    render();
  }

  function addRow(el, keyCol, extra) {
    const blank = Object.assign({}, extra || {}); blank[keyCol] = '';
    if (el === 'people') data.people.push(blank);
    else if (el === 'trads') data.traditions.push(blank);
    else if (el === 'scens') data.scenarios.push(blank);
    else venues.push(blank);
    render();
    const rows = $(el).querySelectorAll('tr[data-id]');
    const first = rows[rows.length - 1].querySelector('input:not([type=checkbox]),textarea');
    if (first) first.focus();
  }

  $('addPerson').onclick = () => addRow('people', 'PersonId', { Side: $('sideFilter').value, Attendance: 1 });
  $('addTrad').onclick = () => addRow('trads', 'TraditionId');
  $('addScen').onclick = () => addRow('scens', 'ScenarioId', { Currency: 'USD' });
  $('addVenue').onclick = () => addRow('venues', 'VenueId', { Selectable: 'TRUE' });
  $('sideFilter').onchange = render;
  $('venues').addEventListener('click', e => {
    const td = e.target.closest('td.score');
    if (!td) return;
    const tr = td.closest('tr');
    const get = k => (tr.querySelector('[data-k="' + k + '"]') || {}).value || '';
    const link = get('MapLink') || App.mapsUrl(get('Lat') && get('Lng') ? get('Lat') + ',' + get('Lng') : get('Address') || get('NameEn'));
    window.open(link, '_blank', 'noopener');
  });

  $('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    sessionStorage.setItem('adminKey', e.target.key.value);
    try { await API.call('admin.login'); start(); } catch (err) { sessionStorage.removeItem('adminKey'); msg('Invalid passcode', 'err'); }
  });
  $('logout').onclick = e => { e.preventDefault(); sessionStorage.removeItem('adminKey'); location.href = 'index.html'; };

  function start() { $('loginForm').hidden = true; $('app').hidden = false; load(); }

  if (sessionStorage.getItem('adminKey')) API.call('admin.login').then(start).catch(() => { $('loginForm').hidden = false; });
  else $('loginForm').hidden = false;
})();
