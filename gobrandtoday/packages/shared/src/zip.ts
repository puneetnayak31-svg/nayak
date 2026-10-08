/**
 * A tiny ZIP writer (stored, no compression) so the whole brand kit can be
 * downloaded as one file in the browser, the API or the preview, with no
 * dependency. SVG, HTML and text are small; PNGs are already compressed.
 */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export interface ZipEntry {
  /** Path inside the archive, forward slashes, e.g. "logo/lumey-logo.svg". */
  name: string;
  data: Uint8Array | string;
}

/** Build a ZIP archive. Dates are fixed so the same kit always gives the same bytes. */
export function makeZip(entries: ZipEntry[]): Uint8Array {
  const enc = new TextEncoder();
  const files = entries.map((e) => ({ name: enc.encode(e.name.replace(/^\/+/, '')), data: typeof e.data === 'string' ? enc.encode(e.data) : e.data }));
  const dosTime = 0;
  const dosDate = ((2026 - 1980) << 9) | (1 << 5) | 1;
  let size = 22;
  for (const f of files) size += 30 + f.name.length + f.data.length + 46 + f.name.length;
  const out = new Uint8Array(size);
  const dv = new DataView(out.buffer);
  let p = 0;
  const central: Array<{ name: Uint8Array; crc: number; len: number; offset: number }> = [];
  for (const f of files) {
    const crc = crc32(f.data);
    central.push({ name: f.name, crc, len: f.data.length, offset: p });
    dv.setUint32(p, 0x04034b50, true);
    dv.setUint16(p + 4, 20, true);
    dv.setUint16(p + 6, 0x0800, true); // UTF-8 names
    dv.setUint16(p + 8, 0, true);
    dv.setUint16(p + 10, dosTime, true);
    dv.setUint16(p + 12, dosDate, true);
    dv.setUint32(p + 14, crc, true);
    dv.setUint32(p + 18, f.data.length, true);
    dv.setUint32(p + 22, f.data.length, true);
    dv.setUint16(p + 26, f.name.length, true);
    dv.setUint16(p + 28, 0, true);
    out.set(f.name, p + 30);
    out.set(f.data, p + 30 + f.name.length);
    p += 30 + f.name.length + f.data.length;
  }
  const cdStart = p;
  for (const c of central) {
    dv.setUint32(p, 0x02014b50, true);
    dv.setUint16(p + 4, 20, true);
    dv.setUint16(p + 6, 20, true);
    dv.setUint16(p + 8, 0x0800, true);
    dv.setUint16(p + 10, 0, true);
    dv.setUint16(p + 12, dosTime, true);
    dv.setUint16(p + 14, dosDate, true);
    dv.setUint32(p + 16, c.crc, true);
    dv.setUint32(p + 20, c.len, true);
    dv.setUint32(p + 24, c.len, true);
    dv.setUint16(p + 28, c.name.length, true);
    dv.setUint16(p + 30, 0, true);
    dv.setUint16(p + 32, 0, true);
    dv.setUint16(p + 34, 0, true);
    dv.setUint16(p + 36, 0, true);
    dv.setUint32(p + 38, 0, true);
    dv.setUint32(p + 42, c.offset, true);
    out.set(c.name, p + 46);
    p += 46 + c.name.length;
  }
  dv.setUint32(p, 0x06054b50, true);
  dv.setUint16(p + 8, central.length, true);
  dv.setUint16(p + 10, central.length, true);
  dv.setUint32(p + 12, p - cdStart, true);
  dv.setUint32(p + 16, cdStart, true);
  return out;
}
