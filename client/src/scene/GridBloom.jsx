import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SPACES, GRID_POSITIONS } from 'shared/constants.js';
import { posToWorld } from './boardLayout.js';

function getGroupColor(group) {
  const colors = {
    dark_blue: '#1a237e', green: '#1b5e20', yellow: '#f9a825',
    red: '#c62828', orange: '#e65100', pink: '#880e4f',
    light_blue: '#81d4fa', brown: '#795548',
    railroad: '#37474f', utility: '#455a64',
  };
  return colors[group] || '#3B82F6';
}

// Single ripple ring that expands and fades
function RippleRing({ color = '#3B82F6', delay = 0, onEnd }) {
  const ref = useRef(null);
  const startTime = useRef(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    if (startTime.current === null) startTime.current = clock.getElapsedTime();
    const t = clock.getElapsedTime() - startTime.current;
    if (t < delay) return;

    const progress = Math.min(1, (t - delay) / 1.5);
    const scale = 0.1 + progress * 2;
    const opacity = 1 - progress;

    ref.current.scale.set(scale, scale, scale);
    ref.current.material.opacity = opacity * 0.4;

    if (progress >= 1) onEnd?.();
  });

  return (
    <mesh ref={ref} position={[0, 0.02, 0]}>
      <ringGeometry args={[0.02, 0.05, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

export default function GridBloom({ landingPos, group }) {
  const color = getGroupColor(group);

  if (landingPos === null || landingPos === undefined) return null;
  const [px, py, pz] = posToWorld(landingPos);

  const groupSpaces = GRID_POSITIONS.filter(({ pos }) => {
    const s = SPACES[pos];
    return s?.group === group && s?.type === 'property';
  });

  return (
    <group position={[px, py, pz]}>
      {[0, 1, 2].map(i => (
        <RippleRing key={i} color={color} delay={i * 0.15} />
      ))}
      {/* Group highlight flashes */}
      {groupSpaces.map(({ pos }) => (
        <GridHighlight key={pos} pos={pos} color={color} delay={0.3} />
      ))}
    </group>
  );
}

function GridHighlight({ pos, color, delay }) {
  const ref = useRef(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const progress = Math.min(1, Math.max(0, (t - delay) / 0.8));
    const opacity = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
    ref.current.material.opacity = opacity * 0.3;
  });

  const [px, py, pz] = posToWorld(pos);

  return (
    <mesh ref={ref} position={[px, 0.01, pz]}>
      <planeGeometry args={[gw * 0.8, gw * 0.8]} />
      <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}
