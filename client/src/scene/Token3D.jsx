import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { posToWorld } from './boardLayout.js';

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
    if (elapsed < 300) return 0.08 * Math.sin((elapsed / 300) * Math.PI);
    return 0;
  };
}

const TOKEN_COLORS = {
  top_hat: '#6B6B6B', car: '#5A5A5A', dog: '#707070',
  battleship: '#555555', iron: '#626262', thimble: '#787878',
  shoe: '#5E5E5E', cannon: '#6A6A6A',
};

const PEWTER = { metalness: 0.4, roughness: 0.6 };
const TS = 2; // token size multiplier

// Racecar: Drift, tire smoke, rev
function RacecarToken({ pos }) {
  const groupRef = useRef(null);
  const [wx, wy, wz] = posToWorld(pos, 0.08);
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
    <group ref={groupRef} position={[wx, wy, wz]} scale={TS}>
      {/* Body — low, sleek 1930s silhouette */}
      <mesh castShadow>
        <boxGeometry args={[0.16, 0.03, 0.07]} />
        <meshStandardMaterial color={TOKEN_COLORS.car} {...PEWTER} />
      </mesh>
      {/* Nose cone */}
      <mesh position={[0.085, 0.015, 0]} castShadow>
        <sphereGeometry args={[0.025, 8, 6]} />
        <meshStandardMaterial color={TOKEN_COLORS.car} {...PEWTER} />
      </mesh>
      {/* Tail fin */}
      <mesh position={[-0.085, 0.025, 0]} castShadow>
        <boxGeometry args={[0.02, 0.02, 0.01]} />
        <meshStandardMaterial color={TOKEN_COLORS.car} {...PEWTER} />
      </mesh>
      {/* Cockpit — open, driver head */}
      <mesh position={[0.01, 0.035, 0]} castShadow>
        <boxGeometry args={[0.05, 0.03, 0.055]} />
        <meshStandardMaterial color="#222" {...PEWTER} />
      </mesh>
      {/* Driver head */}
      <mesh position={[0.02, 0.055, 0]} castShadow>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial color="#333" roughness={0.8} />
      </mesh>
      {/* Wire-spoke wheels */}
      {[[-0.055, -0.018, -0.045], [0.055, -0.018, -0.045],
        [-0.055, -0.018, 0.045], [0.055, -0.018, 0.045]].map((p, i) => (
        <group key={i} position={p}>
          <mesh castShadow>
            <cylinderGeometry args={[0.017, 0.017, 0.02, 8]} />
            <meshStandardMaterial color={TOKEN_COLORS.car} {...PEWTER} />
          </mesh>
          {/* Spoke lines */}
          {[0, Math.PI/3, 2*Math.PI/3, Math.PI, 4*Math.PI/3, 5*Math.PI/3].map((a, j) => (
            <mesh key={j} position={[0.008*Math.cos(a), 0.008*Math.sin(a), 0]} rotation={[0, 0, -a]}>
              <boxGeometry args={[0.016, 0.002, 0.001]} />
              <meshStandardMaterial color={TOKEN_COLORS.car} {...PEWTER} />
            </mesh>
          ))}
        </group>
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

  const [wx, wy, wz] = posToWorld(pos, 0.08);

  return (
    <group ref={groupRef} position={[wx, wy, wz]} scale={TS}>
      {/* Hat brim — curved */}
      <mesh rotation={[Math.PI/2, 0, 0]} castShadow>
        <ringGeometry args={[0.03, 0.085, 16]} />
        <meshStandardMaterial color={TOKEN_COLORS.top_hat} {...PEWTER} side={THREE.DoubleSide} />
      </mesh>
      {/* Hat body — tapered cylinder */}
      <mesh position={[0, 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.055, 0.08, 12]} />
        <meshStandardMaterial color={TOKEN_COLORS.top_hat} {...PEWTER} />
      </mesh>
      {/* Hat band */}
      <mesh position={[0, 0.015, 0]}>
        <cylinderGeometry args={[0.045, 0.052, 0.008, 12]} />
        <meshStandardMaterial color="#333" {...PEWTER} />
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

  const [wx, wy, wz] = posToWorld(pos, 0.08);

  return (
    <group ref={groupRef} position={[wx, wy, wz]} scale={TS}>
      {/* Hull */}
      <mesh castShadow>
        <boxGeometry args={[0.14, 0.03, 0.06]} />
        <meshStandardMaterial color={TOKEN_COLORS.battleship} {...PEWTER} />
      </mesh>
      {/* Deck */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <boxGeometry args={[0.12, 0.015, 0.055]} />
        <meshStandardMaterial color="#5A5A5A" {...PEWTER} />
      </mesh>
      {/* Forward turret */}
      <mesh position={[0.04, 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.022, 0.025, 8]} />
        <meshStandardMaterial color={TOKEN_COLORS.battleship} {...PEWTER} />
      </mesh>
      {/* Forward turret barrel */}
      <mesh position={[0.07, 0.045, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.004, 0.006, 0.04, 6]} />
        <meshStandardMaterial color={TOKEN_COLORS.battleship} {...PEWTER} />
      </mesh>
      {/* Aft turret */}
      <mesh position={[-0.04, 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.018, 0.02, 8]} />
        <meshStandardMaterial color={TOKEN_COLORS.battleship} {...PEWTER} />
      </mesh>
      {/* Aft turret barrel */}
      <mesh position={[-0.065, 0.045, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.003, 0.005, 0.03, 6]} />
        <meshStandardMaterial color={TOKEN_COLORS.battleship} {...PEWTER} />
      </mesh>
      {/* Bridge */}
      <mesh position={[0.01, 0.04, 0]} castShadow>
        <boxGeometry args={[0.025, 0.015, 0.02]} />
        <meshStandardMaterial color={TOKEN_COLORS.battleship} {...PEWTER} />
      </mesh>
      {/* Wave glow */}
      <mesh ref={waveRef} position={[0, -0.015, 0]}>
        <planeGeometry args={[0.22, 0.08]} />
        <meshBasicMaterial color="#4488ff" transparent opacity={0.15} depthWrite={false} />
      </mesh>
    </group>
  );
}

// Thimble — hollow cylinder with domed top, dimpled grid texture
function ThimbleToken({ pos }) {
  const groupRef = useRef(null);
  const getHop = useTokenHop(pos);
  const [wx, wy, wz] = posToWorld(pos, 0.08);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = 0.05 + 0.01 * Math.sin(clock.getElapsedTime() * 2) + getHop();
  });

  return (
    <group ref={groupRef} position={[wx, wy, wz]} scale={TS}>
      <mesh castShadow>
        <cylinderGeometry args={[0.04, 0.045, 0.055, 10]} />
        <meshStandardMaterial color={TOKEN_COLORS.thimble} {...PEWTER} />
      </mesh>
      {/* Domed top */}
      <mesh position={[0, 0.035, 0]} castShadow>
        <sphereGeometry args={[0.04, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={TOKEN_COLORS.thimble} {...PEWTER} />
      </mesh>
      {/* Grid/dimpled rings */}
      <mesh position={[0, -0.01, 0]}>
        <torusGeometry args={[0.042, 0.002, 4, 12]} />
        <meshStandardMaterial color={TOKEN_COLORS.thimble} {...PEWTER} />
      </mesh>
      <mesh position={[0, 0.015, 0]}>
        <torusGeometry args={[0.038, 0.002, 4, 12]} />
        <meshStandardMaterial color={TOKEN_COLORS.thimble} {...PEWTER} />
      </mesh>
    </group>
  );
}

// Generic token fallback for dog, iron, etc.
function GenericToken({ token, color, pos }) {
  const groupRef = useRef(null);
  const getHop = useTokenHop(pos);
  const [wx, wy, wz] = posToWorld(pos, 0.08);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = 0.05 + 0.015 * Math.sin(clock.getElapsedTime() * 2) + getHop();
  });

  return (
    <group ref={groupRef} position={[wx, wy, wz]} scale={TS}>
      <mesh castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.04, 8]} />
        <meshStandardMaterial color={color} {...PEWTER} />
      </mesh>
      <mesh position={[0, 0.045, 0]} castShadow>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color={color} {...PEWTER} />
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
    case 'thimble':
      return <ThimbleToken pos={pos} />;
    default:
      return <GenericToken token={player.token} color={color} pos={pos} />;
  }
}
