import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SPACES, GRID_POSITIONS, GRID_SIZE } from 'shared/constants.js';

const BOARD_SIZE = 10;
const CELL = BOARD_SIZE / GRID_SIZE;
const HALF = (GRID_SIZE - 1) / 2;
const W = 0.85;
const D = 0.3;

function getTileOffset(x, y) {
  const isCorner = (x === 0 || x === 10) && (y === 0 || y === 10);
  const edge = x === 0 ? 'left' : x === 10 ? 'right' : y === 0 ? 'top' : y === 10 ? 'bottom' : 'center';
  let ox = 0, oz = 0;
  if (!isCorner) {
    if (edge === 'bottom') oz = CELL / 2 - D / 2;
    else if (edge === 'top') oz = -(CELL / 2 - D / 2);
    else if (edge === 'right') ox = CELL / 2 - D / 2;
    else if (edge === 'left') ox = -(CELL / 2 - D / 2);
  }
  return [ox, oz];
}

function posToWorld(pos) {
  const gp = GRID_POSITIONS.find(p => p.pos === pos);
  if (!gp) return [0, 0, 0];
  const [ox, oz] = getTileOffset(gp.x, gp.y);
  return [(gp.x - HALF) * CELL + ox, 0, (gp.y - HALF) * CELL + oz];
}

// Single house with construction animation
function House3D({ color = '#3B82F6', delay = 0, onBuilt }) {
  const groupRef = useRef(null);
  const builtRef = useRef(false);

  useFrame(({ clock }) => {
    if (!groupRef.current || builtRef.current) return;
    const t = clock.getElapsedTime() - delay;
    if (t < 0) return;
    const progress = Math.min(1, t / 0.5);
    const eased = 1 - Math.pow(1 - progress, 3);
    groupRef.current.position.y = -0.02 * (1 - eased);
    groupRef.current.scale.y = eased;
    if (progress >= 1 && !builtRef.current) {
      builtRef.current = true;
      onBuilt?.();
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} scale={[1, 0, 1]}>
      {/* Walls */}
      <mesh position={[0, 0.015, 0]} castShadow>
        <boxGeometry args={[0.05, 0.03, 0.04]} />
        <meshStandardMaterial color="#e8d5b7" roughness={0.7} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 0.035, 0]} rotation={[0, 0, 0]} castShadow>
        <coneGeometry args={[0.04, 0.025, 4]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.01, 0.021]}>
        <planeGeometry args={[0.015, 0.02]} />
        <meshBasicMaterial color="#5c4033" />
      </mesh>
    </group>
  );
}

// Construction drone with particles
function ConstructionDrone({ position, delay = 0 }) {
  const ref = useRef(null);
  const dustRef = useRef(null);
  const dustParticles = useRef(new Float32Array(50 * 3).fill(0));

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() - delay;
    if (t < 0 || t > 2) {
      ref.current.visible = false;
      return;
    }
    ref.current.visible = true;
    ref.current.position.y = 0.1 + 0.03 * Math.sin(t * 8);
    ref.current.position.x = 0.02 * Math.sin(t * 4);
    ref.current.rotation.z = Math.sin(t * 6) * 0.1;
  });

  if (delay > 3) return null;

  return (
    <group ref={ref} position={[position[0], position[1], position[2]]}>
      <mesh>
        <boxGeometry args={[0.025, 0.01, 0.025]} />
        <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Rotor */}
      <mesh position={[0, 0.008, 0]}>
        <boxGeometry args={[0.04, 0.002, 0.01]} />
        <meshStandardMaterial color="#888" />
      </mesh>
      <mesh position={[0, 0.008, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.04, 0.002, 0.01]} />
        <meshStandardMaterial color="#888" />
      </mesh>
      {/* Glow */}
      <pointLight distance={0.1} intensity={0.3} color="#4488ff" />
    </group>
  );
}

// Hotel: taller, glass, searchlights
function Hotel3D({ color = '#3B82F6', delay = 0 }) {
  const groupRef = useRef(null);
  const lightRef = useRef(null);
  const builtRef = useRef(false);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime() - delay;
    if (t < 0) return;
    if (!builtRef.current) {
      const progress = Math.min(1, t / 0.8);
      const eased = 1 - Math.pow(1 - progress, 3);
      groupRef.current.position.y = -0.06 * (1 - eased);
      groupRef.current.scale.y = eased;
      groupRef.current.scale.x = 0.5 + 0.5 * eased;
      groupRef.current.scale.z = 0.5 + 0.5 * eased;
      if (progress >= 1) builtRef.current = true;
    }
    // Searchlight rotation
    if (lightRef.current) {
      lightRef.current.rotation.y = clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <group ref={groupRef} scale={[0, 0, 0]}>
      {/* Main tower */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <boxGeometry args={[0.07, 0.1, 0.06]} />
        <meshStandardMaterial color="#4a4a6a" metalness={0.6} roughness={0.2} />
      </mesh>
      {/* Glass panels */}
      <mesh position={[0, 0.05, 0.031]}>
        <planeGeometry args={[0.065, 0.09]} />
        <meshBasicMaterial color="#88ccff" transparent opacity={0.3} />
      </mesh>
      <mesh position={[0.036, 0.05, 0]}>
        <planeGeometry args={[0.04, 0.09]} />
        <meshBasicMaterial color="#88ccff" transparent opacity={0.2} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[0.08, 0.008, 0.07]} />
        <meshStandardMaterial color="#666" metalness={0.8} roughness={0.1} />
      </mesh>
      {/* Roof lights */}
      <mesh position={[0.03, 0.11, 0.03]}>
        <sphereGeometry args={[0.005, 6, 6]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[-0.03, 0.11, -0.03]}>
        <sphereGeometry args={[0.005, 6, 6]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Searchlight beam */}
      <group ref={lightRef} position={[0, 0.1, 0]}>
        <mesh position={[0.1, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
          <coneGeometry args={[0.005, 0.15, 6]} />
          <meshBasicMaterial color={color} transparent opacity={0.1} depthWrite={false} />
        </mesh>
        <mesh position={[-0.1, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <coneGeometry args={[0.005, 0.15, 6]} />
          <meshBasicMaterial color={color} transparent opacity={0.1} depthWrite={false} />
        </mesh>
      </group>
      {/* Entry */}
      <mesh position={[0, 0.01, 0.031]}>
        <planeGeometry args={[0.02, 0.02]} />
        <meshBasicMaterial color="#ffcc00" />
      </mesh>
    </group>
  );
}

// Mortgage barricade (red warning stripe)
function MortgageOverlay({ color = '#ff0000' }) {
  const ref = useRef(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const opacity = 0.3 + 0.2 * Math.sin(clock.getElapsedTime() * 2);
    ref.current.material.opacity = opacity;
  });

  return (
    <mesh ref={ref} position={[0, 0.01, 0]}>
      <planeGeometry args={[gw * 0.85, gw * 0.85]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.3}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Demolition particles (debris burst)
function DemolitionEffect({ active, position }) {
  const ref = useRef(null);
  const particles = useRef(null);

  useFrame(({ clock }) => {
    if (!ref.current || !active) return;
    const t = clock.getElapsedTime();
    if (t > 1) { ref.current.visible = false; return; }
    ref.current.visible = true;
    if (particles.current) {
      const pos = particles.current.geometry.attributes.position.array;
      for (let i = 0; i < 30; i++) {
        pos[i * 3] += (Math.random() - 0.5) * 0.02;
        pos[i * 3 + 1] += 0.01 + Math.random() * 0.02;
        pos[i * 3 + 2] += (Math.random() - 0.5) * 0.02;
      }
      particles.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group ref={ref} position={position} visible={false}>
      <points ref={particles}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={30}
            array={new Float32Array(30 * 3).fill(0).map(() => (Math.random() - 0.5) * 0.1)}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial color="#ff4444" size={0.015} transparent opacity={0.6}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
    </group>
  );
}

// Main building system
export default function BuildingSystem({ game, animState }) {
  if (!game) return null;

  const buildings = [];
  const mortgages = [];

  game.players.forEach(player => {
    if (player.isBankrupt) return;
    Object.entries(player.houses || {}).forEach(([pid, count]) => {
      for (let i = 0; i < count; i++) {
        buildings.push({ pos: Number(pid), type: 'house', playerId: player.id, index: i });
      }
    });
    Object.entries(player.hotels || {}).forEach(([pid, has]) => {
      if (has) buildings.push({ pos: Number(pid), type: 'hotel', playerId: player.id });
    });
    (player.mortgaged || []).forEach(pid => {
      mortgages.push(Number(pid));
    });
  });

  return (
    <group>
      {buildings.map((b, i) => {
        const [px, py, pz] = posToWorld(b.pos);
        const space = SPACES[b.pos];
        const color = space?.color || '#3B82F6';
        const isBuilding = animState?.buildingSpaceId === b.pos;
        const isDemolish = animState?.demolishSpaceId === b.pos;
        const delay = b.index * 0.15 + (isBuilding ? 0 : 0.5);

        return (
          <group key={`${b.pos}-${b.type}-${i}`} position={[px, py, pz]}>
            <group position={[0, 0, 0]}>
              {b.type === 'house' && (
                <>
                  <House3D color={color} delay={delay} />
                  <ConstructionDrone position={[0.04, 0.02, 0.04]} delay={delay} />
                </>
              )}
              {b.type === 'hotel' && <Hotel3D color={color} delay={delay} />}
            </group>
            {isDemolish && <DemolitionEffect active position={[0, 0.02, 0]} />}
          </group>
        );
      })}

      {/* Mortgage overlays */}
      {mortgages.map(pid => {
        const [px, py, pz] = posToWorld(pid);
        return (
          <group key={`mortgage-${pid}`} position={[px, py, pz]}>
            <MortgageOverlay />
            {/* Desaturate effect via grayscale filter */}
            <mesh position={[0, 0.005, 0]}>
              <planeGeometry args={[gw * 0.95, gw * 0.95]} />
              <meshBasicMaterial color="#000" transparent opacity={0.4} depthWrite={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
