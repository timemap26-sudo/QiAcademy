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

/* ---------- 圖像輔助 ---------- */
const limb = (pts, w = 16) => `<polyline class="lo" points="${pts}" style="stroke-width:${w + 2}"/><polyline class="lim" points="${pts}" style="stroke-width:${w}"/>`;
function bodySvg(view, { active = null, only = null, labels = true } = {}) {
  const body = `<g class="bd">
    ${limb('92,80 70,150 56,225 52,246')}${limb('168,80 190,150 204,225 208,246')}
    ${limb('114,192 110,290 108,385', 22)}${limb('146,192 150,290 152,385', 22)}
    <ellipse cx="52" cy="256" rx="8" ry="12"/><ellipse cx="208" cy="256" rx="8" ry="12"/>
    <ellipse cx="104" cy="398" rx="15" ry="7"/><ellipse cx="156" cy="398" rx="15" ry="7"/>
    <path d="M92 72Q130 64 168 72L162 192Q130 200 98 192Z"/><rect x="122" y="56" width="16" height="20" rx="4"/><circle cx="130" cy="38" r="22"/></g>`;
  const line = view === 'f'
    ? `<line class="ml" x1="130" y1="76" x2="130" y2="190" style="stroke:${MER_COLOR['任脈']}"/><text class="mt" x="116" y="120" text-anchor="end" style="fill:${MER_COLOR['任脈']}">任脈</text>`
    : `<line class="ml" x1="130" y1="16" x2="130" y2="190" style="stroke:${MER_COLOR['督脈']}"/><text class="mt" x="116" y="120" text-anchor="end" style="fill:${MER_COLOR['督脈']}">督脈</text>`;
  const pts = Object.entries(POINT_POS).filter(([id, p]) => p.v === view && (!only || id === only)).map(([id, p]) => {
    const pt = POINTS.find(x => x.id === id), c = MER_COLOR[pt.mer], act = id === active || !!only;
    const xs = p.x2 ? [p.x, p.x2] : [p.x];
    const r = only ? 8 : 6;
    return `<g class="pt ${act ? 'act' : ''}" data-id="${id}" tabindex="0" role="button" aria-label="${pt.name}">
      ${labels ? xs.map(x => `<line x1="${x}" y1="${p.y}" x2="${p.lx + (p.a === 's' ? -2 : 2)}" y2="${p.ly - 3}" stroke="${c}" stroke-width=".8"/>`).join('') : ''}
      ${xs.map(x => `<circle cx="${x}" cy="${p.y}" r="${r}" fill="${c}"/>`).join('')}
      ${labels ? `<text x="${p.lx}" y="${p.ly}" text-anchor="${p.a === 's' ? 'start' : 'end'}" class="pl">${pt.name}</text>` : ''}</g>`;
  }).join('');
  return `<svg viewBox="0 0 260 420" class="body" role="img" aria-label="人體${view === 'f' ? '正面' : '背面'}穴位圖">${body}${line}${pts}</svg>`;
}
/* 局部放大圖底圖：[viewBox, 部位說明, SVG] */
const zl = (x, y, t, a = 'end') => `<text x="${x}" y="${y}" text-anchor="${a}" class="zl">${t}</text>`;
const zk = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="zk"/>`;
const toes = t => t.map(([x, y, rx, ry]) => `<ellipse class="zs" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`).join('');
const ZOOM_BASE = {
  arm: ['-30 0 270 330', '前臂掌側', `<path class="zs" d="M58 0C56 60 62 120 70 170C74 200 77 212 74 222C72 230 76 234 78 240C64 254 48 270 40 292C37 302 49 307 56 299C64 288 76 281 88 282L92 330L150 330L148 280C146 262 144 248 144 238C146 200 156 140 166 80C169 50 170 20 170 0Z"/>
    <path class="zf" d="M60 48Q114 58 168 48M78 238Q111 245 144 238"/><path class="zt" d="M104 120Q103 190 105 236M118 120Q119 190 117 236"/>
    ${zl(-26, 14, '橈側', 'start')}${zl(236, 14, '尺側')}${zl(236, 40, '肘橫紋')}${zl(118, 258, '腕橫紋', 'middle')}${zk(72, 227, 22, 244)}${zl(20, 248, '橈骨莖突')}`],
  hand: ['0 0 270 330', '手背', `<rect class="zs" x="100" y="30" width="28" height="120" rx="14"/><rect class="zs" x="131" y="10" width="28" height="140" rx="14"/><rect class="zs" x="162" y="24" width="26" height="126" rx="13"/><rect class="zs" x="191" y="58" width="22" height="92" rx="11"/>
    <path class="zs" d="M106 330C98 300 88 270 76 246C62 226 46 204 36 184C30 170 32 156 42 150C52 146 60 154 66 164C76 180 88 192 100 198C100 170 100 150 102 130L214 136C214 200 206 270 196 330Z"/>
    <path class="zt" d="M108 300L58 176M124 300L116 140"/>
    ${zl(8, 14, '手背（右手）', 'start')}${zk(74, 116, 96, 194)}${zl(70, 110, '虎口', 'middle')}${zk(66, 300, 92, 264)}${zl(64, 306, '第1掌骨')}${zl(132, 292, '第2掌骨', 'start')}`],
  leg: ['0 0 270 330', '小腿前外側', `<path class="zs" d="M78 0C80 40 84 80 86 120C88 160 96 220 108 330L162 330C170 260 182 180 186 120C188 80 190 40 192 0Z"/>
    <ellipse class="zf" cx="136" cy="82" rx="22" ry="26"/><circle class="zf" cx="114" cy="118" r="5"/><circle class="zf" cx="158" cy="118" r="5"/><path class="zt" d="M136 126C134 200 130 260 128 322"/>
    ${zl(8, 14, '內側', 'start')}${zl(262, 14, '外側')}${zk(72, 78, 114, 82)}${zl(70, 82, '髕骨')}${zk(178, 104, 161, 115)}${zl(176, 100, '犢鼻', 'start')}${zk(94, 272, 129, 262)}${zl(92, 276, '脛骨前嵴')}`],
  medleg: ['0 0 270 330', '小腿內側', `<path class="zs" d="M92 0C80 50 78 100 88 150C94 190 96 220 96 250C90 270 76 290 74 306C74 318 84 322 96 322L250 322C262 322 266 310 258 302C236 290 200 276 180 262C172 252 168 236 166 220C164 160 168 80 172 0Z"/>
    <ellipse class="zf" cx="130" cy="262" rx="12" ry="10"/><path class="zt" d="M106 160L100 258M154 40L144 236"/>
    ${zl(8, 14, '後', 'start')}${zl(262, 14, '前')}${zk(184, 106, 151, 110)}${zl(186, 110, '脛骨內側緣', 'start')}${zk(84, 236, 101, 232)}${zl(82, 240, '跟腱')}${zk(146, 296, 132, 273)}${zl(150, 308, '內踝尖', 'middle')}`],
  foot: ['0 0 270 330', '足背', toes([[88, 70, 22, 30], [124, 62, 14, 22], [152, 70, 13, 20], [176, 82, 12, 18], [196, 98, 11, 15]]) + `
    <path class="zs" d="M100 330C96 280 80 220 70 160C66 130 70 100 80 92L200 108C210 130 208 180 196 230C186 270 176 300 172 330Z"/>
    <path class="zt" d="M102 256L92 104M120 250L124 96"/>
    ${zl(8, 14, '足背（右足）', 'start')}${zl(88, 30, '拇趾', 'middle')}${zk(62, 136, 93, 140)}${zl(60, 140, '第1蹠骨')}${zk(146, 166, 124, 160)}${zl(148, 170, '第2蹠骨', 'start')}`],
  sole: ['0 0 270 330', '足底', toes([[98, 64, 20, 26], [132, 58, 13, 19], [158, 64, 12, 17], [180, 76, 11, 15], [200, 92, 10, 13]]) + `
    <path class="zs" d="M130 326C96 326 88 300 90 270C92 240 100 220 98 190C96 160 80 140 78 118C76 100 90 90 110 92L196 104C212 108 214 124 206 146C196 176 180 200 172 240C166 280 170 326 130 326Z"/>
    <path class="zt" d="M145 96L130 324"/>
    <g class="zd"><line x1="234" y1="96" x2="234" y2="324"/><line x1="229" y1="96" x2="239" y2="96"/><line x1="229" y1="172" x2="239" y2="172"/><line x1="229" y1="324" x2="239" y2="324"/>${zk(150, 172, 234, 172)}<text x="241" y="138" class="zc">1/3</text><text x="241" y="252" class="zc">2/3</text></g>
    ${zl(8, 14, '足底（趾除外）', 'start')}${zk(145, 22, 145, 92)}${zl(145, 18, '第2、3趾縫', 'middle')}${zl(130, 300, '足跟', 'middle')}`],
  head: ['0 0 270 330', '頭頂俯視', `<ellipse class="zs" cx="42" cy="175" rx="8" ry="22"/><ellipse class="zs" cx="228" cy="175" rx="8" ry="22"/>
    <ellipse class="zs" cx="135" cy="170" rx="92" ry="112"/><path class="zs" d="M124 62Q135 38 146 62"/>
    <path class="zt" d="M135 58V282M36 175H234"/>
    ${zl(8, 14, '頭頂俯視', 'start')}${zl(135, 32, '前（面部）', 'middle')}${zl(135, 302, '後（枕部）', 'middle')}${zk(38, 134, 42, 152)}${zl(48, 128, '耳尖')}${zl(180, 196, '兩耳尖連線', 'middle')}${zl(142, 250, '前正中線', 'start')}`],
  neck: ['0 0 270 330', '後頸部', `<path class="zs" d="M88 186C92 230 86 260 52 288L14 306L14 330L256 330L256 306L218 288C184 260 178 230 182 186Z"/>
    <ellipse class="zs" cx="52" cy="120" rx="10" ry="24"/><ellipse class="zs" cx="218" cy="120" rx="10" ry="24"/><ellipse class="zs" cx="135" cy="110" rx="80" ry="95"/>
    <path class="zf" d="M78 168Q135 196 192 168"/><path class="zt" d="M96 182L100 244M174 182L170 244M122 196C120 240 112 270 82 300M148 196C150 240 158 270 188 300"/>
    ${zl(8, 14, '後面觀', 'start')}${zk(58, 146, 86, 172)}${zl(56, 150, '枕骨下緣')}${zl(135, 250, '斜方肌', 'middle')}${zk(62, 246, 98, 236)}${zl(60, 250, '胸鎖乳突肌')}`],
  abdomen: ['0 0 270 330', '下腹部', `<path class="zs" d="M60 0C58 80 52 160 64 230C72 270 96 300 110 330L160 330C174 300 198 270 206 230C218 160 212 80 210 0Z"/>
    <ellipse class="zf" cx="135" cy="120" rx="5" ry="7"/><path class="zf" d="M108 272Q135 282 162 272M70 230Q90 262 112 290M200 230Q180 262 158 290"/><path class="zt" d="M135 0V320"/>
    ${zl(8, 14, '前面觀', 'start')}${zl(142, 30, '前正中線', 'start')}${zl(148, 108, '臍（神闕）', 'start')}${zl(135, 300, '恥骨聯合上緣', 'middle')}`]
};
function zoomSvg(id) {
  const z = POINT_ZOOM[id], pt = POINTS.find(x => x.id === id), c = MER_COLOR[pt.mer], [vb, aria, base] = ZOOM_BASE[z.r];
  const a = z.a || 'end', xs = z.x2 ? [z.x, z.x2] : [z.x], near = a === 'start' ? Math.max(...xs) : Math.min(...xs);
  const dim = z.cun ? `<g class="zd">${zk(z.x, z.y, z.bx, z.y)}${zk(z.rx, z.ref, z.bx, z.ref)}<line x1="${z.bx}" y1="${z.y}" x2="${z.bx}" y2="${z.ref}"/>
      <line x1="${z.bx - 5}" y1="${z.y}" x2="${z.bx + 5}" y2="${z.y}"/><line x1="${z.bx - 5}" y1="${z.ref}" x2="${z.bx + 5}" y2="${z.ref}"/>
      <text x="${z.bx + 7}" y="${(z.y + z.ref) / 2 + 4}" class="zc">${z.cun}</text></g>` : '';
  return `<svg viewBox="${vb}" class="body zoom" role="img" aria-label="${pt.name}局部定位圖：${aria}">${base}${dim}
    <g class="pt act">${zk(near, z.y, z.lx + (a === 'start' ? -4 : 4), z.ly - 4)}<text x="${z.lx}" y="${z.ly}" text-anchor="${a}" class="pl">${pt.name}</text>
    ${xs.map(x => `<circle cx="${x}" cy="${z.y}" r="7" fill="${c}"/>`).join('')}</g></svg>`;
}
function gauge(n) {
  const k = n.replace('微', ''), L = ['寒', '涼', '平', '溫', '熱'], cols = ['#3b86c6', '#7fb7dd', '#aab5b0', '#e9a86b', '#d9533f'];
  return `<div class="gauge" title="四氣：寒涼平溫熱">${L.map((l, i) => `<span style="background:${cols[i]}" class="${l === k ? 'on' : ''}">${l === k ? n : l}</span>`).join('')}</div>`;
}
const flavorChips = f => f.split('、').map(x => `<span class="fl" style="background:${FLAVOR_COL[x] || '#999'}">${x}</span>`).join('');
const TPATH = 'M22 22Q60 2 98 22Q114 92 60 136Q6 92 22 22Z';
function tongueSvg(color, coat, sel = -1, regions = false) {
  const R = [[0, 98, 120, 44], [34, 38, 52, 60], [0, 38, 34, 60, 1], [0, 0, 120, 38]]; // 舌尖/舌中/舌邊(左右)/舌根
  const cols = ['#ffd166', '#06d6a0', '#118ab2', '#ef476f'];
  let ov = '';
  if (regions) {
    const rs = [{ i: 0, r: [0, 98, 120, 44] }, { i: 1, r: [34, 38, 52, 60] }, { i: 2, r: [0, 38, 34, 60] }, { i: 2, r: [86, 38, 34, 60] }, { i: 3, r: [0, 0, 120, 38] }];
    ov = `<g clip-path="url(#tc)">${rs.map(({ i, r }) => `<rect data-r="${i}" x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}" fill="${cols[i]}" fill-opacity="${i === sel ? .75 : .3}" stroke="#fff" stroke-width="1.5" style="cursor:pointer"/>`).join('')}</g>
      <text x="60" y="120" text-anchor="middle" class="tl">舌尖</text><text x="60" y="72" text-anchor="middle" class="tl">舌中</text><text x="14" y="72" class="tl" text-anchor="middle">邊</text><text x="106" y="72" class="tl" text-anchor="middle">邊</text><text x="60" y="26" text-anchor="middle" class="tl">舌根</text>`;
  }
  return `<svg viewBox="0 0 120 140" class="tongue"><defs><clipPath id="tc"><path d="${TPATH}"/></clipPath></defs>
    <path d="${TPATH}" fill="${color}" stroke="rgba(0,0,0,.25)"/>
    ${coat ? `<ellipse cx="60" cy="66" rx="24" ry="38" fill="${coat}" fill-opacity=".85"/>` : ''}
    <line x1="60" y1="20" x2="60" y2="110" stroke="rgba(0,0,0,.12)"/>${ov}</svg>`;
}

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

/* ---------- 淺色／深色模式（預設淺色） ---------- */
const isDark = () => document.documentElement.dataset.theme === 'dark';
function setTheme(dark) {
  if (dark) document.documentElement.dataset.theme = 'dark'; else delete document.documentElement.dataset.theme;
  try { localStorage.setItem('qiacademy-theme', dark ? 'dark' : 'light'); } catch {}
  $('meta[name=theme-color]').content = dark ? '#141a11' : '#33502a';
  const b = $('#themeBtn'); if (b) b.textContent = dark ? '☀️ 淺色' : '🌙 深色';
}

/* ---------- 字體大小 ---------- */
const FZ = [0.85, 1, 1.15, 1.3, 1.5];
function setFz(z) {
  document.documentElement.style.setProperty('--fz', z);
  try { localStorage.setItem('qiacademy-fz', z); } catch {}
  const i = FZ.indexOf(z);
  $('#fzv').textContent = Math.round(z * 100) + '%';
  $('[data-fz="-1"]').disabled = i <= 0;
  $('[data-fz="1"]').disabled = i >= FZ.length - 1;
}
const curFz = () => { const z = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--fz')) || 1; return FZ.reduce((a, b) => Math.abs(b - z) < Math.abs(a - z) ? b : a); };

/* ---------- 首頁 ---------- */
function renderHome() {
  const d = DB.get();
  const known = Object.keys(d.known || {}).length;
  const total = HERBS.length + POINTS.length;
  app.innerHTML = `
    <section class="hero"><button id="themeBtn" class="theme" type="button" aria-label="切換淺色／深色模式">${isDark() ? '☀️ 淺色' : '🌙 深色'}</button><h1>氣學苑 <small>QiAcademy</small></h1>
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
    <h2>舌診圖解</h2>
    <p class="muted">舌面分區反映臟腑狀態，點選區塊查看。</p>
    <div class="wx"><div id="tg"></div><div id="tginfo" class="card"></div></div>
    <h3>常見舌象</h3>
    <div class="shelf">${TONGUE_TYPES.map(t => `<figure>${tongueSvg(t.c, t.coat)}<figcaption><b>${t.n}</b><br><small>${t.m}</small></figcaption></figure>`).join('')}</div>
    <h2>核心概念</h2>
    ${THEORY.map(t => `<details class="card"><summary>${t.t}</summary><p>${t.b}</p></details>`).join('')}
    <h2>陰陽小遊戲</h2><div id="yy"></div>`;
  drawWx(0); yinyang(); drawTongue(0);
}
function drawTongue(sel) {
  $('#tg').innerHTML = tongueSvg('#e8868a', '#f3efe8', sel, true);
  const t = TONGUE[sel];
  $('#tginfo').innerHTML = `<h3>${t.k}</h3><p>反映：<b>${t.z}</b></p><p class="muted">口訣：尖心肺、中脾胃、邊肝膽、根腎。</p>`;
  document.querySelectorAll('#tg [data-r]').forEach(r => r.onclick = () => drawTongue(+r.dataset.r));
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
function listPage(title, items, cats, card, searchKeys, pre = '', after = () => {}) {
  let q = '', cat = '全部';
  app.innerHTML = `<h1>${title}</h1>${pre}
    <input id="q" class="search" type="search" placeholder="搜尋…" aria-label="搜尋">
    <div class="chips" id="chips">${['全部', ...cats].map(c => `<button class="chip ${c === '全部' ? 'on' : ''}" data-c="${c}">${c}</button>`).join('')}</div>
    <div id="list"></div>`;
  const draw = () => {
    const r = items.filter(x => (cat === '全部' || x.cat === cat || x.mer === cat) && (!q || searchKeys.some(k => String(x[k]).includes(q))));
    $('#list').innerHTML = r.length ? r.map(card).join('') : '<p class="muted">找不到符合的項目</p>';
  };
  $('#q').oninput = e => { q = e.target.value.trim(); draw(); };
  $('#chips').onclick = e => { const c = e.target.closest('[data-c]'); if (!c) return; cat = c.dataset.c; document.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === c)); draw(); };
  draw(); after();
}
function renderHerbs() {
  const natureCls = n => /寒|涼/.test(n) ? 'cold' : /溫|熱/.test(n) ? 'hot' : 'mid';
  listPage('中藥圖鑑', HERBS, [...new Set(HERBS.map(h => h.cat))],
    h => `<details class="card herb"><summary><span class="emo">${HERB_EMOJI[h.id] || '🌿'}</span><b>${h.name}</b> <small>${h.py}</small><span class="tag ${natureCls(h.nature)}">${h.nature}</span><span class="tag">${h.cat}</span></summary>
      ${gauge(h.nature)}<div class="fls">${flavorChips(h.flavor)}</div>
      <dl><dt>性</dt><dd>${h.nature}</dd><dt>味</dt><dd>${h.flavor}</dd><dt>歸經</dt><dd>${h.mer}</dd><dt>功效</dt><dd>${h.eff}</dd><dt>備註</dt><dd>${h.note}</dd></dl></details>`,
    ['name', 'eff', 'cat', 'py', 'mer']);
}
function renderPoints() {
  let view = 'f', active = null;
  const pre = `<div class="row"><button class="btn" data-v="f">正面</button><button class="btn ghost" data-v="b">背面</button></div>
    <div id="bodywrap" class="bodywrap"></div><div id="ptinfo" class="card"></div>
    <div class="legend wrap">${Object.entries(MER_COLOR).map(([m, c]) => `<span><i class="dot" style="background:${c}"></i>${m}</span>`).join('')}</div>
    <h2>穴位列表</h2>`;
  const draw = () => {
    $('#bodywrap').innerHTML = bodySvg(view, { active });
    document.querySelectorAll('[data-v]').forEach(b => b.classList.toggle('ghost', b.dataset.v !== view));
    const p = POINTS.find(x => x.id === active);
    $('#ptinfo').innerHTML = p ? `<h3>${p.name} <small>${p.code}</small> <span class="tag" style="background:${MER_COLOR[p.mer]};color:#fff">${p.mer}</span></h3>
      <dl><dt>定位</dt><dd>${p.loc}</dd><dt>功效</dt><dd>${p.eff}</dd><dt>主治</dt><dd>${p.use}</dd></dl>` : '<p class="muted">點選人體圖上的圓點，查看穴位資訊。顏色代表所屬經絡。</p>';
    document.querySelectorAll('#bodywrap .pt').forEach(g => {
      const go = () => { active = g.dataset.id; draw(); };
      g.onclick = go; g.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') go(); };
    });
  };
  listPage('經絡穴位', POINTS, [...new Set(POINTS.map(p => p.mer))],
    p => `<details class="card"><summary><b>${p.name}</b> <small>${p.code}</small><span class="tag" style="background:${MER_COLOR[p.mer]};color:#fff">${p.mer}</span></summary>
      <dl><dt>定位</dt><dd>${p.loc}</dd><dt>功效</dt><dd>${p.eff}</dd><dt>主治</dt><dd>${p.use}</dd>${p.note ? `<dt>備註</dt><dd>${p.note}</dd>` : ''}</dl></details>`,
    ['name', 'code', 'mer', 'use', 'eff'], pre,
    () => {
      document.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { view = b.dataset.v; active = null; draw(); });
      draw();
    });
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
    ...HERBS.map(h => ({ id: 'h_' + h.id, tag: '中藥', icon: HERB_EMOJI[h.id], front: h.name, sub: h.py, col: 1, art: gauge(h.nature) + `<div class="fls">${flavorChips(h.flavor)}</div>`, back: `歸經：${h.mer}\n功效：${h.eff}` })),
    ...POINTS.map(p => ({ id: 'p_' + p.id, tag: '穴位', front: p.name, sub: p.code, art: POINT_ZOOM[p.id] ? zoomSvg(p.id) : POINT_POS[p.id] ? bodySvg(POINT_POS[p.id].v, { only: p.id, labels: false }) : '', back: `經絡：${p.mer}\n定位：${p.loc}\n主治：${p.use}` }))
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
        <div class="face front"><span class="tag">${c.tag}</span>${c.icon ? `<div class="big">${c.icon}</div>` : ''}<div class="big">${c.front}</div><small>${c.sub}</small><p class="muted">點擊翻面</p></div>
        <div class="face back"><div class="bk ${c.col ? 'col' : ''}"><div class="art">${c.art}</div><pre>${c.back}</pre></div></div></div>
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
  POINTS.filter(p => POINT_POS[p.id]).forEach(p => {
    Q.push({ q: '圖中標示的穴位是？', svg: bodySvg(POINT_POS[p.id].v, { only: p.id, labels: false }), o: opts(p.name, POINTS.filter(x => POINT_POS[x.id]).map(x => x.name)), a: p.name, e: `${p.name}（${p.code}）：${p.loc}。` });
  });
  TONGUE.forEach(t => {
    Q.push({ q: `舌診中，「${t.k}」主要反映哪些臟腑？`, o: opts(t.z, TONGUE.map(x => x.z)), a: t.z, e: '口訣：尖心肺、中脾胃、邊肝膽、根腎。' });
  });
  TONGUE_TYPES.forEach(t => {
    Q.push({ q: `舌象「${t.n}」常提示？`, o: opts(t.m, TONGUE_TYPES.map(x => x.m)), a: t.m, e: `${t.n}：${t.m}。` });
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
      <div class="card"><p class="q">${q.q}</p>${q.svg ? `<div class="qsvg">${q.svg}</div>` : ''}<div class="opts">${q.o.map((o, n) => `<button class="opt" data-n="${n}">${o}</button>`).join('')}</div>
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
if (isDark()) $('meta[name=theme-color]').content = '#141a11';
addEventListener('click', e => {
  if (e.target.closest('#themeBtn')) setTheme(!isDark());
  const f = e.target.closest('[data-fz]');
  if (f) { const i = FZ.indexOf(curFz()) + +f.dataset.fz; if (FZ[i]) setFz(FZ[i]); }
});
setFz(curFz());
addEventListener('hashchange', route);
route();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
let deferred;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; const b = $('#install'); b.hidden = false; b.onclick = () => { deferred.prompt(); b.hidden = true; }; });
