/* =====================================================================
   Wiring: game ↔ relic modals ↔ classic view ↔ chatbot ↔ preferences
   ===================================================================== */
(function () {
  'use strict';
  const D = PORTFOLIO;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- preferences (browser storage is optional) ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('lt.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('lt.' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };
  let best = store.get('best', 0);
  const hour = new Date().getHours();
  let theme = store.get('theme', hour >= 6 && hour < 18 ? 'day' : 'night');
  const sfx = new TempleSfx();
  sfx.on = store.get('sound', true);

  /* ---------- analytics (GoatCounter, only if a code is set in data.js) ---------- */
  const gcUrl = D.analytics && D.analytics.goatcounter;
  if (gcUrl) {
    const sc = document.createElement('script');
    sc.async = true; sc.src = 'https://gc.zgo.at/count.js'; sc.dataset.goatcounter = gcUrl;
    document.head.appendChild(sc);
  }
  function track(name) {
    try { if (gcUrl && window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: name, title: name, event: true }); }
    catch (e) { /* analytics is optional */ }
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a'); if (!a) return;
    if (a.hasAttribute('download')) track('download-cv');
    else if (a.href.startsWith('mailto:')) track('click-email');
    else if (a.href.includes('linkedin.com')) track('click-linkedin');
  });

  /* ---------- static text from data ---------- */
  $('brandName').textContent = D.name;
  $('gateName').textContent = D.firstName;
  $('gateSub').textContent = `${D.title} · ${D.tagline}`;
  document.querySelector('.brand-mark').textContent = D.name.split(' ').map(w => w[0]).join('').slice(0, 2);

  /* ---------- section builders (shared by modals + classic view) ---------- */
  const contactLinks = (extraClass = '') => `
    <div class="link-row ${extraClass}">
      <a class="btn btn-gold" href="mailto:${esc(D.email)}">Email me</a>
      ${D.linkedin ? `<a class="btn btn-outline" href="${esc(D.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>` : ''}
      ${D.github ? `<a class="btn btn-outline" href="${esc(D.github)}" target="_blank" rel="noopener">GitHub</a>` : ''}
      <a class="btn btn-outline" href="${esc(D.resume)}" download>Download CV</a>
    </div>`;

  const timeline = list => `<ol class="timeline">${list.map(e => `
      <li>
        <p class="tl-role">${esc(e.role)} <span class="tl-company">at ${esc(e.company)}</span></p>
        <p class="tl-meta">${esc(e.dates)} · ${esc(e.place)}</p>
        <ul>${e.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
      </li>`).join('')}</ol>`;

  const educationHTML = () => `<ol class="timeline">${D.education.map(e => `
      <li>
        <p class="tl-role">${esc(e.degree)}${e.current ? ' <span class="pill">In progress</span>' : ''}</p>
        ${e.school ? `<p class="tl-company">${esc(e.school)}</p>` : ''}
        <p class="tl-meta">${[e.dates, e.place].filter(Boolean).map(esc).join(' · ')}</p>
        ${e.note && !e.current ? `<p class="edu-note">${esc(e.note)}</p>` : ''}
      </li>`).join('')}</ol>`;

  const languagesHTML = () => D.spokenLanguages && D.spokenLanguages.length
    ? `<h4>Languages I speak</h4><p class="tags">${D.spokenLanguages.map(t => `<span class="tag tag-soft">${esc(t)}</span>`).join('')}</p>` : '';
  const goalHTML = () => D.lookingFor ? `<p class="goal"><span aria-hidden="true">🧭</span> ${esc(D.lookingFor)}</p>` : '';

  /* ---------- blog ---------- */
  const blogHTML = () => `<div class="posts">${(D.blog || []).map(b => `
      <article class="post" id="post-${esc(b.slug)}">
        <p class="post-date">${esc(b.date)}</p>
        <h3>${esc(b.title)}</h3>
        <p class="post-excerpt">${esc(b.excerpt)}</p>
        <div class="post-body" id="body-${esc(b.slug)}" hidden>${b.body.map(p => `<p>${esc(p)}</p>`).join('')}</div>
        <button class="btn btn-outline btn-small" type="button" data-post="${esc(b.slug)}" aria-expanded="false" aria-controls="body-${esc(b.slug)}">Read the post</button>
      </article>`).join('')}</div>`;

  const skillsHTML = (collected = null) => {
    const gems = `<div class="gem-grid">${D.gems.map((g, i) => {
      const got = collected === null || i < collected;
      return `<div class="gem-card ${got ? '' : 'locked'}" style="--gem:${g.color}">
        <span class="gem-icon" aria-hidden="true"></span>
        <div><p class="gem-name">${esc(g.name)}</p><p class="gem-note">${got ? esc(g.note) : 'Not found yet'}</p></div>
      </div>`;
    }).join('')}</div>`;
    const groups = `<div class="skill-groups">${D.skillGroups.map(g => `
      <div><h4>${esc(g.group)}</h4><p class="tags">${g.items.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</p></div>`).join('')}</div>`;
    const extra = `<h4>Also hands-on with</h4><p class="tags">${D.additional.map(t => `<span class="tag tag-soft">${esc(t)}</span>`).join('')}</p>
      <h4>Strengths</h4><p class="tags">${D.strengths.map(t => `<span class="tag tag-soft">${esc(t)}</span>`).join('')}</p>`;
    return gems + groups + extra;
  };

  const projectCard = (p, compact) => {
    const banner = p.image
      ? `<img class="proj-img" src="${esc(p.image)}" alt="Screenshot of ${esc(p.name)}" loading="lazy">`
      : `<div class="proj-banner" style="--h:${p.hue}" aria-hidden="true"><span>${p.icon}</span></div>`;
    const links = (p.links || []).map(l => `<a class="btn btn-outline btn-small" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('');
    const badge = p.internal ? '<span class="badge">Internal enterprise system · code confidential</span>' : (p.academic ? '<span class="badge">Academic project</span>' : '');
    return `<article class="proj ${compact ? 'proj-compact' : ''}">
      ${banner}
      <div class="proj-text">
        <h3 ${compact ? '' : 'id="modalTitle"'}>${esc(p.name)}</h3>
        <p>${esc(p.summary)}</p>
        <p class="tags">${p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</p>
        ${badge}
        ${links ? `<div class="link-row">${links}</div>` : ''}
      </div>
    </article>`;
  };

  /* ---------- classic view ---------- */
  function renderClassic() {
    $('classic').innerHTML = `
    <div class="classic">
      <section class="hero">
        <p class="hero-hello">Hello, I'm</p>
        <h1>${esc(D.name)}</h1>
        <p class="hero-title">${esc(D.title)} specialising in ${esc(D.tagline)}</p>
        <p class="hero-meta">${esc(D.location)} · ${esc(D.yearsExperience)} years of experience</p>
        ${goalHTML()}
        ${contactLinks()}
        <button class="btn btn-ghost hero-play" type="button" data-action="play">Play the Lost Temple instead</button>
      </section>
      <nav class="classic-nav" aria-label="Sections">
        <a href="#c-about">About</a><a href="#c-exp">Experience</a><a href="#c-skills">Skills</a><a href="#c-projects">Projects</a><a href="#c-edu">Education</a>${(D.blog || []).length ? '<a href="#c-blog">Blog</a>' : ''}<a href="#c-contact">Contact</a>
      </nav>
      <section class="block" id="c-about"><h2>About</h2>${D.summary.map(p => `<p class="lead">${esc(p)}</p>`).join('')}${languagesHTML()}</section>
      <section class="block" id="c-exp"><h2>Experience</h2>${timeline(D.experience)}<h3 class="sub">Internships</h3>${timeline(D.internships)}</section>
      <section class="block" id="c-skills"><h2>Skills</h2>${skillsHTML()}</section>
      <section class="block" id="c-projects"><h2>Projects</h2><div class="proj-grid">${D.projects.map(p => projectCard(p, true)).join('')}</div></section>
      <section class="block" id="c-edu"><h2>Education</h2>${educationHTML()}</section>
      ${(D.blog || []).length ? `<section class="block" id="c-blog"><h2>Blog</h2>${blogHTML()}</section>` : ''}
      <section class="block block-contact" id="c-contact"><h2>Let's work together</h2>
        <p class="lead">I'm happy to talk about roles, projects or anything PHP, APIs and SQL. Email is the fastest way to reach me.</p>
        ${goalHTML()}
        ${contactLinks()}
      </section>
      <footer class="foot">© ${new Date().getFullYear()} ${esc(D.name)} · Hand-built and hosted on GitHub Pages</footer>
    </div>`;
    $('classic').querySelector('[data-action="play"]').addEventListener('click', () => { track('play-from-classic'); showView('adventure'); });
    $('classic').querySelectorAll('[data-post]').forEach(btn => btn.addEventListener('click', () => {
      const body = $('body-' + btn.dataset.post), open = body.hidden;
      body.hidden = !open; btn.setAttribute('aria-expanded', String(open));
      const ex = btn.closest('.post').querySelector('.post-excerpt'); if (ex) ex.hidden = open;
      btn.textContent = open ? 'Show less' : 'Read the post';
      if (open) track('read-post-' + btn.dataset.post);
    }));
    $('classic').querySelectorAll('.classic-nav a').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      const t = document.querySelector(a.getAttribute('href'));
      t && t.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }));
  }

  /* ---------- game ---------- */
  const canvas = $('game');
  const game = new TempleRun(canvas, {
    gems: D.gems.length,
    scrolls: D.projects.length,
    sfx,
    hooks: {
      onScore: s => {
        $('scoreVal').textContent = s;
        if (s > best) { $('bestVal').textContent = s; }
      },
      onToast: msg => toast(msg),
      onRelic: (type, idx, isLast) => {
        updateJournal();
        if (type === 'tablet') openRelic('tablet');
        else if (type === 'gem') {
          const g = D.gems[idx];
          toast(`💎 ${g.name} gem found (${idx + 1}/${D.gems.length})`);
          if (isLast) setTimeout(() => game.running && openRelic('skills'), 350);
        } else if (type === 'scroll') openRelic('scroll', idx);
      },
      onEnd: (score, collected) => {
        const isBest = score > best;
        if (isBest) { best = score; store.set('best', best); }
        updateBest(); updateJournal();
        track('finish-run');
        setTimeout(() => openRelic('shrine', 0, { score, isBest, collected }), 700);
      }
    }
  });
  game.setTheme(theme);

  /* ---------- journal HUD ---------- */
  const JOURNAL = [
    { k: 'tablet', icon: '🗿', label: 'About me' },
    { k: 'gems', icon: '💎', label: 'Skills' },
    { k: 'scrolls', icon: '📜', label: 'Projects' },
    { k: 'shrine', icon: '🔥', label: 'Contact' }
  ];
  function updateJournal() {
    const c = game.collected;
    $('journal').innerHTML = JOURNAL.map(j => {
      let unlocked, count = '';
      if (j.k === 'gems') { unlocked = c.gems > 0; count = `${c.gems}/${D.gems.length}`; }
      else if (j.k === 'scrolls') { unlocked = c.scrolls > 0; count = `${c.scrolls}/${D.projects.length}`; }
      else unlocked = !!c[j.k];
      return `<button type="button" class="j-item ${unlocked ? 'on' : ''}" data-k="${j.k}" ${unlocked ? '' : 'disabled'}
        aria-label="${j.label}${count ? ', ' + count + ' found' : ''}${unlocked ? '' : ', locked'}" title="${j.label}">
        <span aria-hidden="true">${j.icon}</span>${count ? `<small>${count}</small>` : ''}</button>`;
    }).join('');
  }
  $('journal').addEventListener('click', e => {
    const b = e.target.closest('.j-item'); if (!b || b.disabled) return;
    const k = b.dataset.k;
    if (k === 'tablet') openRelic('tablet');
    else if (k === 'gems') openRelic('skills');
    else if (k === 'scrolls') openRelic('scrollList');
    else if (k === 'shrine') openRelic('shrine', 0, { score: Math.floor(game.score), collected: game.collected, review: true });
  });

  function updateBest() {
    $('bestVal').textContent = best;
    $('gateBest').textContent = best ? ` Best run: ${best}.` : '';
  }

  /* ---------- toast ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
  }

  /* ---------- relic modal ---------- */
  let modalOpen = false, lastFocus = null;
  function openRelic(kind, idx, extra = {}) {
    const body = $('modalBody'), foot = $('modalFoot');
    let html = '', buttons = '';
    const cont = game.running ? '<button class="btn btn-gold" type="button" data-act="close">Continue running</button>' : '<button class="btn btn-gold" type="button" data-act="close">Close</button>';
    const head = (icon, kicker, title) => `<div class="relic-head"><span class="relic-icon" aria-hidden="true">${icon}</span><div><p class="relic-kicker">${kicker}</p><h2 id="modalTitle">${title}</h2></div></div>`;

    if (kind === 'tablet') {
      html = head('🗿', 'Stone tablet found', 'About me') +
        D.summary.map(p => `<p>${esc(p)}</p>`).join('') + goalHTML() + languagesHTML() +
        `<h3 class="sub">The path so far</h3>${timeline(D.experience)}<h3 class="sub">Internships</h3>${timeline(D.internships)}<h3 class="sub">Education</h3>${educationHTML()}`;
      buttons = cont;
    } else if (kind === 'skills') {
      const n = game.collected.gems;
      html = head('💎', n >= D.gems.length ? 'All gems collected' : `${n} of ${D.gems.length} gems found`, 'Skills') + skillsHTML(n);
      buttons = cont;
    } else if (kind === 'scroll') {
      const p = D.projects[idx];
      html = `<p class="relic-kicker">📜 Ancient scroll ${idx + 1} of ${D.projects.length}</p>` + projectCard(p, false);
      buttons = cont;
    } else if (kind === 'scrollList') {
      const n = game.collected.scrolls;
      html = head('📜', `${n} of ${D.projects.length} scrolls found`, 'Projects') +
        `<div class="proj-grid">${D.projects.slice(0, n).map(p => projectCard(p, true)).join('')}</div>`;
      buttons = cont;
    } else if (kind === 'shrine') {
      const c = extra.collected || game.collected;
      html = head('🔥', 'You reached the shrine', "Let's work together") +
        `<p>Thanks for running the Lost Temple. If you'd like to talk about a role or a project, I'd love to hear from you.</p>` + goalHTML() +
        contactLinks('link-row-big') +
        `<div class="run-stats">
          <div><b>${extra.score ?? 0}</b><span>Score${extra.isBest ? ' · new best!' : ''}</span></div>
          <div><b>${c.gems}/${D.gems.length}</b><span>Gems</span></div>
          <div><b>${c.scrolls}/${D.projects.length}</b><span>Scrolls</span></div>
          <div><b>${best}</b><span>Best run</span></div>
        </div>`;
      buttons = extra.review ? cont :
        `<button class="btn btn-gold" type="button" data-act="again">Run again</button>
         <button class="btn btn-outline" type="button" data-act="classic">See the classic portfolio</button>`;
    } else if (kind === 'pause') {
      html = head('⏸', 'Paused', 'Take a breath, explorer') + `<p>The temple will wait for you.</p>`;
      buttons = `<button class="btn btn-gold" type="button" data-act="close">Resume</button>
                 <button class="btn btn-outline" type="button" data-act="classic">Skip the adventure</button>`;
    }
    body.innerHTML = html; foot.innerHTML = buttons;
    body.scrollTop = 0;
    game.pause();
    lastFocus = document.activeElement;
    $('modal').hidden = false; modalOpen = true;
    setTimeout(() => (foot.querySelector('button') || $('modalCard')).focus(), 30);
  }
  function closeModal() {
    if (!modalOpen) return;
    $('modal').hidden = true; modalOpen = false;
    if (!chat.isOpen()) game.resume();
    canvas.focus && lastFocus && lastFocus.focus && lastFocus.focus();
  }
  $('modalFoot').addEventListener('click', e => {
    const a = e.target.closest('[data-act]'); if (!a) return;
    if (a.dataset.act === 'close') closeModal();
    if (a.dataset.act === 'again') { closeModal(); startRun(); }
    if (a.dataset.act === 'classic') { closeModal(); showView('classic'); }
  });
  $('modal').addEventListener('click', e => { if (e.target === $('modal')) closeModal(); });
  // keep Tab inside the dialog
  $('modal').addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const f = [...$('modalCard').querySelectorAll('a,button')];
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });

  /* ---------- start / views ---------- */
  function startRun() {
    $('gate').hidden = true; $('hud').hidden = false;
    game.start(); updateJournal(); updateBest();
    $('gameWrap').focus();
  }
  function showGate() {
    if (modalOpen) closeModal();
    game.running = false; game.ended = false; game.paused = false; game.reset();
    $('gate').hidden = false; $('hud').hidden = true;
  }
  function showView(v) {
    const classic = v === 'classic';
    if (classic && game.running) game.pause();
    if (modalOpen) { $('modal').hidden = true; modalOpen = false; }
    $('classic').hidden = !classic; $('adventure').hidden = classic;
    document.body.classList.toggle('is-classic', classic);
    $('viewBtn').textContent = classic ? 'Back to the temple' : 'Skip the adventure';
    try { history.replaceState(null, '', classic ? '#classic' : location.pathname + location.search); } catch (e) { /* file:// */ }
    if (classic) window.scrollTo(0, 0);
    else { game.resize(); if (game.running) openRelic('pause'); }
  }

  $('startBtn').addEventListener('click', () => { sfx.ensure(); track('start-run'); startRun(); });
  $('skipBtn').addEventListener('click', () => { track('skip-adventure'); showView('classic'); });
  $('viewBtn').addEventListener('click', () => showView($('classic').hidden ? 'classic' : 'adventure'));
  $('brandLink').addEventListener('click', e => { e.preventDefault(); showView('adventure'); showGate(); });

  /* ---------- input ---------- */
  const typing = el => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
  document.addEventListener('keydown', e => {
    if (typing(e.target) || !$('classic').hidden) return;
    if (modalOpen) { if (e.key === 'Escape') { e.preventDefault(); closeModal(); } return; }
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      if (e.target.tagName === 'BUTTON' && !game.running) return;
      e.preventDefault();
      if (!game.running && !$('gate').hidden) return;
      game.jump();
    } else if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P') && game.running) {
      openRelic('pause');
    }
  });
  document.addEventListener('keyup', e => {
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') game.releaseJump();
  });
  canvas.addEventListener('pointerdown', e => { e.preventDefault(); game.jump(); });
  canvas.addEventListener('pointerup', () => game.releaseJump());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.running && !modalOpen) openRelic('pause');
  });

  /* ---------- theme + sound ---------- */
  function applyTheme() {
    document.documentElement.dataset.theme = theme;
    game.setTheme(theme);
    const day = theme === 'day';
    $('themeBtn').innerHTML = `<span aria-hidden="true">${day ? '☀️' : '🌙'}</span>`;
    $('themeBtn').setAttribute('aria-label', day ? 'Switch to night mode' : 'Switch to day mode');
  }
  function applySound() {
    $('soundBtn').innerHTML = `<span aria-hidden="true">${sfx.on ? '🔊' : '🔇'}</span>`;
    $('soundBtn').setAttribute('aria-label', sfx.on ? 'Mute sound' : 'Turn sound on');
  }
  $('themeBtn').addEventListener('click', () => { theme = theme === 'day' ? 'night' : 'day'; store.set('theme', theme); applyTheme(); });
  $('soundBtn').addEventListener('click', () => { sfx.on = !sfx.on; store.set('sound', sfx.on); applySound(); if (sfx.on) sfx.orb(); });

  /* ---------- chatbot ---------- */
  let pausedByChat = false;
  const chat = initChat({
    onOpen: () => { track('open-chat'); if (game.running && !game.paused) { game.pause(); pausedByChat = true; } },
    onClose: () => { if (pausedByChat && !modalOpen) game.resume(); pausedByChat = false; }
  });

  /* ---------- boot ---------- */
  renderClassic(); applyTheme(); applySound(); updateBest(); updateJournal();
  $('gameWrap').tabIndex = -1;
  if (location.hash === '#classic') showView('classic');
  function routeHash() {
    if (location.hash === '#blog') { showView('classic'); const b = $('c-blog'); b && b.scrollIntoView(); }
    else if (location.hash === '#classic' && $('classic').hidden) showView('classic');
  }
  routeHash();
  window.addEventListener('hashchange', routeHash);
})();
