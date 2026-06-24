import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import { SPACES } from 'shared/constants.js';
import { getSpaceGeometry, BOARD, TRACK, CORNER, SPACE, BAND } from './boardLayout.js';

const GRP_COLORS = {
  brown: '#5A3825', light_blue: '#A9DDF7', pink: '#D93B88',
  orange: '#F58220', red: '#E31B23', yellow: '#FFF200',
  green: '#00A651', dark_blue: '#0054A6',
  railroad: '#333', utility: '#555',
};

const HEIGHT = 0.06;

function SpaceTile({ pos }) {
  const space = SPACES[pos];
  const g = getSpaceGeometry(pos);
  if (!space || !g) return null;

  const isProp = space.type === 'property';
  const color = GRP_COLORS[space?.group] || '#555';
  const tileColor = g.edge === 'corner' ? '#FDFBF7' : (isProp ? '#FDFBF7' : '#F0EDE4');
  const lineW = 0.01;

  const nameSize = g.edge === 'corner' ? 0.12 : (CORNER * 0.08);
  const priceSize = 0.06;

  return (
    <group position={[g.cx, 0, g.cz]}>
      {/* Tile body */}
      <mesh receiveShadow>
        <boxGeometry args={[g.w - lineW, HEIGHT, g.d - lineW]} />
        <meshStandardMaterial color={tileColor} roughness={0.7} />
      </mesh>

      {/* Outer edge accent line */}
      <mesh position={[0, HEIGHT / 2 + 0.001, 0]}>
        <boxGeometry args={[g.w, 0.002, g.d]} />
        <meshBasicMaterial color="#111" transparent opacity={0.15} />
      </mesh>

      {/* Color band at outer edge */}
      {isProp && g.band && (
        <mesh position={[g.band.cx - g.cx, HEIGHT / 2 + 0.002, g.band.cz - g.cz]}>
          <boxGeometry args={[g.band.bw, 0.003, g.band.bd]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
      )}

      {/* Label */}
      <Text position={[g.labelCx - g.cx, HEIGHT / 2 + 0.005, g.labelCz - g.cz]}
        fontSize={nameSize} color="#1a1a1a" anchorX="center" anchorY="middle"
        maxWidth={g.w * 1.2} textAlign="center"
        outlineWidth={0} font={undefined}>
        {space.name}
      </Text>

      {/* Price */}
      {isProp && space.price > 0 && (
        <Text position={[g.priceCx - g.cx, HEIGHT / 2 + 0.005, g.priceCz - g.cz]}
          fontSize={priceSize} color="#444" anchorX="center" anchorY="middle">
          ${space.price}
        </Text>
      )}
    </group>
  );
}

function CardDeck({ position, label, color }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[1.2, 0.05, 0.85]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <Text position={[0, 0.03, 0.05]} fontSize={0.1}
        color="#fff" anchorX="center" anchorY="middle" textAlign="center"
        outlineWidth={0.003} outlineColor="#000">
        {label}
      </Text>
    </group>
  );
}

export default function Board3D() {
  const spaces = useMemo(() => [...Array(40).keys()], []);

  const cSig = { x: CORNER / 2, z: CORNER / 2 };
  const centerSize = BOARD - 2 * CORNER;

  return (
    <group>
      {/* Felt base */}
      <mesh position={[0, -HEIGHT / 2, 0]} receiveShadow>
        <boxGeometry args={[BOARD, 0.02, BOARD]} />
        <meshStandardMaterial color="#FDFBF7" roughness={0.85} />
      </mesh>

      {/* Interior center field */}
      <mesh position={[0, -HEIGHT / 2 + 0.003, 0]}>
        <boxGeometry args={[centerSize, 0.003, centerSize]} />
        <meshStandardMaterial color="#FDFBF7" roughness={0.9} />
      </mesh>

      {/* Spaces */}
      {spaces.map(pos => (
        <SpaceTile key={pos} pos={pos} />
      ))}

      {/* Chance deck — upper-left quadrant, 45° rotated */}
      <group position={[-centerSize * 0.2, 0, -centerSize * 0.2]} rotation={[0, Math.PI / 4, 0]}>
        <CardDeck position={[0, 0, 0]} label="Chance" color="#E65100" />
      </group>

      {/* Community Chest deck — lower-right quadrant, 45° rotated */}
      <group position={[centerSize * 0.2, 0, centerSize * 0.2]} rotation={[0, Math.PI / 4, 0]}>
        <CardDeck position={[0, 0, 0]} label="Community Chest" color="#1565C0" />
      </group>
    </group>
  );
}
