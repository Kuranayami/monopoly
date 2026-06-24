import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const DEFAULT_POS = new THREE.Vector3(5, 7, 7);
const THROW_POS = new THREE.Vector3(0, 2.5, 4);
const LAND_POS = new THREE.Vector3(0, 6, 0.01);
const DOUBLES_POS = new THREE.Vector3(0, 3, 2);
const SPEEDING_POS = new THREE.Vector3(0, 8, 0);
const JAIL_POS = new THREE.Vector3(0, 2, 4);

export default function CameraController({ phase }) {
  const { camera } = useThree();
  const s = useRef({ progress: 1, fromPos: DEFAULT_POS.clone(), toPos: DEFAULT_POS.clone() });
  const initialized = useRef(false);
  const orbitRef = useRef(0);
  const speedOrbitRef = useRef(0);

  if (!initialized.current) {
    camera.position.copy(DEFAULT_POS);
    camera.lookAt(0, 0, 0);
    initialized.current = true;
  }

  useEffect(() => {
    const target = (() => {
      switch (phase) {
        case 'throw': return THROW_POS;
        case 'land': return LAND_POS;
        case 'doubles': return DOUBLES_POS;
        case 'speeding': return SPEEDING_POS;
        case 'jail': return JAIL_POS;
        default: return DEFAULT_POS;
      }
    })();
    s.current.fromPos.copy(camera.position);
    s.current.toPos.copy(target);
    s.current.progress = 0;
    if (phase === 'speeding') speedOrbitRef.current = 0;
  }, [phase, camera]);

  useFrame((_, delta) => {
    if (phase === 'speeding') {
      speedOrbitRef.current += delta * 2.5;
      const r = 5;
      const angle = speedOrbitRef.current;
      camera.position.x = r * Math.sin(angle);
      camera.position.z = r * Math.cos(angle);
      camera.position.y = 3 + Math.sin(angle * 2) * 0.5;
      camera.lookAt(0, 0, 0);
      return;
    }

    if (phase === 'doubles' && s.current.progress >= 1) {
      orbitRef.current += delta * 0.3;
      const r = 4;
      const angle = orbitRef.current;
      camera.position.x = s.current.toPos.x + r * Math.sin(angle) * 0.5;
      camera.position.z = s.current.toPos.z + r * Math.cos(angle) * 0.5;
      camera.lookAt(0, 0.1, 0);
      return;
    }

    if (s.current.progress >= 1) return;
    s.current.progress = Math.min(1, s.current.progress + delta * 1.5);
    const t = easeInOutCubic(s.current.progress);
    camera.position.lerpVectors(s.current.fromPos, s.current.toPos, t);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
