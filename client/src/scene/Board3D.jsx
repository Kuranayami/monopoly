import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import { SPACES, GRID_POSITIONS, GRID_SIZE } from 'shared/constants.js';

const BOARD_SIZE = 10;
const CELL = BOARD_SIZE / GRID_SIZE;
const HALF = (GRID_SIZE - 1) / 2;
const W = 0.85;
const D = 0.3;

function px(i) { return (i - HALF) * CELL; }

const COLORS = {
  brown: '#955436', light_blue: '#A8D8EA', pink: '#D94F93',
  orange: '#F7923A', red: '#ED1B24', yellow: '#FEE101',
  green: '#1FB25A', dark_blue: '#0072BB',
  railroad: '#333', utility: '#777',
};

const CORNER_INFO = {
  0:  { label: 'GO', color: '#60A5FA' },
  10: { label: 'JAIL', color: '#F59E0B' },
  20: { label: 'FREE\nPARKING', color: '#34D399' },
  30: { label: 'GO TO\nJAIL', color: '#EF4444' },
};

function SpaceTile({ space, x, y }) {
  if (!space) return null;
  const isCorner = space.id === 0 || space.id === 10 || space.id === 20 || space.id === 30;
  const edge = x === 0 ? 'left' : x === 10 ? 'right' : y === 0 ? 'top' : y === 10 ? 'bottom' : 'center';
  const isProp = space.type === 'property';
  const color = COLORS[space?.group] || '#555';
  const corner = CORNER_INFO[space.id];

  let boxArgs = [W, 0.04, W * 0.5];
  let offX = 0, offZ = 0;
  if (isCorner) { boxArgs = [W, 0.04, W]; }
  else if (edge === 'bottom') { boxArgs = [W, 0.04, D]; offZ = CELL / 2 - D / 2; }
  else if (edge === 'top') { boxArgs = [W, 0.04, D]; offZ = -(CELL / 2 - D / 2); }
  else if (edge === 'right') { boxArgs = [D, 0.04, W]; offX = CELL / 2 - D / 2; }
  else if (edge === 'left') { boxArgs = [D, 0.04, W]; offX = -(CELL / 2 - D / 2); }

  let barArgs = null, barPos = null;
  if (isProp && !isCorner) {
    if (edge === 'bottom') {
      barArgs = [W * 0.8, 0.015, 0.04];
      barPos = [0, 0.024, D / 2 - 0.04];
    } else if (edge === 'top') {
      barArgs = [W * 0.8, 0.015, 0.04];
      barPos = [0, 0.024, -D / 2 + 0.04];
    } else if (edge === 'right') {
      barArgs = [0.04, 0.015, W * 0.8];
      barPos = [-D / 2 + 0.04, 0.024, 0];
    } else if (edge === 'left') {
      barArgs = [0.04, 0.015, W * 0.8];
      barPos = [D / 2 - 0.04, 0.024, 0];
    }
  }

  const tSize = CELL * 0.075;
  let namePos, nameMaxW, pricePos;
  if (isCorner) {
    namePos = [0, 0.026, 0];
    nameMaxW = W * 0.6;
  } else if (edge === 'bottom') { namePos = [0, 0.026, -0.03]; nameMaxW = D * 2; pricePos = [0, 0.026, D * 0.25]; }
  else if (edge === 'top') { namePos = [0, 0.026, 0.03]; nameMaxW = D * 2; pricePos = [0, 0.026, -D * 0.25]; }
  else if (edge === 'right') { namePos = [0.03, 0.026, 0]; nameMaxW = D * 2; pricePos = [-D * 0.25, 0.026, 0]; }
  else if (edge === 'left') { namePos = [-0.03, 0.026, 0]; nameMaxW = D * 2; pricePos = [D * 0.25, 0.026, 0]; }

  return (
    <group position={[px(x) + offX, 0, px(y) + offZ]}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={boxArgs} />
        <meshStandardMaterial color={isCorner ? '#1a1a2e' : color} roughness={0.5} />
      </mesh>

      {barArgs && (
        <mesh position={barPos}>
          <boxGeometry args={barArgs} />
          <meshStandardMaterial color={space.color || color} roughness={0.3} />
        </mesh>
      )}

      {corner ? (
        <Text position={namePos} fontSize={tSize * 1.5}
          color={corner.color} anchorX="center" anchorY="middle"
          maxWidth={nameMaxW} outlineWidth={0.003} outlineColor="#000" textAlign="center">
          {corner.label}
        </Text>
      ) : (
        <Text position={namePos} fontSize={tSize}
          color="#fff" anchorX="center" anchorY="middle"
          maxWidth={nameMaxW} outlineWidth={0.003} outlineColor="#000" textAlign="center">
          {space.name}
        </Text>
      )}

      {isProp && space.price > 0 && (
        <Text position={pricePos || [0, 0.026, 0]}
          fontSize={CELL * 0.05}
          color="#FFD700" anchorX="center" anchorY="middle"
          outlineWidth={0.002} outlineColor="#000">
          ${space.price}
        </Text>
      )}
    </group>
  );
}

function CardDeck({ position, label, icon, color }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[1.3, 0.06, 0.9]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      <Text position={[0, 0.04, 0.05]} fontSize={0.13}
        color="#fff" anchorX="center" anchorY="middle" textAlign="center"
        outlineWidth={0.003} outlineColor="#000">
        {label}
      </Text>
      <Text position={[0, 0.04, -0.12]} fontSize={0.25}
        color="#fff" anchorX="center" anchorY="middle">
        {icon}
      </Text>
    </group>
  );
}

export default function Board3D() {
  const spaces = useMemo(() =>
    GRID_POSITIONS.map(({ pos, x, y }) => ({ space: SPACES[pos], x, y })),
  []);

  return (
    <group>
      <mesh position={[0, -0.025, 0]} receiveShadow>
        <boxGeometry args={[BOARD_SIZE + 0.3, 0.03, BOARD_SIZE + 0.3]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
      </mesh>

      <mesh position={[0, -0.008, 0]}>
        <boxGeometry args={[BOARD_SIZE - 0.05, 0.012, BOARD_SIZE - 0.05]} />
        <meshStandardMaterial color="#1B5E20" roughness={0.9} />
      </mesh>

      {spaces.map(({ space, x, y }) => (
        <SpaceTile key={`${x}-${y}`} space={space} x={x} y={y} />
      ))}

      <CardDeck position={[-2, 0, 0]} label="Community Chest" icon={'\u{1F4B0}'} color="#1565C0" />
      <CardDeck position={[2, 0, 0]} label="Chance" icon={'\u{2753}'} color="#E65100" />
    </group>
  );
}
