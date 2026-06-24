import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';

const DICE_SIZE = 0.3;

function createFaceTexture(dots) {
  const s = 64;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = '#1a1a2e';
  const r = s * 0.08;
  const dotPositions = {
    1: [[0, 0]], 2: [[-0.3, -0.3], [0.3, 0.3]],
    3: [[-0.3, -0.3], [0, 0], [0.3, 0.3]],
    4: [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]],
    5: [[-0.3, -0.3], [0.3, -0.3], [0, 0], [-0.3, 0.3], [0.3, 0.3]],
    6: [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0], [0.3, 0], [-0.3, 0.3], [0.3, 0.3]],
  };
  (dotPositions[dots] || []).forEach(([dx, dy]) => {
    ctx.beginPath(); ctx.arc(s / 2 + dx * s * 0.3, s / 2 + dy * s * 0.3, r, 0, Math.PI * 2); ctx.fill();
  });
  return new THREE.CanvasTexture(c);
}

const faceMaterials = {};
[1, 2, 3, 4, 5, 6].forEach(n => {
  const tex = createFaceTexture(n);
  tex.needsUpdate = true;
  faceMaterials[n] = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.2, metalness: 0.1 });
});

const DICE_LAYOUTS = [
  { right: 1, left: 6, up: 2, down: 5, front: 3, back: 4 },
  { right: 2, left: 5, up: 4, down: 3, front: 6, back: 1 },
];
const FACE_ORDER = ['right', 'left', 'up', 'down', 'front', 'back'];

function getMaterials(layoutIdx) {
  const l = DICE_LAYOUTS[layoutIdx] || DICE_LAYOUTS[0];
  return FACE_ORDER.map(face => faceMaterials[l[face]]);
}

// Light trail particles
function DiceLightTrail({ position, active }) {
  const trailRef = useRef(null);
  const particles = useMemo(() => {
    const pos = new Float32Array(20 * 3);
    for (let i = 0; i < 20; i++) {
      pos[i * 3] = position[0] + (Math.random() - 0.5) * 0.1;
      pos[i * 3 + 1] = position[1] + (Math.random() - 0.5) * 0.1;
      pos[i * 3 + 2] = position[2] + (Math.random() - 0.5) * 0.1;
    }
    return pos;
  }, []);

  useFrame(() => {
    if (!trailRef.current || !active) return;
    const pos = trailRef.current.geometry.attributes.position.array;
    for (let i = 0; i < 20; i++) {
      pos[i * 3] += (Math.random() - 0.5) * 0.05;
      pos[i * 3 + 1] += (Math.random() - 0.5) * 0.05 + 0.02;
      pos[i * 3 + 2] += (Math.random() - 0.5) * 0.05;
    }
    trailRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={trailRef} position={position}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={20} array={particles} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#88bbff" size={0.03} transparent opacity={active ? 0.6 : 0}
        blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

export default function Dice3D({ diceLayout = 0, targetValue, launch, isDoubles, isSpeeding }) {
  const rigidRef = useRef(null);
  const launchedRef = useRef(false);
  const snappedRef = useRef(false);
  const glowRef = useRef(null);

  useEffect(() => {
    if (!launch || launchedRef.current || !rigidRef.current) return;
    launchedRef.current = true;
    snappedRef.current = false;
    const body = rigidRef.current;
    const spinX = (Math.random() - 0.5) * 12;
    const spinY = (Math.random() - 0.5) * 12;
    const spinZ = (Math.random() - 0.5) * 12;
    body.setTranslation({ x: 0, y: 2.5, z: 3 });
    body.setLinvel({
      x: (Math.random() - 0.5) * 4,
      y: -5 + (Math.random() - 0.5) * 2,
      z: -7 + (Math.random() - 0.5) * 2,
    });
    body.setAngvel({ x: spinX, y: spinY, z: spinZ });
  }, [launch]);

  useEffect(() => {
    if (!targetValue || !rigidRef.current || !launchedRef.current) return;
    snappedRef.current = true;
    setTimeout(() => {
      if (rigidRef.current) {
        rigidRef.current.setTranslation({ x: 0, y: 0.15, z: -1.5 });
        rigidRef.current.setRotation({ x: 0, y: 0, z: 0 });
        rigidRef.current.setLinvel({ x: 0, y: 0, z: 0 });
        rigidRef.current.setAngvel({ x: 0, y: 0, z: 0 });
      }
    }, 900);
  }, [targetValue]);

  useFrame((_, delta) => {
    if (glowRef.current) {
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.005);
      glowRef.current.material.opacity = isDoubles ? 0.3 + 0.3 * pulse : isSpeeding ? 0.4 + 0.4 * pulse : 0;
    }
  });

  const materials = useMemo(() => getMaterials(diceLayout), [diceLayout]);

  return (
    <group>
      {/* Doubles / speeding glow aura */}
      <mesh ref={glowRef} position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshBasicMaterial
          color={isSpeeding ? '#ff0000' : '#4488ff'}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <RigidBody
        ref={rigidRef}
        colliders="cuboid"
        position={[0, 0, 0]}
        enabledRotations={[true, true, true]}
        restitution={0.4}
        friction={0.4}
      >
        <mesh castShadow materials={materials}>
          <boxGeometry args={[DICE_SIZE, DICE_SIZE, DICE_SIZE]} />
        </mesh>
      </RigidBody>
    </group>
  );
}
