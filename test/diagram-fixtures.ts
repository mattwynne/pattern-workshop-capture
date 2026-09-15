import sharp from "sharp";

// Synthetic, reproducible probes, not a substitute for workshop drawing review.
export async function diagramFixture(kind: string): Promise<Buffer> {
  const paper = kind === 'shadow' ? 'url(#shadow)' : '#f5f2e9';
  const colour = kind === 'pencil' ? '#c5c2b9' : kind === 'marker' ? '#cf2859' : '#303c49';
  const lines = kind === 'lined' ? Array.from({ length: 10 }, (_, i) => `<path d="M0 ${i * 24} H320" stroke="#9ab8df"/>`).join('') : '';
  return sharp(Buffer.from(`<svg width="320" height="240" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="shadow"><stop stop-color="#a6a399"/><stop offset="1" stop-color="#f5f2e9"/></linearGradient></defs>
    <rect width="320" height="240" fill="${paper}"/>${lines}
    <g transform="rotate(${kind === 'skew' ? 7 : 0} 160 120)" fill="none" stroke="${colour}" stroke-width="3">
      <path d="M8 20 L30 20 M30 15 L30 25"/><rect x="50" y="60" width="65" height="55"/>
      <path d="M115 88 L205 88 L192 80 M205 88 L192 98 M60 160 Q100 145 135 167 T230 160"/>
      <ellipse cx="235" cy="90" rx="30" ry="28"/>
    </g></svg>`)).png().toBuffer();
}
