import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GRID_POSITIONS, GRID_SIZE } from 'shared/constants.js';

function useTokenHop(pos) {
  const prevPosRef = useRef(pos);
  const hopStartRef = useRef(0);
  if (pos !== prevPosRef.current) {
    prevPosRef.current = pos;
    hopStartRef.current = performance.now();
  }
  return () => {
    if (hopStartRef.current === 0) return 0;
    const elapsed = performance.now() - hopStartRef.current;
    if (elapsed < 300) return 0.04 * Math.sin((elapsed / 300) * Math.PI);
    return 0;
  };
}

const BOARD_SIZE = 10;
const gw = BOARD_SIZE / GRID_SIZE;

function posToWorld(pos) {
  const gp = GRID_POSITIONS.find(p => p.pos === pos);
  if (!gp) return [0, 0, 0];
  return [(gp.x - (GRID_SIZE - 1) / 2) * gw, 0.05, (gp.y - (GRID_SIZE - 1) / 2) * gw];
}

const TOKEN_COLORS = {
  top_hat: '#8B4513', car: '#e63946', dog: '#4a90d9',
  battleship: '#555', iron: '#666', thimble: '#c0c0c0',
};

// Racecar: Drift, tire smoke, rev
function RacecarToken({ pos }) {
  const groupRef = useRef(null);
  const [wx, wy, wz] = posToWorld(pos);
  const smokeRef = useRef(null);
  const getHop = useTokenHop(pos);
  const smokeParticles = useMemo(() => {
    const pos = new Float32Array(30 * 3);
    for (let i = 0; i < 30; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.2;
      pos[i * 3 + 1] = Math.random() * 0.1;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = wy + 0.02 * Math.sin(t * 3) + getHop();
    groupRef.current.rotation.z = 0.03 * Math.sin(t * 2);
    // Tire smoke
    if (smokeRef.current) {
      const pos = smokeRef.current.geometry.attributes.position.array;
      for (let i = 0; i < 30; i++) {
        pos[i * 3 + 1] += 0.01;
        pos[i * 3] += (Math.random() - 0.5) * 0.02;
        pos[i * 3 + 2] += (Math.random() - 0.5) * 0.02;
        if (pos[i * 3 + 1] > 0.3) {
          pos[i * 3 + 1] = 0;
          pos[i * 3] = (Math.random() - 0.5) * 0.2;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
        }
      }
      smokeRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef} position={[wx, wy, wz]}>
      {/* Body */}
      <mesh castShadow>
        <boxGeometry args={[0.14, 0.04, 0.08]} />
        <meshStandardMaterial color={TOKEN_COLORS.car} metalness={0.6} roughness={0.2} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 0.03, 0]} castShadow>
        <boxGeometry args={[0.06, 0.035, 0.06]} />
        <meshStandardMaterial color="#222" metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Wheels */}
      {[[-0.05, -0.02, -0.05], [0.05, -0.02, -0.05], [-0.05, -0.02, 0.05], [0.05, -0.02, 0.05]].map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <cylinderGeometry args={[0.015, 0.015, 0.025, 6]} />
          <meshStandardMaterial color="#111" roughness={0.8} />
        </mesh>
      ))}
      {/* Tire smoke particles */}
      <points ref={smokeRef} position={[0, -0.02, -0.06]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={30} array={smokeParticles} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color="#ccc" size={0.015} transparent opacity={0.3}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
    </group>
  );
}

// Top Hat: Bounces, tips on GO
function TopHatToken({ pos }) {
  const groupRef = useRef(null);
  const getHop = useTokenHop(pos);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = 0.05 + 0.03 * Math.abs(Math.sin(t * 2)) + getHop();
    groupRef.current.rotation.z = 0.04 * Math.sin(t * 1.5);
  });

  const [wx, wy, wz] = posToWorld(pos);

  return (
    <group ref={groupRef} position={[wx, wy, wz]}>
      {/* Hat base */}
      <mesh castShadow>
        <cylinderGeometry args={[0.07, 0.08, 0.02, 12]} />
        <meshStandardMaterial color={TOKEN_COLORS.top_hat} roughness={0.3} />
      </mesh>
      {/* Hat top */}
      <mesh position={[0, 0.035, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.055, 0.05, 12]} />
        <meshStandardMaterial color={TOKEN_COLORS.top_hat} roughness={0.4} />
      </mesh>
      {/* Hat band */}
      <mesh position={[0, 0.015, 0]}>
        <cylinderGeometry args={[0.055, 0.06, 0.008, 12]} />
        <meshStandardMaterial color="#222" roughness={0.6} />
      </mesh>
    </group>
  );
}

// Battleship: Glides on wave, fires blanks
function BattleshipToken({ pos }) {
  const groupRef = useRef(null);
  const waveRef = useRef(null);
  const getHop = useTokenHop(pos);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = 0.05 + 0.01 * Math.sin(t * 1.5) + getHop();
    groupRef.current.rotation.z = 0.02 * Math.sin(t * 1.2);
    // Wave mesh
    if (waveRef.current) {
      waveRef.current.position.y = -0.01 + 0.005 * Math.sin(t * 2);
      waveRef.current.scale.x = 1 + 0.1 * Math.sin(t * 1.8);
    }
  });

  const [wx, wy, wz] = posToWorld(pos);

  return (
    <group ref={groupRef} position={[wx, wy, wz]}>
      {/* Hull */}
      <mesh castShadow>
        <boxGeometry args={[0.12, 0.03, 0.06]} />
        <meshStandardMaterial color={TOKEN_COLORS.battleship} metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Deck */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <boxGeometry args={[0.1, 0.02, 0.05]} />
        <meshStandardMaterial color="#666" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Turret */}
      <mesh position={[0.03, 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.02, 0.025, 8]} />
        <meshStandardMaterial color="#444" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Cannon barrel */}
      <mesh position={[0.06, 0.045, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.004, 0.006, 0.04, 6]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Wave glow */}
      <mesh ref={waveRef} position={[0, -0.01, 0]}>
        <planeGeometry args={[0.2, 0.08]} />
        <meshBasicMaterial color="#4488ff" transparent opacity={0.15} depthWrite={false} />
      </mesh>
    </group>
  );
}

// Generic token fallback
function GenericToken({ token, color, pos }) {
  const groupRef = useRef(null);
  const getHop = useTokenHop(pos);
  const [wx, wy, wz] = posToWorld(pos);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = 0.05 + 0.015 * Math.sin(clock.getElapsedTime() * 2) + getHop();
  });

  return (
    <group ref={groupRef} position={[wx, wy, wz]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.04, 8]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.045, 0]} castShadow>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.3} />
      </mesh>
    </group>
  );
}

export default function Token3D({ player, pos }) {
  const color = TOKEN_COLORS[player.token] || '#3B82F6';

  switch (player.token) {
    case 'car':
      return <RacecarToken pos={pos} />;
    case 'top_hat':
      return <TopHatToken pos={pos} />;
    case 'battleship':
      return <BattleshipToken pos={pos} />;
    default:
      return <GenericToken token={player.token} color={color} pos={pos} />;
  }
}
