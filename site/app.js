import { stringify } from 'https://cdn.jsdelivr.net/npm/yaml@2.9.1/+esm';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked@15.0.12/+esm';
import DOMPurify from 'https://cdn.jsdelivr.net/npm/dompurify@3.5.0/+esm';

const LOCAL = ['localhost', '127.0.0.1'].includes(location.hostname);
// A local preview reads dev's gallery.
const API = LOCAL ? 'https://api.kloudmate.dev' : 'https://api.kloudmate.com';
const APP = LOCAL ? 'https://app.kloudmate.dev' : 'https://app.kloudmate.com';
const PAGE = 100; // the API's largest page

const TYPES = [
  { key: 'dashboard', label: 'Dashboards', one: 'Dashboard', kinds: ['dashboard', 'dashboard_folder'] },
  { key: 'alert', label: 'Alert rules', one: 'Alert rules', kinds: ['alert_rule', 'alert_folder'] },
  { key: 'workflow', label: 'Workflows', one: 'Workflow', kinds: ['workflow'] },
];

const KIND_LABELS = {
  dashboard_folder: 'Dashboard folder',
  dashboard: 'Dashboard',
  alert_folder: 'Alert folder',
  alert_rule: 'Alert rule',
  workflow: 'Workflow',
  variable: 'Variable',
  aws_account: 'AWS account',
  connection: 'Connection',
  notification_channel: 'Notification channel',
  member: 'Member',
  host: 'Host',
};

const ICONS = {
  search: '<path d="m21 21-4.3-4.3M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  download: '<path d="M12 4v12m0 0-5-5m5 5 5-5M4 20h16"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  back: '<path d="M19 12H5m0 0 6-6m-6 6 6 6"/>',
  dashboard: '<rect x="3" y="3" width="8" height="10" rx="1.5"/><rect x="13" y="3" width="8" height="6" rx="1.5"/><rect x="13" y="11" width="8" height="10" rx="1.5"/><rect x="3" y="15" width="8" height="6" rx="1.5"/>',
  alert: '<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4l2-2ZM10 21h4"/>',
  workflow: '<rect x="3" y="3" width="6" height="6" rx="1.5"/><rect x="15" y="15" width="6" height="6" rx="1.5"/><path d="M6 9v3a3 3 0 0 0 3 3h6"/>',
  installs: '<path d="M12 4v12m0 0-5-5m5 5 5-5"/>',
};

const icon = (name, cls = 'icon') =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

// Every value from the API goes through this before it reaches innerHTML.
const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const typeOf = (item) => TYPES.find((t) => t.kinds.some((k) => item.kinds.includes(k)));

const badge = (b) =>
  b === 'official' ? `<span class="badge badge-official">${icon('shield')}Official</span>` : '';

const plural = (n, word) => `${n.toLocaleString()} ${word}${n === 1 ? '' : 's'}`;

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

const get = async (path) => {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw Object.assign(new Error(res.statusText), { status: res.status });
  return res.json();
};

const isOfficial = (item) => item.publisher.badge === 'official';

// Pages of one group, newest first, up to `max` pages.
const pagesOf = async (official, max) => {
  const items = [];
  for (let offset = 0, n = 0; n < max; offset += PAGE, n++) {
    const page = (await get(`/gallery/items?official=${official}&limit=${PAGE}&offset=${offset}`)).items;
    items.push(...page);
    if (page.length < PAGE) break;
  }
  return items;
};

// ponytail: search and filters run in the browser, so they see every Official
// item but only the newest community ones. Search on the API if that cap bites.
const MAX_COMMUNITY_PAGES = 5;

// KloudMate's own items first, then the community's.
const allItems = async () => {
  const [official, community] = await Promise.all([
    pagesOf(true, Infinity),
    pagesOf(false, MAX_COMMUNITY_PAGES),
  ]);
  return [...official, ...community];
};

const main = document.getElementById('main');

const showError = (retry) => {
  main.innerHTML = `<div class="empty" style="margin-top:48px">
    <h2>Templates didn't load</h2><p>Check your connection, then try again.</p>
    <button class="btn" id="retry">Try again</button></div>`;
  document.getElementById('retry').onclick = retry;
};

/* ---------- home ---------- */

const showList = async () => {
  let items;
  try {
    items = await allItems();
  } catch {
    return showError(showList);
  }

  const params = new URLSearchParams(location.search);
  const state = { q: params.get('q') ?? '', type: params.get('type') ?? '', tag: params.get('tag') ?? '' };

  const tagCounts = new Map();
  for (const item of items) for (const t of item.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  const tags = [...tagCounts.keys()].sort((a, b) => tagCounts.get(b) - tagCounts.get(a) || a.localeCompare(b));

  main.innerHTML = `
    <section class="hero">
      <h1>Ready-made dashboards, alert rules and workflows</h1>
      <p>Copy a template's ID, paste it into Import in KloudMate, and it's in your workspace.</p>
      <label class="search">
        <span class="sr-only">Search templates</span>
        ${icon('search')}
        <input id="q" type="search" placeholder="Search MySQL, Kubernetes, JVM…" autocomplete="off" />
      </label>
    </section>
    <div class="browse">
      <aside class="filters">
        <h2>Type</h2><ul class="kind-list" id="types"></ul>
        ${tags.length ? '<h2>Tags</h2><div class="tag-list" id="tags"></div>' : ''}
      </aside>
      <section>
        <div class="results-head" id="head"></div>
        <div id="results"></div>
      </section>
    </div>`;

  const q = document.getElementById('q');
  q.value = state.q;

  const matches = (item, skip) => {
    const text = state.q.trim().toLowerCase();
    return (
      (skip === 'type' || !state.type || typeOf(item)?.key === state.type) &&
      (skip === 'tag' || !state.tag || item.tags.includes(state.tag)) &&
      (!text ||
        [item.name, item.description, item.publisher.name, ...item.tags].some((s) =>
          (s ?? '').toLowerCase().includes(text),
        ))
    );
  };

  const render = () => {
    const url = new URLSearchParams(Object.entries(state).filter(([, v]) => v));
    history.replaceState(null, '', url.size ? `/?${url}` : '/');

    const forTypes = items.filter((i) => matches(i, 'type'));
    document.getElementById('types').innerHTML = [{ key: '', label: 'All' }, ...TYPES]
      .map((t) => {
        const n = t.key ? forTypes.filter((i) => typeOf(i)?.key === t.key).length : forTypes.length;
        return `<li><button data-type="${t.key}" aria-pressed="${state.type === t.key}">${t.label}<span class="count">${n}</span></button></li>`;
      })
      .join('');

    const tagBox = document.getElementById('tags');
    if (tagBox) {
      tagBox.innerHTML = tags
        .map((t) => `<button class="chip" data-tag="${esc(t)}" aria-pressed="${state.tag === t}">${esc(t)}</button>`)
        .join('');
    }

    const shown = items.filter((i) => matches(i));
    const filtered = state.q || state.type || state.tag;
    document.getElementById('head').innerHTML = `<span>${plural(shown.length, 'template')}</span>${
      filtered ? '<button class="link-btn" id="clear">Clear filters</button>' : ''
    }`;
    document.getElementById('results').innerHTML = shown.length
      ? `<div class="grid">${shown.map(card).join('')}</div>`
      : `<div class="empty"><h2>No templates match</h2><p>Try another word, or clear the filters.</p></div>`;
  };

  q.addEventListener('input', () => {
    state.q = q.value;
    render();
  });
  main.addEventListener('click', (e) => {
    const typeBtn = e.target.closest('[data-type]');
    const tagBtn = e.target.closest('[data-tag]');
    if (typeBtn) state.type = typeBtn.dataset.type;
    else if (tagBtn) state.tag = state.tag === tagBtn.dataset.tag ? '' : tagBtn.dataset.tag;
    else if (e.target.closest('#clear')) {
      Object.assign(state, { q: '', type: '', tag: '' });
      q.value = '';
    } else return;
    render();
  });
  render();
};

const card = (item) => {
  const type = typeOf(item);
  return `<a class="card" href="/${encodeURIComponent(item.slug)}/">
    ${
      item.screenshots.length
        ? `<div class="thumb"><img src="${esc(API + item.screenshots[0])}" alt="" loading="lazy" /></div>`
        : `<div class="thumb thumb-${type?.key ?? 'dashboard'}">${icon(type?.key ?? 'dashboard', '')}</div>`
    }
    <div class="card-body">
      <h3>${esc(item.name)}</h3>
      ${item.description ? `<p>${esc(item.description)}</p>` : ''}
      <div class="card-foot">
        ${badge(item.publisher.badge)}
        ${type ? `<span class="chip">${type.one}</span>` : ''}
        <span class="count" title="Installs">${icon('installs')}${item.installs.toLocaleString()}</span>
      </div>
    </div>
  </a>`;
};

/* ---------- item ---------- */

const showItem = async (slug) => {
  let item;
  try {
    item = await get(`/gallery/items/${encodeURIComponent(slug)}`);
  } catch (e) {
    if (e.status !== 404) return showError(() => showItem(slug));
    document.title = 'Template not found | KloudMate templates';
    main.innerHTML = `<a class="back" href="/">${icon('back')}All templates</a>
      <div class="empty"><h2>This template isn't here</h2>
      <p>It may have been removed, or the link has a typo.</p>
      <a class="btn" href="/">Browse templates</a></div>`;
    return;
  }

  document.title = `${item.name} | KloudMate templates`;
  document.querySelector('meta[name="description"]').content = item.description ?? '';

  const type = typeOf(item);
  const held = item.documents.filter((d) => !d.kind.endsWith('_folder'));
  const kindIcon = (kind) =>
    icon(kind.startsWith('alert') ? 'alert' : kind === 'workflow' ? 'workflow' : 'dashboard');
  const where = type?.key === 'alert' ? 'Alerts' : type?.key === 'workflow' ? 'Workflows' : 'Dashboards';

  main.innerHTML = `
    <a class="back" href="/">${icon('back')}All templates</a>
    <div class="item">
      <header class="item-head">
        <h1>${esc(item.name)}</h1>
        <div class="byline">
          <span>${esc(item.publisher.name)}</span>${badge(item.publisher.badge)}
          <span class="sep">·</span><span>Version ${item.revision}</span>
          <span class="sep">·</span><span>Updated ${formatDate(item.published_at)}</span>
          <span class="sep">·</span><span>${plural(item.installs, 'install')}</span>
        </div>
        ${item.description ? `<p class="lead">${esc(item.description)}</p>` : ''}
      </header>
      <article class="item-body">
        ${
          isOfficial(item)
            ? ''
            : `<p class="note">Published by ${esc(item.publisher.name)}, not by KloudMate. Check what it holds before you install it.</p>`
        }
        ${
          item.screenshots.length
            ? `<div class="shot"><img id="shot" src="${esc(API + item.screenshots[0])}" alt="${esc(item.name)}" /></div>
               ${
                 item.screenshots.length > 1
                   ? `<div class="shots">${item.screenshots
                       .map(
                         (s, i) => `<button type="button" class="shot-pick${i ? '' : ' on'}" data-src="${esc(API + s)}"
                           aria-label="Screenshot ${i + 1}"><img src="${esc(API + s)}" alt="" loading="lazy" /></button>`,
                       )
                       .join('')}</div>`
                   : ''
               }`
            : ''
        }
        ${
          item.setup
            ? `<section class="section"><h2>Before you install</h2>
               <div class="setup">${DOMPurify.sanitize(marked.parse(item.setup))}</div></section>`
            : ''
        }
        <section class="section">
          <h2>What's inside</h2>
          <ul class="rows">${held
            .map(
              (d) => `<li>${kindIcon(d.kind)}<span>${esc(d.spec?.name ?? d.uid)}</span>
                <span class="chip">${KIND_LABELS[d.kind] ?? esc(d.kind)}</span></li>`,
            )
            .join('')}</ul>
        </section>
        ${
          item.needs.length
            ? `<section class="section"><h2>What it needs</h2>
               <p>When you install, you pick a match for each of these from your workspace.</p>
               <ul class="rows">${item.needs
                 .map(
                   (n) => `<li><span>${KIND_LABELS[n.kind] ?? esc(n.kind)}${n.type ? ` · ${esc(n.type)}` : ''}</span>
                     ${n.name ? `<span class="chip">${esc(n.name)}</span>` : ''}</li>`,
                 )
                 .join('')}</ul></section>`
            : ''
        }
        ${
          item.tags.length
            ? `<div class="tag-list">${item.tags
                .map((t) => `<a class="chip" href="/?tag=${encodeURIComponent(t)}">${esc(t)}</a>`)
                .join('')}</div>`
            : ''
        }
      </article>
      <aside class="panel">
        <h2>Install</h2>
        <div class="id-box">
          <code>${esc(item.slug)}</code>
          <button class="btn btn-small" id="copy">${icon('copy')}<span>Copy ID</span></button>
        </div>
        <ol>
          <li>In KloudMate, click <b>Import</b> on the ${where} list.</li>
          <li>Paste the ID and click <b>Check</b>.</li>
          <li>Review the changes and click <b>Apply</b>.</li>
        </ol>
        <a class="btn btn-primary btn-block" href="${APP}/gallery/${encodeURIComponent(item.slug)}" target="_blank" rel="noopener">
          Open in KloudMate${icon('external')}</a>
        <button class="btn btn-block" id="yaml">${icon('download')}Download YAML</button>
        <div class="panel-foot">Installing makes a copy in your workspace. A later version doesn't change it until you install again.</div>
      </aside>
    </div>`;

  for (const pick of document.querySelectorAll('.shot-pick')) {
    pick.onclick = () => {
      document.getElementById('shot').src = pick.dataset.src;
      for (const p of document.querySelectorAll('.shot-pick')) p.classList.toggle('on', p === pick);
    };
  }

  const copy = document.getElementById('copy');
  copy.onclick = async () => {
    try {
      await navigator.clipboard.writeText(item.slug);
    } catch {
      // The browser refused the clipboard: select the ID to copy by hand.
      getSelection().selectAllChildren(copy.previousElementSibling);
      return;
    }
    copy.lastElementChild.textContent = 'Copied';
    setTimeout(() => (copy.lastElementChild.textContent = 'Copy ID'), 1500);
  };

  // The same file `kmctl` and Import read: one YAML document per resource.
  document.getElementById('yaml').onclick = () => {
    const yaml = item.documents.map((d) => stringify(d, { lineWidth: 0 })).join('---\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([yaml], { type: 'text/yaml' }));
    a.download = `${item.slug}.yaml`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
};

/* ---------- route ---------- */

// GitHub Pages serves this page for every path it has no file for, so the
// path names the item: `/<slug>/`.
const slug = decodeURIComponent(location.pathname.replace(/^\/+|\/+$/g, '')).toLowerCase();
if (slug && slug !== 'index.html' && slug !== '404.html') showItem(slug);
else showList();
