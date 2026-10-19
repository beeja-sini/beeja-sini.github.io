/* =====================================================================
   The Temple Guide — a small chatbot that answers from data.js.
   Runs fully in the browser (no API key, works on GitHub Pages).
   ===================================================================== */
(function (global) {
  'use strict';
  const D = global.PORTFOLIO;
  const N = D.firstName;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const link = (url, label) => `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a>`;
  const mail = () => `<a href="mailto:${esc(D.email)}">${esc(D.email)}</a>`;

  /* Skills on the CV, with aliases and a line of context */
  const SKILLS = [
    { k: ['php'], name: 'PHP', ctx: `PHP is ${N}'s core language, used daily at Emtel for enterprise apps, API integrations and the Recharge Cashback Platform.` },
    { k: ['javascript', ' js '], name: 'JavaScript', ctx: `${N} uses JavaScript with jQuery and AJAX on the enterprise web applications at Emtel.` },
    { k: ['html', 'css'], name: 'HTML/CSS', ctx: `HTML/CSS is part of ${N}'s everyday web development toolkit.` },
    { k: ['sql server', 'mssql', 'ms sql', 't-sql', 'tsql'], name: 'Microsoft SQL Server', ctx: `${N} writes complex SQL Server queries for transaction processing, reporting, reconciliation and business-rule validation.` },
    { k: ['mysql'], name: 'MySQL', ctx: `${N} uses MySQL in production, including on the Recharge Cashback Platform.` },
    { k: [' sql '], name: 'SQL', ctx: `SQL is central to ${N}'s work: complex SQL Server and MySQL queries for transactions, reporting and reconciliation.` },
    { k: ['sqlite'], name: 'SQLite', ctx: `SQLite is listed among ${N}'s databases.` },
    { k: ['firebase', 'firestore'], name: 'Firebase Firestore', ctx: `Firebase Firestore is listed among ${N}'s databases.` },
    { k: ['jquery'], name: 'jQuery', ctx: `${N} uses jQuery for front-end interactivity.` },
    { k: ['ajax'], name: 'AJAX', ctx: `${N} uses AJAX for dynamic, database-backed web pages.` },
    { k: ['node', 'nodejs', 'node.js'], name: 'Node.js', ctx: `Node.js is listed in ${N}'s frameworks and libraries.` },
    { k: [' rest ', 'soap', 'api', 'apis'], name: 'REST & SOAP APIs', ctx: `API integration is one of ${N}'s specialities: REST/SOAP integrations with JSON and XML for billing, payments and e-invoicing.` },
    { k: ['json', 'xml'], name: 'JSON & XML', ctx: `${N} works with JSON and XML payloads in REST/SOAP integrations every day.` },
    { k: ['curl'], name: 'cURL', ctx: `${N} uses cURL for API calls and connectivity troubleshooting.` },
    { k: ['git', 'github', 'version control'], name: 'Git', ctx: `${N} uses Git for version control.` },
    { k: ['composer'], name: 'Composer', ctx: `${N} uses Composer to manage PHP dependencies.` },
    { k: ['phpmailer', 'email automation'], name: 'PHPMailer', ctx: `${N} uses PHPMailer for automated email notifications.` },
    { k: ['wkhtmltopdf', 'dompdf', 'pdftk', 'pdf'], name: 'PDF generation', ctx: `${N} generates PDFs with wkhtmltopdf, Dompdf and pdftk.` },
    { k: ['ssh', 'winscp', 'putty'], name: 'SSH / WinSCP / PuTTY', ctx: `${N} uses SSH, WinSCP and PuTTY for server work and production support.` },
    { k: ['linux', 'windows server', 'windows'], name: 'Linux & Windows', ctx: `${N} works across Linux and Windows environments.` },
    { k: ['cron', 'task scheduler', 'scheduled', 'automation'], name: 'Automation', ctx: `${N} builds scheduled automations with cron and Windows Task Scheduler for data processing, notifications and reporting.` },
    { k: ['odbc'], name: 'ODBC', ctx: `${N} has hands-on experience with ODBC / SQL Server connectivity.` },
    { k: ['ssl', 'tls'], name: 'SSL/TLS', ctx: `${N} troubleshoots SSL/TLS and API connectivity issues.` },
    { k: ['python'], name: 'Python', ctx: `${N} worked with Python during the Rogers Capital internship (Jun 2023).` },
    { k: ['asp.net', 'asp .net', '.net', 'dotnet', 'c#'], name: 'ASP.NET', ctx: `${N} was exposed to ASP.NET during the Ceridian internship (Jun–Sep 2022).` },
    { k: ['figma', 'prototyp'], name: 'Figma', ctx: `${N} did software design and prototyping in Figma during the Rogers Capital internship.` },
    { k: ['agile', 'scrum'], name: 'Agile / Scrum', ctx: `${N} works with Agile and Scrum practices, first learned during the Ceridian internship.` },
    { k: ['debug', 'troubleshoot'], name: 'Debugging', ctx: `Debugging is a real strength: ${N} traces production issues across the application, database, API and server layers.` }
  ];
  const NOT_LISTED = ['react', 'angular', 'vue', 'laravel', 'symfony', 'codeigniter', 'django', 'flask', 'java ', 'kotlin', 'swift', 'flutter',
    'typescript', 'golang', ' go ', 'rust', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'mongodb', 'postgres', 'redis', 'ruby', 'rails', 'wordpress', 'next.js', 'nextjs', 'tailwind'];

  const PROJECT_KEYS = [
    ['invoice', 'invoic', 'fiscal', 'mra'],
    ['cashback', 'recharge'],
    ['srm', 'free internet', 'airbox'],
    ['lease', 'landlord'],
    ['dose']
  ];

  const INTENTS = [
    { id: 'greet', k: ['hi', 'hello', 'hey', 'bonjour', 'salut', 'good morning', 'good evening', 'hola', 'yo'] },
    { id: 'thanks', k: ['thank', 'thanks', 'merci', 'cheers', 'great', 'awesome', 'cool'] },
    { id: 'play', k: ['how to play', 'how do i play', 'controls', 'jump', 'game', 'play', 'relic', 'score', 'skip'] },
    { id: 'available', k: ['available', 'availability', 'open to', 'freelance', 'opportunit', 'looking for', 'notice', 'seeking', 'job search', 'what roles', 'which roles', 'kind of role', 'type of role', 'want to work'] },
    { id: 'languages', k: ['speak', 'spoken', 'language', 'english', 'french', 'creole', 'kreol', 'hindi'] },
    { id: 'interests', k: ['hobby', 'hobbies', 'interest', 'free time', 'fun', 'anime', 'k-drama', 'kdrama', 'drama', 'music', 'reading', 'robot', ' ai ', 'artificial intelligence', 'outside work', 'passion'] },
    { id: 'blog', k: ['blog', 'post', 'article', 'journey', 'writing', 'write'] },
    { id: 'about', k: ['who', 'about', 'yourself', 'summary', 'introduce', 'background', 'tell me'] },
    { id: 'current', k: ['current', 'now', 'currently', 'today', 'present'] },
    { id: 'experience', k: ['experience', 'work', 'job', 'career', 'emtel', 'role', 'position', 'company', 'worked', 'years', 'employ'] },
    { id: 'internships', k: ['intern', 'internship', 'rogers', 'ceridian'] },
    { id: 'skills', k: ['skill', 'skills', 'tech', 'stack', 'technolog', 'programming', 'framework', 'database', 'tools', 'good at'] },
    { id: 'projects', k: ['project', 'projects', 'built', 'build', 'portfolio', 'worked on', 'made'] },
    { id: 'education', k: ['study', 'studied', 'education', 'degree', 'university', 'bsc', 'school', 'limoges', 'mascareignes', 'student', 'graduat', 'master', 'msc', 'project management', 'qualification'] },
    { id: 'contact', k: ['contact', 'email', 'mail', 'reach', 'hire', 'linkedin', 'phone', 'call', 'connect', 'message', 'get in touch', 'recruit'] },
    { id: 'resume', k: ['cv', 'resume', 'résumé', 'download'] },
    { id: 'location', k: ['where', 'based', 'location', 'mauritius', 'live', 'remote', 'relocat', 'country'] },
    { id: 'strengths', k: ['strength', 'strengths', 'soft skill', 'best at', 'personality', 'qualities'] },
  ];

  const SKILL_Q = /\b(know|knows|use|uses|used|using|experience|experienced|familiar|work with|works with|worked with|skill|can|does|do|good|proficient|level)\b/;

  class TempleGuide {
    constructor() { this.lastTopic = null; }

    reply(raw) {
      const t = ' ' + raw.toLowerCase().replace(/[?!.,;:()]/g, ' ').replace(/\s+/g, ' ') + ' ';
      const has = k => t.includes(k.startsWith(' ') || k.endsWith(' ') ? k : (k.length <= 3 ? ` ${k} ` : k));
      const short = raw.trim().split(/\s+/).length <= 3;

      // 1. specific project
      for (let i = 0; i < PROJECT_KEYS.length; i++) if (PROJECT_KEYS[i].some(has)) return this.project(i);

      // 2. a specific technology
      const skillAsk = SKILL_Q.test(t) || short;
      if (skillAsk) {
        const s = SKILLS.find(sk => sk.k.some(has));
        if (s) {
          return { html: `Yes. ${esc(s.ctx)}`, chips: ['All skills', 'Projects', 'How to contact?'] };
        }
        const nl = NOT_LISTED.find(has);
        if (nl) {
          return {
            html: `${esc(nl.trim().replace(/^\w/, c => c.toUpperCase()))} isn't on ${N}'s CV. The main stack is PHP, JavaScript, SQL Server, MySQL and REST/SOAP APIs. For anything else, the best way to find out is to ask directly at ${mail()}.`,
            chips: ['All skills', 'How to contact?']
          };
        }
      }

      // 3. intents
      let best = null, bestScore = 0;
      for (const it of INTENTS) {
        const s = it.k.reduce((n, k) => n + (has(k) ? 1 : 0), 0);
        if (s > bestScore) { best = it.id; bestScore = s; }
      }
      if (best === 'about') {
        // "tell me about X": prefer the specific topic X
        let alt = null, altScore = 0;
        for (const it of INTENTS) {
          if (it.id === 'about') continue;
          const sc = it.k.reduce((n, k) => n + (has(k) ? 1 : 0), 0);
          if (sc > altScore) { alt = it.id; altScore = sc; }
        }
        if (alt) best = alt;
      }
      if (has('programming')) best = 'skills';
      if (best === 'current' && !has('project')) best = 'currentRole';
      if (has('all skills')) best = 'skills';
      if (has('top skill')) best = 'skills';
      const r = best && this[best] ? this[best]() : this.fallback();
      this.lastTopic = best;
      return r;
    }

    greet() {
      return { html: `Welcome, traveller 🧭 I'm the Temple Guide. I can tell you about ${N}'s experience, skills, projects, education and how to get in touch. What would you like to know?`, chips: ['Who is ' + N + '?', 'What roles?', 'Projects', 'How to contact?'] };
    }
    thanks() { return { html: `You're welcome! Anything else you'd like to know about ${N}?`, chips: ['Projects', 'Download CV', 'How to contact?'] }; }
    play() {
      return {
        html: `Press <b>Space</b>, <b>↑</b> or tap the screen to jump. Hold it for a higher jump. Leap over chasms and roots and collect the glowing relics:<br>🗿 the tablet reveals About me<br>💎 each gem is a skill<br>📜 each scroll is a project<br>🔥 the shrine at the end holds contact details.<br>In a hurry? Use <b>Skip the adventure</b> at the top to see the classic portfolio.`,
        chips: ['Who is ' + N + '?', 'Projects']
      };
    }
    about() {
      return {
        html: `${esc(D.name)} is a ${esc(D.title.toLowerCase())} in ${esc(D.location)} with ${D.yearsExperience} years of experience building and supporting enterprise, business-critical applications. The focus areas are PHP, API integration (REST/SOAP), SQL Server and MySQL, plus billing and payment systems, e-invoicing/fiscalisation, cashback platforms, automation and production troubleshooting.`,
        chips: ['Current role', 'Top skills', 'Projects']
      };
    }
    currentRole() {
      const e = D.experience[0];
      return {
        html: `${N} is currently a <b>${esc(e.role)} at ${esc(e.company)}</b> (${esc(e.dates)}), building PHP enterprise applications, REST/SOAP integrations for billing, payments and e-invoicing, complex SQL queries and scheduled automations, and resolving production issues.`,
        chips: ['Full experience', 'Projects', 'Top skills']
      };
    }
    experience() {
      const rows = D.experience.map(e => `• <b>${esc(e.role)}</b>, ${esc(e.company)} <span class="muted">(${esc(e.dates)})</span>`).join('<br>');
      return {
        html: `${N} has ${D.yearsExperience} years of professional experience, all at Emtel, growing from trainee to software developer:<br>${rows}<br>Before that came internships at Rogers Capital and Ceridian.`,
        chips: ['Current role', 'Internships', 'Projects']
      };
    }
    internships() {
      const rows = D.internships.map(e => `• <b>${esc(e.company)}</b> (${esc(e.dates)}): ${esc(e.points[0])}`).join('<br>');
      return { html: `Internships:<br>${rows}`, chips: ['Full experience', 'Education'] };
    }
    skills() {
      const rows = D.skillGroups.map(g => `<b>${esc(g.group)}:</b> ${g.items.map(esc).join(', ')}`).join('<br>');
      return {
        html: `The core stack is <b>PHP, JavaScript, SQL Server, MySQL and REST/SOAP APIs</b>.<br>${rows}`,
        chips: ['Do you know Python?', 'Strengths', 'Projects']
      };
    }
    projects() {
      const rows = D.projects.map((p, i) => `${p.icon} <b>${esc(p.name)}</b>`).join('<br>');
      return { html: `Here are ${N}'s projects. Ask about any of them for details:<br>${rows}`, chips: D.projects.slice(0, 3).map(p => p.name) };
    }
    project(i) {
      const p = D.projects[i];
      const note = p.internal ? '<br><span class="muted">Internal enterprise system, so the code is confidential.</span>' : (p.academic ? '<br><span class="muted">Academic project.</span>' : '');
      const others = D.projects.filter((_, j) => j !== i).slice(0, 2).map(q => q.name);
      return { html: `${p.icon} <b>${esc(p.name)}</b><br>${esc(p.summary)}<br><span class="muted">${p.tags.map(esc).join(' · ')}</span>${note}`, chips: [...others, 'How to contact?'] };
    }
    education() {
      const rows = D.education.map(e => `• <b>${esc(e.degree)}</b>${e.school ? ', ' + esc(e.school) : ''} <span class="muted">(${esc(e.dates)})</span>`).join('<br>');
      const cur = D.education.find(e => e.current);
      return { html: `${cur ? `${N} is currently studying for an <b>${esc(cur.degree)}</b> alongside working as a developer.<br>` : ''}${rows}`, chips: ['Internships', 'Languages spoken', 'Top skills'] };
    }
    languages() {
      return { html: `${N} speaks ${D.spokenLanguages.map(esc).join(', ').replace(/, ([^,]*)$/, ' and $1')}.`, chips: ['Where is ' + N + ' based?', 'How to contact?'] };
    }
    interests() {
      return { html: `Outside of work, ${N} is curious about <b>artificial intelligence and robotics</b>, and enjoys anime, K-dramas, reading and music.${(D.blog || []).length ? ' There\'s more in the blog post <i>' + esc(D.blog[0].title) + '</i>.' : ''}`, chips: ['Blog', 'Projects'] };
    }
    blog() {
      if (!(D.blog || []).length) return this.fallback();
      const rows = D.blog.map(b => `📝 <a href="#blog">${esc(b.title)}</a> <span class="muted">(${esc(b.date)})</span><br>${esc(b.excerpt)}`).join('<br><br>');
      return { html: rows, chips: ['Hobbies', 'Projects'] };
    }
    contact() {
      const parts = [`📧 ${mail()}`];
      if (D.linkedin) parts.push(`💼 ${link(D.linkedin, 'LinkedIn profile')}`);
      if (D.github) parts.push(`🐙 ${link(D.github, 'GitHub')}`);
      parts.push(`📄 <a href="${esc(D.resume)}" download>Download CV</a>`);
      return { html: `The best way to reach ${N}:<br>${parts.join('<br>')}`, chips: ['Download CV', 'Where is ' + N + ' based?'] };
    }
    resume() {
      return { html: `Here you go: 📄 <a href="${esc(D.resume)}" download>download ${N}'s CV</a>.`, chips: ['How to contact?', 'Projects'] };
    }
    location() { return { html: `${N} is based in <b>${esc(D.location)}</b>. For questions about remote work or relocation, it's best to ask directly at ${mail()}.`, chips: ['How to contact?'] }; }
    strengths() { return { html: `${N}'s professional strengths: ${D.strengths.map(esc).join(', ')}.`, chips: ['Top skills', 'Projects'] }; }
    available() {
      return { html: `${D.lookingFor ? esc(D.lookingFor) + '<br>' : ''}For timing and details, the quickest way is a message to ${mail()}${D.linkedin ? ' or on ' + link(D.linkedin, 'LinkedIn') : ''}.`, chips: ['Download CV', 'Top skills'] };
    }
    fallback() {
      return {
        html: `Hmm, that one isn't written on any temple wall I know 🧭 I can answer questions about ${N}'s experience, skills, projects, education and contact details.`,
        chips: ['Who is ' + N + '?', 'Top skills', 'Projects', 'How to contact?']
      };
    }
  }

  /* ---------------- UI ---------------- */
  function initChat(opts) {
    const guide = new TempleGuide();
    const fab = document.getElementById('chatFab');
    const panel = document.getElementById('chatPanel');
    const log = document.getElementById('chatLog');
    const chipsEl = document.getElementById('chatChips');
    const form = document.getElementById('chatForm');
    const input = document.getElementById('chatInput');
    const closeBtn = document.getElementById('chatClose');
    let greeted = false;

    const scroll = () => { log.scrollTop = log.scrollHeight; };
    const add = (who, html) => {
      const el = document.createElement('div');
      el.className = 'msg ' + who;
      el.innerHTML = html;
      log.appendChild(el); scroll(); return el;
    };
    const setChips = chips => {
      chipsEl.innerHTML = '';
      (chips || []).forEach(c => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'chip'; b.textContent = c;
        b.addEventListener('click', () => ask(c));
        chipsEl.appendChild(b);
      });
    };
    const botSay = r => {
      const typing = add('bot typing', '<span></span><span></span><span></span>');
      setChips([]);
      setTimeout(() => { typing.remove(); add('bot', r.html); setChips(r.chips); }, 420 + Math.random() * 380);
    };
    const ask = text => {
      const q = text.trim(); if (!q) return;
      add('user', esc(q));
      botSay(guide.reply(q));
    };

    const open = () => {
      panel.hidden = false; fab.setAttribute('aria-expanded', 'true'); fab.classList.add('is-open');
      opts.onOpen && opts.onOpen();
      if (!greeted) { greeted = true; botSay(guide.greet()); }
      setTimeout(() => input.focus(), 60);
    };
    const close = () => {
      panel.hidden = true; fab.setAttribute('aria-expanded', 'false'); fab.classList.remove('is-open');
      opts.onClose && opts.onClose(); fab.focus();
    };
    fab.addEventListener('click', () => (panel.hidden ? open() : close()));
    closeBtn.addEventListener('click', close);
    panel.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
    form.addEventListener('submit', e => { e.preventDefault(); ask(input.value); input.value = ''; });
    return { open, close, isOpen: () => !panel.hidden };
  }

  global.TempleGuide = TempleGuide;
  global.initChat = initChat;
})(window);
