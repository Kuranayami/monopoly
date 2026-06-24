import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { SPACES } from 'shared/constants.js';
import { getSpaceGeometry, BOARD, TRACK, CORNER, SPACE, BAND } from './boardLayout.js';

const GRP_COLORS = {
  brown: '#8B4513', light_blue: '#87CEEB', pink: '#FF69B4',
  orange: '#FF8C00', red: '#FF0000', yellow: '#FFD700',
  green: '#00AA00', dark_blue: '#00008B',
  railroad: '#444', utility: '#888',
};

const HEIGHT = 0.06;

function NonPropIcon({ type, g }) {
  let iconColor, iconLabel;
  if (type === 'railroad') {
    iconColor = '#444';
    iconLabel = 'RR';
  } else if (type === 'tax') {
    iconColor = '#C67B30';
    iconLabel = 'TAX';
  } else if (type === 'utility') {
    iconColor = '#778899';
    iconLabel = 'UTIL';
  } else {
    return null;
  }

  const iconH = BAND * 0.55;
  const iconW = g.edge === 'bottom' || g.edge === 'top' ? iconH * 1.2 : iconH * 1.2;

  let bx, bz;
  if (g.edge === 'bottom') {
    bx = 0;
    bz = TRACK * 0.25;
  } else if (g.edge === 'left') {
    bx = -TRACK * 0.25;
    bz = 0;
  } else if (g.edge === 'top') {
    bx = 0;
    bz = -TRACK * 0.25;
  } else {
    bx = TRACK * 0.25;
    bz = 0;
  }

  return (
    <group position={[bx, 0.018, bz]}>
      <mesh>
        <planeGeometry args={[iconW, iconH]} />
        <meshBasicMaterial color={iconColor} transparent opacity={0.7} />
      </mesh>
      <Billboard>
        <Text position={[0, 0, 0.002]}
          fontSize={iconH * 0.45} color="#eee" anchorX="center" anchorY="middle"
          renderOrder={2} depthWrite={false}
          material-polygonOffset={true} material-polygonOffsetFactor={-1} material-polygonOffsetUnits={1}>
          {iconLabel}
        </Text>
      </Billboard>
    </group>
  );
}

function SpaceTile({ pos }) {
  const space = SPACES[pos];
  const g = getSpaceGeometry(pos);
  if (!space || !g) return null;

  const isProp = space.type === 'property';
  const color = GRP_COLORS[space?.group] || '#555';
  const tileColor = g.edge === 'corner' ? '#FDFBF7' : (isProp ? '#FDFBF7' : '#F5F0E8');
  const lineW = 0.01;
  const nameSize = g.edge === 'corner' ? 0.14 : (CORNER * 0.09);
  const priceSize = g.edge === 'corner' ? 0 : 0.07;

  return (
    <group position={[g.cx, 0, g.cz]}>
      {/* Tile body */}
      <mesh receiveShadow>
        <boxGeometry args={[g.w - lineW, HEIGHT, g.d - lineW]} />
        <meshStandardMaterial color={tileColor} roughness={0.55} metalness={0.01} />
      </mesh>

      {/* Outer edge accent line */}
      <mesh position={[0, HEIGHT / 2 + 0.001, 0]}>
        <boxGeometry args={[g.w, 0.002, g.d]} />
        <meshBasicMaterial color="#111" transparent opacity={0.10} />
      </mesh>

      {/* Color band at outer edge */}
      {isProp && g.band && (
        <ColorBand g={g} color={color} />
      )}

      {/* Non-property indicator icons */}
      {!isProp && g.edge !== 'corner' && (
        <NonPropIcon type={space.type} g={g} />
      )}

      {/* Label */}
      <Billboard position={[g.labelCx - g.cx, 0.18, g.labelCz - g.cz]}>
        <Text position={[0, 0, 0]}
          fontSize={nameSize} color="#1a1a1a" anchorX="center" anchorY="middle"
          maxWidth={g.w * 1.4} textAlign="center"
          renderOrder={1} depthWrite={false}
          material-polygonOffset={true} material-polygonOffsetFactor={-1} material-polygonOffsetUnits={1}>
          {space.name}
        </Text>
      </Billboard>

      {/* Price */}
      {isProp && space.price > 0 && (
        <Billboard position={[g.priceCx - g.cx, 0.15, g.priceCz - g.cz]}>
          <Text position={[0, 0, 0]}
            fontSize={priceSize} color="#555" anchorX="center" anchorY="middle"
            renderOrder={1} depthWrite={false}
            material-polygonOffset={true} material-polygonOffsetFactor={-1} material-polygonOffsetUnits={1}>
            ${space.price}
          </Text>
        </Billboard>
      )}
    </group>
  );
}

function ColorBand({ g, color }) {
  const ref = useRef(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const shimmer = 0.85 + 0.15 * Math.sin(clock.getElapsedTime() * 0.8 + g.cx + g.cz);
    ref.current.material.emissiveIntensity = shimmer * 0.10;
  });
  const bW = g.band.bw;
  const bD = g.band.bd;
  const innerW = bW * 0.88;
  const innerD = bD * 0.75;
  return (
    <group>
      {/* Band outer border */}
      <mesh position={[g.band.cx - g.cx, HEIGHT / 2 + 0.006, g.band.cz - g.cz]}>
        <boxGeometry args={[bW, 0.005, bD]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.05}
          emissive={color} emissiveIntensity={0}
          transparent opacity={0.9} />
      </mesh>
      {/* Band inner highlight */}
      <mesh position={[g.band.cx - g.cx, HEIGHT / 2 + 0.008, g.band.cz - g.cz]}>
        <boxGeometry args={[innerW, 0.003, innerD]} />
        <meshStandardMaterial color="#fff" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

function CardDeck({ position, label, color, glowColor }) {
  const glowRef = useRef(null);
  const floatRef = useRef(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (glowRef.current) {
      glowRef.current.position.y = 0.03 + 0.008 * Math.sin(t * 0.7);
    }
    if (floatRef.current) {
      floatRef.current.position.y = 0.03 + 0.008 * Math.sin(t * 0.7 + 0.5);
      floatRef.current.rotation.y = t * 0.05;
    }
  });

  return (
    <group position={position}>
      <mesh receiveShadow>
        <boxGeometry args={[1.3, 0.06, 0.95]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.05} />
      </mesh>
      {/* Gold trim */}
      <mesh position={[0, 0.036, 0]}>
        <boxGeometry args={[1.25, 0.008, 0.9]} />
        <meshStandardMaterial color="#D4AF37" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Label */}
      <Billboard>
        <Text position={[0, 0.12, 0.06]} fontSize={0.09}
          color="#fff" anchorX="center" anchorY="middle" textAlign="center"
          outlineWidth={0.003} outlineColor="#000"
          renderOrder={1} depthWrite={false}
          material-polygonOffset={true} material-polygonOffsetFactor={-1} material-polygonOffsetUnits={1}>
          {label}
        </Text>
      </Billboard>
      {/* Floating card above deck */}
      <group ref={floatRef} position={[0, 0.05, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.005, 0.35]} />
          <meshStandardMaterial color="#fff" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.004, 0]}>
          <boxGeometry args={[0.45, 0.003, 0.3]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
      </group>
      {/* Glow ring */}
      <mesh ref={glowRef} position={[0, 0.01, 0]}>
        <planeGeometry args={[1.8, 1.4]} />
        <meshBasicMaterial color={glowColor || color} transparent opacity={0.06}
          depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

function CornerGlow({ pos }) {
  const ref = useRef(null);
  const g = getSpaceGeometry(pos);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const pulse = 0.3 + 0.2 * Math.sin(clock.getElapsedTime() * 0.5 + pos);
    ref.current.material.opacity = pulse * 0.10;
  });
  if (!g || g.edge !== 'corner') return null;

  return (
    <mesh ref={ref} position={[g.cx, 0.008, g.cz]}>
      <planeGeometry args={[CORNER * 0.7, CORNER * 0.7]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.05}
          depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

// GO arrow indicator on the corner tile
function GOIndicator() {
  return (
    <Billboard position={[4.231, 0.05, 4.231]}>
      <Text position={[0, 0, 0]}
        fontSize={0.22} color="#1a1a1a" anchorX="center" anchorY="middle"
        fontWeight="bold"
        renderOrder={1} depthWrite={false}
        material-polygonOffset={true} material-polygonOffsetFactor={-1} material-polygonOffsetUnits={1}>
        GO
      </Text>
    </Billboard>
  );
}

export default function Board3D() {
  const spaces = useMemo(() => [...Array(40).keys()], []);
  const centerSize = BOARD - 2 * CORNER;

  return (
    <group>
      {/* Felt base */}
      <mesh position={[0, -HEIGHT / 2, 0]} receiveShadow>
        <boxGeometry args={[BOARD + 0.1, 0.025, BOARD + 0.1]} />
        <meshStandardMaterial color="#1B5E20" roughness={0.9} metalness={0} />
      </mesh>

      {/* Cream playing surface */}
      <mesh position={[0, -HEIGHT / 2 + 0.008, 0]} receiveShadow>
        <boxGeometry args={[BOARD - 0.02, 0.01, BOARD - 0.02]} />
        <meshStandardMaterial color="#FDFBF7" roughness={0.6} metalness={0.01} />
      </mesh>

      {/* Interior center field */}
      <mesh position={[0, -HEIGHT / 2 + 0.012, 0]}>
        <boxGeometry args={[centerSize, 0.003, centerSize]} />
        <meshStandardMaterial color="#FAF8F0" roughness={0.7} metalness={0.01} />
      </mesh>

      {/* Inner track border */}
      <mesh position={[0, -HEIGHT / 2 + 0.013, 0]}>
        <boxGeometry args={[centerSize + 0.05, 0.001, centerSize + 0.05]} />
        <meshBasicMaterial color="#111" transparent opacity={0.12} />
      </mesh>

      {/* GO label at bottom-right corner */}
      <GOIndicator />

      {/* Spaces */}
      {spaces.map(pos => (
        <SpaceTile key={pos} pos={pos} />
      ))}

      {/* Corner glows */}
      {[0, 10, 20, 30].map(pos => (
        <CornerGlow key={`cg-${pos}`} pos={pos} />
      ))}

      {/* Chance deck */}
      <group position={[-centerSize * 0.22, 0, -centerSize * 0.22]} rotation={[0, Math.PI / 4, 0]}>
        <CardDeck position={[0, 0, 0]} label="Chance" color="#E65100" glowColor="#FF9800" />
      </group>

      {/* Community Chest deck */}
      <group position={[centerSize * 0.22, 0, centerSize * 0.22]} rotation={[0, Math.PI / 4, 0]}>
        <CardDeck position={[0, 0, 0]} label="Community Chest" color="#1565C0" glowColor="#42A5F5" />
      </group>
    </group>
  );
}
