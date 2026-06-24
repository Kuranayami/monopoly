import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { SPACES } from 'shared/constants.js';
import Board3D from './Board3D.jsx';
import Dice3D from './Dice3D.jsx';
import Token3D from './Token3D.jsx';
import CameraController from './CameraController.jsx';
import WeatherSystem from './WeatherSystem.jsx';
import GridBloom from './GridBloom.jsx';
import BuildingSystem from './Building3D.jsx';
import CinematicEvents from './CinematicEvents.jsx';

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[8, 10, 6]} intensity={1.8}
        castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-far={25} shadow-camera-left={-8} shadow-camera-right={8}
        shadow-camera-top={8} shadow-camera-bottom={-8} />
      <directionalLight position={[-6, 4, -4]} intensity={0.6} color="#4488ff" />
      <directionalLight position={[0, 2, -8]} intensity={0.4} color="#ff8844" />
      <hemisphereLight args={['#88bbff', '#2a4a2a', 0.4]} />
    </>
  );
}

function BoardCollider() {
  return (
    <RigidBody type="fixed" position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <CuboidCollider args={[6, 0.01, 6]} />
    </RigidBody>
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

export default function GameScene({ game, playerId, rolling, dice, animState, cinematicEvent, visualPositions = {} }) {
  const [camPhase, setCamPhase] = useState('idle');
  const [launchDice, setLaunchDice] = useState(false);
  const [landingPos, setLandingPos] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => { setInitialized(true); }, []);

  useEffect(() => {
    if (rolling) { setCamPhase('throw'); setLaunchDice(true); setLandingPos(null); }
  }, [rolling]);

  useEffect(() => {
    if (dice && dice.length === 2 && !rolling && camPhase === 'throw') {
      const isDbl = dice[0] === dice[1];
      setCamPhase(isDbl ? 'doubles' : 'land');
      const p = game?.players?.[game?.currentTurn];
      if (p && !p.isBankrupt) { setLandingPos(p.position); setTimeout(() => setLandingPos(null), 2000); }
      setTimeout(() => { setCamPhase('idle'); setLaunchDice(false); }, isDbl ? 2500 : 1200);
    }
  }, [dice, rolling, camPhase, game]);

  useEffect(() => {
    if (animState?.speedWarning) { setCamPhase('speeding'); setTimeout(() => setCamPhase('idle'), 2000); }
  }, [animState?.speedWarning]);

  useEffect(() => {
    if (cinematicEvent === 'jail') { setCamPhase('jail'); setTimeout(() => setCamPhase('idle'), 1800); }
  }, [cinematicEvent]);

  const weather = getWeatherState(game);
  const players = game?.players?.filter(p => !p.isBankrupt) || [];
  const isDoubles = dice && dice.length === 2 && dice[0] === dice[1] && !rolling;
  const isSpeeding = !!animState?.speedWarning;

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 400, position: 'relative' }}>
      <Canvas shadows camera={{ position: [5, 7, 7], fov: 40 }} dpr={[1, 2]}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      >
        <Suspense fallback={null}>
          <SceneLights />
          <WeatherSystem weatherState={weather} intensity={weather === 'stormy' ? 1 : 0.5} />

          <Physics gravity={[0, -15, 0]}>
            <Board3D game={game} />
            <BoardCollider />
            <Dice3D diceLayout={0} targetValue={dice?.[0]}
              launch={launchDice} isDoubles={isDoubles} isSpeeding={isSpeeding} />
            <Dice3D diceLayout={1} targetValue={dice?.[1]}
              launch={launchDice} isDoubles={isDoubles} isSpeeding={isSpeeding} />
          </Physics>

          <GridBloom landingPos={landingPos} group={landingPos !== null ? SPACES[landingPos]?.group : null} />
          <BuildingSystem game={game} animState={animState || {}} />

          {players.map(p => (
            <Token3D key={p.id} player={p} pos={visualPositions[p.id] ?? p.position} />
          ))}

          <CinematicEvents cinematicEvent={cinematicEvent} />
          <ContactShadows opacity={0.3} blur={2} far={1} resolution={256} />
          <CameraController phase={camPhase} />
        </Suspense>
      </Canvas>
    </div>
  );
}
