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
const bodyBase = () => `<g class="bd">
    ${limb('92,80 70,150 56,225 52,246')}${limb('168,80 190,150 204,225 208,246')}
    ${limb('114,192 110,290 108,385', 22)}${limb('146,192 150,290 152,385', 22)}
    <ellipse cx="52" cy="256" rx="8" ry="12"/><ellipse cx="208" cy="256" rx="8" ry="12"/>
    <ellipse cx="104" cy="398" rx="15" ry="7"/><ellipse cx="156" cy="398" rx="15" ry="7"/>
    <path d="M92 72Q130 64 168 72L162 192Q130 200 98 192Z"/><rect x="122" y="56" width="16" height="20" rx="4"/><circle cx="130" cy="38" r="22"/></g>`;
function bodySvg(view, { active = null, only = null, labels = true } = {}) {
  const body = bodyBase();
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

/* ---------- 圖解課程插圖（SVG） ---------- */
const svgWrap = (vb, body, label) => `<svg class="fig" viewBox="${vb}" role="img" aria-label="${label}">${body}</svg>`;
const box = (x, y, w, h, fill, txt, sub = '', tc = '#fff') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${fill}"/>
  <text x="${x + w / 2}" y="${y + h / 2 + (sub ? -2 : 6)}" text-anchor="middle" class="b" style="fill:${tc}">${txt}</text>${sub ? `<text x="${x + w / 2}" y="${y + h / 2 + 16}" text-anchor="middle" class="s" style="fill:${tc}">${sub}</text>` : ''}`;
const arc = (cx, cy, r1, r2, a0, a1) => {
  const P = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)].map(v => v.toFixed(1)).join(',');
  return `M${P(r2, a0)} A${r2},${r2} 0 0 1 ${P(r2, a1)} L${P(r1, a1)} A${r1},${r1} 0 0 0 ${P(r1, a0)}Z`;
};
const curShichen = () => Math.floor(((new Date().getHours() + 1) % 24) / 2);
const FIG = {
  taiji: () => svgWrap('0 0 360 240', `
    <circle cx="180" cy="120" r="101" fill="#2b2b2b"/><circle cx="180" cy="120" r="100" fill="#f7f1e1"/>
    <path d="M180,20 A100,100 0 0 1 180,220 A50,50 0 0 1 180,120 A50,50 0 0 0 180,20Z" fill="#2b2b2b"/>
    <circle cx="180" cy="70" r="13" fill="#2b2b2b"/><circle cx="180" cy="170" r="13" fill="#f7f1e1"/>
    <text x="128" y="128" text-anchor="middle" class="b" style="fill:#2b2b2b">陽</text><text x="232" y="128" text-anchor="middle" class="b" style="fill:#f7f1e1">陰</text>
    <text x="38" y="40" text-anchor="middle" class="b" style="fill:#d98a1f">陽</text>
    ${['動', '熱', '上', '外', '明', '功能'].map((t, i) => `<text x="38" y="${70 + i * 27}" text-anchor="middle">${t}</text>`).join('')}
    <text x="322" y="40" text-anchor="middle" class="b" style="fill:#3b4a63">陰</text>
    ${['靜', '寒', '下', '內', '暗', '物質'].map((t, i) => `<text x="322" y="${70 + i * 27}" text-anchor="middle">${t}</text>`).join('')}`, '陰陽太極圖'),
  clock: () => {
    const now = curShichen(), A = i => (-90 + (i - .5) * 30) * Math.PI / 180;
    const seg = SHICHEN.map(([z, h, o, w], i) => {
      const m = (-90 + i * 30) * Math.PI / 180, on = i === now;
      const T = (r, t, c, dy) => `<text x="${(150 + r * Math.cos(m)).toFixed(1)}" y="${(150 + r * Math.sin(m) + dy).toFixed(1)}" text-anchor="middle" class="${c}" style="fill:#fff">${t}</text>`;
      return `<path d="${arc(150, 150, 66, 138, A(i), A(i + 1))}" fill="${WX_COL[w]}" opacity="${on ? 1 : .55}" stroke="${on ? 'var(--ink)' : 'var(--card)'}" stroke-width="${on ? 3 : 2}"/>
        ${T(103, z, 'b', -2)}${T(103, o, 's', 17)}`;
    }).join('');
    const [z, h, o] = SHICHEN[now];
    return svgWrap('0 0 300 300', `${seg}<circle cx="150" cy="150" r="62" fill="var(--card)"/>
      <text x="150" y="128" text-anchor="middle" class="s">現在是</text><text x="150" y="156" text-anchor="middle" class="b">${z}時</text>
      <text x="150" y="180" text-anchor="middle" class="s">${o}經當令</text><text x="150" y="198" text-anchor="middle" class="xs" style="fill:var(--mut)">${h}:00–${(h + 2) % 24}:00</text>`, '十二時辰經絡時辰鐘');
  },
  zangfu: () => {
    const P = [['肝', '膽', '木'], ['心', '小腸', '火'], ['脾', '胃', '土'], ['肺', '大腸', '金'], ['腎', '膀胱', '水'], ['心包', '三焦', '火']];
    return svgWrap('0 0 372 210', `<text x="6" y="44" class="s">五臟（裡・陰）</text><text x="6" y="196" class="s">六腑（表・陽）</text>
      ${P.map(([a, b, w], i) => { const x = 8 + i * 61; return `${box(x, 54, 52, 44, WX_COL[w], a)}<line x1="${x + 26}" y1="98" x2="${x + 26}" y2="130" stroke="${WX_COL[w]}" stroke-width="3" stroke-dasharray="4 3"/><text x="${x + 26}" y="119" text-anchor="middle" class="xs" style="fill:var(--mut)">${w}</text>${box(x, 130, 52, 44, WX_COL[w], b, '', '#fff')}`; }).join('')}
      <text x="186" y="20" text-anchor="middle" class="s" style="fill:var(--mut)">虛線＝經脈相互絡屬（表裡關係）</text>`, '五臟六腑表裡關係圖');
  },
  qixue: () => svgWrap('-34 0 408 250', `<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="var(--mut)"/></marker></defs>
    <line x1="146" y1="78" x2="84" y2="168" stroke="var(--mut)" stroke-width="2" marker-end="url(#ah)"/><line x1="70" y1="160" x2="132" y2="72" stroke="var(--mut)" stroke-width="2" marker-end="url(#ah)"/>
    <line x1="194" y1="78" x2="256" y2="168" stroke="var(--mut)" stroke-width="2"/><line x1="110" y1="200" x2="230" y2="200" stroke="var(--mut)" stroke-width="2" stroke-dasharray="5 4"/>
    <circle cx="170" cy="52" r="38" fill="#d98a1f"/><text x="170" y="60" text-anchor="middle" class="b" style="fill:#fff">氣</text>
    <circle cx="70" cy="200" r="38" fill="#c0392b"/><text x="70" y="208" text-anchor="middle" class="b" style="fill:#fff">血</text>
    <circle cx="270" cy="200" r="38" fill="#2f6fb0"/><text x="270" y="208" text-anchor="middle" class="b" style="fill:#fff">津液</text>
    <text x="38" y="102" text-anchor="middle" class="s">氣為血之帥</text><text x="38" y="120" text-anchor="middle" class="xs" style="fill:var(--mut)">生血・行血・攝血</text>
    <text x="166" y="136" text-anchor="middle" class="s">血為氣之母</text><text x="166" y="153" text-anchor="middle" class="xs" style="fill:var(--mut)">養氣・載氣</text>
    <text x="304" y="108" text-anchor="middle" class="s">氣能生津</text><text x="304" y="126" text-anchor="middle" class="xs" style="fill:var(--mut)">行津・攝津・津能載氣</text>
    <text x="170" y="192" text-anchor="middle" class="s">津血同源</text>`, '氣血津液關係圖'),
  liuyin: () => {
    const L = [['🌬️', '風', '善行數變', '#3f9b5b'], ['❄️', '寒', '凝滯收引', '#2f6fb0'], ['☀️', '暑', '炎熱升散', '#d98a1f'], ['💧', '濕', '重濁黏滯', '#8a7a4a'], ['🍂', '燥', '乾澀傷肺', '#a87a3a'], ['🔥', '火', '炎上動血', '#c0392b']];
    return svgWrap('0 0 360 236', L.map(([e, n, d, c], i) => { const x = 6 + (i % 3) * 118, y = 6 + (i / 3 | 0) * 116; return `<rect x="${x}" y="${y}" width="112" height="108" rx="14" fill="${c}" opacity=".14"/><rect x="${x}" y="${y}" width="112" height="108" rx="14" fill="none" stroke="${c}" stroke-width="2"/>
      <text x="${x + 56}" y="${y + 38}" text-anchor="middle" style="font-size:28px">${e}</text><text x="${x + 56}" y="${y + 70}" text-anchor="middle" class="b" style="fill:${c}">${n}邪</text><text x="${x + 56}" y="${y + 94}" text-anchor="middle" class="xs">${d}</text>`; }).join(''), '六淫外邪圖');
  },
  sizhen: () => {
    const Q = [['👁️', '望', '神色・形態・舌象', '#3f9b5b'], ['👂', '聞', '聽聲音・嗅氣味', '#2f6fb0'], ['💬', '問', '十問歌', '#d98a1f'], ['✋', '切', '脈診・按診', '#c0392b']];
    return svgWrap('0 0 340 260', `${Q.map(([e, n, d, c], i) => { const x = 6 + (i % 2) * 168, y = 6 + (i / 2 | 0) * 128; return `<rect x="${x}" y="${y}" width="160" height="120" rx="16" fill="${c}" opacity=".14"/>
      <text x="${x + 80}" y="${y + 42}" text-anchor="middle" style="font-size:28px">${e}</text><text x="${x + 80}" y="${y + 76}" text-anchor="middle" class="b" style="fill:${c}">${n}診</text><text x="${x + 80}" y="${y + 100}" text-anchor="middle" class="xs">${d}</text>`; }).join('')}
      <circle cx="170" cy="130" r="34" fill="var(--pri)"/><text x="170" y="126" text-anchor="middle" class="s" style="fill:var(--onp)">四診</text><text x="170" y="146" text-anchor="middle" class="s" style="fill:var(--onp)">合參</text>`, '四診合參圖');
  },
  bagang: () => {
    const R = [['表', '裡', '病位深淺'], ['熱', '寒', '疾病性質'], ['實', '虛', '邪正盛衰']];
    return svgWrap('0 0 340 250', `${box(6, 6, 150, 40, '#d98a1f', '陽證')}${box(184, 6, 150, 40, '#3b4a63', '陰證')}
      ${R.map(([a, b, d], i) => { const y = 66 + i * 62; return `${box(6, y, 92, 46, '#d98a1f', a, '', '#fff')}${box(242, y, 92, 46, '#3b4a63', b, '', '#fff')}
        <line x1="104" y1="${y + 23}" x2="236" y2="${y + 23}" stroke="var(--mut)" stroke-width="2"/><rect x="122" y="${y + 9}" width="96" height="28" rx="14" fill="var(--card)" stroke="var(--line)"/><text x="170" y="${y + 29}" text-anchor="middle" class="xs">${d}</text>`; }).join('')}`, '八綱辨證圖');
  },
  jingluo: () => {
    const G = [['經脈', '#2f6fb0', ['十二經脈', '奇經八脈', '十二經別']], ['絡脈', '#3f9b5b', ['十五絡脈', '浮絡', '孫絡']], ['連屬部分', '#d98a1f', ['十二經筋', '十二皮部']]];
    let y = 0, out = box(4, 112, 74, 50, 'var(--pri)', '經絡', '系統', 'var(--onp)');
    G.forEach(([n, c, kids]) => {
      const top = y, mid = top + kids.length * 31 / 2 + 2;
      out += `<path d="M78,137 C100,137 100,${mid} 120,${mid}" fill="none" stroke="${c}" stroke-width="2"/>${box(120, mid - 18, 84, 36, c, n)}`;
      kids.forEach((k, j) => { const ky = top + j * 31 + 4; out += `<path d="M204,${mid} C220,${mid} 220,${ky + 13} 236,${ky + 13}" fill="none" stroke="${c}" stroke-width="1.5"/><rect x="236" y="${ky}" width="112" height="26" rx="8" fill="${c}" opacity=".16"/><text x="292" y="${ky + 19}" text-anchor="middle" class="s">${k}</text>`; });
      y += kids.length * 31 + 14;
    });
    return svgWrap(`0 0 352 ${y}`, out, '經絡系統組成圖');
  },
  sanjiao: () => svgWrap('0 0 330 300', `<defs><clipPath id="tor"><path d="M120,70 Q80,72 74,110 L70,280 Q70,292 82,292 L218,292 Q230,292 230,280 L226,110 Q220,72 180,70Z"/></clipPath></defs>
    <circle cx="150" cy="34" r="26" fill="var(--bf)" stroke="var(--bl)"/><rect x="138" y="56" width="24" height="18" fill="var(--bf)"/>
    <g clip-path="url(#tor)"><rect x="60" y="60" width="180" height="78" fill="#6a9fd8"/><rect x="60" y="138" width="180" height="70" fill="#d9a43a"/><rect x="60" y="208" width="180" height="90" fill="#5a8f6a"/></g>
    <path d="M120,70 Q80,72 74,110 L70,280 Q70,292 82,292 L218,292 Q230,292 230,280 L226,110 Q220,72 180,70Z" fill="none" stroke="var(--bl)" stroke-width="2"/>
    <text x="150" y="100" text-anchor="middle" class="b" style="fill:#fff">上焦</text><text x="150" y="122" text-anchor="middle" class="xs" style="fill:#fff">心・肺</text>
    <text x="150" y="172" text-anchor="middle" class="b" style="fill:#fff">中焦</text><text x="150" y="194" text-anchor="middle" class="xs" style="fill:#fff">脾・胃</text>
    <text x="150" y="244" text-anchor="middle" class="b" style="fill:#fff">下焦</text><text x="150" y="266" text-anchor="middle" class="xs" style="fill:#fff">肝・腎・腸・膀胱</text>
    <text x="236" y="104" class="s">☁️ 如霧</text><text x="236" y="178" class="s">🫕 如漚</text><text x="236" y="252" class="s">🌊 如瀆</text>
    <text x="4" y="142" class="xs" style="fill:var(--mut)">膈 —</text><text x="4" y="212" class="xs" style="fill:var(--mut)">臍 —</text>`, '三焦分部圖'),
  wuxing: () => {
    const N = [['木', '#3f9b5b', '肝'], ['火', '#d9534f', '心'], ['土', '#c9a227', '脾'], ['金', '#8a94a6', '肺'], ['水', '#2f6fb0', '腎']];
    const P = N.map((_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return [150 + 108 * Math.cos(a), 150 + 104 * Math.sin(a)]; });
    const seg = (a, b, r = 31) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L; return [a[0] + ux * r, a[1] + uy * r, b[0] - ux * r, b[1] - uy * r].map(v => v.toFixed(1)); };
    let g = '';
    N.forEach((_, i) => {
      const [a, b, c, d] = seg(P[i], P[(i + 1) % 5]), [e, f, h, k] = seg(P[i], P[(i + 2) % 5]);
      g += `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="#3f9b5b" stroke-width="3" marker-end="url(#wxG)"/><line x1="${e}" y1="${f}" x2="${h}" y2="${k}" stroke="#d9534f" stroke-width="2" stroke-dasharray="6 4" marker-end="url(#wxR)"/>`;
    });
    return svgWrap('0 0 300 300', `<defs><marker id="wxG" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10z" fill="#3f9b5b"/></marker><marker id="wxR" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10z" fill="#d9534f"/></marker></defs>${g}
      ${N.map(([n, c, o], i) => `<circle cx="${P[i][0].toFixed(1)}" cy="${P[i][1].toFixed(1)}" r="28" fill="${c}"/><text x="${P[i][0].toFixed(1)}" y="${(P[i][1] + 3).toFixed(1)}" text-anchor="middle" class="b" style="fill:#fff">${n}</text><text x="${P[i][0].toFixed(1)}" y="${(P[i][1] + 19).toFixed(1)}" text-anchor="middle" class="xs" style="fill:#fff">${o}</text>`).join('')}
      <text x="150" y="294" text-anchor="middle" class="xs"><tspan style="fill:#3f9b5b">━ 相生（外圈）</tspan>　<tspan style="fill:#d9534f">╍ 相剋（內星）</tspan></text>`, '五行相生相剋圖');
  },
  wuzang: () => {
    const R = [['肝', '#3f9b5b', '藏血・主疏泄', '筋・目・爪'], ['心', '#d9534f', '主血脈・藏神', '脈・舌・面'], ['脾', '#c9a227', '主運化・統血・升清', '肉・口・唇'], ['肺', '#8a94a6', '主氣・宣降・通調水道', '皮・鼻・毛'], ['腎', '#2f6fb0', '藏精・主水・納氣', '骨・耳・髮']];
    return svgWrap('0 0 360 290', `<text x="80" y="16" class="xs" style="fill:var(--mut)">主要生理功能</text><text x="272" y="16" class="xs" style="fill:var(--mut)">體・竅・華</text>
      ${R.map(([n, c, f, o], i) => { const y = 24 + i * 53; return `${box(4, y, 60, 46, c, n)}<rect x="70" y="${y}" width="286" height="46" rx="10" fill="${c}" opacity=".14"/><text x="80" y="${y + 28}" class="s">${f}</text><text x="272" y="${y + 28}" class="xs">${o}</text>`; }).join('')}`, '五臟功能圖');
  },
  qiqing: () => {
    const L = [['😠', '怒', '傷肝・氣上', '#3f9b5b'], ['😄', '喜', '傷心・氣緩', '#d9534f'], ['🤔', '思', '傷脾・氣結', '#c9a227'], ['😢', '悲・憂', '傷肺・氣消', '#8a94a6'], ['😨', '恐', '傷腎・氣下', '#2f6fb0'], ['😱', '驚', '傷心腎・氣亂', '#6a5a9a']];
    return svgWrap('0 0 360 236', L.map(([e, n, d, c], i) => { const x = 6 + (i % 3) * 118, y = 6 + (i / 3 | 0) * 116; return `<rect x="${x}" y="${y}" width="112" height="108" rx="14" fill="${c}" opacity=".14"/><rect x="${x}" y="${y}" width="112" height="108" rx="14" fill="none" stroke="${c}" stroke-width="2"/>
      <text x="${x + 56}" y="${y + 38}" text-anchor="middle" style="font-size:28px">${e}</text><text x="${x + 56}" y="${y + 68}" text-anchor="middle" class="b" style="fill:${c}">${n}</text><text x="${x + 56}" y="${y + 92}" text-anchor="middle" class="xs">${d}</text>`; }).join(''), '七情內傷圖');
  },
  shezhen: () => {
    const RS = [[0, 98, 120, 44, '#ffd166'], [34, 38, 52, 60, '#06d6a0'], [0, 38, 34, 60, '#118ab2'], [86, 38, 34, 60, '#118ab2'], [0, 0, 120, 38, '#ef476f']];
    const T = (x, y, t, c = 's') => `<text x="${x}" y="${y}" text-anchor="middle" class="${c}" style="fill:#3a2420">${t}</text>`;
    return svgWrap('0 0 340 262', `<defs><clipPath id="tcL"><path d="${TPATH}"/></clipPath></defs>
      <g transform="translate(80,14) scale(1.5)"><path d="${TPATH}" fill="#e8868a"/><g clip-path="url(#tcL)">${RS.map(([x, y, w, h, c]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" fill-opacity=".45" stroke="#fff" stroke-width="1"/>`).join('')}</g><path d="${TPATH}" fill="none" stroke="rgba(0,0,0,.3)"/></g>
      ${T(170, 52, '舌根', 'b')}${T(170, 67, '腎', 'xs')}${T(170, 116, '舌中', 'b')}${T(170, 136, '脾胃', 'xs')}<path d="M88,124 H122 M252,124 H218" stroke="var(--mut)" stroke-width="1.5"/><circle cx="122" cy="124" r="3" fill="var(--mut)"/><circle cx="218" cy="124" r="3" fill="var(--mut)"/><text x="58" y="118" text-anchor="middle" class="s">舌邊</text><text x="58" y="136" text-anchor="middle" class="xs">肝膽</text><text x="282" y="118" text-anchor="middle" class="s">舌邊</text><text x="282" y="136" text-anchor="middle" class="xs">肝膽</text>${T(170, 182, '舌尖')}${T(170, 198, '心肺', 'xs')}
      <text x="170" y="254" text-anchor="middle" class="xs" style="fill:var(--mut)">舌質看臟腑虛實・舌苔看病邪深淺</text>`, '舌面臟腑分區圖');
  },
  maizhen: () => {
    const C = ['#d9534f', '#c9a227', '#2f6fb0'];
    const arm = (cx, dx, side, org) => `<ellipse cx="${cx}" cy="40" rx="42" ry="28" fill="var(--bf)" stroke="var(--bl)" stroke-width="2"/><rect x="${cx - 30}" y="56" width="60" height="176" rx="22" fill="var(--bf)" stroke="var(--bl)" stroke-width="2"/>
      <text x="${cx}" y="46" text-anchor="middle" class="s">${side}</text>
      ${['寸', '關', '尺'].map((p, i) => { const y = 96 + i * 44, x = cx + dx; return `<circle cx="${x}" cy="${y}" r="12" fill="${C[i]}"/><text x="${x}" y="${y + 4}" text-anchor="middle" class="xs" style="fill:#fff">${p}</text><text x="${x + (dx > 0 ? 22 : -22)}" y="${y + 5}" text-anchor="${dx > 0 ? 'start' : 'end'}" class="s">${org[i]}</text>`; }).join('')}`;
    return svgWrap('0 0 340 262', `${arm(84, 14, '左手', ['心', '肝', '腎'])}${arm(256, -14, '右手', ['肺', '脾', '腎・命門'])}
      <text x="170" y="254" text-anchor="middle" class="xs" style="fill:var(--mut)">掌後高骨定關・浮中沉三候</text>`, '寸口脈寸關尺分候臟腑圖');
  },
  siqi: () => {
    const Q = [['寒', '#3b86c6'], ['涼', '#7fb7dd'], ['平', '#aab5b0'], ['溫', '#e9a86b'], ['熱', '#d9533f']];
    const W = [['辛', '#8a94a6', '能散・能行'], ['甘', '#c9a227', '能補・能和・能緩'], ['酸', '#3f9b5b', '能收・能澀'], ['苦', '#d9534f', '能泄・能燥・能堅'], ['鹹', '#2f6fb0', '能下・能軟']];
    return svgWrap('0 0 360 250', `<text x="180" y="18" text-anchor="middle" class="s">四氣：藥性寒熱</text>
      ${Q.map(([n, c], i) => box(8 + i * 70, 28, 64, 44, c, n)).join('')}
      <text x="8" y="92" class="xs" style="fill:var(--mut)">← 清熱瀉火</text><text x="352" y="92" text-anchor="end" class="xs" style="fill:var(--mut)">溫裡散寒 →</text>
      <text x="180" y="126" text-anchor="middle" class="s">五味：作用特點</text>
      ${W.map(([n, c, d], i) => { const x = 40 + i * 70; return `<rect x="${x - 32}" y="136" width="64" height="106" rx="10" fill="${c}" opacity=".15"/><circle cx="${x}" cy="166" r="21" fill="${c}"/><text x="${x}" y="173" text-anchor="middle" class="b" style="fill:#fff">${n}</text>${d.split('・').map((t, j) => `<text x="${x}" y="${204 + j * 15}" text-anchor="middle" class="xs">${t}</text>`).join('')}`; }).join('')}`, '四氣五味圖');
  },
  peiwu: () => {
    const G = [['增效', '#3f9b5b', '宜用', [['相須', '麻黃＋桂枝'], ['相使', '黃耆＋茯苓']]], ['減毒', '#2f6fb0', '宜用（毒性藥）', [['相畏', '半夏畏生薑'], ['相殺', '生薑殺半夏毒']]], ['減效・增毒', '#d9534f', '慎用・禁用', [['相惡', '人參惡萊菔子'], ['相反', '甘草反甘遂']]]];
    return svgWrap('0 0 360 262', G.map(([h, c, u, K], i) => { const x = 4 + i * 119; return `<rect x="${x}" y="4" width="113" height="40" rx="10" fill="${c}"/><text x="${x + 56}" y="30" text-anchor="middle" class="s" style="fill:#fff;font-weight:700">${h}</text><text x="${x + 56}" y="62" text-anchor="middle" class="xs" style="fill:var(--mut)">${u}</text>
      ${K.map(([n, e], j) => { const y = 72 + j * 82; return `<rect x="${x}" y="${y}" width="113" height="74" rx="12" fill="${c}" opacity=".14"/><rect x="${x}" y="${y}" width="113" height="74" rx="12" fill="none" stroke="${c}" stroke-width="1.5"/><text x="${x + 56}" y="${y + 32}" text-anchor="middle" class="b" style="fill:${c}">${n}</text><text x="${x + 56}" y="${y + 56}" text-anchor="middle" class="xs">${e}</text>`; }).join('')}`; }).join('')
      + `<text x="180" y="252" text-anchor="middle" class="xs" style="fill:var(--mut)">另有「單行」：單用一味藥，如獨參湯</text>`, '中藥配伍七情圖');
  },
  junchen: () => {
    const L = [['君', '麻黃', '發汗解表・宣肺平喘', '#c0392b', 140], ['臣', '桂枝', '解肌發表・助君發汗', '#d98a1f', 200], ['佐', '杏仁', '降利肺氣・助麻黃平喘', '#3f9b5b', 260], ['使', '炙甘草', '調和諸藥・緩和藥性', '#2f6fb0', 320]];
    return svgWrap('0 0 340 268', `<text x="170" y="18" text-anchor="middle" class="s">以「麻黃湯」為例</text>` + L.map(([r, h, d, c, w], i) => { const y = 28 + i * 60, x = 170 - w / 2; return `<rect x="${x}" y="${y}" width="${w}" height="54" rx="10" fill="${c}"/><text x="170" y="${y + 25}" text-anchor="middle" class="b" style="fill:#fff">${r}・${h}</text><text x="170" y="${y + 45}" text-anchor="middle" class="xs" style="fill:#fff">${d}</text>`; }).join(''), '君臣佐使組方圖');
  },
  bafa: () => {
    const M = [['汗', '解表', '#5a9fd0'], ['吐', '湧吐', '#8a7a4a'], ['下', '瀉下', '#a87a3a'], ['和', '和解', '#3f9b5b'], ['溫', '溫裡', '#e08a4b'], ['清', '清熱', '#3b6fb6'], ['消', '消導', '#b8921f'], ['補', '補益', '#c0392b']];
    return svgWrap('0 0 300 300', `<circle cx="150" cy="150" r="104" fill="none" stroke="var(--line)" stroke-width="2" stroke-dasharray="4 4"/>`
      + M.map(([n, d, c], i) => { const a = (-90 + i * 45) * Math.PI / 180, x = (150 + 104 * Math.cos(a)).toFixed(1), y = 150 + 104 * Math.sin(a); return `<circle cx="${x}" cy="${y.toFixed(1)}" r="32" fill="${c}"/><text x="${x}" y="${(y + 3).toFixed(1)}" text-anchor="middle" class="b" style="fill:#fff">${n}</text><text x="${x}" y="${(y + 19).toFixed(1)}" text-anchor="middle" class="xs" style="fill:#fff">${d}</text>`; }).join('')
      + `<circle cx="150" cy="150" r="44" fill="var(--pri)"/><text x="150" y="146" text-anchor="middle" class="s" style="fill:var(--onp)">治療</text><text x="150" y="166" text-anchor="middle" class="s" style="fill:var(--onp)">八法</text>`, '治療八法圖');
  },
  gudu: () => {
    const sk = 'fill="var(--bf)" stroke="var(--bl)" stroke-width="2"', ln = 'stroke="var(--bl)" stroke-width="1.5"';
    const br = (x1, x2, y, t) => `<path d="M${x1},${y + 6} V${y} H${x2} V${y + 6}" fill="none" stroke="#d9534f" stroke-width="2"/><text x="${(x1 + x2) / 2}" y="${y - 6}" text-anchor="middle" class="s" style="fill:#d9534f">${t}</text>`;
    const vb = (x, y1, y2, t) => `<path d="M${x - 6},${y1} H${x} V${y2} H${x - 6}" fill="none" stroke="#d9534f" stroke-width="2"/><text x="${x + 5}" y="${(y1 + y2) / 2 + 5}" class="s" style="fill:#d9534f">${t}</text>`;
    const G = [['前髮際至後髮際', '12 寸'], ['歧骨至臍中', '8 寸'], ['臍中至恥骨上緣', '5 寸'], ['肘橫紋至腕橫紋', '12 寸'], ['膝中至外踝尖', '16 寸'], ['犢鼻至足三里', '3 寸']];
    return svgWrap('0 0 360 290', `<rect x="40" y="30" width="30" height="116" rx="14" ${sk}/><line x1="42" y1="70" x2="68" y2="70" ${ln}/><line x1="42" y1="102" x2="68" y2="102" ${ln}/>${vb(80, 70, 102, '1寸')}
      <rect x="158" y="54" width="36" height="92" rx="16" ${sk}/><line x1="160" y1="88" x2="192" y2="88" ${ln}/>${br(158, 194, 42, '1寸')}
      ${[0, 1, 2, 3].map(i => `<rect x="${250 + i * 24}" y="${i === 1 ? 50 : 56}" width="22" height="${i === 1 ? 96 : 90}" rx="10" ${sk}/>`).join('')}<line x1="250" y1="96" x2="344" y2="96" stroke="#d9534f" stroke-width="1.5" stroke-dasharray="3 3"/>${br(250, 344, 38, '3寸')}
      <text x="60" y="166" text-anchor="middle" class="xs">中指同身寸</text><text x="176" y="166" text-anchor="middle" class="xs">拇指同身寸</text><text x="297" y="166" text-anchor="middle" class="xs">一夫法（四指併攏）</text>
      <text x="180" y="192" text-anchor="middle" class="s">常用骨度分寸</text>
      ${G.map(([a, b], i) => { const x = 4 + (i % 3) * 119, y = 202 + (i / 3 | 0) * 44; return `<rect x="${x}" y="${y}" width="113" height="38" rx="8" fill="var(--pri)" opacity=".13"/><text x="${x + 56}" y="${y + 16}" text-anchor="middle" class="xs">${a}</text><text x="${x + 56}" y="${y + 32}" text-anchor="middle" class="xs" style="font-weight:700">${b}</text>`; }).join('')}`, '取穴量度：同身寸與骨度分寸圖');
  },
  wushu: () => {
    const P = [['井', '所出', '如泉源', '少商'], ['滎', '所溜', '如小流', '魚際'], ['輸', '所注', '如灌注', '太淵'], ['經', '所行', '如江河', '經渠'], ['合', '所入', '歸大海', '尺澤']];
    return svgWrap('0 0 360 220', `<polygon points="16,102 344,78 344,130 16,106" fill="#2f6fb0" opacity=".22"/>
      <text x="16" y="148" class="xs" style="fill:var(--mut)">指（趾）端</text><text x="344" y="148" text-anchor="end" class="xs" style="fill:var(--mut)">肘（膝）</text>
      ${P.map(([n, a, b, e], i) => { const x = 40 + i * 70; return `<text x="${x}" y="40" text-anchor="middle" class="s">${a}</text><text x="${x}" y="58" text-anchor="middle" class="xs" style="fill:var(--mut)">${b}</text><circle cx="${x}" cy="104" r="19" fill="#2f6fb0"/><text x="${x}" y="111" text-anchor="middle" class="b" style="fill:#fff">${n}</text><text x="${x}" y="176" text-anchor="middle" class="s">${e}</text>`; }).join('')}
      <text x="180" y="204" text-anchor="middle" class="xs" style="fill:var(--mut)">例：手太陰肺經的五輸穴</text>`, '五輸穴經氣流注圖');
  },
  jingdian: () => {
    const B = [['黃帝內經', '戰國–西漢', '理論奠基', '#3f9b5b'], ['神農本草經', '東漢', '本草之祖', '#c9a227'], ['傷寒雜病論', '東漢末・張仲景', '方書之祖', '#c0392b'], ['溫病條辨', '清・吳鞠通', '溫病集成', '#2f6fb0']];
    return svgWrap('0 0 360 240', `<defs><marker id="jdA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="var(--mut)"/></marker></defs>
      <line x1="6" y1="120" x2="352" y2="120" stroke="var(--mut)" stroke-width="3" marker-end="url(#jdA)"/>`
      + B.map(([n, t, d, c], i) => { const x = 56 + i * 84, up = i % 2 === 0, y = up ? 14 : 140; return `<line x1="${x}" y1="${up ? 99 : 120}" x2="${x}" y2="${up ? 120 : 140}" stroke="${c}" stroke-width="2"/><circle cx="${x}" cy="120" r="7" fill="${c}"/>
        <rect x="${x - 52}" y="${y}" width="104" height="85" rx="10" fill="${c}" opacity=".15"/><rect x="${x - 52}" y="${y}" width="104" height="85" rx="10" fill="none" stroke="${c}" stroke-width="1.5"/>
        <text x="${x}" y="${y + 24}" text-anchor="middle" style="font-size:18px">📜</text><text x="${x}" y="${y + 46}" text-anchor="middle" class="s" style="font-weight:700">${n}</text><text x="${x}" y="${y + 62}" text-anchor="middle" class="xs">${t}</text><text x="${x}" y="${y + 77}" text-anchor="middle" class="xs" style="fill:${c};font-weight:700">${d}</text>`; }).join(''), '中醫經典年代圖');
  },
  liujing: () => {
    const L = [['太陽', '脈浮・頭項強痛・惡寒', '麻黃湯・桂枝湯', '#e07a3a'], ['陽明', '大熱・大汗・大渴・脈洪大', '白虎湯・承氣湯', '#d9534f'], ['少陽', '口苦・咽乾・往來寒熱', '小柴胡湯', '#c9a227'], ['太陰', '腹滿・吐利・食不下', '理中丸', '#5f9a5f'], ['少陰', '脈微細・但欲寐', '四逆湯', '#2f6fb0'], ['厥陰', '寒熱錯雜・消渴', '烏梅丸', '#5a4a8a']];
    return svgWrap('0 0 360 322', `<defs><marker id="ljA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="var(--mut)"/></marker></defs>
      <text x="22" y="15" class="xs" style="fill:var(--mut)">外感病傳變：由表入裡、由陽入陰 ↓</text><line x1="9" y1="26" x2="9" y2="314" stroke="var(--mut)" stroke-width="2" marker-end="url(#ljA)"/>`
      + L.map(([n, d, f, c], i) => { const y = 24 + i * 50; return `${box(20, y, 66, 44, c, n)}<rect x="92" y="${y}" width="264" height="44" rx="10" fill="${c}" opacity=".14"/><text x="102" y="${y + 19}" class="s">${d}</text><text x="102" y="${y + 37}" class="xs" style="fill:var(--mut)">代表方：${f}</text>`; }).join(''), '傷寒六經辨證圖');
  },
  weiqi: () => {
    const R = [['衛分', '發熱微惡寒', 140, '#f3c58a', '#5a3a10'], ['氣分', '壯熱口渴', 108, '#e9a86b', '#fff'], ['營分', '身熱夜甚', 76, '#d9534f', '#fff'], ['血分', '耗血動血', 44, '#8f2a2a', '#fff']];
    return svgWrap('0 0 300 300', R.map(([n, d, r, c, t]) => `<circle cx="150" cy="150" r="${r}" fill="${c}" stroke="var(--card)" stroke-width="2"/>`).join('')
      + R.map(([n, d, r, c, t], i) => i < 3 ? `<text x="150" y="${150 - r + 23}" text-anchor="middle" class="s" style="fill:${t};font-weight:700">${n}</text><text x="150" y="${150 + r - 12}" text-anchor="middle" class="xs" style="fill:${t}">${d}</text>` : `<text x="150" y="150" text-anchor="middle" class="s" style="fill:${t};font-weight:700">${n}</text><text x="150" y="168" text-anchor="middle" class="xs" style="fill:${t}">${d}</text>`).join(''), '衛氣營血辨證層次圖');
  },
  yangsheng: () => {
    const S = [['🌱', '春生', '養肝', 180, '#3f9b5b'], ['☀️', '夏長', '養心', 270, '#d9534f'], ['🍂', '秋收', '養肺', 0, '#8a94a6'], ['❄️', '冬藏', '養腎', 90, '#2f6fb0']];
    const rad = a => a * Math.PI / 180;
    return svgWrap('0 0 300 300', S.map(([e, n, o, a0, c]) => { const m = rad(a0 + 45), x = (150 + 94 * Math.cos(m)).toFixed(1), y = 150 + 94 * Math.sin(m); return `<path d="${arc(150, 150, 48, 140, rad(a0), rad(a0 + 90))}" fill="${c}" stroke="var(--card)" stroke-width="3"/>
      <text x="${x}" y="${(y - 12).toFixed(1)}" text-anchor="middle" style="font-size:22px">${e}</text><text x="${x}" y="${(y + 14).toFixed(1)}" text-anchor="middle" class="b" style="fill:#fff">${n}</text><text x="${x}" y="${(y + 32).toFixed(1)}" text-anchor="middle" class="xs" style="fill:#fff">${o}</text>`; }).join('')
      + `<circle cx="150" cy="150" r="46" fill="var(--card)"/><text x="150" y="146" text-anchor="middle" class="s">春夏養陽</text><text x="150" y="168" text-anchor="middle" class="s">秋冬養陰</text>`, '四季養生圖');
  }
};

/* ---------- 十四經脈循行圖 ---------- */
const ARM = [[92, 80], [70, 150], [56, 225], [52, 246], [52, 266]], LEG = [[114, 192], [110, 290], [108, 385], [106, 400]];
/* 沿肢體中線取點：t 為節點索引（手臂 1=肘、3=腕；腿 1=膝、2=踝），off 為偏移（正值偏內側、負值偏外側） */
function at(P, off, t) {
  const i = Math.min(Math.floor(t), P.length - 2), f = t - i, [x0, y0] = P[i], [x1, y1] = P[i + 1], dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy);
  return [+(x0 + dx * f + dy / l * off).toFixed(1), +(y0 + dy * f - dx / l * off).toFixed(1)];
}
function along(P, off, t0, t1) {
  const up = t0 <= t1, [a, b] = up ? [t0, t1] : [t1, t0], ts = [a];
  for (let k = Math.floor(a) + 1; k < b; k++) ts.push(k);
  ts.push(b);
  const r = ts.map(t => at(P, off, t));
  return up ? r : r.reverse();
}
/* v: f=正面 b=背面；p: 主幹（依經氣方向）；br: 分支；pts: [穴名, [x,y], 標籤偏移 dx, dy]；mid: 位於正中線，不左右對稱；note: 圖上補充說明 */
const MERIDIANS = {
  LU: { n: '手太陰肺經', v: 'f', p: [[98, 86], [90, 84], ...along(ARM, -5, 0.05, 3), [45, 254], [43, 263]],
    pts: [['中府', [98, 86], 8, 4], ['尺澤', at(ARM, -5, 1)], ['列缺', at(ARM, -5, 2.43)], ['少商', [43, 263]]] },
  LI: { n: '手陽明大腸經', v: 'f', p: [[47, 268], [46, 254], ...along(ARM, -8, 3, 0), [94, 72], [118, 64], [120, 52], [130, 50], [136, 45]],
    pts: [['商陽', [47, 268], -8, 10], ['合谷', [46, 254]], ['曲池', at(ARM, -8, 1)], ['肩髃', [86, 76]], ['迎香', [136, 45], 22, 0, 's']] },
  ST: { n: '足陽明胃經', v: 'f', p: [[122, 33], [121, 44], [123, 50], [116, 56], [119, 66], [112, 76], [110, 96], [110, 136], [120, 144], [120, 188], ...along(LEG, -4, 0.05, 2), [102, 400], [100, 405]],
    br: [[[116, 56], [110, 40], [112, 22]]],
    pts: [['承泣', [122, 33], 30, -2, 's'], ['頭維', [112, 22]], ['天樞', [120, 148], 14, 4, 's'], ['足三里', at(LEG, -4, 1.19)], ['內庭', [100, 405], -6, 8]] },
  SP: { n: '足太陰脾經', v: 'f', p: [[117, 404], [116, 392], ...along(LEG, 8, 2, 0.05), [112, 186], [112, 124], [102, 112], [102, 88], [98, 112]],
    pts: [['隱白', [117, 404], -26, 10], ['三陰交', at(LEG, 8, 1.81)], ['陰陵泉', at(LEG, 8, 1.05)], ['血海', at(LEG, 8, 0.82)], ['大包', [98, 112], -8]] },
  HT: { n: '手少陰心經', v: 'f', p: [[94, 92], ...along(ARM, 6, 0.25, 3), [58, 256], [58, 265]],
    pts: [['極泉', [94, 92], 12, 18, 's'], ['少海', at(ARM, 6, 1)], ['神門', at(ARM, 6, 3)], ['少衝', [58, 265], -10, 8]] },
  SI: { n: '手太陽小腸經', v: 'b', p: [[58, 266], [59, 256], ...along(ARM, 7, 3, 0.2), [96, 92], [106, 104], [112, 86], [118, 66], [112, 50], [108, 40]],
    pts: [['少澤', [58, 266], -10, 8], ['後溪', [59, 254]], ['小海', at(ARM, 7, 1)], ['天宗', [106, 104], 30, 8, 's'], ['聽宮', [108, 40]]] },
  BL: { n: '足太陽膀胱經', v: 'b', p: [[124, 16], [124, 40], [124, 62], [122, 78], [122, 186], [118, 198], ...along(LEG, 0, 0.15, 1.85), at(LEG, -7, 1.98), [96, 398], [90, 401]],
    br: [[[124, 62], [114, 80], [114, 186], at(LEG, -2, 0.4), at(LEG, 0, 1)]],
    pts: [['天柱', [124, 62], -14, 0], ['肺俞', [122, 92], -14, 4], ['腎俞', [122, 160], -14, 4], ['委中', at(LEG, 0, 1)], ['承山', at(LEG, 0, 1.45)], ['至陰', [90, 401], -6, 8]],
    note: '起於目內眥（睛明），上額交巔' },
  KI: { n: '足少陰腎經', v: 'f', p: [[108, 404], [118, 392], ...along(LEG, 9, 1.97, 0.05), [126, 186], [126, 134], [120, 126], [120, 78]],
    pts: [['湧泉', [108, 404], -22, 10], ['太溪', at(LEG, 9, 1.97)], ['陰谷', at(LEG, 9, 1)], ['俞府', [120, 78], -4, -4]], note: '湧泉位於足底' },
  PC: { n: '手厥陰心包經', v: 'f', p: [[104, 100], [93, 94], ...along(ARM, 0, 0.3, 3), [52, 268]],
    pts: [['天池', [104, 100], 10, 4, 's'], ['曲澤', at(ARM, 0, 1)], ['內關', at(ARM, 0, 2.24)], ['勞宮', [52, 256]]] },
  SJ: { n: '手少陽三焦經', v: 'b', p: [[55, 267], [53, 254], ...along(ARM, 0, 3, 0.1), [98, 76], [116, 60], [110, 46], [106, 32]],
    pts: [['關衝', [55, 267], -10, 8], ['外關', at(ARM, 0, 2.24)], ['肩髎', [90, 78], -6], ['翳風', [110, 46], 30, 6, 's']], note: '繞耳後上行，止於眉梢（絲竹空）' },
  GB: { n: '足少陽膽經', v: 'f', p: [[117, 36], [109, 40], [110, 22], [108, 34], [112, 58], [104, 74], [94, 110], [96, 160], [99, 190], ...along(LEG, -10, 0.05, 2), [96, 400], [95, 405]],
    pts: [['瞳子髎', [117, 36], 26, -8, 's'], ['肩井', [104, 74], -10, -4], ['環跳', [99, 190]], ['陽陵泉', at(LEG, -10, 1.1)], ['懸鐘', at(LEG, -10, 1.8)]], note: '頭側往返迂曲，後經風池下行' },
  LR: { n: '足厥陰肝經', v: 'f', p: [[113, 404], [111, 392], ...along(LEG, 5, 2, 0.05), [118, 190], [104, 168], [96, 150], [108, 116]],
    pts: [['大敦', [113, 404], -18, 10], ['太衝', [111, 392]], ['曲泉', at(LEG, 5, 1)], ['章門', [96, 150]], ['期門', [108, 116], -16, -6]] },
  GV: { n: '督脈', v: 'b', mid: 1, p: [[130, 194], [130, 16]], note: '續行過頭頂，止於上齒齦（齦交）',
    pts: [['長強', [130, 194], 10, 4, 's'], ['命門', [130, 160], 10, 4, 's'], ['大椎', [130, 76], 10, 4, 's'], ['風府', [130, 58], 10, 4, 's'], ['百會', [130, 17], 10, 2, 's']] },
  CV: { n: '任脈', v: 'f', mid: 1, p: [[130, 198], [130, 54]], note: '起於胞中，出會陰，上行至唇下',
    pts: [['關元', [130, 172], 10, 4, 's'], ['神闕', [130, 148], 10, 4, 's'], ['中脘', [130, 116], 10, 4, 's'], ['膻中', [130, 98], 10, 4, 's'], ['承漿', [130, 54], 10, 4, 's']] }
};
const pl = a => a.map(p => p.join(',')).join(' ');
const mirror = a => a.map(([x, y]) => [260 - x, y]);
function merFig(id) {
  const m = MERIDIANS[id], c = MER_COLOR[m.n], f = m.v === 'f', s = m.p[0], e = m.p[m.p.length - 1];
  const head = f ? `<g class="hd"><circle cx="122" cy="35" r="2"/><circle cx="138" cy="35" r="2"/><path d="M130 38v7M124 51q6 3 12 0"/></g>` : '';
  const ears = `<ellipse class="ear" cx="107" cy="40" rx="3" ry="6"/><ellipse class="ear" cx="153" cy="40" rx="3" ry="6"/>`;
  const line = (a, cls) => `<polyline class="${cls}" points="${pl(a)}" style="stroke:${c}"${cls === 'mp' ? ` marker-end="url(#ar${id})"` : ''}/>`;
  const all = [m.p, ...(m.br || [])];
  const paths = all.map((a, i) => line(a, i ? 'mb' : 'mp')).join('') + (m.mid ? '' : all.map(a => line(mirror(a), 'mm')).join(''));
  const pts = m.pts.map(([n, [x, y], dx = -12, dy = 4, a]) => {
    const st = a === 's' || (dx > 0 && a !== 'e'), lx = x + dx, ly = y + dy;
    const lead = Math.hypot(dx, dy) > 14 ? `<line x1="${x}" y1="${y}" x2="${lx + (st ? -2 : 2)}" y2="${ly - 4}" stroke="${c}" stroke-width=".8"/>` : '';
    return `${lead}<circle cx="${x}" cy="${y}" r="4.5" fill="${c}" stroke="var(--card)" stroke-width="1.2"/><text x="${lx}" y="${ly}" text-anchor="${st ? 'start' : 'end'}" class="pl">${n}</text>`;
  }).join('');
  return `<svg class="fig mf" viewBox="-40 -14 340 ${m.note ? 468 : 450}" role="img" aria-label="${m.n}循行圖（${f ? '正面' : '背面'}）">
    <defs><marker id="ar${id}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0L10,5L0,10z" fill="${c}"/></marker></defs>
    ${bodyBase()}${ears}${head}${paths}
    <circle cx="${s[0]}" cy="${s[1]}" r="7" fill="none" stroke="${c}" stroke-width="2"/>
    ${pts}
    <text x="-34" y="4" class="xs" style="fill:${c};font-weight:700">${m.n}</text><text x="294" y="4" text-anchor="end" class="xs" style="fill:var(--mut)">${f ? '正面' : '背面'}</text>
    <text x="-34" y="428" class="xs" style="fill:var(--mut)">◯ 起點　▶ 經氣方向${m.mid ? '' : '　淡線：對側'}</text>
    ${m.note ? `<text x="-34" y="448" class="xs" style="fill:var(--mut)">※ ${m.note}</text>` : ''}</svg>`;
}
Object.keys(MERIDIANS).forEach(id => { FIG['m' + id] = () => merFig(id); });

/* ---------- 圖解課程 ---------- */
function renderLessons() {
  const id = location.hash.split('?')[1];
  const done = DB.get().lessons || {};
  const L = LESSONS.find(x => x.id === id);
  if (!L) {
    const card = l => { const i = LESSONS.indexOf(l); return `<a class="lesson" href="#/lessons?${l.id}"><div class="lthumb">${FIG[l.fig]()}</div><div><small class="muted">第 ${i + 1} 課 ${done[l.id] ? '<span class="ok">✔ 已完成</span>' : ''}</small><b>${l.t}</b></div></a>`; };
    app.innerHTML = `<h1>圖解課程</h1><p class="muted">參考中醫學系核心課程（中醫基礎理論、中醫診斷學、中藥學、方劑學、針灸學、內經・傷寒・溫病）編排為 ${UNITS.length} 個單元、${LESSONS.length} 堂圖文課，每堂附插圖與小測驗。已完成 ${LESSONS.filter(l => done[l.id]).length}/${LESSONS.length}。</p>
      ${UNITS.map((u, ui) => { const ls = u.ids.map(id => LESSONS.find(l => l.id === id)); return `<section class="unit"><h2>${u.ic} 第${'一二三四五六七八九十'[ui]}單元　${u.t} <small class="muted">${ls.filter(l => done[l.id]).length}/${ls.length}</small></h2><p class="muted">${u.d}</p><div class="lessons">${ls.map(card).join('')}</div></section>`; }).join('')}`;
    return;
  }
  const n = LESSONS.indexOf(L), prev = LESSONS[n - 1], next = LESSONS[n + 1];
  app.innerHTML = `<p><a class="muted" href="#/lessons">← 全部課程</a></p>
    <h1><small class="muted">${UNITS[unitOf(L.id)].ic} ${UNITS[unitOf(L.id)].t}・第 ${n + 1} 課</small><br>${L.t}</h1>
    <figure class="card figbox">${FIG[L.fig]()}<figcaption class="muted">圖 ${n + 1}　${L.t}</figcaption></figure>
    <p>${L.sum}</p>
    <h2>重點整理</h2><ul class="pts">${L.pts.map(p => `<li>${p}</li>`).join('')}</ul>
    <h2>隨堂小測</h2><div id="lq"></div>
    <div class="row between">${prev ? `<a class="btn ghost" href="#/lessons?${prev.id}">← ${prev.t}</a>` : '<span></span>'}${next ? `<a class="btn" href="#/lessons?${next.id}">${next.t} →</a>` : `<a class="btn" href="#/lessons">回到課程列表</a>`}</div>`;
  let k = 0, right = 0;
  const ask = () => {
    if (k >= L.quiz.length) {
      if (right === L.quiz.length) DB.patch(x => { (x.lessons = x.lessons || {})[L.id] = 1; });
      $('#lq').innerHTML = `<div class="card"><p>答對 <b>${right}/${L.quiz.length}</b> ${right === L.quiz.length ? '🎉 本課完成！' : '— 再試一次就能完成本課。'}</p><button class="btn ghost" id="lr">重新作答</button></div>`;
      $('#lr').onclick = () => { k = 0; right = 0; ask(); }; return;
    }
    const [q, a, w] = L.quiz[k], o = shuffle([a, ...w]);
    $('#lq').innerHTML = `<div class="card"><p class="muted">${k + 1}/${L.quiz.length}</p><p class="q">${q}</p><div class="opts">${o.map(x => `<button class="opt">${x}</button>`).join('')}</div><div id="lfb"></div></div>`;
    document.querySelectorAll('#lq .opt').forEach(b => b.onclick = () => {
      const ok = b.textContent === a; if (ok) right++;
      document.querySelectorAll('#lq .opt').forEach(x => { x.disabled = true; if (x.textContent === a) x.classList.add('ok'); });
      if (!ok) b.classList.add('no');
      $('#lfb').innerHTML = `<p class="fb ${ok ? 'ok' : 'no'}">${ok ? '✔ 答對了！' : `✘ 正確答案：${a}`}</p><button class="btn" id="ln">${k + 1 === L.quiz.length ? '看結果' : '下一題'}</button>`;
      $('#ln').onclick = () => { k++; ask(); };
    });
  };
  ask();
}

/* ---------- 路由 ---------- */
const routes = {
  home: renderHome, theory: renderTheory, herbs: renderHerbs, points: renderPoints,
  formulas: renderFormulas, learn: renderLearn, cards: renderCards, quiz: renderQuiz, body: renderBody, lessons: renderLessons, cale: renderCale
};
const NAV = [['home', '首頁', '🏠'], ['learn', '學習', '📖'], ['cards', '閃卡', '🃏'], ['quiz', '測驗', '✅'], ['body', '體質', '🧘']];
const NAVGROUP = { cale: 'quiz', lessons: 'learn', theory: 'learn', herbs: 'learn', points: 'learn', formulas: 'learn' };

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
      ${tile('lessons', '🖼️', '圖解課程', UNITS.length + ' 單元 ' + LESSONS.length + ' 堂：基礎、診斷、中藥、方劑、針灸、經脈、經典')}
      ${tile('herbs', '🌿', '中藥圖鑑', HERBS.length + ' 味常用中藥：性味歸經功效')}
      ${tile('points', '📍', '經絡穴位', POINTS.length + ' 個常用穴位與定位')}
      ${tile('formulas', '⚗️', '經典方劑', FORMULAS.length + ' 首名方與組成')}
      ${tile('cards', '🃏', '翻牌記憶', '記住的卡片會被記錄')}
      ${tile('quiz', '✅', '隨堂測驗', '每回 10 題，自動出題')}
      ${tile('cale', '🎓', '加州針灸執照考 CALE', '官方範例題＋依考試大綱模擬考')}
      ${tile('body', '🧘', '體質測試', '九種體質自我檢測與養生建議')}
    </div>
    ${d.constitution ? `<p class="muted">上次體質結果：<b>${d.constitution}</b></p>` : ''}
    <p class="disc">⚠️ 本 App 僅供中醫學習與文化推廣，內容不能取代專業醫師診斷與治療。</p>`;
}
const tile = (r, i, t, s) => `<a class="tile" href="#/${r}"><span class="ti">${i}</span><b>${t}</b><small>${s}</small></a>`;
function renderLearn() {
  app.innerHTML = `<h1>學習</h1><div class="grid">
    ${tile('lessons', '🖼️', '圖解課程', '圖文並茂的入門課')}
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
        <div class="face front"><span class="tag">${c.tag}</span>${c.icon ? `<div class="big ico">${c.icon}</div>` : ''}<div class="big">${c.front}</div><small>${c.sub}</small><p class="muted">點擊翻面</p></div>
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
  LESSONS.forEach(l => l.quiz.forEach(([q, a, w]) => Q.push({ q, o: shuffle([a, ...w]), a, e: `出自圖解課程「${l.t}」。` })));
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
        <div class="row"><button class="btn" id="again">再測一次</button><a class="btn ghost" href="#/cale">🎓 加州執照考練習</a></div>`;
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

/* ---------- 加州針灸執照考試（CALE）練習 ---------- */
const CALE_EXAM_N = 50, CALE_EXAM_MIN = 75; // 正式考試 200 題 5 小時（每題 1.5 分鐘），模擬考按比例縮小
function calePickExam() {
  // 依官方大綱權重分配題數，最後一個領域補足餘數
  let left = CALE_EXAM_N;
  return shuffle(CALE_DOMAINS.flatMap((D, i) => {
    const pool = CALE.map((q, id) => ({ ...q, id })).filter(q => q.d === D.k);
    const n = i === CALE_DOMAINS.length - 1 ? left : Math.round(CALE_EXAM_N * D.w / 100);
    left -= n;
    return pick(pool, Math.min(n, pool.length));
  }));
}
function renderCale() {
  const d = DB.get(), wrong = d.caleWrong || {};
  const all = CALE.map((q, id) => ({ ...q, id }));
  const nW = Object.keys(wrong).length;
  app.innerHTML = `<h1>加州針灸執照考試 <small class="muted">CALE</small></h1>
    <p class="muted">California Acupuncture Licensing Examination：正式考試 200 題單選（175 題計分、25 題試測），限時 5 小時，提供英、中、韓文版本，採標準參照計分（只告知通過與否）。</p>
    <div class="stats">
      <div class="stat"><b>${CALE.length}</b><span>題庫題數</span></div>
      <div class="stat"><b>${d.caleBest != null ? d.caleBest + '%' : '—'}</b><span>模擬考最高</span></div>
      <div class="stat"><b>${nW}</b><span>待複習錯題</span></div>
    </div>
    <h2>開始練習</h2>
    <div class="grid">
      <button class="tile" data-m="exam"><span class="ti">⏱️</span><b>全真模擬考</b><small>${CALE_EXAM_N} 題・${CALE_EXAM_MIN} 分鐘・依官方權重抽題，交卷才公布答案</small></button>
      <button class="tile" data-m="official"><span class="ti">📜</span><b>官方範例題</b><small>${CALE.filter(q => q.official).length} 題・PSI 考生手冊 Appendix B（附英文原題）</small></button>
      <button class="tile" data-m="wrong" ${nW ? '' : 'disabled'}><span class="ti">🔁</span><b>錯題複習</b><small>${nW ? nW + ' 題，答對即移出' : '目前沒有錯題'}</small></button>
    </div>
    <h2>依考試領域練習</h2>
    <div class="grid">${CALE_DOMAINS.map(D => `<button class="tile" data-m="d${D.k}"><span class="ti">${'①②③④'[D.k - 1]}</span><b>${D.t} <small class="muted">${D.w}%</small></b><small>${D.en}・${all.filter(q => q.d === D.k).length} 題<br>${D.d}</small></button>`).join('')}</div>
    <p class="disc">ℹ️ 考試大綱與權重依加州針灸局 2021 職業分析（Occupational Analysis）；考試脈名使用 New CAM 英文名（如 String-taut、Rolling、Hesitant），穴名代號如 Sp 6、Liv 3。<b>CALE 正式考題保密不公開</b>（取得、散布考題屬違法並可能導致不予發照），本區除標示「官方範例」者外均為依大綱自編之模擬題。法規以加州針灸局（acupuncture.ca.gov）最新公告為準。</p>`;
  app.querySelectorAll('[data-m]').forEach(b => b.onclick = () => {
    const m = b.dataset.m;
    if (m === 'exam') return caleRun(calePickExam(), { exam: true, title: '全真模擬考' });
    if (m === 'official') return caleRun(all.filter(q => q.official), { title: '官方範例題' });
    if (m === 'wrong') return caleRun(shuffle(all.filter(q => wrong[q.id])), { title: '錯題複習' });
    const D = CALE_DOMAINS[+m.slice(1) - 1];
    caleRun(pick(all.filter(q => q.d === D.k), 10), { title: D.t });
  });
}
function caleRun(qs, { exam = false, title }) {
  const ans = qs.map(q => ({ o: shuffle([q.a, ...q.w]), pick: null }));
  let i = 0, timer = null, end = exam ? Date.now() + CALE_EXAM_MIN * 60000 : 0;
  const mark = (q, ok) => DB.patch(x => { x.caleWrong = x.caleWrong || {}; if (ok) delete x.caleWrong[q.id]; else x.caleWrong[q.id] = 1; });
  const clock = () => { const t = Math.max(0, end - Date.now()), el = $('#clk'); if (el) el.textContent = `⏱ ${Math.floor(t / 60000)}:${String(Math.floor(t / 1000) % 60).padStart(2, '0')}`; if (!t) finish(); };
  const finish = () => {
    clearInterval(timer); removeEventListener('hashchange', stop);
    const res = qs.map((q, n) => ({ q, ok: ans[n].pick === q.a, picked: ans[n].pick }));
    const right = res.filter(r => r.ok).length, pct = Math.round(right / qs.length * 100);
    if (exam) DB.patch(x => { x.caleBest = Math.max(x.caleBest || 0, pct); x.caleExams = (x.caleExams || 0) + 1; });
    res.forEach(r => mark(r.q, r.ok));
    const byD = CALE_DOMAINS.map(D => { const r = res.filter(x => x.q.d === D.k); return { D, n: r.length, ok: r.filter(x => x.ok).length }; }).filter(x => x.n);
    app.innerHTML = `<h1>${title}・結果</h1><div class="card center"><div class="big">${right} / ${qs.length}</div><p>${pct}%　${pct >= 70 ? '👍 表現不錯，持續保持' : '📚 再加強弱項領域'}</p>
      <p class="muted">CALE 採標準參照計分，及格分數依各版本難度設定，此百分比僅供自我評估。</p></div>
      <h2>各領域得分</h2>${byD.map(x => `<div class="meter"><span>${x.D.t}</span><div class="bar"><i style="width:${x.ok / x.n * 100}%"></i></div><b>${x.ok}/${x.n}</b></div>`).join('')}
      ${res.some(r => !r.ok) ? `<h2>答錯的題目</h2>${res.filter(r => !r.ok).map(r => `<div class="card"><p><b>${r.q.q}</b></p>${r.picked ? `<p class="no">你的答案：${r.picked}</p>` : '<p class="no">未作答</p>'}<p class="ok">正解：${r.q.a}</p><p class="muted">${r.q.e}</p></div>`).join('')}` : ''}
      <div class="row"><button class="btn ghost" id="back">回到 CALE 首頁</button><button class="btn" id="again">再練一次</button></div>`;
    $('#back').onclick = renderCale;
    $('#again').onclick = () => caleRun(exam ? calePickExam() : shuffle(qs), { exam, title });
    window.scrollTo(0, 0);
  };
  const stop = () => clearInterval(timer);
  const show = () => {
    if (!exam && i >= qs.length) return finish();
    const q = qs[i], a = ans[i];
    app.innerHTML = `<p><a class="muted" href="#/cale" id="quit">← 離開${exam ? '（不計分）' : ''}</a></p>
      <div class="row between"><h1>${title}</h1>${exam ? '<b id="clk"></b>' : ''}</div>
      <div class="bar"><i style="width:${i / qs.length * 100}%"></i></div>
      <p class="muted">第 ${i + 1} / ${qs.length} 題　<span class="tag">${CALE_DOMAINS[q.d - 1].t}</span>${q.official ? ' <span class="tag hot">官方範例</span>' : ''}</p>
      <div class="card"><p class="q">${q.q}</p>${q.en ? `<details class="muted"><summary>英文原題 English</summary><p>${q.en}</p></details>` : ''}
      <div class="opts">${a.o.map((o, n) => `<button class="opt${exam && a.pick === o ? ' sel' : ''}" data-n="${n}">${'ABCD'[n]}. ${o}</button>`).join('')}</div><div id="fb"></div></div>
      ${exam ? `<div class="row between"><button class="btn ghost" id="pv" ${i ? '' : 'disabled'}>← 上一題</button><span class="muted">已答 ${ans.filter(x => x.pick).length}/${qs.length}</span>${i + 1 < qs.length ? '<button class="btn" id="nx">下一題 →</button>' : '<button class="btn" id="sub">交卷</button>'}</div>
        <div class="row"><button class="btn ghost" id="sub2">提前交卷</button></div>` : ''}`;
    if (exam) {
      clock();
      app.querySelectorAll('.opt').forEach(b => b.onclick = () => { a.pick = a.o[b.dataset.n]; app.querySelectorAll('.opt').forEach(x => x.classList.toggle('sel', x === b)); show(); });
      if ($('#pv')) $('#pv').onclick = () => { i--; show(); };
      if ($('#nx')) $('#nx').onclick = () => { i++; show(); };
      const sub = () => { const left = ans.filter(x => !x.pick).length; if (!left || confirm(`尚有 ${left} 題未作答，確定交卷？`)) finish(); };
      if ($('#sub')) $('#sub').onclick = sub;
      $('#sub2').onclick = sub;
      return;
    }
    app.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      const ok = a.o[b.dataset.n] === q.a; a.pick = a.o[b.dataset.n];
      app.querySelectorAll('.opt').forEach(x => { x.disabled = true; if (a.o[x.dataset.n] === q.a) x.classList.add('ok'); });
      if (!ok) b.classList.add('no');
      mark(q, ok);
      $('#fb').innerHTML = `<p class="fb ${ok ? 'ok' : 'no'}">${ok ? '✔ 答對了！' : '✘ 答錯了'}</p><p class="muted">${q.e}</p><button class="btn" id="nx">${i + 1 === qs.length ? '看結果' : '下一題'}</button>`;
      $('#nx').onclick = () => { i++; show(); };
    });
  };
  if (exam) { timer = setInterval(clock, 1000); addEventListener('hashchange', stop, { once: true }); }
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
