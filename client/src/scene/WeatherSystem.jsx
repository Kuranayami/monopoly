import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const RAIN_COUNT = 2000;
const RAIN_AREA = 12;

function RainParticles({ intensity = 1 }) {
  const meshRef = useRef(null);
  const positions = useMemo(() => {
    const pos = new Float32Array(RAIN_COUNT * 3);
    for (let i = 0; i < RAIN_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * RAIN_AREA;
      pos[i * 3 + 1] = Math.random() * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * RAIN_AREA;
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const pos = meshRef.current.geometry.attributes.position.array;
    const speed = 4 * intensity;
    for (let i = 0; i < RAIN_COUNT; i++) {
      pos[i * 3 + 1] -= speed * delta;
      pos[i * 3] -= speed * 0.3 * delta;
      if (pos[i * 3 + 1] < -1) {
        pos[i * 3 + 1] = 7 + Math.random();
        pos[i * 3] = (Math.random() - 0.5) * RAIN_AREA;
        pos[i * 3 + 2] = (Math.random() - 0.5) * RAIN_AREA;
      }
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={RAIN_COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#88bbff"
        size={0.04}
        transparent
        opacity={0.4 * intensity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function CloudMesh({ delay = 0, speed = 0.5 }) {
  const ref = useRef(null);
  const startX = useMemo(() => (Math.random() - 0.5) * 15, []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.position.x += speed * delta;
    if (ref.current.position.x > 10) ref.current.position.x = -10;
  });

  return (
    <group ref={ref} position={[startX, 2 + Math.random() * 2, (Math.random() - 0.5) * 6]} scale={[1 + Math.random(), 0.5 + Math.random() * 0.5, 1]}>
      <mesh>
        <sphereGeometry args={[0.6, 7, 7]} />
        <meshStandardMaterial color="#888" transparent opacity={0.35} roughness={1} metalness={0} />
      </mesh>
      <mesh position={[0.5, -0.2, 0]}>
        <sphereGeometry args={[0.5, 7, 7]} />
        <meshStandardMaterial color="#999" transparent opacity={0.3} roughness={1} metalness={0} />
      </mesh>
      <mesh position={[-0.4, -0.1, 0.2]}>
        <sphereGeometry args={[0.4, 7, 7]} />
        <meshStandardMaterial color="#777" transparent opacity={0.25} roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}

function LightningFlash({ active }) {
  const ref = useRef(null);
  const flashRef = useRef(0);

  useFrame((_, delta) => {
    if (!ref.current || !active) {
      if (ref.current) ref.current.material.opacity = 0;
      return;
    }
    flashRef.current += delta;
    if (flashRef.current > 0.1) {
      flashRef.current = 0;
      if (Math.random() > 0.995) {
        ref.current.material.opacity = 0.6;
        setTimeout(() => {
          if (ref.current) ref.current.material.opacity = 0;
        }, 100);
      }
    }
  });

  return (
    <mesh ref={ref} position={[0, 4, 0]}>
      <planeGeometry args={[14, 14]} />
      <meshBasicMaterial color="#ccddff" transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

export default function WeatherSystem({ weatherState = 'clear', intensity = 1 }) {
  const isStormy = weatherState === 'stormy';
  const isCloudy = weatherState === 'cloudy';
  const hasRain = isStormy;
  const hasLightning = isStormy;
  const cloudsVisible = isCloudy || isStormy;

  return (
    <group>
      {hasRain && <RainParticles intensity={intensity} />}
      {hasLightning && <LightningFlash active />}
      {cloudsVisible && (
        <>
          {[0, 1, 2, 3].map(i => (
            <CloudMesh key={i} delay={i * 3} speed={0.3 + i * 0.1} />
          ))}
        </>
      )}
    </group>
  );
}
