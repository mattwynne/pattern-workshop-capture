// Media lives only in this page's memory. Never put it in draft storage.
export function setupAvatar() {
  const inputs = document.querySelectorAll('#avatar, #avatar-camera');
  const comparison = document.querySelector('#avatar-comparison');
  const status = document.querySelector('#avatar-status');
  const originalImage = document.querySelector('#avatar-preview');
  const cleanedImage = document.querySelector('#avatar-cleaned');
  const originalRadio = document.querySelector('#avatar-original-choice');
  const cleanedRadio = document.querySelector('#avatar-cleaned-choice');
  const alt = document.querySelector('#avatarAlt');
  const altStatus = document.querySelector('#avatar-alt-status');
  let descriptionController, suggestedAlt, editVersion = 0;
  alt.addEventListener('input', () => { editVersion++; });
  let original, cleaned, pending = false, generation = 0;
  let urls = [];
  let controller;

  function cancelDescription() {
    descriptionController?.abort();
    descriptionController = undefined;
    altStatus.textContent = '';
  }
  async function describe(file, current) {
    if (alt.value.trim()) return; // Keep descriptions already written by the contributor.
    const edits = editVersion;
    const request = new AbortController(); descriptionController = request;
    const timeout = setTimeout(() => request.abort(), 70000);
    altStatus.textContent = 'Suggesting a picture description… You can write your own while you wait.';
    try {
      const body = new FormData(); body.append('avatar', file);
      const response = await fetch('/api/avatars/description', { method: 'POST', body, signal: request.signal });
      const result = await response.json();
      if (current !== generation || request.signal.aborted || edits !== editVersion) return;
      if (!response.ok || typeof result.alt !== 'string' || !result.alt.trim()) throw new Error('No description');
      suggestedAlt = result.alt.trim().slice(0, 240);
      alt.value = suggestedAlt;
      alt.dispatchEvent(new Event('input', { bubbles: true }));
      altStatus.textContent = 'Description suggested. Check and edit it before publishing.';
    } catch {
      if (current === generation && descriptionController === request && edits === editVersion) {
        altStatus.textContent = 'Could not suggest a description. Please describe the picture yourself.';
      }
    } finally {
      clearTimeout(timeout);
      if (descriptionController === request) {
        descriptionController = undefined;
        if (edits !== editVersion && alt.value !== suggestedAlt) altStatus.textContent = '';
      }
    }
  }
  function clear() {
    controller?.abort();
    cancelDescription();
    if (suggestedAlt !== undefined && alt.value === suggestedAlt) {
      alt.value = ''; alt.dispatchEvent(new Event('input', { bubbles: true }));
    }
    suggestedAlt = undefined;
    for (const url of urls) URL.revokeObjectURL(url);
    urls = []; original = cleaned = undefined;
    originalImage.removeAttribute('src'); cleanedImage.removeAttribute('src');
    document.querySelector('#review-avatar').removeAttribute('src');
    comparison.hidden = true; cleanedImage.hidden = true;
    originalRadio.checked = true; cleanedRadio.disabled = true;
  }
  function display(image, blob) {
    const url = URL.createObjectURL(blob); urls.push(url); image.src = url;
  }
  for (const input of inputs) input.addEventListener('change', async () => {
    const current = ++generation;
    clear();
    const file = input.files[0];
    input.value = ''; // Both pickers can select the same photo again; retain media only in memory.
    pending = !!file;
    document.querySelector('#avatar-alt-wrap').hidden = !file;
    status.textContent = file ? 'Preparing your picture… You can continue with the original if cleanup is unavailable.' : '';
    if (!file) return;
    original = file;
    describe(file, current);
    const requestController = new AbortController();
    controller = requestController;
    const timeout = setTimeout(() => requestController.abort(), 30000);
    try {
      const body = new FormData(); body.append('avatar', file);
      const response = await fetch('/api/avatars/previews', { method: 'POST', body, signal: requestController.signal });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 400 && current === generation) { original = undefined; cancelDescription(); }
        throw new Error(result.error || 'Preview unavailable');
      }
      const blobs = await Promise.all([fetch(result.original).then(r => r.blob()), result.cleaned ? fetch(result.cleaned).then(r => r.blob()) : undefined]);
      if (current !== generation) return;
      [original, cleaned] = blobs;
      status.textContent = result.warning || 'Compare both pictures and choose one. The original is selected by default.';
    } catch (error) {
      if (current !== generation) return;
      status.textContent = original ? 'Preview unavailable. You can publish the original, retry by choosing it again, or remove the picture.' : error.message;
    } finally {
      clearTimeout(timeout);
      if (current === generation) {
        pending = false; comparison.hidden = !original;
        document.querySelector('#avatar-alt-wrap').hidden = !original;
        if (original) display(originalImage, original);
        if (cleaned) { display(cleanedImage, cleaned); cleanedImage.hidden = false; cleanedRadio.disabled = false; }
      }
    }
  });
  document.querySelector('#remove-avatar').addEventListener('click', () => {
    ++generation; clear(); pending = false;
    document.querySelector('#avatar-alt-wrap').hidden = true;
    status.textContent = '';
  });
  return {
    version: () => generation,
    async usePhoto(previews, expectedVersion, isCurrent) {
      const canApply = () => generation === expectedVersion && !original && !pending && isCurrent();
      if (!previews || !canApply()) return false;
      try {
        const blobs = await Promise.all([fetch(previews.original).then(r => r.blob()), previews.cleaned ? fetch(previews.cleaned).then(r => r.blob()) : undefined]);
        if (!canApply()) return false;
        ++generation; clear();
        [original, cleaned] = blobs;
        display(originalImage, original);
        if (cleaned) { display(cleanedImage, cleaned); cleanedImage.hidden = false; cleanedRadio.disabled = false; }
        comparison.hidden = false;
        document.querySelector('#avatar-alt-wrap').hidden = false;
        status.textContent = previews.warning || 'Picture taken from the card. Check the crop and description, then choose the original or gently cleaned version. You can replace or remove it.';
        return true;
      } catch {
        if (canApply()) status.textContent = 'The card picture could not be loaded. Choose a separate picture if needed.';
        return false;
      }
    },
    selected: () => cleanedRadio.checked && cleaned ? cleaned : original,
    validate() { if (pending) throw new Error('Your picture is still being prepared. Wait a moment or remove it.'); },
    review(image, alt) {
      cancelDescription(); // A late suggestion must not change text after review begins.
      image.hidden = !original;
      if (original) { image.src = cleanedRadio.checked && cleaned ? cleanedImage.src : originalImage.src; image.alt = alt; }
    },
    append(body) {
      body.delete('avatar'); body.delete('avatarChoice');
      const selected = this.selected();
      if (selected) body.append('avatar', selected, selected.type === 'image/webp' ? 'avatar.webp' : 'avatar');
    },
    discard() { ++generation; clear(); pending = false; },
  };
}
