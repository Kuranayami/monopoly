import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { SPACES, GRID_POSITIONS, GRID_SIZE } from 'shared/constants.js';

const BOARD_SIZE = 10;
const SPACE_HEIGHT = 0.02;

const GROUP_CONFIG = {
  dark_blue: { emissive: '#4488ff', emissiveIntensity: 0.6, metalness: 0.8, roughness: 0.1 },
  green: { emissive: '#44ff44', emissiveIntensity: 0.4, metalness: 0.4, roughness: 0.2 },
  yellow: { emissive: '#ffaa00', emissiveIntensity: 0.5, metalness: 0.5, roughness: 0.15 },
  red: { emissive: '#ff3333', emissiveIntensity: 0.3, metalness: 0.3, roughness: 0.3 },
  orange: { emissive: '#ff6600', emissiveIntensity: 0.3, metalness: 0.3, roughness: 0.3 },
  pink: { emissive: '#cc44cc', emissiveIntensity: 0.3, metalness: 0.3, roughness: 0.3 },
  light_blue: { emissive: '#88ddff', emissiveIntensity: 0.4, metalness: 0.2, roughness: 0.4 },
  brown: { emissive: '#885533', emissiveIntensity: 0.15, metalness: 0.1, roughness: 0.8 },
  railroad: { emissive: '#667788', emissiveIntensity: 0.2, metalness: 0.9, roughness: 0.1 },
  utility: { emissive: '#44aaff', emissiveIntensity: 0.2, metalness: 0.6, roughness: 0.2 },
};

const GROUP_COLORS = {
  dark_blue: '#1a237e', green: '#1b5e20', yellow: '#f9a825',
  red: '#c62828', orange: '#e65100', pink: '#880e4f',
  light_blue: '#81d4fa', brown: '#795548',
  railroad: '#37474f', utility: '#455a64',
};

function SpaceMesh({ space, x, y, game }) {
  const meshRef = useRef(null);
  const isCorner = (x === 0 && y === 0) || (x === 0 && y === GRID_SIZE - 1) ||
    (x === GRID_SIZE - 1 && y === 0) || (x === GRID_SIZE - 1 && y === GRID_SIZE - 1);

  const gw = BOARD_SIZE / GRID_SIZE;
  const px = (x - (GRID_SIZE - 1) / 2) * gw;
  const pz = (y - (GRID_SIZE - 1) / 2) * gw;

  const config = GROUP_CONFIG[space?.group];
  const color = GROUP_COLORS[space?.group] || '#333';
  const isHighValue = ['dark_blue', 'green', 'yellow'].includes(space?.group);
  const isIndustrial = ['railroad', 'utility'].includes(space?.group);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    if (isHighValue) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 2 + x + y);
      meshRef.current.material.emissiveIntensity = (config?.emissiveIntensity || 0.3) * (0.7 + 0.3 * pulse);
    }
    if (isIndustrial) {
      meshRef.current.material.roughness = (config?.roughness || 0.5) + 0.05 * Math.sin(t * 0.5 + x);
    }
  });

  if (!space) return null;

  return (
    <group position={[px, 0, pz]}>
      {/* Space base */}
      <mesh ref={meshRef} receiveShadow>
        <planeGeometry args={[gw - 0.02, gw - 0.02]} />
        <meshStandardMaterial
          color={isCorner ? '#1a1a2e' : color}
          metalness={config?.metalness || 0.1}
          roughness={config?.roughness || 0.7}
          emissive={config?.emissive || '#000'}
          emissiveIntensity={isCorner ? 0 : (config?.emissiveIntensity || 0)}
        />
      </mesh>

      {/* Neon border for high-value */}
      {isHighValue && (
        <mesh position={[0, 0.01, 0]}>
          <planeGeometry args={[gw - 0.01, gw - 0.01]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.15}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* Property color bar (raised) */}
      {space.color && space.type === 'property' && (
        <mesh position={[0, SPACE_HEIGHT, -gw / 2 + gw * 0.07]}>
          <planeGeometry args={[gw * 0.9, gw * 0.12]} />
          <meshStandardMaterial
            color={color}
            metalness={0.3}
            roughness={0.4}
            emissive={config?.emissive || color}
            emissiveIntensity={0.2}
          />
        </mesh>
      )}

      {/* Industrial/metallic overlay for railroad/utility */}
      {isIndustrial && (
        <mesh position={[0, SPACE_HEIGHT, 0]}>
          <planeGeometry args={[gw * 0.6, gw * 0.6]} />
          <meshStandardMaterial
            color={color}
            metalness={0.9}
            roughness={0.1}
            transparent
            opacity={0.4}
          />
        </mesh>
      )}
    </group>
  );
}

export default function Board3D({ game }) {
  const spaces = useMemo(() =>
    GRID_POSITIONS.map(({ pos, x, y }) => ({ space: SPACES[pos], x, y, pos })),
  []);

  const boardRef = useRef(null);
  useFrame(({ clock }) => {
    if (!boardRef.current) return;
    boardRef.current.rotation.z = 0.0005 * Math.sin(clock.getElapsedTime() * 0.3);
  });

  return (
    <group ref={boardRef}>
      {/* Base platform */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[BOARD_SIZE + 0.5, BOARD_SIZE + 0.5]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Green felt border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
        <planeGeometry args={[BOARD_SIZE + 0.3, BOARD_SIZE + 0.3]} />
        <meshStandardMaterial color="#1a3a1a" roughness={0.8} metalness={0} />
      </mesh>

      {/* Individual space meshes */}
      {spaces.map(({ space, x, y }) => (
        <SpaceMesh key={`${x}-${y}`} space={space} x={x} y={y} game={game} />
      ))}
    </group>
  );
}
