// Copyright 2026 Linu Alex. SPDX-License-Identifier: Apache-2.0
// What the stage shows at one instant: the board, and while a variation is open, a second
// board sliding in over it with a label. Pure, like the board renderer: a scene in, SVG out.
import { boardSVG, pieceDefs, esc } from './render.js';

/** The stage draws in a square viewBox of this size; CSS scales it to the element. */
export const VIEW_SIZE = 720;

const lerp = (a, b, t) => a + (b - a) * t;
const lerpBox = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), size: lerp(a.size, b.size, t) });
const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/**
 * Scene body (no <svg> wrapper, no defs): the stage swaps this every frame while the
 * piece <symbol>s stay put.
 * @param {object} scene { main: board, side?: board, sideT: 0..1, sideLabel? } (boards as for boardSVG)
 */
export function sceneBody(scene, theme, idp = 'cs') {
  const S = VIEW_SIZE;
  const t = ease(scene.sideT || 0);
  const out = [`<rect width="${S}" height="${S}" fill="${theme.surface}"/>`];
  out.push(boardSVG({ ...scene.main, dim: (scene.main.dim ?? 0) * t }, theme, { x: 0, y: 0, size: S, idp }));

  if (scene.side && t > 0.001) {
    // The variation takes the board's place, slightly smaller, with its label above it.
    const sideBox = lerpBox({ x: S, y: 0, size: 0 }, { x: S * 0.06, y: S * 0.1, size: S * 0.88 }, t);
    out.push(`<g opacity="${Math.min(1, t * 1.6).toFixed(3)}">`);
    out.push(`<rect width="${S}" height="${S}" fill="${theme.surface}"/>`);
    if (scene.sideLabel) {
      const fs = S * 0.036;
      out.push(`<text x="${sideBox.x}" y="${(sideBox.y - fs * 0.8).toFixed(1)}" font-family="${esc(theme.font)}" font-size="${fs.toFixed(1)}" font-weight="600" fill="${theme.text}">${esc(scene.sideLabel)}</text>`);
    }
    out.push(boardSVG(scene.side, theme, { ...sideBox, idp }), '</g>');
  }
  return out.join('');
}

/** Complete SVG document for a scene. */
export function sceneDocument(scene, theme, idp = 'cs') {
  const S = VIEW_SIZE;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">`
    + `<defs>${pieceDefs(theme.pieceSet, idp, theme.tint)}</defs>${sceneBody(scene, theme, idp)}</svg>`;
}
