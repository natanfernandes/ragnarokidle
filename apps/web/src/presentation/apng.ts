const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/**
 * Total play time of one loop of an animated PNG, from its fcTL frame delays.
 * Returns null for still images and data that is not a PNG.
 */
export function apngDurationMs(bytes: Uint8Array): number | null {
  if (bytes.length < 8 || PNG_SIGNATURE.some((b, i) => bytes[i] !== b)) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8;
  let total = 0;
  let frames = 0;
  while (offset + 8 <= bytes.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    const data = offset + 8;
    if (type === 'fcTL' && data + 26 <= bytes.length) {
      const numerator = view.getUint16(data + 20);
      // A zero denominator means hundredths of a second (APNG spec).
      const denominator = view.getUint16(data + 22) || 100;
      total += (numerator / denominator) * 1000;
      frames += 1;
    }
    if (type === 'IEND') break;
    offset = data + length + 4;
  }
  return frames > 1 && total > 0 ? Math.round(total) : null;
}
