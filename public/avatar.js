// Media lives only in this page's memory. Never put it in draft storage.
export function setupAvatar() {
  const input = document.querySelector('#avatar');
  const comparison = document.querySelector('#avatar-comparison');
  const status = document.querySelector('#avatar-status');
  const originalImage = document.querySelector('#avatar-preview');
  const cleanedImage = document.querySelector('#avatar-cleaned');
  const originalRadio = document.querySelector('#avatar-original-choice');
  const cleanedRadio = document.querySelector('#avatar-cleaned-choice');
  let original, cleaned, pending = false, generation = 0;
  let urls = [];
  let controller;

  function clear() {
    controller?.abort();
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
  input.addEventListener('change', async () => {
    const current = ++generation;
    clear();
    const file = input.files[0];
    pending = !!file;
    document.querySelector('#avatar-alt-wrap').hidden = !file;
    status.textContent = file ? 'Preparing your picture… You can continue with the original if cleanup is unavailable.' : '';
    if (!file) return;
    original = file;
    const requestController = new AbortController();
    controller = requestController;
    const timeout = setTimeout(() => requestController.abort(), 30000);
    try {
      const body = new FormData(); body.append('avatar', file);
      const response = await fetch('/api/avatars/previews', { method: 'POST', body, signal: requestController.signal });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 400 && current === generation) { original = undefined; input.value = ''; }
        throw new Error(result.error || 'Preview unavailable');
      }
      const blobs = await Promise.all([fetch(result.original).then(r => r.blob()), result.cleaned ? fetch(result.cleaned).then(r => r.blob()) : undefined]);
      if (current !== generation) return;
      [original, cleaned] = blobs;
      // Raw bytes are no longer needed after normalization.
      input.value = '';
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
    ++generation; clear(); pending = false; input.value = '';
    document.querySelector('#avatar-alt-wrap').hidden = true;
    status.textContent = '';
  });
  return {
    selected: () => cleanedRadio.checked && cleaned ? cleaned : original,
    validate() { if (pending) throw new Error('Your picture is still being prepared. Wait a moment or remove it.'); },
    review(image, alt) {
      image.hidden = !original;
      if (original) { image.src = cleanedRadio.checked && cleaned ? cleanedImage.src : originalImage.src; image.alt = alt; }
    },
    append(body) {
      body.delete('avatar'); body.delete('avatarChoice');
      const selected = this.selected();
      if (selected) body.append('avatar', selected, selected.type === 'image/webp' ? 'avatar.webp' : 'avatar');
    },
    discard() { ++generation; clear(); input.value = ''; pending = false; },
  };
}
