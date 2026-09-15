import { spawn } from 'node:child_process';

export const MAX_AUDIO_BYTES = 16 * 1024 * 1024;
export class AudioValidationError extends Error {}
export function audioFormat(mimeType: string): string | null {
  return ({ 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mpeg': 'mp3', 'audio/mp3': 'mp3',
    'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/aac': 'aac', 'audio/wav': 'wav', 'audio/x-wav': 'wav',
  } as Record<string, string>)[mimeType.toLowerCase().split(';')[0].trim()] ?? null;
}

// Decode through pipes, never paths. Count actual samples, including containers without
// duration metadata (MediaRecorder WebM and fragmented MP4). Only PCM reaches the provider.
export async function normalizeAudio(bytes: Buffer, mimeType: string, signal?: AbortSignal): Promise<Buffer> {
  if (!bytes.length) throw new AudioValidationError('The recording is empty. Record or choose audio again.');
  if (bytes.length > MAX_AUDIO_BYTES) throw new AudioValidationError('The audio must be 16 MiB or smaller.');
  // File pickers sometimes omit MIME or use octet-stream; inspect container bytes,
  // never the participant filename. Declared unsupported types still fail clearly.
  const type = mimeType.toLowerCase().split(';')[0].trim();
  const detected = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WAVE' ? 'wav'
    : bytes.toString('ascii', 4, 8) === 'ftyp' ? 'm4a'
    : bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) ? 'webm'
    : bytes.toString('ascii', 0, 4) === 'OggS' ? 'ogg'
    : bytes.toString('ascii', 0, 3) === 'ID3' ? 'mp3' : null;
  const format = !type || type === 'application/octet-stream' ? detected : audioFormat(mimeType);
  if (!format) throw new AudioValidationError('This audio format is not supported. Choose WAV, MP3, M4A, AAC, Ogg or WebM audio.');
  const demuxer = ({ webm: 'matroska', m4a: 'mov' } as Record<string, string>)[format] || format;
  const pcm = await new Promise<Buffer>((resolve, reject) => {
    const child = spawn('ffmpeg', ['-nostdin', '-hide_banner', '-loglevel', 'error', '-xerror',
      '-max_alloc', '67108864', '-protocol_whitelist', 'pipe', '-f', demuxer, '-i', 'pipe:0',
      '-map', '0:a:0', '-vn', '-threads', '1', '-af', 'aresample=async=1:first_pts=0',
      '-t', '120.001', '-ar', '16000', '-ac', '1', '-f', 's16le', 'pipe:1'],
    { stdio: ['pipe', 'pipe', 'ignore'] });
    const chunks: Buffer[] = []; let size = 0; let failure: Error | undefined;
    const stop = (error: Error) => { failure ??= error; child.kill('SIGKILL'); };
    const abort = () => stop(new Error('Audio processing cancelled'));
    const timer = setTimeout(() => stop(new Error('Audio processing timed out')), 15_000);
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    child.stdin.on('error', () => {}); // EPIPE is expected when the duration cap stops decoding.
    child.on('error', () => { failure = new Error('Audio processing is unavailable'); });
    child.stdout.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > 120 * 16000 * 2) stop(new AudioValidationError('Recordings must be two minutes or shorter.'));
      else chunks.push(chunk);
    });
    child.on('close', code => {
      clearTimeout(timer); signal?.removeEventListener('abort', abort);
      if (failure) reject(failure);
      else if (code !== 0 || !size) reject(new AudioValidationError('That audio could not be read. Record or choose audio again.'));
      else resolve(Buffer.concat(chunks));
    });
    child.stdin.end(bytes);
  });
  const header = Buffer.alloc(44);
  header.write('RIFF'); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
  header.writeUInt32LE(16000, 24); header.writeUInt32LE(32000, 28); header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}
