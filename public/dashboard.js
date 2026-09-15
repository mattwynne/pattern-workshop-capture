const board = document.querySelector('#board');
const badge = document.querySelector('.live-badge');
const summary = document.querySelector('#board-summary');
const position = document.querySelector('#page-position');
const previous = document.querySelector('#previous-page');
const next = document.querySelector('#next-page');
const labels = { drafting: 'Being written', publishing: 'Saving to Git', 'awaiting-pages': 'Saved · waiting for Pages', 'publication-delayed': 'Saved · Pages delayed; retry from capture', published: 'Published', failed: 'Needs another try' };
let drafts = [], page = 0;
const pageSize = 12;
const cards = new Map();
function render() {
  const pages = Math.max(1, Math.ceil(drafts.length / pageSize));
  page = Math.min(page, pages - 1);
  position.textContent = `Page ${page + 1} of ${pages}`;
  previous.disabled = page === 0; next.disabled = page === pages - 1;
  summary.textContent = `${drafts.length} patterns · ${drafts.filter(draft => draft.stage === 'published').length} published`;
  const visible = drafts.slice(page * pageSize, (page + 1) * pageSize);
  const ids = new Set(visible.map(draft => draft.id));
  for (const [id, card] of cards) if (!ids.has(id)) { card.remove(); cards.delete(id); }
  board.querySelector('.empty')?.remove();
  for (const draft of visible) {
    let card = cards.get(draft.id);
    if (!card) {
      card = document.createElement('article'); card.className = 'status-card';
      card.append(document.createElement('h2'), document.createElement('span'));
      cards.set(draft.id, card); board.append(card);
    }
    const title = card.querySelector('h2'), status = card.querySelector('span');
    let url;
    try { const parsed = new URL(draft.publicUrl); if (draft.stage === 'published' && parsed.protocol === 'https:' && !parsed.username && !parsed.password) url = parsed.href; } catch {}
    if (url) {
      let link = title.querySelector('a');
      if (!link) { link = document.createElement('a'); title.replaceChildren(link); }
      link.href = url; link.textContent = draft.name;
    } else if (title.textContent !== draft.name) title.textContent = draft.name;
    status.className = `status ${Object.hasOwn(labels, draft.stage) ? draft.stage : 'drafting'}`;
    status.textContent = labels[draft.stage] || 'Being written';
  }
  if (!drafts.length) { const empty = document.createElement('p'); empty.className = 'empty'; empty.textContent = 'Waiting for the first pattern…'; board.append(empty); }
}
previous.addEventListener('click', () => { page--; render(); });
next.addEventListener('click', () => { page++; render(); });
function snapshot(data) {
  const parsed = JSON.parse(data);
  if (!Array.isArray(parsed)) throw new Error('Invalid snapshot');
  drafts = parsed; render(); badge.textContent = 'Live from the room';
}
if (typeof EventSource === 'function') {
  const events = new EventSource('/api/dashboard/events');
  events.onopen = () => { badge.textContent = 'Connected · waiting for snapshot'; };
  events.onerror = () => { badge.textContent = 'Reconnecting… showing last update'; };
  events.onmessage = ({ data }) => { try { snapshot(data); } catch { badge.textContent = 'Waiting for a valid update'; } };
  addEventListener('pagehide', () => events.close());
  addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
} else {
  badge.textContent = 'Live updates unavailable in this browser. Use a browser with EventSource support.';
}
