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

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = !message;
}

function currentData() {
  return Object.fromEntries(new FormData(form).entries());
}

function avatarFile() {
  return document.querySelector('#avatar').files[0];
}

function saveLocally() {
  localStorage.setItem(storageKey, JSON.stringify({ draftId, ...currentData() }));
}

async function createDraft() {
  const response = await fetch('/api/drafts', { method: 'POST' });
  if (!response.ok) throw new Error('Could not start a draft');
  const draft = await response.json();
  draftId = draft.id;
  saveLocally();
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
  updateAttribution();
  await updateDraftName(true);
}

async function updateDraftName(createIfMissing = false) {
  const name = document.querySelector('#name').value.trim();
  if (!draftId) return;
  const response = await fetch(`/api/drafts/${draftId}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name || 'Untitled pattern' }),
  });
  if (response.status === 404 && createIfMissing) {
    await createDraft();
    return updateDraftName(false);
  }
}

function updateAttribution() {
  const kind = document.querySelector('[name="attributionKind"]:checked').value;
  document.querySelector('#attribution-name-wrap').hidden = kind === 'anonymous';
}

function validate() {
  const data = currentData();
  for (const field of ['name', 'context', 'problem', 'solution']) {
    if (!String(data[field] || '').trim()) {
      document.querySelector(`#${field}`).focus();
      throw new Error(`Please add the ${field}`);
    }
  }
  if (avatarFile() && !String(data.avatarAlt || '').trim()) {
    document.querySelector('#avatarAlt').focus();
    throw new Error('Please add a short description of the picture');
  }
  if (data.attributionKind !== 'anonymous' && !String(data.attributionName || '').trim()) {
    document.querySelector('#attributionName').focus();
    throw new Error('Please add the individual or group name');
  }
  return data;
}

function showReview(data) {
  const reviewAvatar = document.querySelector('#review-avatar');
  const file = avatarFile();
  reviewAvatar.hidden = !file;
  if (file) { reviewAvatar.src = URL.createObjectURL(file); reviewAvatar.alt = data.avatarAlt; }
  document.querySelector('#review-name').textContent = data.name;
  for (const field of ['context', 'problem', 'solution']) document.querySelector(`#review-${field}`).textContent = data[field];
  document.querySelector('#review-attribution').textContent = data.attributionKind === 'anonymous' ? 'Anonymous contribution' : `Contributed by ${data.attributionName}`;
  captureStep.hidden = true; reviewStep.hidden = false; resultStep.hidden = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

form.addEventListener('input', () => {
  saveLocally();
  clearTimeout(updateTimer);
  updateTimer = setTimeout(() => updateDraftName(false), 250);
});
form.addEventListener('change', updateAttribution);
document.querySelector('#avatar').addEventListener('change', event => {
  const file = event.target.files[0];
  const preview = document.querySelector('#avatar-preview');
  const altWrap = document.querySelector('#avatar-alt-wrap');
  preview.hidden = !file; altWrap.hidden = !file;
  if (file) preview.src = URL.createObjectURL(file);
});
form.addEventListener('submit', event => {
  event.preventDefault(); showError('');
  try { showReview(validate()); } catch (error) { showError(error.message); }
});
document.querySelector('#back-button').addEventListener('click', () => {
  reviewStep.hidden = true; captureStep.hidden = false; window.scrollTo({ top: 0, behavior: 'smooth' });
});
publishButton.addEventListener('click', async () => {
  showError(''); publishButton.disabled = true; publishButton.textContent = 'Publishing…';
  try {
    validate();
    const body = new FormData(form);
    body.set('captureId', draftId);
    const response = await fetch('/api/patterns', { method: 'POST', body });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Publication failed');
    localStorage.removeItem(storageKey);
    reviewStep.hidden = true; resultStep.hidden = false;
    const link = document.querySelector('#pattern-link'); link.href = result.publicUrl;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    showError(error.message); publishButton.disabled = false; publishButton.textContent = 'Try publishing again';
  }
});
document.querySelector('#another-button').addEventListener('click', () => location.reload());

restoreOrCreateDraft().catch(error => showError(error.message));
