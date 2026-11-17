/* 氣學苑 QiAcademy — 互動式中醫教學 App（純前端，PWA） */
const $ = (s, r = document) => r.querySelector(s);
const app = $('#app');

/* ---------- 儲存 ---------- */
const DB = {
  get() { try { return JSON.parse(localStorage.getItem('qiacademy') || '{}'); } catch { return {}; } },
  set(v) { try { localStorage.setItem('qiacademy', JSON.stringify(v)); } catch {} },
  patch(fn) { const d = this.get(); fn(d); this.set(d); return d; }
};
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a, n) => shuffle(a).slice(0, n);

/* ---------- 路由 ---------- */
const routes = {
  home: renderHome, theory: renderTheory, herbs: renderHerbs, points: renderPoints,
  formulas: renderFormulas, learn: renderLearn, cards: renderCards, quiz: renderQuiz, body: renderBody
};
const NAV = [['home', '首頁', '🏠'], ['learn', '學習', '📖'], ['cards', '閃卡', '🃏'], ['quiz', '測驗', '✅'], ['body', '體質', '🧘']];
const NAVGROUP = { theory: 'learn', herbs: 'learn', points: 'learn', formulas: 'learn' };

function route() {
  const name = (location.hash.replace('#/', '') || 'home').split('?')[0];
  const fn = routes[name] || renderHome;
  const active = NAVGROUP[name] || name;
  document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === active));
  app.innerHTML = '';
  fn();
  window.scrollTo(0, 0);
}
function buildNav() {
  $('#nav').innerHTML = NAV.map(([k, t, i]) => `<a data-nav="${k}" href="#/${k}"><span class="ic">${i}</span><span>${t}</span></a>`).join('');
}

/* ---------- 首頁 ---------- */
function renderHome() {
  const d = DB.get();
  const known = Object.keys(d.known || {}).length;
  const total = HERBS.length + POINTS.length;
  app.innerHTML = `
    <section class="hero"><h1>氣學苑 <small>QiAcademy</small></h1>
      <p>互動式中醫入門：中藥、穴位、方劑、陰陽五行，邊學邊測。</p></section>
    <div class="stats">
      <div class="stat"><b>${known}/${total}</b><span>已掌握閃卡</span></div>
      <div class="stat"><b>${d.quizBest ?? '—'}</b><span>測驗最高分</span></div>
      <div class="stat"><b>${d.quizCount || 0}</b><span>測驗次數</span></div>
    </div>
    <h2>開始學習</h2>
    <div class="grid">
      ${tile('theory', '☯️', '基礎理論', '陰陽、八綱、四診、五行互動圖')}
      ${tile('herbs', '🌿', '中藥圖鑑', HERBS.length + ' 味常用中藥：性味歸經功效')}
      ${tile('points', '📍', '經絡穴位', POINTS.length + ' 個常用穴位與定位')}
      ${tile('formulas', '⚗️', '經典方劑', FORMULAS.length + ' 首名方與組成')}
      ${tile('cards', '🃏', '翻牌記憶', '記住的卡片會被記錄')}
      ${tile('quiz', '✅', '隨堂測驗', '每回 10 題，自動出題')}
      ${tile('body', '🧘', '體質測試', '九種體質自我檢測與養生建議')}
    </div>
    ${d.constitution ? `<p class="muted">上次體質結果：<b>${d.constitution}</b></p>` : ''}
    <p class="disc">⚠️ 本 App 僅供中醫學習與文化推廣，內容不能取代專業醫師診斷與治療。</p>`;
}
const tile = (r, i, t, s) => `<a class="tile" href="#/${r}"><span class="ti">${i}</span><b>${t}</b><small>${s}</small></a>`;
function renderLearn() {
  app.innerHTML = `<h1>學習</h1><div class="grid">
    ${tile('theory', '☯️', '基礎理論', '陰陽、八綱、四診、五行')}
    ${tile('herbs', '🌿', '中藥圖鑑', '性味歸經功效')}
    ${tile('points', '📍', '經絡穴位', '穴位定位與主治')}
    ${tile('formulas', '⚗️', '經典方劑', '組成與主治')}</div>`;
}

/* ---------- 基礎理論 + 五行互動 ---------- */
function renderTheory() {
  app.innerHTML = `<h1>基礎理論</h1>
    <h2>五行互動圖</h2>
    <p class="muted">點選任一行，查看相生、相剋與對應事物。</p>
    <div class="wx"><svg id="wxsvg" viewBox="0 0 300 300" role="img" aria-label="五行相生相剋圖"></svg>
      <div id="wxinfo" class="card"></div></div>
    <div class="legend"><span><i class="l g"></i>相生</span><span><i class="l r"></i>相剋</span></div>
    <h2>五行對應表</h2>
    <div class="scroll"><table><thead><tr><th>五行</th><th>五臟</th><th>六腑</th><th>五味</th><th>五色</th><th>五季</th><th>情志</th><th>五官</th><th>五體</th></tr></thead>
    <tbody>${ELEMENTS.map(e => `<tr><td><b>${e.k}</b></td><td>${e.organ}</td><td>${e.fu}</td><td>${e.taste}</td><td>${e.color}</td><td>${e.season}</td><td>${e.emo}</td><td>${e.orifice}</td><td>${e.tissue}</td></tr>`).join('')}</tbody></table></div>
    <h2>核心概念</h2>
    ${THEORY.map(t => `<details class="card"><summary>${t.t}</summary><p>${t.b}</p></details>`).join('')}
    <h2>陰陽小遊戲</h2><div id="yy"></div>`;
  drawWx(0); yinyang();
}
function drawWx(sel) {
  const cx = 150, cy = 150, R = 105;
  const pos = ELEMENTS.map((_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; });
  const col = ['#3f9b5b', '#d9534f', '#c9a227', '#8a94a6', '#2f6fb0'];
  const next = i => (i + 1) % 5, ke = i => (i + 2) % 5;
  let lines = '';
  ELEMENTS.forEach((_, i) => {
    const a = pos[i], b = pos[next(i)], c = pos[ke(i)];
    const hi = i === sel;
    lines += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" class="g ${hi ? 'hi' : ''}" marker-end="url(#ag)"/>`;
    lines += `<line x1="${a[0]}" y1="${a[1]}" x2="${c[0]}" y2="${c[1]}" class="r ${hi ? 'hi' : ''}" marker-end="url(#ar)"/>`;
  });
  const nodes = ELEMENTS.map((e, i) => `<g class="n ${i === sel ? 'sel' : ''}" data-i="${i}" tabindex="0" role="button" aria-label="${e.k}">
    <circle cx="${pos[i][0]}" cy="${pos[i][1]}" r="26" fill="${col[i]}"/><text x="${pos[i][0]}" y="${pos[i][1] + 7}" text-anchor="middle">${e.k}</text></g>`).join('');
  $('#wxsvg').innerHTML = `<defs>
    <marker id="ag" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#3f9b5b"/></marker>
    <marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#d9534f"/></marker></defs>${lines}${nodes}`;
  const e = ELEMENTS[sel], N = ELEMENTS;
  $('#wxinfo').innerHTML = `<h3>${e.k}（${e.dir}）</h3>
    <p>🟢 ${e.k}生${N[next(sel)].k}　🟢 ${N[(sel + 4) % 5].k}生${e.k}</p>
    <p>🔴 ${e.k}剋${N[ke(sel)].k}　🔴 ${N[(sel + 3) % 5].k}剋${e.k}</p>
    <p>臟：<b>${e.organ}</b>（腑：${e.fu}）｜味：${e.taste}｜色：${e.color}｜季：${e.season}｜志：${e.emo}｜竅：${e.orifice}｜體：${e.tissue}</p>`;
  document.querySelectorAll('#wxsvg .n').forEach(n => {
    const go = () => drawWx(+n.dataset.i);
    n.onclick = go; n.onkeydown = ev => { if (ev.key === 'Enter' || ev.key === ' ') go(); };
  });
}
function yinyang() {
  const pairs = [['寒', '陰'], ['熱', '陽'], ['靜', '陰'], ['動', '陽'], ['下', '陰'], ['上', '陽'], ['內', '陰'], ['外', '陽'], ['夜晚', '陰'], ['白天', '陽'], ['水', '陰'], ['火', '陽'], ['女', '陰'], ['男', '陽'], ['物質', '陰'], ['功能', '陽']];
  let items = pick(pairs, 6), i = 0, score = 0;
  const box = $('#yy');
  const show = () => {
    if (i >= items.length) { box.innerHTML = `<div class="card"><p>完成！得分 <b>${score}/${items.length}</b></p><button class="btn" id="yr">再玩一次</button></div>`; $('#yr').onclick = () => { items = pick(pairs, 6); i = 0; score = 0; show(); }; return; }
    box.innerHTML = `<div class="card center"><p class="muted">${i + 1}/${items.length} 屬於陰還是陽？</p><div class="big">${items[i][0]}</div>
      <div class="row"><button class="btn yin" data-a="陰">陰 ☾</button><button class="btn yang" data-a="陽">陽 ☀</button></div><p id="yf" class="fb"></p></div>`;
    box.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
      const ok = b.dataset.a === items[i][1]; if (ok) score++;
      $('#yf').textContent = ok ? '✔ 正確' : `✘ 應為「${items[i][1]}」`; $('#yf').className = 'fb ' + (ok ? 'ok' : 'no');
      box.querySelectorAll('button').forEach(x => x.disabled = true);
      setTimeout(() => { i++; show(); }, 800);
    });
  };
  show();
}

/* ---------- 列表型頁面（中藥 / 穴位 / 方劑） ---------- */
function listPage(title, items, cats, card, searchKeys) {
  let q = '', cat = '全部';
  app.innerHTML = `<h1>${title}</h1>
    <input id="q" class="search" type="search" placeholder="搜尋…" aria-label="搜尋">
    <div class="chips" id="chips">${['全部', ...cats].map(c => `<button class="chip ${c === '全部' ? 'on' : ''}" data-c="${c}">${c}</button>`).join('')}</div>
    <div id="list"></div>`;
  const draw = () => {
    const r = items.filter(x => (cat === '全部' || x.cat === cat || x.mer === cat) && (!q || searchKeys.some(k => String(x[k]).includes(q))));
    $('#list').innerHTML = r.length ? r.map(card).join('') : '<p class="muted">找不到符合的項目</p>';
  };
  $('#q').oninput = e => { q = e.target.value.trim(); draw(); };
  $('#chips').onclick = e => { const c = e.target.closest('[data-c]'); if (!c) return; cat = c.dataset.c; document.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === c)); draw(); };
  draw();
}
function renderHerbs() {
  const natureCls = n => /寒|涼/.test(n) ? 'cold' : /溫|熱/.test(n) ? 'hot' : 'mid';
  listPage('中藥圖鑑', HERBS, [...new Set(HERBS.map(h => h.cat))],
    h => `<details class="card herb"><summary><b>${h.name}</b> <small>${h.py}</small><span class="tag ${natureCls(h.nature)}">${h.nature}</span><span class="tag">${h.cat}</span></summary>
      <dl><dt>性</dt><dd>${h.nature}</dd><dt>味</dt><dd>${h.flavor}</dd><dt>歸經</dt><dd>${h.mer}</dd><dt>功效</dt><dd>${h.eff}</dd><dt>備註</dt><dd>${h.note}</dd></dl></details>`,
    ['name', 'eff', 'cat', 'py', 'mer']);
}
function renderPoints() {
  listPage('經絡穴位', POINTS, [...new Set(POINTS.map(p => p.mer))],
    p => `<details class="card"><summary><b>${p.name}</b> <small>${p.code}</small><span class="tag">${p.mer}</span></summary>
      <dl><dt>定位</dt><dd>${p.loc}</dd><dt>功效</dt><dd>${p.eff}</dd><dt>主治</dt><dd>${p.use}</dd>${p.note ? `<dt>備註</dt><dd>${p.note}</dd>` : ''}</dl></details>`,
    ['name', 'code', 'mer', 'use', 'eff']);
}
function renderFormulas() {
  listPage('經典方劑', FORMULAS, [...new Set(FORMULAS.map(f => f.cat))],
    f => `<details class="card"><summary><b>${f.name}</b><span class="tag">${f.cat}</span></summary>
      <p class="herbs">${f.herbs.map(h => `<span class="pill">${h}</span>`).join('')}</p>
      <dl><dt>功用</dt><dd>${f.eff}</dd><dt>主治</dt><dd>${f.ind}</dd><dt>備註</dt><dd>${f.note}</dd></dl></details>`,
    ['name', 'ind', 'eff', 'cat']);
}

/* ---------- 閃卡 ---------- */
function renderCards() {
  const all = [
    ...HERBS.map(h => ({ id: 'h_' + h.id, tag: '中藥', front: h.name, sub: h.py, back: `性味：${h.nature}、${h.flavor}\n歸經：${h.mer}\n功效：${h.eff}` })),
    ...POINTS.map(p => ({ id: 'p_' + p.id, tag: '穴位', front: p.name, sub: p.code, back: `經絡：${p.mer}\n定位：${p.loc}\n主治：${p.use}` }))
  ];
  let deck = shuffle(all), i = 0, flipped = false, onlyNew = false;
  const known = () => DB.get().known || {};
  const draw = () => {
    const k = known();
    const d = onlyNew ? deck.filter(c => !k[c.id]) : deck;
    if (!d.length) { app.innerHTML = `<h1>閃卡</h1><div class="card center"><p>🎉 全部已掌握！</p><button class="btn" id="reset">重置進度</button></div>`; $('#reset').onclick = () => { DB.patch(x => x.known = {}); onlyNew = false; draw(); }; return; }
    if (i >= d.length) i = 0;
    const c = d[i];
    app.innerHTML = `<h1>閃卡</h1>
      <div class="row between"><label class="chk"><input type="checkbox" id="on" ${onlyNew ? 'checked' : ''}> 只顯示未掌握</label><span class="muted">${i + 1}/${d.length}　已掌握 ${Object.keys(k).length}/${all.length}</span></div>
      <div class="flip ${flipped ? 'on' : ''}" id="flip" tabindex="0" role="button" aria-label="翻面">
        <div class="face front"><span class="tag">${c.tag}</span><div class="big">${c.front}</div><small>${c.sub}</small><p class="muted">點擊翻面</p></div>
        <div class="face back"><pre>${c.back}</pre></div></div>
      <div class="row"><button class="btn ghost" id="again">還不熟</button><button class="btn" id="got">我記住了</button></div>`;
    const flip = () => { flipped = !flipped; $('#flip').classList.toggle('on', flipped); };
    $('#flip').onclick = flip; $('#flip').onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } };
    $('#on').onchange = e => { onlyNew = e.target.checked; i = 0; flipped = false; draw(); };
    $('#again').onclick = () => { DB.patch(x => { if (x.known) delete x.known[c.id]; }); i++; flipped = false; draw(); };
    $('#got').onclick = () => { DB.patch(x => { (x.known = x.known || {})[c.id] = 1; }); if (!onlyNew) i++; flipped = false; draw(); };
  };
  draw();
}

/* ---------- 測驗 ---------- */
function makeQuestions() {
  const Q = [];
  const opts = (ans, pool, n = 4) => shuffle([ans, ...pick(pool.filter(x => x !== ans), n - 1)]);
  const NAT = ['寒', '涼', '平', '溫', '熱'];
  HERBS.forEach(h => {
    const nat = h.nature.replace('微', '');
    Q.push({ q: `「${h.name}」的藥性（四氣）屬於？`, o: opts(nat, NAT, 4), a: nat, e: `${h.name}：${h.nature}，味${h.flavor}。` });
    Q.push({ q: `下列哪一項是「${h.name}」的主要功效？`, o: opts(h.eff, HERBS.map(x => x.eff)), a: h.eff, e: `${h.name}：${h.eff}。` });
  });
  POINTS.forEach(p => {
    Q.push({ q: `「${p.name}（${p.code}）」屬於哪條經絡？`, o: opts(p.mer, [...new Set(POINTS.map(x => x.mer))]), a: p.mer, e: `${p.name}屬${p.mer}。` });
    Q.push({ q: `哪個穴位的定位是：${p.loc}？`, o: opts(p.name, POINTS.map(x => x.name)), a: p.name, e: `${p.name}（${p.code}）：${p.loc}。` });
  });
  FORMULAS.forEach(f => {
    Q.push({ q: `「${f.name}」的主要功用是？`, o: opts(f.eff, FORMULAS.map(x => x.eff)), a: f.eff, e: `${f.name}：${f.eff}；組成：${f.herbs.join('、')}。` });
    const inH = f.herbs[0], out = HERBS.map(h => h.name).filter(n => !f.herbs.some(x => x.includes(n)));
    Q.push({ q: `下列哪一味藥「不」在${f.name}中？`, o: shuffle([...pick(out, 1), ...pick(f.herbs.filter(h => HERBS.some(x => x.name === h || h.includes(x.name))), 3)]).slice(0, 4), a: null, e: `${f.name}組成：${f.herbs.join('、')}。`, f });
  });
  // 修正「不在方中」題：確保有明確答案
  Q.forEach(q => {
    if (q.f) {
      const f = q.f, notIn = pick(HERBS.map(h => h.name).filter(n => !f.herbs.some(x => x.includes(n))), 1)[0];
      const inn = pick(f.herbs, 3);
      q.a = notIn; q.o = shuffle([notIn, ...inn]);
    }
  });
  ELEMENTS.forEach((e, i) => {
    const N = ELEMENTS, k = N.map(x => x.k);
    Q.push({ q: `五行中，${e.k}生？`, o: opts(N[(i + 1) % 5].k, k), a: N[(i + 1) % 5].k, e: `五行相生：木→火→土→金→水→木。` });
    Q.push({ q: `五行中，${e.k}剋？`, o: opts(N[(i + 2) % 5].k, k), a: N[(i + 2) % 5].k, e: `五行相剋：木剋土、土剋水、水剋火、火剋金、金剋木。` });
    Q.push({ q: `「${e.organ}」在五行中屬？`, o: opts(e.k, k), a: e.k, e: `${e.organ}屬${e.k}，主${e.season}，志為${e.emo}。` });
    Q.push({ q: `五行屬「${e.k}」的情志是？`, o: opts(e.emo, N.map(x => x.emo)), a: e.emo, e: `${e.k}：${e.organ}，情志為${e.emo}。` });
  });
  return Q;
}
function renderQuiz() {
  let qs = pick(makeQuestions(), 10), i = 0, score = 0;
  const wrong = [];
  const show = () => {
    if (i >= qs.length) {
      DB.patch(d => { d.quizCount = (d.quizCount || 0) + 1; d.quizBest = Math.max(d.quizBest || 0, score); });
      app.innerHTML = `<h1>測驗結果</h1><div class="card center"><div class="big">${score} / ${qs.length}</div>
        <p>${score >= 9 ? '🏆 太棒了！' : score >= 6 ? '👍 不錯，繼續加油' : '📚 再多複習一下吧'}</p></div>
        ${wrong.length ? `<h2>答錯的題目</h2>${wrong.map(w => `<div class="card"><p><b>${w.q}</b></p><p class="ok">正解：${w.a}</p><p class="muted">${w.e}</p></div>`).join('')}` : ''}
        <div class="row"><button class="btn" id="again">再測一次</button></div>`;
      $('#again').onclick = () => renderQuiz(); return;
    }
    const q = qs[i];
    app.innerHTML = `<h1>隨堂測驗</h1><div class="bar"><i style="width:${i / qs.length * 100}%"></i></div>
      <p class="muted">第 ${i + 1} / ${qs.length} 題　目前 ${score} 分</p>
      <div class="card"><p class="q">${q.q}</p><div class="opts">${q.o.map((o, n) => `<button class="opt" data-n="${n}">${o}</button>`).join('')}</div>
      <div id="fb"></div></div>`;
    app.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      const ok = q.o[b.dataset.n] === q.a;
      app.querySelectorAll('.opt').forEach(x => { x.disabled = true; if (q.o[x.dataset.n] === q.a) x.classList.add('ok'); });
      if (ok) score++; else { b.classList.add('no'); wrong.push(q); }
      $('#fb').innerHTML = `<p class="fb ${ok ? 'ok' : 'no'}">${ok ? '✔ 答對了！' : '✘ 答錯了'}</p><p class="muted">${q.e}</p><button class="btn" id="nx">${i + 1 === qs.length ? '看結果' : '下一題'}</button>`;
      $('#nx').onclick = () => { i++; show(); };
    });
  };
  show();
}

/* ---------- 體質測試 ---------- */
function renderBody() {
  const ans = {};
  const flat = CQ.flatMap((p, t) => p.map((q, j) => ({ t, id: t * 2 + j, q })));
  app.innerHTML = `<h1>九種體質測試</h1><p class="muted">依最近三個月的感受作答（1＝完全沒有，5＝總是）。共 ${flat.length} 題。</p>
    <form id="cf">${flat.map((x, n) => `<fieldset class="card"><legend>${n + 1}. ${x.q}</legend><div class="scale">${[1, 2, 3, 4, 5].map(v => `<label><input type="radio" name="q${x.id}" value="${v}" required><span>${v}</span></label>`).join('')}</div></fieldset>`).join('')}
    <button class="btn" type="submit">查看結果</button></form>`;
  $('#cf').onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const sc = CQ.map((_, t) => +fd.get('q' + t * 2) + +fd.get('q' + (t * 2 + 1)));
    // 平和質為正向題；其餘為偏頗傾向（>=7 分）
    const bias = sc.map((s, t) => t > 0 && s >= 7 ? t : -1).filter(t => t >= 0).sort((a, b) => sc[b] - sc[a]);
    const main = bias.length ? bias[0] : (sc[0] >= 7 ? 0 : (sc.slice(1).indexOf(Math.max(...sc.slice(1))) + 1));
    const label = bias.length || sc[0] >= 7 ? CONSTITUTIONS[main].k : CONSTITUTIONS[main].k + '（傾向）';
    DB.patch(d => d.constitution = label);
    const c = CONSTITUTIONS[main];
    app.innerHTML = `<h1>測試結果</h1><div class="card center"><div class="big">${label}</div><p>${c.d}</p></div>
      <div class="card"><h3>養生建議</h3><p>${c.adv}</p></div>
      <h2>各體質分數</h2>${CONSTITUTIONS.map((x, t) => `<div class="meter"><span>${x.k}</span><div class="bar"><i style="width:${sc[t] * 10}%"></i></div><b>${sc[t]}</b></div>`).join('')}
      ${bias.length > 1 ? `<p class="muted">同時有 ${bias.map(t => CONSTITUTIONS[t].k).join('、')} 的傾向（兼夾體質）。</p>` : ''}
      <p class="disc">⚠️ 此為簡化教學版問卷，非正式診斷；如有不適請諮詢合格中醫師。</p>
      <div class="row"><button class="btn" id="re">重新測試</button></div>`;
    $('#re').onclick = renderBody;
    window.scrollTo(0, 0);
  };
}

/* ---------- 啟動 ---------- */
buildNav();
addEventListener('hashchange', route);
route();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
let deferred;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; const b = $('#install'); b.hidden = false; b.onclick = () => { deferred.prompt(); b.hidden = true; }; });
