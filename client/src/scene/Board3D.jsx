import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { SPACES, GRID_POSITIONS, GRID_SIZE } from 'shared/constants.js';

const BOARD_SIZE = 10;
const CELL = BOARD_SIZE / GRID_SIZE;
const HALF = (GRID_SIZE - 1) / 2;

const PROP_COLORS = {
  dark_blue: '#191970', green: '#228B22', yellow: '#FFD700',
  red: '#DC143C', orange: '#FF8C00', pink: '#FF69B4',
  light_blue: '#87CEEB', brown: '#8B4513',
  railroad: '#555', utility: '#888',
};

function px(i) { return (i - HALF) * CELL; }

function SpaceMesh({ space, x, y }) {
  const isCorner = (x === 0 && y === 0) || (x === 0 && y === GRID_SIZE - 1) ||
    (x === GRID_SIZE - 1 && y === 0) || (x === GRID_SIZE - 1 && y === GRID_SIZE - 1);
  if (!space) return null;

  const tileColor = isCorner ? '#1a1a2e' : (PROP_COLORS[space?.group] || '#333');
  const p = [px(x), 0, px(y)];
  const isProp = space.type === 'property';

  return (
    <group position={p}>
      {/* Space tile */}
      <mesh receiveShadow>
        <boxGeometry args={[CELL - 0.04, 0.025, CELL - 0.04]} />
        <meshStandardMaterial
          color={tileColor}
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>

      {/* Property color bar */}
      {isProp && space.color && (
        <mesh position={[0, 0.014, -CELL / 2 + CELL * 0.06]}>
          <boxGeometry args={[CELL * 0.8, 0.02, 0.04]} />
          <meshStandardMaterial color={space.color} roughness={0.2} metalness={0.2} />
        </mesh>
      )}

      {/* Name label */}
      {!isCorner && (
        <Text
          position={[0, 0.018, isProp ? CELL * 0.06 : 0]}
          fontSize={0.045}
          color="#ddd"
          anchorX="center"
          anchorY="middle"
          maxWidth={CELL * 0.7}
        >
          {space.name}
        </Text>
      )}

      {/* Price */}
      {isProp && space.price > 0 && (
        <Text
          position={[0, 0.018, -CELL * 0.06]}
          fontSize={0.03}
          color="#3B82F6"
          anchorX="center"
          anchorY="middle"
        >
          ${space.price}
        </Text>
      )}

      {/* Corner labels */}
      {isCorner && (
        <Text
          position={[0, 0.018, 0]}
          fontSize={0.055}
          color="#60A5FA"
          anchorX="center"
          anchorY="middle"
          maxWidth={CELL * 0.6}
        >
          {space.name}
        </Text>
      )}
    </group>
  );
}

export default function Board3D({ game }) {
  const spaces = useMemo(() =>
    GRID_POSITIONS.map(({ pos, x, y }) => ({ space: SPACES[pos], x, y })),
  []);

  return (
    <group>
      {/* Base platform */}
      <mesh position={[0, -0.015, 0]} receiveShadow>
        <boxGeometry args={[BOARD_SIZE + 0.3, 0.03, BOARD_SIZE + 0.3]} />
        <meshStandardMaterial color="#111" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Frame border */}
      <mesh position={[0, 0.005, 0]}>
        <boxGeometry args={[BOARD_SIZE + 0.15, 0.04, BOARD_SIZE + 0.15]} />
        <meshStandardMaterial color="#8B7355" roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Green playing surface */}
      <mesh position={[0, -0.005, 0]}>
        <boxGeometry args={[BOARD_SIZE - 0.05, 0.015, BOARD_SIZE - 0.05]} />
        <meshStandardMaterial color="#1a4a1a" roughness={0.8} metalness={0} />
      </mesh>

      {/* Corner decorations */}
      {[[-HALF, -HALF], [-HALF, HALF], [HALF, -HALF], [HALF, HALF]].map(([cx, cz], i) => (
        <mesh key={i} position={[cx * CELL, 0.013, cz * CELL]}>
          <boxGeometry args={[CELL - 0.03, 0.01, CELL - 0.03]} />
          <meshStandardMaterial color="#0a0a1a" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}

      {/* Spaces */}
      {spaces.map(({ space, x, y }) => (
        <SpaceMesh key={`${x}-${y}`} space={space} x={x} y={y} />
      ))}
    </group>
  );
}
