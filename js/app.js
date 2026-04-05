// ============================================================
// SOC ACADEMY — APPLICATION LOGIC
// ============================================================

// ── Auth (Netlify Identity) ───────────────────────────────────
function initAuth() {
  const wall   = document.getElementById('login-wall');
  const appEl  = document.getElementById('app');
  const menu   = document.getElementById('user-menu');
  const avatar = document.getElementById('user-avatar');

  // Développement local → accès direct sans auth
  const isLocal = ['localhost', '127.0.0.1', ''].includes(location.hostname);
  if (typeof netlifyIdentity === 'undefined' || isLocal) {
    wall.classList.add('hidden');
    return;
  }

  netlifyIdentity.init();

  function showApp(user) {
    wall.classList.add('hidden');
    appEl.style.display = '';
    menu.classList.add('visible');
    // Afficher email court dans le topbar
    const email = user && user.email ? user.email.split('@')[0] : '';
    if (avatar) avatar.textContent = email;
    // Préfixer les clés localStorage par user id pour isoler les données
    const uid = user && user.id ? user.id : 'local';
    window._SOC_UID = uid;
  }

  function showWall() {
    wall.classList.remove('hidden');
    appEl.style.display = 'none';
    menu.classList.remove('visible');
    window._SOC_UID = null;
  }

  const currentUser = netlifyIdentity.currentUser();
  if (currentUser) {
    showApp(currentUser);
  } else {
    showWall();
  }

  netlifyIdentity.on('login',  user => { netlifyIdentity.close(); showApp(user); router(); });
  netlifyIdentity.on('logout', ()   => showWall());

  // Boutons de la login wall
  document.getElementById('btn-login') ?.addEventListener('click', () => {
    wall.style.display = 'none';
    netlifyIdentity.open('login');
  });
  document.getElementById('btn-signup')?.addEventListener('click', () => {
    wall.style.display = 'none';
    netlifyIdentity.open('signup');
  });
  document.getElementById('btn-logout')?.addEventListener('click', () => netlifyIdentity.logout());

  // Si l'utilisateur ferme le widget sans se connecter → réafficher le login wall
  netlifyIdentity.on('close', () => {
    if (!netlifyIdentity.currentUser()) {
      wall.style.display = '';
    }
  });
}

// ── State ────────────────────────────────────────────────────
const STATE_KEY  = 'soc_progress';
const LABS_KEY   = 'soc_labs';
const PROJ_KEY   = 'soc_projets';
const NOTES_KEY  = 'soc_notes';
const STREAK_KEY = 'soc_streak';

function loadState() {
  try { return JSON.parse(localStorage.getItem(STATE_KEY)) || {}; } catch { return {}; }
}
function saveState(s) { localStorage.setItem(STATE_KEY, JSON.stringify(s)); }

function loadLabs() {
  try { return JSON.parse(localStorage.getItem(LABS_KEY)) || []; } catch { return []; }
}
function saveLabs(l) { localStorage.setItem(LABS_KEY, JSON.stringify(l)); }

function loadProjets() {
  try { return JSON.parse(localStorage.getItem(PROJ_KEY)) || []; } catch { return []; }
}
function saveProjets(p) { localStorage.setItem(PROJ_KEY, JSON.stringify(p)); }

function loadNotes() {
  try { return JSON.parse(localStorage.getItem(NOTES_KEY)) || {}; } catch { return {}; }
}
function saveNotes(n) { localStorage.setItem(NOTES_KEY, JSON.stringify(n)); }

function getCompStatus(id) {
  return loadState()[id] || 'non_commence';
}
function setCompStatus(id, status) {
  const s = loadState();
  s[id] = status;
  saveState(s);
  updateStreak();
  refreshGlobalProgress();
}

// ── Progress ─────────────────────────────────────────────────
function getAllComps() {
  return CURRICULUM.modules.flatMap(m => m.competences);
}

function getProgress() {
  const s = loadState();
  const all = getAllComps();
  const total = all.length;
  const done = all.filter(c => s[c.id] && s[c.id] !== 'non_commence').length;
  const maitrise = all.filter(c => s[c.id] === 'maitrise').length;
  return { total, done, maitrise, pct: total ? Math.round((done / total) * 100) : 0 };
}

function getModuleProgress(mod) {
  const s = loadState();
  const total = mod.competences.length;
  const done = mod.competences.filter(c => s[c.id] && s[c.id] !== 'non_commence').length;
  const maitrise = mod.competences.filter(c => s[c.id] === 'maitrise').length;
  return { total, done, maitrise, pct: total ? Math.round((done / total) * 100) : 0 };
}

function refreshGlobalProgress() {
  const { pct } = getProgress();
  const bar = document.getElementById('global-progress-bar');
  const label = document.getElementById('global-progress-pct');
  if (bar) bar.style.width = pct + '%';
  if (label) label.textContent = pct + '%';
}

// ── Streak ────────────────────────────────────────────────────
function updateStreak() {
  const today = new Date().toDateString();
  let data = { last: '', count: 0 };
  try { data = JSON.parse(localStorage.getItem(STREAK_KEY)) || data; } catch {}
  if (data.last === today) return;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  data.count = data.last === yesterday ? data.count + 1 : 1;
  data.last = today;
  localStorage.setItem(STREAK_KEY, JSON.stringify(data));
  const el = document.getElementById('streak-count');
  if (el) el.textContent = data.count;
}
function getStreak() {
  try { return (JSON.parse(localStorage.getItem(STREAK_KEY)) || { count: 0 }).count; } catch { return 0; }
}

// ── Router ────────────────────────────────────────────────────
function getHash() {
  return window.location.hash.replace('#', '') || 'dashboard';
}

function navigate(hash) {
  window.location.hash = hash;
}

function router() {
  const hash = getHash();
  const parts = hash.split('/');
  const page  = parts[0];
  const param = parts[1];

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  const content = document.getElementById('content');

  switch (page) {
    case 'dashboard':     renderDashboard(content); break;
    case 'modules':       renderModules(content); break;
    case 'module':        param ? renderModuleDetail(content, param) : renderModules(content); break;
    case 'cours':         param ? renderCours(content, param) : renderModules(content); break;
    case 'labs':          renderLabs(content); break;
    case 'projets':       renderProjets(content); break;
    case 'certifications':renderCertifications(content); break;
    case 'tracker':       renderTracker(content); break;
    case 'emploi':        renderEmploi(content); break;
    default:              renderDashboard(content);
  }

  window.scrollTo(0, 0);
}

// ── Helpers ───────────────────────────────────────────────────
function statusLabel(s) {
  const map = { non_commence: '○ Non commencé', compris: '◑ Compris', pratique: '◕ Pratiqué', maitrise: '● Maîtrisé' };
  return map[s] || s;
}
function statusIcon(s) {
  const map = { non_commence: '○', compris: '◑', pratique: '◕', maitrise: '●' };
  return map[s] || '○';
}
function diffBadge(d) {
  const map = { débutant: '#10b981', intermédiaire: '#f59e0b', avancé: '#ef4444', expert: '#a855f7' };
  return `<span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;background:${map[d]||'#666'}22;color:${map[d]||'#666'};border:1px solid ${map[d]||'#666'}44">${d}</span>`;
}

function findComp(id) {
  for (const mod of CURRICULUM.modules) {
    for (const comp of mod.competences) {
      if (comp.id === id) return { comp, mod };
    }
  }
  return null;
}

function md(text) {
  if (!text) return '';
  let html = text;

  // 1. Blocs de code (avant tout le reste)
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code class="lang-${lang || 'text'}">${code.replace(/</g,'&lt;').replace(/>/g,'&gt;').trim()}</code></pre>`;
  });

  // 2. Code inline
  html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');

  // 3. Tableaux markdown
  html = html.replace(/(\|.+\|\n\|[-| :]+\|\n(?:\|.+\|\n?)+)/g, (table) => {
    const rows = table.trim().split('\n');
    const header = rows[0].split('|').filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join('');
    const body = rows.slice(2).map(row => {
      const cells = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    return `<table class="md-table"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
  });

  // 4. Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '\n');

  // 5. Titres
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // 6. Listes non ordonnées (tirets ou étoiles)
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');

  // 7. Listes ordonnées
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ol">$1</li>');

  // 8. Regrouper les <li> consécutifs en <ul> ou <ol>
  html = html.replace(/(<li>.*?<\/li>\n?)+/gs, m => {
    if (m.includes('class="ol"')) {
      return `<ol>${m.replace(/ class="ol"/g,'')}</ol>`;
    }
    return `<ul>${m}</ul>`;
  });

  // 9. Séparateurs horizontaux ---
  html = html.replace(/^---+$/gm, '<hr>');

  // 10. Gras et italique
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // 11. Paragraphes : double saut de ligne → <p>
  html = html.split(/\n{2,}/).map(block => {
    block = block.trim();
    if (!block) return '';
    if (/^<(h[1-3]|ul|ol|pre|blockquote|table|hr)/.test(block)) return block;
    return `<p>${block.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');

  return html;
}

// ── Renderer Atelier ─────────────────────────────────────────
function renderAtelier(atelier) {
  if (!atelier || typeof atelier !== 'object') return '';

  const outils = (atelier.outils || []).map(o =>
    `<span class="atelier-tool-tag">${o}</span>`
  ).join('');

  const etapes = (atelier.etapes || []).map((e, i) => `
    <div class="atelier-step">
      <div class="atelier-step-num">${i+1}</div>
      <div style="color:var(--text-muted)">${e}</div>
    </div>`).join('');

  const correction = (atelier.questions_correction || []).map(q => `
    <div class="atelier-correction-item">💬 ${q}</div>
  `).join('');

  return `
    <div class="atelier-card">
      <div class="atelier-header">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <span style="font-size:22px">🔬</span>
          <div>
            <div style="font-size:16px;font-weight:800;color:var(--text)">${atelier.titre || 'Atelier pratique'}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px">
              ${atelier.niveau ? `Niveau : ${atelier.niveau}` : ''}
              ${atelier.duree ? ` · ⏱ ${atelier.duree}` : ''}
            </div>
          </div>
        </div>
      </div>

      ${atelier.objectif ? `
        <div class="atelier-section">
          <div class="atelier-section-label">🎯 Objectif</div>
          <div style="font-size:13px;color:var(--text-muted)">${atelier.objectif}</div>
        </div>` : ''}

      ${atelier.contexte ? `
        <div class="atelier-section">
          <div class="atelier-section-label">📋 Contexte / Scénario</div>
          <div style="font-size:13px;color:var(--text);font-style:italic;background:var(--surface);padding:12px;border-radius:8px;border-left:3px solid var(--accent)">${atelier.contexte}</div>
        </div>` : ''}

      ${atelier.donnees ? `
        <div class="atelier-section">
          <div class="atelier-section-label">📂 Données fournies</div>
          <div style="font-size:13px">${md(atelier.donnees)}</div>
        </div>` : ''}

      ${outils ? `
        <div class="atelier-section">
          <div class="atelier-section-label">🛠 Outils nécessaires</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">${outils}</div>
        </div>` : ''}

      ${etapes ? `
        <div class="atelier-section">
          <div class="atelier-section-label">📝 Étapes</div>
          ${etapes}
        </div>` : ''}

      ${atelier.livrable ? `
        <div class="atelier-section" style="background:rgba(16,185,129,0.05);border:1px solid rgba(16,185,129,0.2);border-radius:8px;padding:14px">
          <div class="atelier-section-label" style="color:var(--green)">✅ Livrable attendu</div>
          <div style="font-size:13px;color:var(--text-muted)">${atelier.livrable}</div>
        </div>` : ''}

      ${correction ? `
        <div class="atelier-section">
          <div class="atelier-section-label">💡 Pistes de correction</div>
          ${correction}
        </div>` : ''}
    </div>`;
}

// ── DASHBOARD ─────────────────────────────────────────────────
function renderDashboard(el) {
  const prog = getProgress();
  const s = loadState();
  const labs = loadLabs();
  const projets = loadProjets();
  const streak = getStreak();

  // Module progress cards
  const modCards = CURRICULUM.modules.map(mod => {
    const mp = getModuleProgress(mod);
    return `
      <div class="module-card card-clickable" style="--mod-color:${mod.couleur}" onclick="navigate('module/${mod.id}')">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div class="module-badge"><span>${mod.icon}</span>${mod.mois}</div>
          <span style="font-size:13px;font-weight:700;color:${mod.couleur}">${mp.pct}%</span>
        </div>
        <div class="module-title">${mod.titre}</div>
        <div class="progress-bar-bg" style="margin-top:8px">
          <div class="progress-bar-fill" style="width:${mp.pct}%;background:${mod.couleur}"></div>
        </div>
        <div style="font-size:11px;color:var(--text-dim);margin-top:6px">${mp.done}/${mp.total} compétences</div>
      </div>`;
  }).join('');

  // Recent activity (last 5 changed comps)
  const allComps = getAllComps();
  const started = allComps.filter(c => s[c.id] && s[c.id] !== 'non_commence')
    .slice(0, 5);

  const activityHtml = started.length ? started.map(c => {
    const { mod } = findComp(c.id);
    return `
      <div class="comp-item" onclick="navigate('cours/${c.id}')" style="margin-bottom:6px">
        <div class="comp-status ${s[c.id]}">${statusIcon(s[c.id])}</div>
        <div class="comp-info">
          <div class="comp-title" style="font-size:13px">${c.titre}</div>
          <div class="comp-meta">${mod.titre} · ${statusLabel(s[c.id])}</div>
        </div>
      </div>`;
  }).join('') : '<div style="color:var(--text-dim);font-size:13px;padding:16px 0">Aucune activité pour l\'instant — commence par le Module 1 !</div>';

  // Badges
  const badgesHtml = CURRICULUM.badges.map(b => {
    const unlocked = b.condition(s, labs, projets);
    return `
      <div class="badge-item ${unlocked ? 'unlocked' : 'locked'}" title="${b.desc}">
        <div class="badge-emoji">${b.emoji}</div>
        <div class="badge-name">${b.nom}</div>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title">Dashboard</div>
      <div class="page-subtitle">Bienvenue dans SOC Academy — ta formation cybersécurité personnelle</div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(99,102,241,0.15);color:#6366f1">⬡</div>
        <div class="stat-value">${prog.pct}%</div>
        <div class="stat-label">Progression globale</div>
        <div class="stat-sub">${prog.done}/${prog.total} compétences</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(16,185,129,0.15);color:#10b981">●</div>
        <div class="stat-value">${prog.maitrise}</div>
        <div class="stat-label">Maîtrisées</div>
        <div class="stat-sub">sur ${prog.total} compétences</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(6,182,212,0.15);color:#06b6d4">⚗</div>
        <div class="stat-value">${labs.length}</div>
        <div class="stat-label">Labs complétés</div>
        <div class="stat-sub">sur ${CURRICULUM.labs.length} labs</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(245,158,11,0.15);color:#f59e0b">🔥</div>
        <div class="stat-value">${streak}</div>
        <div class="stat-label">Jours consécutifs</div>
        <div class="stat-sub">continue comme ça !</div>
      </div>
    </div>

    <div class="grid-2" style="gap:24px;margin-bottom:28px">
      <div>
        <div class="section-header"><div class="section-title">Modules de formation</div><a href="#modules" style="font-size:13px;color:var(--accent)">Voir tout</a></div>
        <div class="grid-2" style="gap:12px">${modCards}</div>
      </div>
      <div>
        <div class="section-header"><div class="section-title">Activité récente</div></div>
        <div class="card" style="padding:16px">${activityHtml}</div>

        <div class="section-header" style="margin-top:24px"><div class="section-title">Badges & Achievements</div></div>
        <div class="badges-grid">${badgesHtml}</div>
      </div>
    </div>

    <div class="card" style="background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(6,182,212,0.08));border-color:rgba(99,102,241,0.3)">
      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
        <div style="font-size:32px">🎯</div>
        <div style="flex:1">
          <div style="font-size:16px;font-weight:700;margin-bottom:4px">Objectif : SOC Analyst en 12 mois</div>
          <div style="font-size:13px;color:var(--text-muted)">Suis ta progression module par module. Chaque compétence maîtrisée te rapproche du poste visé.</div>
        </div>
        <button class="btn btn-primary" onclick="navigate('emploi')">Voir la stratégie emploi</button>
      </div>
    </div>
  `;
}

// ── MODULES LIST ──────────────────────────────────────────────
function renderModules(el) {
  const cards = CURRICULUM.modules.map(mod => {
    const mp = getModuleProgress(mod);
    return `
      <div class="module-card card-clickable" style="--mod-color:${mod.couleur}" onclick="navigate('module/${mod.id}')">
        <div class="module-badge"><span>${mod.icon}</span>${mod.mois}</div>
        <div class="module-title">${mod.titre}</div>
        <div class="module-desc">${mod.description}</div>
        <div class="module-meta">
          <span>📚 ${mod.competences.length} compétences</span>
          <span>🎯 ${mod.objectif.substring(0,50)}…</span>
        </div>
        <div class="module-progress-label">
          <span>Progression</span>
          <span style="color:${mod.couleur};font-weight:700">${mp.pct}%</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width:${mp.pct}%;background:${mod.couleur}"></div>
        </div>
        <div style="font-size:11px;color:var(--text-dim);margin-top:6px">${mp.done} commencées · ${mp.maitrise} maîtrisées</div>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title">Modules de formation</div>
      <div class="page-subtitle">12 mois · 6 modules · ${getAllComps().length} compétences</div>
    </div>
    <div class="grid-auto">${cards}</div>
  `;
}

// ── MODULE DETAIL ─────────────────────────────────────────────
function renderModuleDetail(el, modId) {
  const mod = CURRICULUM.modules.find(m => m.id === modId);
  if (!mod) { navigate('modules'); return; }
  const s = loadState();

  const compItems = mod.competences.map(comp => {
    const status = getCompStatus(comp.id);

    return `
      <div class="comp-item" onclick="navigate('cours/${comp.id}')">
        <div class="comp-status ${status}">${statusIcon(status)}</div>
        <div class="comp-info">
          <div class="comp-title">${comp.titre}</div>
          <div class="comp-meta">
            ${diffBadge(comp.difficulte)} · ${comp.duree}
          </div>
          <div style="font-size:12px;color:var(--text-dim);margin-top:4px">${comp.sous_competences.slice(0,2).join(' · ')}</div>
        </div>
        <div class="comp-action">Ouvrir →</div>
      </div>`;
  }).join('');

  const mp = getModuleProgress(mod);

  el.innerHTML = `
    <button class="back-btn" onclick="navigate('modules')">← Modules</button>
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
        <span style="font-size:36px">${mod.icon}</span>
        <div>
          <div style="font-size:11px;font-weight:700;color:${mod.couleur};text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">${mod.mois}</div>
          <div class="page-title" style="margin-bottom:0">${mod.titre}</div>
        </div>
      </div>
      <div class="page-subtitle">${mod.description}</div>
    </div>

    <div class="card" style="margin-bottom:24px;border-left:3px solid ${mod.couleur}">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
        <div>
          <div style="font-size:13px;color:var(--text-muted);margin-bottom:4px">Objectif du module</div>
          <div style="font-size:14px;font-weight:600">${mod.objectif}</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:28px;font-weight:800;color:${mod.couleur}">${mp.pct}%</div>
          <div style="font-size:12px;color:var(--text-muted)">${mp.done}/${mp.total} compétences</div>
        </div>
      </div>
      <div class="progress-bar-bg" style="margin-top:14px">
        <div class="progress-bar-fill" style="width:${mp.pct}%;background:${mod.couleur}"></div>
      </div>
    </div>

    <div class="section-title" style="margin-bottom:14px">Compétences (${mod.competences.length})</div>
    <div class="comp-list">${compItems}</div>
  `;
}

// ── COURS ─────────────────────────────────────────────────────
function renderCours(el, compId) {
  const found = findComp(compId);
  if (!found) { navigate('modules'); return; }
  const { comp, mod } = found;
  const status = getCompStatus(comp.id);
  const notes = loadNotes();
  const noteText = notes[comp.id] || '';
  const c = comp.cours || {};

  // ── Définition des onglets + filtre selon contenu disponible
  const allTabs = [
    { id: 'simple',     label: '📖 Simple',         has: () => !!c.simple },
    { id: 'technique',  label: '⚙ Technique',        has: () => !!c.technique },
    { id: 'attaquant',  label: '☠ Attaquant',         has: () => c.attaquant && c.attaquant !== 'N/A' },
    { id: 'soc',        label: '🛡 Vision SOC',        has: () => !!c.soc },
    { id: 'logs',       label: '📋 Logs & Exemples',  has: () => c.logs_exemples && c.logs_exemples !== 'N/A' },
    { id: 'atelier',    label: '🔬 Atelier SOC',       has: () => c.atelier && typeof c.atelier === 'object' },
    { id: 'cas',        label: '🔎 Cas concret',       has: () => !!c.cas_concret },
    { id: 'exercices',  label: '🧪 Exercices',         has: () => !!(c.exercices && c.exercices.length) },
    { id: 'questions',  label: '💼 Entretien',         has: () => !!(c.questions && c.questions.length) },
    { id: 'recruteur',  label: '🎯 Niveau attendu',    has: () => !!c.niveau_recruteur },
    { id: 'resume',     label: '⚡ Résumé',            has: () => !!(c.resume || c.erreurs) },
    { id: 'notes',      label: '📝 Mes notes',         has: () => true },
  ];
  const tabs = allTabs.filter(t => t.has());

  // ── Génération des boutons d'onglets
  const tabBtns = tabs.map((t, i) =>
    `<button class="tab-btn ${i === 0 ? 'active' : ''}" onclick="switchTab('${t.id}', this)">${t.label}</button>`
  ).join('');

  function block(id, content) {
    const active = tabs[0].id === id;
    return `<div class="tab-content content-body ${active ? 'active' : ''}" id="tab-${id}">${content}</div>`;
  }

  // ── Sous-compétences
  const sousCompHtml = comp.sous_competences.map(sc => `
    <li style="display:flex;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)">
      <span style="color:var(--accent);flex-shrink:0;margin-top:1px">▸</span>
      <span style="font-size:13px;color:var(--text-muted)">${sc}</span>
    </li>`).join('');

  // ── Exercices
  const exercicesHtml = (c.exercices || []).map((e, i) => `
    <div class="exercice-card">
      <div class="exercice-header">
        <span style="font-size:11px;font-weight:800;color:var(--text-dim)">Exercice ${i+1}</span>
        <span class="exercice-badge badge-${e.difficulte === 'avancé' ? 'avance' : (e.difficulte || 'moyen').replace('é','e')}">${e.difficulte || 'moyen'}</span>
        ${e.type === 'lab' ? '<span class="exercice-badge badge-lab">🧪 Lab</span>' : ''}
        ${e.type === 'analyse' ? '<span class="exercice-badge" style="background:rgba(168,85,247,0.1);color:#a855f7;border-color:#a855f744">🔍 Analyse</span>' : ''}
        ${e.type === 'mémo' ? '<span class="exercice-badge" style="background:rgba(245,158,11,0.1);color:#f59e0b;border-color:#f59e0b44">📌 Mémo</span>' : ''}
      </div>
      <div class="exercice-title" style="font-size:15px;font-weight:700;margin:8px 0">${e.titre}</div>
      <div class="exercice-desc">${e.desc}</div>
      ${e.outil ? `<div class="exercice-tool">🛠 <strong>Outils :</strong> ${e.outil}</div>` : ''}
      ${e.warning ? `<div class="alert alert-warning" style="margin-top:10px">⚠ ${e.warning}</div>` : ''}
    </div>`).join('');

  // ── Questions d'entretien
  const questionsHtml = `
    <div style="margin-bottom:16px;font-size:13px;color:var(--text-muted)">
      Ces questions sont posées réellement en entretien SOC L1. Entraîne-toi à y répondre oralement en moins de 2 minutes.
    </div>
    <div class="question-list">
      ${(c.questions || []).map((q, i) => `
        <div class="question-item">
          <span class="q-num">Q${i+1}</span>
          <span>${q}</span>
        </div>`).join('')}
    </div>`;

  // ── Erreurs fréquentes
  const erreursHtml = (c.erreurs || []).map(e => `
    <div class="erreur-item">
      <span class="erreur-icon">✗</span>
      <span>${e}</span>
    </div>`).join('');

  // ── Résumé + Erreurs (onglet dédié)
  const resumeTabHtml = `
    ${erreursHtml ? `
      <div style="margin-bottom:28px">
        <div style="font-size:14px;font-weight:800;color:#ef4444;margin-bottom:14px;display:flex;align-items:center;gap:8px">
          <span>⚠</span> Erreurs fréquentes à éviter absolument
        </div>
        ${erreursHtml}
      </div>` : ''}
    ${c.resume ? `
      <div class="alert alert-success" style="border-radius:12px">
        <div style="font-size:14px;font-weight:800;margin-bottom:10px">⚡ Résumé actionnable — ce qu'il faut retenir</div>
        <div style="font-size:13px;line-height:1.7">${md(c.resume)}</div>
      </div>` : ''}`;

  // ── Niveau recruteur
  const recruteurHtml = c.niveau_recruteur ? `
    <div class="recruteur-card">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
        <span style="font-size:28px">🎯</span>
        <div>
          <div style="font-size:16px;font-weight:800">Ce qu'attend le recruteur</div>
          <div style="font-size:12px;color:var(--text-muted)">Poste visé : SOC Analyst L1 Junior</div>
        </div>
      </div>
      <div class="content-body">${md(c.niveau_recruteur)}</div>
    </div>` : '';

  el.innerHTML = `
    <div class="cours-page">
      <button class="back-btn" onclick="navigate('module/${mod.id}')">← ${mod.titre}</button>

      <!-- En-tête cours -->
      <div class="cours-header">
        <div class="cours-breadcrumb">
          <a href="#module/${mod.id}">${mod.icon} ${mod.titre}</a>
          <span style="color:var(--text-dim)"> / </span>
          <span>${comp.titre}</span>
        </div>
        <div class="cours-title">${comp.titre}</div>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:8px">
          ${diffBadge(comp.difficulte)}
          <span style="font-size:12px;color:var(--text-dim)">⏱ ${comp.duree}</span>
          <div style="flex:1"></div>
          <div class="status-select">
            ${['non_commence','compris','pratique','maitrise'].map(s =>
              `<button class="status-btn ${status === s ? 'active-'+s : ''}"
                onclick="setStatus('${comp.id}', '${s}', this)">${statusLabel(s)}</button>`
            ).join('')}
          </div>
        </div>
      </div>

      <!-- Ce que tu vas apprendre -->
      <div class="card" style="margin-bottom:24px">
        <div style="font-size:11px;font-weight:800;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">
          📌 Ce que tu vas maîtriser
        </div>
        <ul style="list-style:none;margin:0;padding:0">${sousCompHtml}</ul>
      </div>

      <!-- Onglets -->
      <div class="cours-tabs">${tabBtns}</div>

      <!-- Contenu des onglets -->
      ${block('simple',    md(c.simple || ''))}
      ${block('technique', md(c.technique || ''))}
      ${block('attaquant', md(c.attaquant || ''))}
      ${block('soc',       md(c.soc || ''))}
      ${block('logs',      md(c.logs_exemples || ''))}
      ${block('atelier',   renderAtelier(c.atelier))}
      ${block('cas',       md(c.cas_concret || ''))}
      ${block('exercices', exercicesHtml || '<div style="color:var(--text-muted);padding:20px 0">Exercices à venir.</div>')}
      ${block('questions', questionsHtml)}
      ${block('recruteur', recruteurHtml)}
      ${block('resume',    resumeTabHtml)}
      ${block('notes', `
        <div style="font-size:15px;font-weight:700;margin-bottom:12px">📝 Mes notes personnelles</div>
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:12px">
          Espace libre pour noter tes réflexions, questions, commandes à retenir…
        </div>
        <textarea class="notes-area" id="notes-input"
          placeholder="Écris tes notes ici — sauvegarde automatique…"
          oninput="autoSaveNote('${comp.id}')">${noteText}</textarea>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
          <span class="notes-saved" id="notes-saved" style="font-size:12px;color:var(--green);opacity:0;transition:opacity 0.3s">✓ Sauvegardé</span>
          <span style="font-size:12px;color:var(--text-dim)">Sauvegarde automatique</span>
        </div>`)}
    </div>
  `;
}

function switchTab(id, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  const tab = document.getElementById('tab-' + id);
  if (tab) tab.classList.add('active');
}

function setStatus(id, status, btn) {
  setCompStatus(id, status);
  document.querySelectorAll('.status-btn').forEach(b => {
    b.className = 'status-btn';
  });
  btn.className = `status-btn active-${status}`;
}

let noteTimer;
function autoSaveNote(id) {
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => {
    const val = document.getElementById('notes-input')?.value || '';
    const n = loadNotes();
    n[id] = val;
    saveNotes(n);
    const saved = document.getElementById('notes-saved');
    if (saved) { saved.classList.add('show'); setTimeout(() => saved.classList.remove('show'), 1500); }
  }, 800);
}

// ── LABS ──────────────────────────────────────────────────────
function renderLabs(el) {
  const done = loadLabs();
  const byModule = {};
  CURRICULUM.labs.forEach(lab => {
    if (!byModule[lab.module]) byModule[lab.module] = [];
    byModule[lab.module].push(lab);
  });

  const sections = CURRICULUM.modules.map(mod => {
    const modLabs = byModule[mod.id] || [];
    if (!modLabs.length) return '';
    const labCards = modLabs.map(lab => {
      const isDone = done.includes(lab.id);
      return `
        <div class="lab-card ${isDone ? 'done' : ''}">
          <div class="lab-icon" style="background:${isDone ? 'rgba(16,185,129,0.15)' : 'var(--surface)'}">
            ${lab.type === 'plateforme' ? '🌐' : lab.type === 'challenge' ? '🏆' : '⚗'}
          </div>
          <div class="lab-info">
            <div class="lab-title">${lab.titre}</div>
            <div class="lab-desc">${lab.desc}</div>
            <div class="lab-tags">${(lab.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}
              <span class="tag">⏱ ${lab.duree}</span>
              <span class="tag">${lab.difficulte}</span>
            </div>
          </div>
          <button class="lab-check ${isDone ? 'done' : ''}" onclick="toggleLab('${lab.id}', this)" title="${isDone ? 'Marquer non fait' : 'Marquer terminé'}">
            ${isDone ? '✓' : ''}
          </button>
        </div>`;
    }).join('');

    return `
      <div style="margin-bottom:28px">
        <div class="section-header">
          <div class="section-title" style="color:${mod.couleur}">${mod.icon} ${mod.titre}</div>
          <div class="section-sub">${modLabs.filter(l => done.includes(l.id)).length}/${modLabs.length} faits</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">${labCards}</div>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title">Labs & Pratique</div>
      <div class="page-subtitle">${done.length}/${CURRICULUM.labs.length} labs complétés — Clique sur ✓ pour marquer un lab comme terminé</div>
    </div>
    ${sections}
  `;
}

function toggleLab(id, btn) {
  const labs = loadLabs();
  const idx = labs.indexOf(id);
  if (idx >= 0) labs.splice(idx, 1);
  else labs.push(id);
  saveLabs(labs);
  const isDone = labs.includes(id);
  btn.className = `lab-check ${isDone ? 'done' : ''}`;
  btn.textContent = isDone ? '✓' : '';
  btn.closest('.lab-card').classList.toggle('done', isDone);
  refreshGlobalProgress();
}

// ── PROJETS ───────────────────────────────────────────────────
function renderProjets(el) {
  const done = loadProjets();

  const cards = CURRICULUM.projets.map(p => {
    const isDone = done.includes(p.id);
    return `
      <div class="projet-card ${isDone ? 'done' : ''}">
        <div class="projet-num">Projet ${p.num}</div>
        <div class="projet-title">${p.titre}</div>
        <div class="projet-desc">${p.desc}</div>
        <div class="projet-skills">${p.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div>
        <div class="projet-footer">
          <span class="projet-duree">⏱ ${p.duree}</span>
          <button class="btn-done ${isDone ? 'done' : ''}" onclick="toggleProjet('${p.id}', this)">
            ${isDone ? '✓ Terminé' : '○ Marquer terminé'}
          </button>
        </div>
        <div style="margin-top:12px;font-size:12px;color:var(--text-dim);border-top:1px solid var(--border);padding-top:10px">
          💡 <strong style="color:var(--text-muted)">Impact portfolio :</strong> ${p.impact}
        </div>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title">Projets Portfolio</div>
      <div class="page-subtitle">${done.length}/${CURRICULUM.projets.length} projets complétés — Construis ton profil SOC concret</div>
    </div>
    <div class="alert alert-info" style="margin-bottom:24px">
      💡 <strong>Conseil :</strong> Publie chaque projet sur GitHub avec un README détaillé. Un portfolio avec 5 projets documentés vaut plus que 5 certifications sans pratique.
    </div>
    <div class="grid-auto">${cards}</div>
  `;
}

function toggleProjet(id, btn) {
  const projets = loadProjets();
  const idx = projets.indexOf(id);
  if (idx >= 0) projets.splice(idx, 1);
  else projets.push(id);
  saveProjets(projets);
  const isDone = projets.includes(id);
  btn.className = `btn-done ${isDone ? 'done' : ''}`;
  btn.textContent = isDone ? '✓ Terminé' : '○ Marquer terminé';
  btn.closest('.projet-card').classList.toggle('done', isDone);
}

// ── CERTIFICATIONS ────────────────────────────────────────────
function renderCertifications(el) {
  const cards = CURRICULUM.certifications.map(cert => {
    const niveauColor = { fondamental: '#10b981', intermédiaire: '#f59e0b', avancé: '#ef4444' };
    const color = niveauColor[cert.niveau] || '#666';
    return `
      <div class="cert-card" style="border-top:3px solid ${cert.couleur}">
        <span class="cert-badge" style="background:${color}22;color:${color};border:1px solid ${color}44">${cert.niveau}</span>
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div class="cert-title">${cert.titre}</div>
            <div class="cert-org">${cert.org} · ${cert.mois_ideal}</div>
          </div>
          <div style="text-align:right;font-size:13px;color:var(--text-muted)">
            <div style="font-weight:700;color:var(--text)">${cert.cout}</div>
            <div style="font-size:11px">Prépa : ${cert.duree_prep}</div>
          </div>
        </div>
        <div class="cert-desc">${cert.desc}</div>
        <div style="margin-bottom:10px">
          <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:6px">Ressources recommandées :</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${cert.ressources.map(r => `<span class="tag">${r}</span>`).join('')}
          </div>
        </div>
        <div class="cert-meta">
          <span>⏱ Validité : ${cert.validite}</span>
          <span>📚 ${cert.prerequis_recommandes[0]}</span>
        </div>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title">Certifications</div>
      <div class="page-subtitle">Roadmap certifications alignée sur ta progression — dans l'ordre optimal</div>
    </div>
    <div class="alert alert-info" style="margin-bottom:24px">
      💡 <strong>Ordre recommandé :</strong> Security+ → Splunk → BTL1 ou CySA+ → GCFE (si spécialisation DFIR). Ne pas se précipiter — mieux vaut pratiquer d'abord.
    </div>
    <div class="grid-auto">${cards}</div>
  `;
}

// ── TRACKER ───────────────────────────────────────────────────
function renderTracker(el) {
  const s = loadState();
  const prog = getProgress();

  const legend = `
    <div class="legend">
      <div class="legend-item"><div class="legend-dot" style="background:var(--border-light)"></div>Non commencé</div>
      <div class="legend-item"><div class="legend-dot" style="background:var(--cyan)"></div>Compris</div>
      <div class="legend-item"><div class="legend-dot" style="background:var(--orange)"></div>Pratiqué</div>
      <div class="legend-item"><div class="legend-dot" style="background:var(--green)"></div>Maîtrisé</div>
    </div>`;

  const moduleSections = CURRICULUM.modules.map(mod => {
    const mp = getModuleProgress(mod);
    const items = mod.competences.map(comp => {
      const status = s[comp.id] || 'non_commence';
      return `
        <div class="tracker-item ${status}" onclick="navigate('cours/${comp.id}')" title="${comp.titre}">
          <div class="tracker-dot dot-${status}"></div>
          <div class="tracker-name">${comp.titre}</div>
          <div class="tracker-mod">${comp.duree}</div>
        </div>`;
    }).join('');

    return `
      <div style="margin-bottom:28px">
        <div class="section-header">
          <div class="section-title" style="color:${mod.couleur}">${mod.icon} ${mod.titre}</div>
          <div style="display:flex;align-items:center;gap:12px">
            <div class="progress-bar-bg" style="width:120px">
              <div class="progress-bar-fill" style="width:${mp.pct}%;background:${mod.couleur}"></div>
            </div>
            <span style="font-size:13px;font-weight:700;color:${mod.couleur}">${mp.pct}%</span>
          </div>
        </div>
        <div class="tracker-grid">${items}</div>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title">Tracker de progression</div>
      <div class="page-subtitle">${prog.done} compétences commencées · ${prog.maitrise} maîtrisées · ${prog.pct}% global</div>
    </div>
    ${legend}

    <div class="card" style="margin-bottom:28px">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0;text-align:center">
        ${['non_commence','compris','pratique','maitrise'].map(st => {
          const count = Object.values(s).filter(v => v === st).length + (st === 'non_commence' ? prog.total - Object.keys(s).length : 0);
          const colors = { non_commence: 'var(--border-light)', compris: 'var(--cyan)', pratique: 'var(--orange)', maitrise: 'var(--green)' };
          const labels = { non_commence: 'Non commencé', compris: 'Compris', pratique: 'Pratiqué', maitrise: 'Maîtrisé' };
          return `
            <div style="padding:16px;border-right:1px solid var(--border)">
              <div style="font-size:24px;font-weight:800;color:${colors[st]}">${st === 'non_commence' ? prog.total - prog.done : Object.values(s).filter(v => v === st).length}</div>
              <div style="font-size:12px;color:var(--text-muted)">${labels[st]}</div>
            </div>`;
        }).join('')}
      </div>
    </div>

    ${moduleSections}
  `;
}

// ── EMPLOI ────────────────────────────────────────────────────
function renderEmploi(el) {
  const e = CURRICULUM.emploi;

  const timelineHtml = e.timeline.map(t => `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-date">${t.periode}</div>
      <div class="timeline-title">${t.titre}</div>
      <ul style="margin-top:8px">
        ${t.actions.map(a => `<li style="font-size:13px;color:var(--text-muted);padding:3px 0 3px 16px;position:relative"><span style="position:absolute;left:0;color:var(--accent)">▸</span>${a}</li>`).join('')}
      </ul>
    </div>`).join('');

  const postesHtml = e.postes_cibles.map(p => `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        <div class="section-title" style="font-size:15px">${p.titre}</div>
        <span style="font-size:14px;font-weight:700;color:var(--green)">${p.salaire}</span>
      </div>
      <div style="font-size:12px;color:var(--accent);margin-bottom:6px;font-weight:600">${p.quand}</div>
      <div style="font-size:13px;color:var(--text-muted)">${p.desc}</div>
    </div>`).join('');

  const conseilsHtml = e.conseils.map(c => `
    <div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
      <span style="color:var(--accent);flex-shrink:0">→</span>
      <span style="font-size:13px;color:var(--text-muted)">${c}</span>
    </div>`).join('');

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title">Stratégie Emploi SOC</div>
      <div class="page-subtitle">De zéro à SOC Analyst — plan d'action sur 12 mois</div>
    </div>

    <div class="grid-2" style="gap:28px;margin-bottom:32px">
      <div>
        <div class="section-title" style="margin-bottom:20px">Roadmap 12 mois</div>
        <div class="timeline">${timelineHtml}</div>
      </div>
      <div>
        <div class="section-title" style="margin-bottom:16px">Postes cibles</div>
        <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:28px">${postesHtml}</div>

        <div class="section-title" style="margin-bottom:12px">Conseils clés</div>
        <div class="card">${conseilsHtml}</div>
      </div>
    </div>

    <div class="card" style="background:linear-gradient(135deg,rgba(16,185,129,0.08),rgba(6,182,212,0.05));border-color:rgba(16,185,129,0.3)">
      <div style="font-size:16px;font-weight:700;margin-bottom:8px">🎯 Le message clé</div>
      <div style="font-size:14px;color:var(--text-muted);line-height:1.7">
        En cybersécurité, <strong style="color:var(--text)">la pratique prime sur les certifications</strong>. Un candidat avec un home lab documenté, des write-ups publiés et 3 projets concrets sera toujours préféré à quelqu'un qui a 5 certifications mais aucune pratique. <strong style="color:var(--green)">Construis, documente, publie.</strong>
      </div>
    </div>
  `;
}

// ── Mobile sidebar ────────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}
document.addEventListener('click', (e) => {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('menu-toggle');
  if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== toggle) {
    sidebar.classList.remove('open');
  }
});

// ── Init ──────────────────────────────────────────────────────
window.addEventListener('hashchange', router);
// Force z-index des iframes Netlify Identity au-dessus du login wall
const _niObserver = new MutationObserver(() => {
  document.querySelectorAll('iframe#netlify-identity-widget').forEach(f => {
    f.style.setProperty('z-index', '100000', 'important');
  });
});
_niObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });

window.addEventListener('DOMContentLoaded', () => {
  initAuth();
  refreshGlobalProgress();
  const streak = getStreak();
  const el = document.getElementById('streak-count');
  if (el) el.textContent = streak;
  router();
});
