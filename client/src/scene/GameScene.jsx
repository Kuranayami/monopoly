import { Suspense, useState, useEffect, useRef, Component } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { BOARD, CORNER } from './boardLayout.js';
import Board3D from './Board3D.jsx';
import Token3D from './Token3D.jsx';
import CameraController from './CameraController.jsx';
import WeatherSystem from './WeatherSystem.jsx';
import GridBloom from './GridBloom.jsx';
import BuildingSystem from './Building3D.jsx';
import CinematicEvents from './CinematicEvents.jsx';

// Error boundary to suppress R3F reconciler crash (#310) during WebGL context loss
class SceneErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    const known = error?.message?.includes('310') || error?.message?.includes('Node cannot be found');
    if (known) {
      this.setState({ hasError: false });
    }
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

// Warm ambient dust motes floating above the board
function BoardParticles() {
  const ref = useRef(null);
  const count = 120;
  const pos = useRef(new Float32Array(count * 3).fill(0).map(() => (Math.random() - 0.5) * 11));

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const arr = ref.current.geometry.attributes.position.array;
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] = 0.1 + 0.5 * (0.5 + 0.5 * Math.sin(t * 0.3 + i * 0.7));
      arr[i * 3] += 0.001 * Math.sin(t * 0.5 + i);
      arr[i * 3 + 2] += 0.001 * Math.cos(t * 0.4 + i * 0.3);
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={pos.current} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#FFD700" size={0.015} transparent opacity={0.2}
        blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 7]} intensity={1.0}
        castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024}
        shadow-camera-far={20} shadow-camera-left={-6} shadow-camera-right={6}
        shadow-camera-top={6} shadow-camera-bottom={-6} color="#FFE4B5" />
      <directionalLight position={[-4, 6, -2]} intensity={0.4} color="#FFDAB9" />
      <directionalLight position={[2, 4, -6]} intensity={0.2} color="#E0F0FF" />
      <hemisphereLight args={['#FFF5E6', '#1a3a1a', 0.3]} />
    </>
  );
}

function BoardCollider() {
  return (
    <RigidBody type="fixed" position={[0, -0.04, 0]}>
      <CuboidCollider args={[5.5, 0.02, 5.5]} />
    </RigidBody>
  );
}

const _pos = (BOARD - 2 * CORNER) * 0.22;

function CardDeckColliders() {
  return (
    <group>
      <RigidBody type="fixed" position={[-_pos, 0.03, -_pos]}>
        <CuboidCollider args={[0.65, 0.03, 0.475]} rotation={[0, Math.PI / 4, 0]} />
      </RigidBody>
      <RigidBody type="fixed" position={[_pos, 0.03, _pos]}>
        <CuboidCollider args={[0.65, 0.03, 0.475]} rotation={[0, Math.PI / 4, 0]} />
      </RigidBody>
    </group>
  );
}

function getWeatherState(game) {
  if (!game) return 'clear';
  const hasDebt = game.players?.some(p => p.owes > 0);
  const bankruptCount = game.players?.filter(p => p.isBankrupt).length || 0;
  const totalHotels = game.players?.reduce((s, p) => s + Object.keys(p.hotels || {}).length, 0) || 0;
  if (hasDebt || bankruptCount > 0) return 'stormy';
  if (totalHotels > 0) return 'cloudy';
  return 'clear';
}

export default function GameScene({ game, playerId, animState, cinematicEvent, visualPositions = {} }) {
  const controlsRef = useRef(null);
  const canvasRef = useRef(null);
  const [camPhase, setCamPhase] = useState('idle');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => { setInitialized(true); }, []);

  useEffect(() => {
    if (animState?.speedWarning) { setCamPhase('speeding'); setTimeout(() => setCamPhase('idle'), 2000); }
  }, [animState?.speedWarning]);

  useEffect(() => {
    if (cinematicEvent === 'jail') { setCamPhase('jail'); setTimeout(() => setCamPhase('idle'), 1800); }
  }, [cinematicEvent]);

  const weather = getWeatherState(game);
  const players = game?.players?.filter(p => !p.isBankrupt) || [];

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 400, position: 'relative' }}>
      <SceneErrorBoundary>
      <Canvas shadows={{ type: THREE.PCFShadowMap }} camera={{ position: [0, 10, 9], fov: 50 }} dpr={[1, 2]}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          canvasRef.current = gl.domElement;
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            // Schedule restore to prevent R3F reconciler from crashing
            setTimeout(() => {
              try { gl.forceContextRestore?.(); } catch (_) {}
            }, 100);
          });
        }}
        onError={(e) => {
          // Suppress R3F reconciler errors during context loss recovery
          if (e?.message?.includes('Node cannot be found') || e?.message?.includes('310')) return;
        }}
      >
        <Suspense fallback={null}>
          <SceneLights />
          <WeatherSystem weatherState={weather} intensity={weather === 'stormy' ? 1 : 0.5} />

          <Physics gravity={[0, -15, 0]}>
            <Board3D game={game} />
            <BoardCollider />
            <CardDeckColliders />
          </Physics>

          <GridBloom />
          <BuildingSystem game={game} animState={animState || {}} />
          <BoardParticles />

          {players.map(p => (
            <Token3D key={p.id} player={p} pos={visualPositions[p.id] ?? p.position} />
          ))}

          <CinematicEvents cinematicEvent={cinematicEvent} />
          <ContactShadows opacity={0.25} blur={10} far={2} resolution={1024} />
          <CameraController phase={camPhase} controlsRef={controlsRef} />
          <OrbitControls ref={controlsRef} enablePan={true} enableZoom={true}
            minDistance={4} maxDistance={18}
            maxPolarAngle={Math.PI / 3}
            target={[0, 0, 0]} />
        </Suspense>
      </Canvas>
      </SceneErrorBoundary>
    </div>
  );
}
