import { useMemo } from 'react';
import * as THREE from 'three';
import { SPACES, GRID_POSITIONS, GRID_SIZE } from 'shared/constants.js';

const GROUP_COLORS = {
  dark_blue: '#1a237e', green: '#1b5e20', yellow: '#f9a825',
  red: '#c62828', orange: '#e65100', pink: '#880e4f',
  light_blue: '#81d4fa', brown: '#795548',
  railroad: '#37474f', utility: '#455a64',
};

export function useBoardTexture(size = 1024) {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const pad = size * 0.03;
    const cellSize = (size - pad * 2) / GRID_SIZE;

    ctx.fillStyle = '#1a3a1a';
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#1E1E1E';
    ctx.fillRect(pad - 2, pad - 2, cellSize * GRID_SIZE + 4, cellSize * GRID_SIZE + 4);

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(pad + cellSize, pad + cellSize, cellSize * (GRID_SIZE - 2), cellSize * (GRID_SIZE - 2));

    ctx.fillStyle = '#3B82F6';
    ctx.font = `bold ${size * 0.035}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MONOPOLY', size / 2, size / 2 - size * 0.02);
    ctx.font = `${size * 0.015}px Arial`;
    ctx.fillStyle = '#666';
    ctx.fillText('3D EDITION', size / 2, size / 2 + size * 0.02);

    GRID_POSITIONS.forEach(({ pos, x, y }) => {
      const space = SPACES[pos];
      if (!space) return;
      const left = pad + x * cellSize;
      const top = pad + y * cellSize;
      const isCorner = (x === 0 && y === 0) || (x === 0 && y === GRID_SIZE - 1) ||
        (x === GRID_SIZE - 1 && y === 0) || (x === GRID_SIZE - 1 && y === GRID_SIZE - 1);

      ctx.fillStyle = '#222';
      ctx.fillRect(left, top, cellSize, cellSize);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.strokeRect(left, top, cellSize, cellSize);

      if (isCorner) {
        ctx.fillStyle = '#3B82F6';
        ctx.font = `bold ${cellSize * 0.12}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(space.name, left + cellSize / 2, top + cellSize / 2);
        return;
      }

      if (space.color && space.type === 'property') {
        const barH = cellSize * 0.15;
        ctx.fillStyle = GROUP_COLORS[space.group] || space.color;
        ctx.fillRect(left + 1, top + 1, cellSize - 2, barH);
      }

      ctx.fillStyle = '#F0F0F0';
      ctx.font = `bold ${cellSize * 0.1}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const nameY = space.color ? top + cellSize * 0.32 : top + cellSize * 0.25;
      ctx.fillText(space.name, left + cellSize / 2, nameY);

      if (space.price > 0) {
        ctx.fillStyle = '#3B82F6';
        ctx.font = `${cellSize * 0.09}px Arial`;
        ctx.fillText(`$${space.price}`, left + cellSize / 2, top + cellSize * 0.55);
      }

      if (space.group === 'railroad') {
        ctx.fillStyle = '#888';
        ctx.font = `${cellSize * 0.06}px Arial`;
        ctx.fillText('RR', left + cellSize / 2, top + cellSize * 0.75);
      }
      if (space.group === 'utility') {
        ctx.fillStyle = '#888';
        ctx.font = `${cellSize * 0.06}px Arial`;
        ctx.fillText('UTIL', left + cellSize / 2, top + cellSize * 0.75);
      }
      if (space.type === 'tax') {
        ctx.fillStyle = '#ef4444';
        ctx.font = `${cellSize * 0.07}px Arial`;
        ctx.fillText('TAX', left + cellSize / 2, top + cellSize * 0.65);
      }
      if (space.type === 'chance') {
        ctx.fillStyle = '#e65100';
        ctx.font = `${cellSize * 0.06}px Arial`;
        ctx.fillText('?', left + cellSize / 2, top + cellSize * 0.65);
      }
      if (space.type === 'chest') {
        ctx.fillStyle = '#1565c0';
        ctx.font = `${cellSize * 0.06}px Arial`;
        ctx.fillText('??', left + cellSize / 2, top + cellSize * 0.65);
      }
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);
}
