/**
 * ============================================================================
 * scripts/generate-icons.js — Gerador dos icones PNG da extensao
 * ----------------------------------------------------------------------------
 * @author Glauco Santos
 * ----------------------------------------------------------------------------
 * (O QUE) Cria icons/icon-16.png, icon-48.png e icon-128.png desenhando um
 *   simbolo de "pular para frente" (dois chevrons + barra, estilo botao skip)
 *   branco sobre um quadrado arredondado azul.
 *
 * (POR QUE) O ambiente nao tem ImageMagick/PIL. Em vez de depender de binarios
 *   de imagem, geramos PNGs validos usando apenas o modulo `zlib` nativo do
 *   Node — zero dependencias, reproduzivel em qualquer maquina.
 *
 * (COMO) Rasterizamos um buffer RGBA na CPU, aplicamos o filtro PNG (byte 0 por
 *   scanline), comprimimos com deflate e montamos os chunks IHDR/IDAT/IEND com
 *   seus CRCs. E didatico: mostra como um PNG e formado por dentro.
 * ============================================================================
 */
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// ---- CRC32 (exigido por cada chunk PNG) ------------------------------------
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** (COMO) Monta um chunk PNG: [len][tipo+dados][crc]. */
function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

/** (COMO) Codifica um buffer RGBA (size x size) num arquivo PNG completo. */
function encodePng(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); // largura
  ihdr.writeUInt32BE(size, 4); // altura
  ihdr[8] = 8; // profundidade de bit
  ihdr[9] = 6; // tipo de cor: RGBA
  // 10,11,12 = compressao/filtro/entrelacamento = 0 (padrao)

  // Filtro por scanline: prefixamos cada linha com o byte 0 ("None").
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- Desenho do icone ------------------------------------------------------
const ACCENT = [37, 99, 235]; // #2563eb
const WHITE = [255, 255, 255];

/** (O QUE) Preenche um pixel RGBA. */
function put(rgba, size, x, y, [r, g, b], a = 255) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const i = (y * size + x) * 4;
  rgba[i] = r;
  rgba[i + 1] = g;
  rgba[i + 2] = b;
  rgba[i + 3] = a;
}

/** (O QUE) Desenha o simbolo "skip" (>>|) e retorna o buffer RGBA. */
function drawIcon(size) {
  const rgba = Buffer.alloc(size * size * 4); // transparente por padrao
  const radius = size * 0.22; // canto arredondado do fundo

  // Fundo azul com cantos arredondados.
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inRounded = (() => {
        const rx = Math.min(x, size - 1 - x);
        const ry = Math.min(y, size - 1 - y);
        if (rx >= radius || ry >= radius) return true;
        const dx = radius - rx;
        const dy = radius - ry;
        return dx * dx + dy * dy <= radius * radius;
      })();
      if (inRounded) put(rgba, size, x, y, ACCENT);
    }
  }

  // Simbolo branco: dois triangulos apontando para a direita + uma barra.
  const cy = size / 2;
  const h = size * 0.42; // altura do simbolo
  const top = cy - h / 2;
  const bottom = cy + h / 2;
  const triW = size * 0.26;
  const x0 = size * 0.16; // inicio do 1o triangulo
  const gap = size * 0.04;
  const barX = x0 + 2 * triW + 2 * gap;
  const barW = size * 0.08;

  for (let y = Math.floor(top); y <= Math.ceil(bottom); y++) {
    // Progresso vertical 0..1..0 (largura do triangulo afunila nas pontas).
    const t = 1 - Math.abs((y - cy) / (h / 2)); // 0 nas bordas, 1 no centro
    if (t < 0) continue;
    for (let tri = 0; tri < 2; tri++) {
      const startX = x0 + tri * (triW + gap);
      const endX = startX + triW * t;
      for (let x = Math.floor(startX); x <= Math.ceil(endX); x++) {
        put(rgba, size, x, y, WHITE);
      }
    }
    // Barra vertical (o "|" do simbolo skip-to-end).
    for (let x = Math.floor(barX); x < barX + barW; x++) {
      put(rgba, size, x, y, WHITE);
    }
  }

  return rgba;
}

// ---- Geracao dos arquivos --------------------------------------------------
const outDir = path.join(__dirname, '..', 'icons');
fs.mkdirSync(outDir, { recursive: true });
for (const size of [16, 48, 128]) {
  const png = encodePng(size, drawIcon(size));
  const file = path.join(outDir, `icon-${size}.png`);
  fs.writeFileSync(file, png);
  console.log(`gerado ${file} (${png.length} bytes)`);
}
