import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Jail bars that slam down
function JailBars({ active }) {
  const barRefs = useRef([]);
  const topRef = useRef(null);
  const bottomRef = useRef(null);
  const vignetteRef = useRef(null);

  useFrame(({ clock }) => {
    if (!active) {
      if (vignetteRef.current) vignetteRef.current.material.opacity = 0;
      return;
    }
    const t = clock.getElapsedTime();
    const progress = Math.min(1, Math.max(0, (t - 0.2) / 0.4));
    const eased = 1 - Math.pow(1 - progress, 3);

    barRefs.current.forEach((bar, i) => {
      if (!bar) return;
      const dir = i % 2 === 0 ? 1 : -1;
      bar.position.y = -1 + (1 + dir * 0.3) * eased;
    });
    if (topRef.current) topRef.current.position.y = -1 + 1.2 * eased;
    if (bottomRef.current) bottomRef.current.position.y = 1 - 1.2 * eased;

    // Vignette darken
    if (vignetteRef.current) {
      vignetteRef.current.material.opacity = Math.min(0.7, progress * 0.7);
    }
  });

  return (
    <group>
      {/* Dark vignette overlay */}
      <mesh ref={vignetteRef} position={[0, 0, -0.1]} renderOrder={999}>
        <planeGeometry args={[12, 12]} />
        <meshBasicMaterial color="#000" transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Bars */}
      {[-0.2, -0.1, 0, 0.1, 0.2].map((x, i) => (
        <mesh key={i} ref={el => barRefs.current[i] = el}
          position={[x, -1, 0.05]}
          renderOrder={998}
        >
          <boxGeometry args={[0.015, 0.7, 0.015]} />
          <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
      {/* Top bar */}
      <mesh ref={topRef} position={[0, -1, 0.05]} renderOrder={998}>
        <boxGeometry args={[0.5, 0.025, 0.02]} />
        <meshStandardMaterial color="#999" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Bottom bar */}
      <mesh ref={bottomRef} position={[0, 1, 0.05]} renderOrder={998}>
        <boxGeometry args={[0.5, 0.025, 0.02]} />
        <meshStandardMaterial color="#999" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

// Bankruptcy shatter particles
function BankruptcyShatter({ active, playerColor = '#ef4444' }) {
  const groupRef = useRef(null);
  const shardsRef = useRef(null);
  const shardPositions = useRef(new Float32Array(60 * 3).fill(0));
  const initialPos = useRef(null);

  useFrame(({ clock }) => {
    if (!groupRef.current || !active) {
      if (groupRef.current) groupRef.current.visible = false;
      return;
    }
    if (initialPos.current === null) initialPos.current = clock.getElapsedTime();
    const t = clock.getElapsedTime() - initialPos.current;
    if (t > 2) { groupRef.current.visible = false; return; }

    groupRef.current.visible = true;
    const progress = t / 1.5;
    if (shardsRef.current) {
      const pos = shardsRef.current.geometry.attributes.position.array;
      for (let i = 0; i < 60; i++) {
        const speed = 0.02 + (i % 5) * 0.01;
        pos[i * 3] += (i % 3 - 1) * speed;
        pos[i * 3 + 1] += speed * 1.5;
        pos[i * 3 + 2] += ((i + 1) % 3 - 1) * speed;
      }
      shardsRef.current.geometry.attributes.position.needsUpdate = true;
      shardsRef.current.material.opacity = Math.max(0, 1 - progress);
    }
  });

  return (
    <group ref={groupRef} visible={false} renderOrder={1000}>
      <points ref={shardsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={60}
            array={new Float32Array(60 * 3).fill(0).map(() => (Math.random() - 0.5) * 0.3)}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color={playerColor}
          size={0.03}
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

// Dust implosion clouds for demolished buildings
function ImplosionCloud({ active, position }) {
  const ref = useRef(null);

  useFrame(({ clock }) => {
    if (!ref.current || !active) return;
    const t = clock.getElapsedTime();
    if (t > 1.5) { ref.current.visible = false; return; }
    ref.current.visible = true;
    const scale = 0.1 + t * 0.8;
    ref.current.scale.set(scale, scale, scale);
    ref.current.material.opacity = Math.max(0, 0.6 - t * 0.4);
  });

  return (
    <mesh ref={ref} position={position} visible={false}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshBasicMaterial color="#aa8866" transparent opacity={0.3} depthWrite={false} />
    </mesh>
  );
}

export default function CinematicEvents({ cinematicEvent }) {
  const isJail = cinematicEvent === 'jail';
  const isBankruptcy = cinematicEvent?.type === 'bankruptcy';

  return (
    <group>
      {isJail && <JailBars active />}
      {isBankruptcy && (
        <group>
          <BankruptcyShatter active playerColor="#ef4444" />
          <ImplosionCloud active position={[0, 0.2, 0]} />
        </group>
      )}
    </group>
  );
}
