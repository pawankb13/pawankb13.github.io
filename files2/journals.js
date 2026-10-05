const PER = 24;
let RAW = [], filtered = [], pg = 1;
let selAbdc = new Set(), selAbs = new Set(), selSq = new Set();
let selFor = '', selFt50 = false, q = '';

const themeToggle = document.getElementById('jrk-theme-toggle');
const themeRoot = document.documentElement;

function setThemeToggleState(){
  if(!themeToggle) return;
  const isDark = themeRoot.classList.contains('jrk-dark-mode');
  themeToggle.setAttribute('aria-checked', isDark ? 'true' : 'false');
  themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  themeToggle.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
}

if(themeToggle){
  setThemeToggleState();
  themeToggle.addEventListener('click', () => {
    const isDark = themeRoot.classList.toggle('jrk-dark-mode');
    try {
      localStorage.setItem('jrk-theme', isDark ? 'dark' : 'light');
    } catch (e) {}
    setThemeToggleState();
  });
}

function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

const ABDC_CLS = {'A*':'abdc-astar','A':'abdc-a','B':'abdc-b','C':'abdc-c'};
const ABS_CLS  = {'4*':'abs-4star','4':'abs-4','3':'abs-3','2':'abs-2','1':'abs-1'};
const SQ_CLS   = {'Q1':'sq-q1','Q2':'sq-q2','Q3':'sq-q3','Q4':'sq-q4'};
const CARD_CLS = {'A*':'rank-astar','A':'rank-a','B':'rank-b','C':'rank-c'};

// Does a journal pass every active filter? `skip` leaves one filter group out,
// so each pill can show how many journals it would match alongside the others.
function matches(j, skip){
  const qq = q.toLowerCase().trim();
  if(qq && !j.t.toLowerCase().includes(qq) && !j.pub.toLowerCase().includes(qq) && !j.issn.toLowerCase().includes(qq)) return false;
  if(skip !== 'abdc' && selAbdc.size && !selAbdc.has(j.abdc)) return false;
  if(skip !== 'abs'  && selAbs.size  && !selAbs.has(j.abs))   return false;
  if(skip !== 'sq'   && selSq.size   && !selSq.has(j.sq))     return false;
  if(selFor  && j.fl !== selFor) return false;
  if(selFt50 && !j.ft)           return false;
  return true;
}

function updateStats(src){
  const setStat = (id, value) => {
    const el = document.getElementById(id);
    if(el) el.textContent = value.toLocaleString();
  };
  const tally = (key, skip) => {
    const counts = {};
    RAW.forEach(j => { if(j[key] && matches(j, skip)) counts[j[key]] = (counts[j[key]] || 0) + 1; });
    return v => counts[v] || 0;
  };

  setStat('stat-total', src.length);
  setStat('stat-total-abdc', src.filter(j => j.abdc).length);
  setStat('stat-total-abs', src.filter(j => j.abs).length);
  setStat('stat-total-scopus', src.filter(j => j.sq).length);
  setStat('stat-ft50', src.filter(j => j.ft).length);

  const abdcCount = tally('abdc', 'abdc');
  setStat('stat-astar', abdcCount('A*'));
  setStat('stat-a', abdcCount('A'));
  setStat('stat-b', abdcCount('B'));
  setStat('stat-c', abdcCount('C'));

  const absCount = tally('abs', 'abs');
  setStat('stat-abs4s', absCount('4*'));
  setStat('stat-abs4', absCount('4'));
  setStat('stat-abs3', absCount('3'));
  setStat('stat-abs2', absCount('2'));
  setStat('stat-abs1', absCount('1'));

  const scopusCount = tally('sq', 'sq');
  setStat('stat-q1', scopusCount('Q1'));
  setStat('stat-q2', scopusCount('Q2'));
  setStat('stat-q3', scopusCount('Q3'));
  setStat('stat-q4', scopusCount('Q4'));
}

function buildFieldDropdown(){
  const labels = [...new Set(RAW.map(j => j.fl).filter(Boolean))].sort();
  const sel = document.getElementById('jrk-for');
  labels.forEach(label => {
    const opt = document.createElement('option');
    opt.value = label;
    opt.textContent = label;
    sel.appendChild(opt);
  });
}

function filter(){
  filtered = RAW.filter(j => matches(j));
  pg = 1;
  render();
}

function render(){
  const n = filtered.length;
  document.getElementById('jrk-count').innerHTML =
    `<strong>${n.toLocaleString()}</strong> journal${n!==1?'s':''} found`;

  updateStats(filtered);

  const slice = filtered.slice((pg-1)*PER, pg*PER);
  const grid  = document.getElementById('jrk-grid');

  if(!slice.length){
    grid.innerHTML = '<div class="jrk-empty"><p>No journals match your search or filters.</p></div>';
    document.getElementById('jrk-pages').innerHTML = '';
    return;
  }

  grid.innerHTML = slice.map(j => {
    const cc  = CARD_CLS[j.abdc] || '';

    // ABDC badge
    const abdc = ABDC_CLS[j.abdc]
      ? `<span class="badge ${ABDC_CLS[j.abdc]}"><span class="bl">ABDC</span>${esc(j.abdc)}</span>`
      : `<span class="badge na"><span class="bl">ABDC</span>—</span>`;

    // ABS badge
    const abs = ABS_CLS[j.abs]
      ? `<span class="badge ${ABS_CLS[j.abs]}"><span class="bl">ABS</span>${esc(j.abs)}</span>`
      : `<span class="badge na"><span class="bl">ABS</span>—</span>`;

    // Scopus badge
    const sq = SQ_CLS[j.sq]
      ? `<span class="badge ${SQ_CLS[j.sq]}"><span class="bl">Scopus</span>${esc(j.sq)}</span>`
      : `<span class="badge na"><span class="bl">Scopus</span>—</span>`;

    const ft50Badge = j.ft ? `<span class="badge ft50-badge">FT50</span>` : '';
    const fieldTag  = j.fl ? `<span class="meta-tag">${esc(j.fl)}</span>` : '';
    const yrTag     = j.yr ? `<span class="meta-tag year">Est. ${esc(j.yr)}</span>` : '';
    const issnTag   = j.issn ? `<span class="meta-tag">ISSN ${esc(j.issn)}</span>` : '';

    // Title links to the journal's site when a valid URL is available
    const title = /^https?:\/\//i.test(j.link)
      ? `<a href="${esc(j.link)}" target="_blank" rel="noopener noreferrer">${esc(j.t)}</a>`
      : esc(j.t);

    return `<div class="jrk-card ${cc}">
      <div class="card-title">${title}</div>
      ${j.pub ? `<div class="card-pub">${esc(j.pub)}</div>` : ''}
      <div class="card-badges">${abdc}${abs}${sq}${ft50Badge}</div>
      <div class="card-meta">${fieldTag}${yrTag}${issnTag}</div>
    </div>`;
  }).join('');

  renderPages(n);
}

function renderPages(total){
  const totalPg = Math.ceil(total/PER);
  const el = document.getElementById('jrk-pages');
  if(totalPg <= 1){ el.innerHTML=''; return; }

  const range = pageRange(pg, totalPg);
  let h = `<button class="pg" onclick="goPage(${pg-1})" ${pg===1?'disabled':''}>‹</button>`;
  range.forEach(p => {
    if(p==='…') h += `<span class="pg-dots">…</span>`;
    else h += `<button class="pg ${p===pg?'on':''}" onclick="goPage(${p})">${p}</button>`;
  });
  h += `<button class="pg" onclick="goPage(${pg+1})" ${pg===totalPg?'disabled':''}>›</button>`;
  el.innerHTML = h;
}

function pageRange(cur, tot){
  if(tot<=7) return Array.from({length:tot},(_,i)=>i+1);
  const p=[1];
  if(cur>3) p.push('…');
  for(let i=Math.max(2,cur-1);i<=Math.min(tot-1,cur+1);i++) p.push(i);
  if(cur<tot-2) p.push('…');
  p.push(tot);
  return p;
}

window.goPage = function(p){
  pg=p; render();
  document.getElementById('jrk-results').scrollIntoView({behavior:'smooth'});
};

// ── Event listeners ────────────────────────────────────────────
const searchInput = document.getElementById('jrk-search');
const searchClear = document.getElementById('jrk-search-clear');

searchInput.addEventListener('input', e => {
  q = e.target.value;
  searchClear.classList.toggle('visible', q.length > 0);
  filter();
});

searchClear.addEventListener('click', () => {
  searchInput.value = '';
  q = '';
  searchClear.classList.remove('visible');
  searchInput.focus();
  filter();
});

document.querySelectorAll('[data-abdc]').forEach(btn => {
  btn.addEventListener('click', () => {
    const v=btn.dataset.abdc;
    selAbdc.has(v) ? (selAbdc.delete(v), btn.classList.remove('on')) : (selAbdc.add(v), btn.classList.add('on'));
    filter();
  });
});

document.querySelectorAll('[data-abs]').forEach(btn => {
  btn.addEventListener('click', () => {
    const v=btn.dataset.abs;
    selAbs.has(v) ? (selAbs.delete(v), btn.classList.remove('on')) : (selAbs.add(v), btn.classList.add('on'));
    filter();
  });
});

document.querySelectorAll('[data-sq]').forEach(btn => {
  btn.addEventListener('click', () => {
    const v=btn.dataset.sq;
    selSq.has(v) ? (selSq.delete(v), btn.classList.remove('on')) : (selSq.add(v), btn.classList.add('on'));
    filter();
  });
});

document.querySelectorAll('[data-ft50]').forEach(btn => {
  btn.addEventListener('click', () => {
    selFt50 = !selFt50;
    selFt50 ? btn.classList.add('on') : btn.classList.remove('on');
    filter();
  });
});

document.getElementById('jrk-for').addEventListener('change', e => {
  selFor = e.target.value;
  e.target.className = selFor ? 'active' : '';
  filter();
});

document.getElementById('jrk-clear').addEventListener('click', () => {
  q=''; selAbdc=new Set(); selAbs=new Set(); selSq=new Set(); selFor=''; selFt50=false;
  document.getElementById('jrk-search').value='';
  searchClear.classList.remove('visible');
  document.getElementById('jrk-for').value='';
  document.getElementById('jrk-for').className='';
  document.querySelectorAll('[data-abdc],[data-abs],[data-sq],[data-ft50]').forEach(b=>b.classList.remove('on'));
  filter();
});

// ── Load data ──────────────────────────────────────────────────
document.getElementById('jrk-grid').innerHTML =
  '<div class="jrk-empty"><p>Loading journals…</p></div>';

fetch('journals.json', {cache: 'no-cache'})
  .then(r => { if(!r.ok) throw new Error('Failed to load'); return r.json(); })
  .then(data => {
    // Map new JSON field names → internal short keys
    RAW = data.journals.map(j => ({
      t:    j['Journal Title']   || '',
      pub:  j['Publisher']       || '',
      issn: j['ISSN']            || '',
      yr:   j['Year Founded']    || '',
      fl:   j['Field Label']     || '',
      abdc: j['ABDC Rank']       || '',
      abs:  j['ABS Rank']        || '',
      sq:   j['Scopus Quantile'] || '',
      ft:   j['FT50'] === true,
      link: (j['Link'] || '').trim()
    }));
    filtered = RAW;
    document.getElementById('jrk-total').textContent = RAW.length.toLocaleString();
    buildFieldDropdown();
    updateStats(RAW);
    filter();
  })
  .catch(() => {
    document.getElementById('jrk-grid').innerHTML =
      '<div class="jrk-empty"><p>Could not load journal data.</p></div>';
  });
