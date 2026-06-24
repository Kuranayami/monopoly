import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SPACES } from 'shared/constants.js';
import { posToWorld, SPACE } from './boardLayout.js';

// Scaled from real: 0.5×0.4×0.35" house → 0.256×0.205×0.179 units
const H_W = 0.256;
const H_D = 0.205;
const H_H = 0.179;
const H_ROOF = H_H * 0.5;

const HOT_W = 0.385;
const HOT_D = 0.256;
const HOT_H = 0.256;

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
      {/* Base — rectangular block */}
      <mesh position={[0, H_ROOF, 0]} castShadow>
        <boxGeometry args={[H_W, H_H - H_ROOF, H_D]} />
        <meshStandardMaterial color="#1B5E20" roughness={0.85} metalness={0} />
      </mesh>
      {/* Roof — peaked triangular prism (box scaled in y) */}
      <mesh position={[0, H_H, 0]} rotation={[0, 0, 0]} castShadow>
        <boxGeometry args={[H_W * 0.85, H_ROOF * 0.6, H_D * 0.85]} />
        <meshStandardMaterial color="#1B5E20" roughness={0.8} metalness={0} />
      </mesh>
    </group>
  );
}

function Hotel3D({ color = '#E31B23', delay = 0 }) {
  const groupRef = useRef(null);
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
  });

  return (
    <group ref={groupRef} scale={[0, 0, 0]}>
      {/* Main block */}
      <mesh position={[0, HOT_H / 2, 0]} castShadow>
        <boxGeometry args={[HOT_W, HOT_H, HOT_D]} />
        <meshStandardMaterial color="#DC2626" roughness={0.75} metalness={0} />
      </mesh>
      {/* Stepped ridge along top edges */}
      <mesh position={[0, HOT_H + 0.01, 0]} castShadow>
        <boxGeometry args={[HOT_W * 1.05, 0.015, HOT_D * 1.05]} />
        <meshStandardMaterial color="#DC2626" roughness={0.7} metalness={0} />
      </mesh>
      <mesh position={[0, HOT_H + 0.025, 0]} castShadow>
        <boxGeometry args={[HOT_W * 0.85, 0.012, HOT_D * 0.85]} />
        <meshStandardMaterial color="#DC2626" roughness={0.7} metalness={0} />
      </mesh>
    </group>
  );
}

function ConstructionDrone({ position, delay = 0 }) {
  const ref = useRef(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() - delay;
    if (t < 0 || t > 2) { ref.current.visible = false; return; }
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
      <mesh position={[0, 0.008, 0]}>
        <boxGeometry args={[0.04, 0.002, 0.01]} />
        <meshStandardMaterial color="#888" />
      </mesh>
      <mesh position={[0, 0.008, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.04, 0.002, 0.01]} />
        <meshStandardMaterial color="#888" />
      </mesh>
      <pointLight distance={0.1} intensity={0.3} color="#4488ff" />
    </group>
  );
}

function MortgageOverlay({ color = '#ff0000' }) {
  const ref = useRef(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const opacity = 0.3 + 0.2 * Math.sin(clock.getElapsedTime() * 2);
    ref.current.material.opacity = opacity;
  });

  return (
    <mesh ref={ref} position={[0, 0.01, 0]}>
      <planeGeometry args={[SPACE * 0.85, SPACE * 0.85]} />
      <meshBasicMaterial color={color} transparent opacity={0.3}
        depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

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
          <bufferAttribute attach="attributes-position" count={30}
            array={new Float32Array(30 * 3).fill(0).map(() => (Math.random() - 0.5) * 0.1)}
            itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color="#ff4444" size={0.015} transparent opacity={0.6}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
    </group>
  );
}

export default function BuildingSystem({ game, animState }) {
  if (!game) return null;

  const buildings = [];
  const mortgages = [];

  game.players.forEach(player => {
    if (player.isBankrupt) return;
    Object.entries(player.houses || {}).forEach(([pid, count]) => {
      for (let i = 0; i < count; i++)
        buildings.push({ pos: Number(pid), type: 'house', playerId: player.id, index: i });
    });
    Object.entries(player.hotels || {}).forEach(([pid, has]) => {
      if (has) buildings.push({ pos: Number(pid), type: 'hotel', playerId: player.id });
    });
    (player.mortgaged || []).forEach(pid => mortgages.push(Number(pid)));
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
            {b.type === 'house' && (
              <>
                <House3D color={color} delay={delay} />
                <ConstructionDrone position={[H_W * 0.3, 0.02, 0]} delay={delay} />
              </>
            )}
            {b.type === 'hotel' && <Hotel3D color={color} delay={delay} />}
            {isDemolish && <DemolitionEffect active position={[0, 0.02, 0]} />}
          </group>
        );
      })}

      {mortgages.map(pid => {
        const [px, py, pz] = posToWorld(pid);
        return (
          <group key={`mortgage-${pid}`} position={[px, py, pz]}>
            <MortgageOverlay />
            <mesh position={[0, 0.005, 0]}>
              <planeGeometry args={[SPACE * 0.95, SPACE * 0.95]} />
              <meshBasicMaterial color="#000" transparent opacity={0.4} depthWrite={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
