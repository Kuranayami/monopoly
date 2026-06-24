// Real-world Monopoly board proportions mapped to a 10-unit 3D board
// Board: 19.5" × 19.5", Track: 3" deep, Corners: 3", Spaces: 1.625" wide

export const BOARD = 10;
export const TRACK = BOARD * 3 / 19.5;   // ~1.538
export const CORNER = TRACK;             // ~1.538
export const SPACE = (BOARD - 2 * TRACK) / 9; // ~0.769
export const BAND = TRACK * 0.625 / 3;   // color band depth ~0.321

const HALF_BOARD = BOARD / 2; // 5
const HALF_CORNER = CORNER / 2;
const HALF_SPACE = SPACE / 2;
const HALF_TRACK = TRACK / 2;

// Returns world position [x, y, z] for a board position index 0–39
export function posToWorld(pos) {
  const g = getSpaceGeometry(pos);
  return [g.cx, 0, g.cz];
}

/**
 * Returns { edge, cx, cz, w, d, rot, colorBandPos }
 *  cx, cz: center of the tile
 *  w, d: width (along x) and depth (along z, before rotation)
 *  rot: radians, additional rotation for text / decorations
 *  colorBandPos: [x, y, z, bw, bd] for the color band mesh
 */
export function getSpaceGeometry(pos) {
  if (pos >= 1 && pos <= 9)   return bottomEdge(pos);
  if (pos >= 11 && pos <= 19) return leftEdge(pos);
  if (pos >= 21 && pos <= 29) return topEdge(pos);
  if (pos >= 31 && pos <= 39) return rightEdge(pos);
  return getCorner(pos);
}

function bottomEdge(pos) {
  const i = pos - 1; // 0–8
  const cx = HALF_BOARD - CORNER - (i + 0.5) * SPACE;
  const cz = HALF_BOARD - HALF_TRACK;
  return {
    edge: 'bottom', cx, cz, w: SPACE, d: TRACK, rot: 0,
    band: { cx, cz: HALF_BOARD - HALF_BAND, bw: SPACE, bd: BAND, orient: 'h' },
    labelCx: cx, labelCz: cz - TRACK * 0.1,
    priceCx: cx, priceCz: cz + TRACK * 0.25,
  };
}

function leftEdge(pos) {
  const i = pos - 11; // 0–8
  const cx = -HALF_BOARD + HALF_TRACK;
  const cz = HALF_BOARD - CORNER - (i + 0.5) * SPACE;
  return {
    edge: 'left', cx, cz, w: TRACK, d: SPACE, rot: Math.PI / 2,
    band: { cx: -HALF_BOARD + HALF_BAND, cz, bw: BAND, bd: SPACE, orient: 'v' },
    labelCx: cx + TRACK * 0.1, labelCz: cz,
    priceCx: cx - TRACK * 0.25, priceCz: cz,
  };
}

function topEdge(pos) {
  const i = pos - 21; // 0–8
  const cx = -HALF_BOARD + CORNER + (i + 0.5) * SPACE;
  const cz = -HALF_BOARD + HALF_TRACK;
  return {
    edge: 'top', cx, cz, w: SPACE, d: TRACK, rot: Math.PI,
    band: { cx, cz: -HALF_BOARD + HALF_BAND, bw: SPACE, bd: BAND, orient: 'h' },
    labelCx: cx, labelCz: cz + TRACK * 0.1,
    priceCx: cx, priceCz: cz - TRACK * 0.25,
  };
}

function rightEdge(pos) {
  const i = pos - 31; // 0–8
  const cx = HALF_BOARD - HALF_TRACK;
  const cz = -HALF_BOARD + CORNER + (i + 0.5) * SPACE;
  return {
    edge: 'right', cx, cz, w: TRACK, d: SPACE, rot: -Math.PI / 2,
    band: { cx: HALF_BOARD - HALF_BAND, cz, bw: BAND, bd: SPACE, orient: 'v' },
    labelCx: cx - TRACK * 0.1, labelCz: cz,
    priceCx: cx + TRACK * 0.25, priceCz: cz,
  };
}

function getCorner(pos) {
  const cfg = {
    0:  { cx:  HALF_BOARD - HALF_CORNER, cz:  HALF_BOARD - HALF_CORNER },
    10: { cx: -HALF_BOARD + HALF_CORNER, cz:  HALF_BOARD - HALF_CORNER },
    20: { cx: -HALF_BOARD + HALF_CORNER, cz: -HALF_BOARD + HALF_CORNER },
    30: { cx:  HALF_BOARD - HALF_CORNER, cz: -HALF_BOARD + HALF_CORNER },
  };
  const c = cfg[pos];
  return {
    edge: 'corner', cx: c.cx, cz: c.cz, w: CORNER, d: CORNER, rot: 0,
    band: null,
    labelCx: c.cx, labelCz: c.cz,
    priceCx: null, priceCz: null,
  };
}

const HALF_BAND = BAND / 2;
