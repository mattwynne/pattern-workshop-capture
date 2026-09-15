import { setupAudio } from './audio.js';
import { setupAvatar } from './avatar.js';
const avatar = setupAvatar();
const form = document.querySelector('#pattern-form');
const captureStep = document.querySelector('#capture-step');
const reviewStep = document.querySelector('#review-step');
const resultStep = document.querySelector('#result-step');
const errorBox = document.querySelector('#error');
const publishButton = document.querySelector('#publish-button');
const fields = ['name', 'context', 'problem', 'solution', 'attributionName', 'avatarAlt'];
const storageKey = 'pattern-workshop-draft';
let draftId;
let updateTimer;
let suggestions = {};

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = !message;
}

function currentData() { return Object.fromEntries(new FormData(form).entries()); }
function avatarFile() { return avatar.selected(); }
function saveLocally() { localStorage.setItem(storageKey, JSON.stringify({ draftId, ...currentData(), avatar: undefined })); }

async function createDraft() {
  const response = await fetch('/api/drafts', { method: 'POST' });
  if (!response.ok) throw new Error('Could not start a draft');
  const draft = await response.json(); draftId = draft.id; saveLocally();
}

async function restoreOrCreateDraft() {
  let saved;
  try { saved = JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch { localStorage.removeItem(storageKey); }
  if (saved) {
    draftId = saved.draftId;
    for (const field of fields) if (saved[field] !== undefined) document.querySelector(`#${field}`).value = saved[field];
    if (saved.attributionKind) {
      const radio = document.querySelector(`[name="attributionKind"][value="${saved.attributionKind}"]`);
      if (radio) radio.checked = true;
    }
  }
  if (!draftId) await createDraft();
  updateAttribution(); await updateDraftName(true);
}

async function updateDraftName(createIfMissing = false) {
  const name = document.querySelector('#name').value.trim();
  if (!draftId) return;
  const response = await fetch(`/api/drafts/${draftId}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name || 'Untitled pattern' }),
  });
  if (response.status === 404 && createIfMissing) { await createDraft(); return updateDraftName(false); }
}

function updateAttribution() {
  const kind = document.querySelector('[name="attributionKind"]:checked').value;
  document.querySelector('#attribution-name-wrap').hidden = kind === 'anonymous';
}

function validate() {
  avatar.validate();
  const data = currentData();
  for (const field of ['name', 'context', 'problem', 'solution']) {
    if (!String(data[field] || '').trim()) { document.querySelector(`#${field}`).focus(); throw new Error(`Please add the ${field}`); }
  }
  if (avatarFile() && !String(data.avatarAlt || '').trim()) {
    document.querySelector('#avatarAlt').focus(); throw new Error('Please add a short description of the picture');
  }
  if (data.attributionKind !== 'anonymous' && !String(data.attributionName || '').trim()) {
    document.querySelector('#attributionName').focus(); throw new Error('Please add the individual or group name');
  }
  return data;
}

function showReview(data) {
  interpretationVersion++;
  audio.discard('Audio discarded for review.');
  const reviewAvatar = document.querySelector('#review-avatar');
  avatar.review(reviewAvatar, data.avatarAlt);
  document.querySelector('#review-name').textContent = data.name;
  for (const field of ['context', 'problem', 'solution']) document.querySelector(`#review-${field}`).textContent = data[field];
  document.querySelector('#review-attribution').textContent = data.attributionKind === 'anonymous' ? 'Anonymous contribution' : `Contributed by ${data.attributionName}`;
  captureStep.hidden = true; reviewStep.hidden = false; resultStep.hidden = true;
  document.querySelector('#review-name').setAttribute('tabindex', '-1');
  document.querySelector('#review-name').focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderSuggestions(next) {
  next = Object.fromEntries(Object.entries(next || {}).filter(([key, value]) => ['name', 'context', 'problem', 'solution'].includes(key) && typeof value === 'string' && value.trim()));
  suggestions = next;
  const list = document.querySelector('#suggestion-list');
  list.replaceChildren(...Object.entries(next).filter(([, value]) => value).map(([field, value]) => {
    const row = document.createElement('div'); row.className = 'suggestion-row';
    const copy = document.createElement('div');
    const label = document.createElement('strong'); label.textContent = field[0].toUpperCase() + field.slice(1);
    const text = document.createElement('p'); text.textContent = value; copy.append(label, text);
    const use = document.createElement('button'); use.type = 'button'; use.className = 'secondary compact'; use.textContent = `Use ${field}`;
    use.addEventListener('click', () => { document.querySelector(`#${field}`).value = value; use.disabled = true; delete suggestions[field]; saveLocally(); updateDraftName(false); });
    row.append(copy, use); return row;
  }));
  document.querySelector('#suggestions').hidden = list.children.length === 0;
}

function clearResults() {
  renderSuggestions({});
  const transcript = document.querySelector('#transcript'); transcript.textContent = ''; transcript.hidden = true;
}
let interpretationVersion = 0;
async function interpretFile(endpoint, fieldName, file, button, signal, isCurrent = () => true) {
  const generation = ++interpretationVersion;
  const current = () => generation === interpretationVersion && isCurrent() && !signal?.aborted;
  clearResults();
  showError(''); button.disabled = true; const original = button.textContent; button.textContent = 'Working…';
  try {
    const body = new FormData(); body.append(fieldName, file, file.name || `${fieldName}.webm`);
    const response = await fetch(endpoint, { method: 'POST', body, signal });
    const result = await response.json();
    if (!current()) return;
    if (!response.ok) throw new Error(result.error || 'Interpretation failed');
    if (result.transcript) { const transcript = document.querySelector('#transcript'); transcript.textContent = result.transcript; transcript.hidden = false; }
    renderSuggestions(result.suggestions);
    if (result.warning) showError(result.warning);
  } catch (error) { if (generation === interpretationVersion && isCurrent()) showError(signal?.aborted ? 'Transcription timed out. Record again or enter the fields manually.' : error.message); }
  finally { if (!signal) { button.disabled = false; button.textContent = original; } }
}

form.addEventListener('input', () => { saveLocally(); clearTimeout(updateTimer); updateTimer = setTimeout(() => updateDraftName(false), 250); });
form.addEventListener('change', updateAttribution);
form.addEventListener('submit', event => { event.preventDefault(); showError(''); try { showReview(validate()); } catch (error) { showError(error.message); } });

const photoInput = document.querySelector('#card-photo');
const photoButton = document.querySelector('#interpret-photo');
photoInput.addEventListener('change', () => { photoButton.disabled = !photoInput.files[0]; });
photoButton.addEventListener('click', () => interpretFile('/api/interpret/photo', 'photo', photoInput.files[0], photoButton));

document.querySelector('#use-all-suggestions').addEventListener('click', () => {
  for (const [field, value] of Object.entries(suggestions)) if (value) document.querySelector(`#${field}`).value = value;
  renderSuggestions({}); saveLocally(); updateDraftName(false);
});

const audio = setupAudio({ showError, clearResults: () => { interpretationVersion++; clearResults(); },
  interpret: (file, signal, current) => interpretFile('/api/interpret/audio', 'audio', file, document.querySelector('#interpret-audio'), signal, current),
});

document.querySelector('#back-button').addEventListener('click', () => { reviewStep.hidden = true; captureStep.hidden = false; document.querySelector('#name').focus(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
publishButton.addEventListener('click', async () => {
  showError(''); publishButton.disabled = true; publishButton.textContent = 'Publishing…';
  try {
    validate(); const body = new FormData(form); body.set('captureId', draftId); avatar.append(body);
    const response = await fetch('/api/patterns', { method: 'POST', body }); const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Publication failed');
    avatar.discard(); localStorage.removeItem(storageKey); reviewStep.hidden = true; resultStep.hidden = false;
    const link = document.querySelector('#pattern-link'); link.href = result.publicUrl; link.focus(); window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) { showError(error.message); publishButton.disabled = false; publishButton.textContent = 'Try publishing again'; }
});
document.querySelector('#another-button').addEventListener('click', () => location.reload());
restoreOrCreateDraft().catch(error => showError(error.message));
