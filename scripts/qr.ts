import QRCode from 'qrcode';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const [input, directory = 'artifacts/qr'] = process.argv.slice(2);
const url = new URL(input);
if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
  throw new Error('Use the final public HTTPS capture URL without credentials, query parameters or fragment');
}
await mkdir(directory, { recursive: true });
for (const extension of ['svg', 'png'] as const) {
  await QRCode.toFile(resolve(directory, `workshop-qr.${extension}`), url.href, { type: extension, errorCorrectionLevel: 'M', margin: 4, width: 1200 });
}
console.log(`QR generated for ${url.href} in ${resolve(directory)}. Print with the URL alongside it; test on both workshop phones.`);
