import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import { SPACES, GRID_POSITIONS, GRID_SIZE } from 'shared/constants.js';

const BOARD_SIZE = 10;
const CELL = BOARD_SIZE / GRID_SIZE;
const HALF = (GRID_SIZE - 1) / 2;
const TILE_SIZE = 0.78;
const TILE_GAP = (CELL - TILE_SIZE) / 2;

function px(i) { return (i - HALF) * CELL; }

const GROUP_COLORS = {
  brown: '#955436', light_blue: '#AFDBF5', pink: '#D64E93',
  orange: '#F7923A', red: '#ED1B24', yellow: '#FEE101',
  green: '#1FB25A', dark_blue: '#0072BB',
  railroad: '#333', utility: '#777',
};

const CORNER_NAMES = { 0: 'GO', 10: 'JAIL', 20: 'FREE\nPARKING', 30: 'GO TO\nJAIL' };

function SpaceTile({ space, x, y }) {
  if (!space) return null;
  const isCorner = space.type === 'corner' || space.type === 'go';
  const cornerName = CORNER_NAMES[space.pos];
  const color = GROUP_COLORS[space?.group] || '#444';
  const isProp = space.type === 'property';

  return (
    <group position={[px(x), 0, px(y)]}>
      {/* Tile base */}
      <mesh receiveShadow>
        <boxGeometry args={[TILE_SIZE, 0.04, TILE_SIZE]} />
        <meshStandardMaterial color={isCorner ? '#1a1a2e' : color} roughness={0.6} />
      </mesh>

      {/* Property color bar */}
      {isProp && (
        <mesh position={[0, 0.024, -TILE_SIZE / 2 + 0.04]}>
          <boxGeometry args={[TILE_SIZE * 0.85, 0.015, 0.04]} />
          <meshStandardMaterial color={space.color || color} roughness={0.3} />
        </mesh>
      )}

      {/* Name */}
      <Text
        position={[0, 0.026, isProp ? 0.04 : 0]}
        fontSize={CELL * 0.09}
        color={isCorner ? '#60A5FA' : '#fff'}
        anchorX="center"
        anchorY="middle"
        maxWidth={TILE_SIZE * 0.7}
        outlineWidth={0.004}
        outlineColor="#000"
      >
        {isCorner && cornerName ? cornerName : space.name}
      </Text>

      {/* Price */}
      {isProp && space.price > 0 && (
        <Text
          position={[0, 0.026, -TILE_SIZE * 0.25]}
          fontSize={CELL * 0.055}
          color="#FFD700"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.003}
          outlineColor="#000"
        >
          ${space.price}
        </Text>
      )}
    </group>
  );
}

export default function Board3D() {
  const spaces = useMemo(() =>
    GRID_POSITIONS.map(({ pos, x, y }) => ({ space: SPACES[pos], x, y })),
  []);

  return (
    <group>
      {/* Board base */}
      <mesh position={[0, -0.025, 0]} receiveShadow>
        <boxGeometry args={[BOARD_SIZE + 0.2, 0.03, BOARD_SIZE + 0.2]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
      </mesh>

      {/* Felt surface */}
      <mesh position={[0, -0.008, 0]}>
        <boxGeometry args={[BOARD_SIZE - 0.02, 0.012, BOARD_SIZE - 0.02]} />
        <meshStandardMaterial color="#1B5E20" roughness={0.9} />
      </mesh>

      {/* Individual tiles */}
      {spaces.map(({ space, x, y }) => (
        <SpaceTile key={`${x}-${y}`} space={space} x={x} y={y} />
      ))}
    </group>
  );
}
