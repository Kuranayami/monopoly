import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';

const DICE_SIZE = 0.38;
const PIP_RADIUS = 0.022;
const PIP_OFFSET = DICE_SIZE * 0.2;
const CORNER_RADIUS = 0.04;

// Pip positions (local 2D) for each face value
// Coordinates range from -1 to +1, scaled by PIP_OFFSET
const PIP_POSITIONS = {
  1: [[0, 0]],
  2: [[-1, -1], [1, 1]],
  3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};

// Face geometry definitions: normal direction, local-x axis, local-y axis
const FACE_DEFS = {
  right: { n: [ 1, 0, 0], lx: [0, 0, 1], ly: [0, 1, 0] },
  left:  { n: [-1, 0, 0], lx: [0, 0,-1], ly: [0, 1, 0] },
  up:    { n: [ 0, 1, 0], lx: [1, 0, 0], ly: [0, 0, 1] },
  down:  { n: [ 0,-1, 0], lx: [1, 0, 0], ly: [0, 0,-1] },
  front: { n: [ 0, 0, 1], lx: [1, 0, 0], ly: [0, 1, 0] },
  back:  { n: [ 0, 0,-1], lx: [-1,0, 0], ly: [0, 1, 0] },
};

const DICE_LAYOUTS = [
  { right: 1, left: 6, up: 2, down: 5, front: 3, back: 4 },
  { right: 2, left: 5, up: 4, down: 3, front: 6, back: 1 },
];
const FACE_ORDER = ['right', 'left', 'up', 'down', 'front', 'back'];

const FACE_ROTATIONS = {
  right: [0, 0, -Math.PI / 2],
  left:  [0, 0,  Math.PI / 2],
  up:    [0, 0, 0],
  down:  [Math.PI, 0, 0],
  front: [-Math.PI / 2, 0, 0],
  back:  [Math.PI / 2, 0, 0],
};

function DicePips({ faceIdx, diceLayout }) {
  const layout = DICE_LAYOUTS[diceLayout] || DICE_LAYOUTS[0];
  const faceName = FACE_ORDER[faceIdx];
  const faceValue = layout[faceName];
  const def = FACE_DEFS[faceName];
  const half = DICE_SIZE / 2;
  const pipDepth = PIP_RADIUS * 0.3;

  const pips = useMemo(() => {
    const localPositions = PIP_POSITIONS[faceValue] || [];
    return localPositions.map(([px, py]) => {
      const offset = [
        def.lx[0] * px * PIP_OFFSET + def.ly[0] * py * PIP_OFFSET,
        def.lx[1] * px * PIP_OFFSET + def.ly[1] * py * PIP_OFFSET,
        def.lx[2] * px * PIP_OFFSET + def.ly[2] * py * PIP_OFFSET,
      ];
      return [
        def.n[0] * half + offset[0] + def.n[0] * pipDepth,
        def.n[1] * half + offset[1] + def.n[1] * pipDepth,
        def.n[2] * half + offset[2] + def.n[2] * pipDepth,
      ];
    });
  }, [faceValue, faceName, diceLayout]);

  return pips.map((pos, i) => (
    <mesh key={i} position={pos}>
      <sphereGeometry args={[PIP_RADIUS, 10, 10]} />
      <meshStandardMaterial color="#CC0000" roughness={0.3} metalness={0.01} />
    </mesh>
  ));
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
  const glowRef = useRef(null);
  const phaseRef = useRef('idle');
  const launchTimeRef = useRef(null);
  const targetValueRef = useRef(targetValue);
  const velRef = useRef(null);

  targetValueRef.current = targetValue;

  const _euler = new THREE.Euler();
  const _quat = new THREE.Quaternion();

  const launchPos = useMemo(() => [diceLayout === 0 ? -0.35 : 0.35, 2.8, diceLayout === 0 ? 3.2 : 2.8], [diceLayout]);

  if (!velRef.current) {
    const dir = diceLayout === 0 ? -1 : 1;
    velRef.current = {
      linvel: {
        x: dir * (1 + Math.random() * 2),
        y: -5 + (Math.random() - 0.5) * 2,
        z: -7 + (Math.random() - 0.5) * 2,
      },
      angvel: {
        x: (Math.random() - 0.5) * 12,
        y: (Math.random() - 0.5) * 12,
        z: dir * (2 + Math.random() * 4),
      },
    };
  }

  useFrame(() => {
    if (!rigidRef.current) return;
    const body = rigidRef.current;

    if (!launch) {
      if (phaseRef.current !== 'idle') {
        phaseRef.current = 'idle';
        launchTimeRef.current = null;
        velRef.current = null;
      }
      glowRef.current && (glowRef.current.material.opacity = 0);
      return;
    }

    if (phaseRef.current === 'idle') {
      phaseRef.current = 'launching';
    }

    if (phaseRef.current === 'launching') {
      if (!velRef.current) return;
      body.setLinvel(velRef.current.linvel);
      body.setAngvel(velRef.current.angvel);
      body.wakeUp();
      launchTimeRef.current = performance.now();
      phaseRef.current = 'flying';
      return;
    }

    if (phaseRef.current === 'flying') {
      if (performance.now() - launchTimeRef.current < 900) return;
      const val = targetValueRef.current;
      if (!val) return;
      const layout = DICE_LAYOUTS[diceLayout] || DICE_LAYOUTS[0];
      let face = 'up';
      for (const [f, v] of Object.entries(layout)) {
        if (v === val) { face = f; break; }
      }
      const rot = FACE_ROTATIONS[face] || [0, 0, 0];
      _euler.set(rot[0], rot[1], rot[2], 'XYZ');
      _quat.setFromEuler(_euler);
      const snapX = diceLayout === 0 ? -0.28 : 0.28;
      body.setTranslation({ x: snapX, y: DICE_SIZE / 2 + 0.02, z: -1.5 });
      body.setRotation({ x: _quat.x, y: _quat.y, z: _quat.z, w: _quat.w });
      body.setLinvel({ x: 0, y: 0, z: 0 });
      body.setAngvel({ x: 0, y: 0, z: 0 });
      body.sleep();
      phaseRef.current = 'snapped';
      return;
    }

    if (phaseRef.current === 'snapped' && glowRef.current) {
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.005);
      glowRef.current.material.opacity = isDoubles ? 0.3 + 0.3 * pulse : isSpeeding ? 0.4 + 0.4 * pulse : 0;
    }
  });

  const faceIndices = useMemo(() => [0, 1, 2, 3, 4, 5], []);

  return (
    <group>
      <mesh ref={glowRef} position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshBasicMaterial
          color={isSpeeding ? '#ff0000' : '#4488ff'}
          transparent opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <RigidBody
        ref={rigidRef}
        colliders="cuboid"
        position={launchPos}
        enabledRotations={[true, true, true]}
        restitution={0.4}
        friction={0.4}
      >
        <RoundedBox args={[DICE_SIZE, DICE_SIZE, DICE_SIZE]} radius={CORNER_RADIUS} bevelSegments={3} smoothness={4} castShadow>
          <meshStandardMaterial color="#F5F0E8" roughness={0.35} metalness={0.02} />
          {faceIndices.map(idx => (
            <DicePips key={idx} faceIdx={idx} diceLayout={diceLayout} />
          ))}
        </RoundedBox>
      </RigidBody>
    </group>
  );
}
