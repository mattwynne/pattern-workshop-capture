import { execFileSync } from 'node:child_process';
export function wav(seconds = 0.25): Buffer {
  const data = Buffer.alloc(Math.round(seconds * 16000) * 2);
  for (let i = 0; i < data.length / 2; i++) data.writeInt16LE(Math.round(1000 * Math.sin(i * 2 * Math.PI * 440 / 16000)), i * 2);
  const header = Buffer.alloc(44);
  header.write('RIFF'); header.writeUInt32LE(data.length + 36, 4); header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
  header.writeUInt32LE(16000, 24); header.writeUInt32LE(32000, 28); header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}
export function encodedAudio(format: string, seconds = 0.25): Buffer {
  const codec = ({ webm: 'libopus', ogg: 'libopus', mp4: 'aac', adts: 'aac', mp3: 'libmp3lame' } as Record<string, string>)[format];
  return execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'wav', '-i', 'pipe:0',
    '-metadata', 'artist=PRIVATE AUDIO METADATA', '-c:a', codec,
    ...(format === 'mp4' ? ['-movflags', 'frag_keyframe+empty_moov'] : []), '-f', format, 'pipe:1'],
  { input: wav(seconds), maxBuffer: 16 * 1024 * 1024 });
}
