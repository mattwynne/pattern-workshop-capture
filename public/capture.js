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
let recordedAudio;
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
  const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
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
  const reviewAvatar = document.querySelector('#review-avatar');
  avatar.review(reviewAvatar, data.avatarAlt);
  document.querySelector('#review-name').textContent = data.name;
  for (const field of ['context', 'problem', 'solution']) document.querySelector(`#review-${field}`).textContent = data[field];
  document.querySelector('#review-attribution').textContent = data.attributionKind === 'anonymous' ? 'Anonymous contribution' : `Contributed by ${data.attributionName}`;
  captureStep.hidden = true; reviewStep.hidden = false; resultStep.hidden = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderSuggestions(next) {
  suggestions = next;
  const list = document.querySelector('#suggestion-list');
  list.replaceChildren(...Object.entries(next).filter(([, value]) => value).map(([field, value]) => {
    const row = document.createElement('div'); row.className = 'suggestion-row';
    const copy = document.createElement('div');
    const label = document.createElement('strong'); label.textContent = field[0].toUpperCase() + field.slice(1);
    const text = document.createElement('p'); text.textContent = value; copy.append(label, text);
    const use = document.createElement('button'); use.type = 'button'; use.className = 'secondary compact'; use.textContent = `Use ${field}`;
    use.addEventListener('click', () => { document.querySelector(`#${field}`).value = value; saveLocally(); updateDraftName(false); });
    row.append(copy, use); return row;
  }));
  document.querySelector('#suggestions').hidden = list.children.length === 0;
}

async function interpretFile(endpoint, fieldName, file, button) {
  showError(''); button.disabled = true; const original = button.textContent; button.textContent = 'Working…';
  try {
    const body = new FormData(); body.append(fieldName, file, file.name || `${fieldName}.webm`);
    const response = await fetch(endpoint, { method: 'POST', body });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Interpretation failed');
    if (result.transcript) { const transcript = document.querySelector('#transcript'); transcript.textContent = result.transcript; transcript.hidden = false; }
    renderSuggestions(result.suggestions);
  } catch (error) { showError(error.message); }
  finally { button.disabled = false; button.textContent = original; }
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
  saveLocally(); updateDraftName(false);
});

const audioInput = document.querySelector('#audio-file');
const audioButton = document.querySelector('#interpret-audio');
audioInput.addEventListener('change', () => { recordedAudio = undefined; audioButton.disabled = !audioInput.files[0]; });
audioButton.addEventListener('click', () => {
  const file = recordedAudio || audioInput.files[0];
  if (file) interpretFile('/api/interpret/audio', 'audio', file, audioButton);
});

const recordButton = document.querySelector('#record-audio');
const recordingTime = document.querySelector('#recording-time');
let recorder;
let recordTimer;
recordButton.addEventListener('click', async () => {
  if (recorder?.state === 'recording') { recorder.stop(); return; }
  showError('');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const preferred = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
    recorder = new MediaRecorder(stream, preferred ? { mimeType: preferred } : undefined);
    const chunks = []; let seconds = 0;
    recorder.addEventListener('dataavailable', event => { if (event.data.size) chunks.push(event.data); });
    recorder.addEventListener('stop', () => {
      clearInterval(recordTimer); stream.getTracks().forEach(track => track.stop());
      recordedAudio = new File(chunks, `explanation.${recorder.mimeType.includes('mp4') ? 'm4a' : recorder.mimeType.includes('ogg') ? 'ogg' : 'webm'}`, { type: recorder.mimeType });
      audioButton.disabled = false; recordButton.textContent = '● Record again'; recordingTime.textContent = `Recorded ${seconds}s`;
    });
    recorder.start(); recordButton.textContent = '■ Stop recording'; recordingTime.textContent = 'Recording 0:00 / 2:00';
    recordTimer = setInterval(() => {
      seconds += 1; recordingTime.textContent = `Recording ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} / 2:00`;
      if (seconds >= 120) recorder.stop();
    }, 1000);
  } catch { showError('Microphone access was not available. You can choose an audio file instead.'); }
});

document.querySelector('#back-button').addEventListener('click', () => { reviewStep.hidden = true; captureStep.hidden = false; window.scrollTo({ top: 0, behavior: 'smooth' }); });
publishButton.addEventListener('click', async () => {
  showError(''); publishButton.disabled = true; publishButton.textContent = 'Publishing…';
  try {
    validate(); const body = new FormData(form); body.set('captureId', draftId); avatar.append(body);
    const response = await fetch('/api/patterns', { method: 'POST', body }); const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Publication failed');
    avatar.discard(); localStorage.removeItem(storageKey); reviewStep.hidden = true; resultStep.hidden = false;
    const link = document.querySelector('#pattern-link'); link.href = result.publicUrl; window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) { showError(error.message); publishButton.disabled = false; publishButton.textContent = 'Try publishing again'; }
});
document.querySelector('#another-button').addEventListener('click', () => location.reload());
restoreOrCreateDraft().catch(error => showError(error.message));
