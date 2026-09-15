// All temporary audio lives in this page or an active request; never draft storage.
export function setupAudio({ showError, clearResults, interpret }) {
  const input = document.querySelector('#audio-file');
  const transcribe = document.querySelector('#interpret-audio');
  const record = document.querySelector('#record-audio');
  const cancel = document.querySelector('#cancel-audio');
  const timer = document.querySelector('#recording-time');
  const status = document.querySelector('#audio-status');
  const supported = !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
  let session, file, request, version = 0;
  const tracksOff = stream => stream?.getTracks().forEach(track => track.stop());
  function controls() {
    record.disabled = !supported || !!request || session?.phase === 'stopping';
    record.textContent = session ? (session.phase === 'permission' ? 'Waiting for microphone…' : '■ Stop recording') : '● Start recording';
    if (session?.phase === 'permission') record.disabled = true;
    input.disabled = !!session || !!request;
    transcribe.disabled = !!session || !!request || !file;
    transcribe.textContent = request ? 'Transcribing…' : 'Transcribe and suggest fields';
    cancel.hidden = !session && !request && !file;
  }
  function discard(message = 'Audio cancelled. You can keep editing manually.') {
    version++;
    const old = session; session = undefined;
    if (old) {
      clearInterval(old.timer); old.chunks.length = 0;
      if (old.recorder?.state !== 'inactive') { try { old.recorder?.stop(); } catch {} }
      tracksOff(old.stream);
    }
    request?.abort(); request = undefined;
    file = undefined; input.value = ''; timer.textContent = '';
    status.textContent = message; controls();
  }
  cancel.addEventListener('click', () => { discard(); clearResults(); record.focus(); });
  input.addEventListener('change', () => {
    const selected = input.files[0]; discard(''); clearResults(); showError('');
    if (selected?.size > 16 * 1024 * 1024) showError('The audio must be 16 MiB or smaller.');
    else if (selected && !selected.size) showError('The audio file is empty. Choose another file.');
    else file = selected;
    status.textContent = file ? 'Audio ready to transcribe.' : ''; controls();
  });
  record.addEventListener('click', async () => {
    if (session?.recorder) { session.phase = 'stopping'; session.recorder.stop(); controls(); return; }
    discard('Requesting microphone access…'); clearResults(); showError('');
    const current = { phase: 'permission', chunks: [], bytes: 0 };
    session = current; controls();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (session !== current) { tracksOff(stream); return; }
      current.stream = stream;
      const preferred = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
        .find(type => MediaRecorder.isTypeSupported?.(type));
      const recorder = new MediaRecorder(stream, preferred ? { mimeType: preferred } : undefined);
      current.recorder = recorder;
      const fail = () => { if (session === current) { discard('Recording interrupted.'); showError('Recording failed. Record again, choose an audio file, or edit manually.'); } };
      recorder.addEventListener('error', fail);
      stream.getTracks().forEach(track => track.addEventListener('ended', fail));
      recorder.addEventListener('dataavailable', event => {
        if (session !== current || !event.data.size) return;
        current.bytes += event.data.size;
        if (current.bytes > 16 * 1024 * 1024) { discard('Recording too large.'); showError('The audio must be 16 MiB or smaller.'); }
        else current.chunks.push(event.data);
      });
      recorder.addEventListener('stop', () => {
        if (session !== current) return;
        session = undefined; clearInterval(current.timer); tracksOff(stream);
        const mime = recorder.mimeType || current.chunks.find(chunk => chunk.type)?.type || preferred;
        const ext = { 'audio/mp4': 'm4a', 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/wav': 'wav' }[mime?.split(';')[0]];
        if (current.bytes && ext) file = new File(current.chunks, `explanation.${ext}`, { type: mime });
        current.chunks.length = 0;
        timer.textContent = `Recorded ${Math.min(120, Math.round((performance.now() - current.started) / 1000))}s`;
        status.textContent = file ? 'Recording ready to transcribe.' : 'No supported audio was captured. Record again or choose an audio file.';
        controls();
      });
      current.started = performance.now(); current.phase = 'recording';
      recorder.start(250); status.textContent = 'Recording started. Stop to keep it, or cancel to discard it.';
      timer.textContent = 'Recording 0:00 / 2:00'; controls();
      current.timer = setInterval(() => {
        const seconds = Math.min(120, Math.floor((performance.now() - current.started) / 1000));
        timer.textContent = `Recording ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} / 2:00`;
        if (seconds >= 120 && recorder.state === 'recording') { current.phase = 'stopping'; recorder.stop(); controls(); }
      }, 250);
    } catch {
      if (session === current) { discard('Microphone unavailable.'); showError('Microphone access was not available. You can choose an audio file instead or edit manually.'); }
    }
  });
  transcribe.addEventListener('click', async () => {
    if (!file || request || session) return;
    const generation = ++version; const controller = new AbortController(); request = controller;
    const deadline = setTimeout(() => controller.abort(), 140_000);
    const selected = file; file = undefined; input.value = ''; controls();
    status.textContent = 'Transcribing audio. You can cancel and keep editing.';
    try {
      await interpret(selected, controller.signal, () => generation === version);
      if (generation === version) status.textContent = 'Audio discarded. Review the result or continue editing manually.';
    } finally {
      clearTimeout(deadline);
      if (generation === version) { request = undefined; controls(); }
    }
  });
  if (!supported) status.textContent = 'Recording is not supported in this browser. Choose an audio file or edit manually.';
  window.addEventListener('pagehide', () => discard(''));
  document.addEventListener('visibilitychange', () => { if (document.hidden && session) discard('Recording interrupted. Record again or choose audio.'); });
  controls();
  return { discard };
}
