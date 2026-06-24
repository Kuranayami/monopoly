import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import { ContactShadows, SoftShadows } from '@react-three/drei';
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
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[8, 12, 4]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={20}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <pointLight position={[-4, 6, -4]} intensity={0.4} color="#3B82F6" />
      <hemisphereLight args={['#4466aa', '#1a3a1a', 0.3]} />
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

function getPlayerLandedGroup(game) {
  if (!game?.currentTurn) return null;
  const player = game.players?.[game.currentTurn];
  if (!player) return null;
  const space = SPACES?.[player.position];
  return space?.group || null;
}

export default function GameScene({ game, playerId, rolling, dice, animState, cinematicEvent }) {
  const [camPhase, setCamPhase] = useState('idle');
  const [launchDice, setLaunchDice] = useState(false);
  const [landingPos, setLandingPos] = useState(null);

  useEffect(() => {
    if (rolling) {
      setCamPhase('throw');
      setLaunchDice(true);
      setLandingPos(null);
    }
  }, [rolling]);

  useEffect(() => {
    if (dice && dice.length === 2 && !rolling && camPhase === 'throw') {
      const isDoubles = dice[0] === dice[1];
      setCamPhase(isDoubles ? 'doubles' : 'land');
      const player = game?.players?.[game?.currentTurn];
      if (player && !player.isBankrupt) {
        setLandingPos(player.position);
        setTimeout(() => setLandingPos(null), 2000);
      }
      setTimeout(() => {
        setCamPhase('idle');
        setLaunchDice(false);
      }, isDoubles ? 2500 : 1200);
    }
  }, [dice, rolling, camPhase, game]);

  // Speeding detection
  useEffect(() => {
    if (animState?.speedWarning) {
      setCamPhase('speeding');
      setTimeout(() => setCamPhase('idle'), 2000);
    }
  }, [animState?.speedWarning]);

  // Jail cinematic
  useEffect(() => {
    if (cinematicEvent === 'jail') {
      setCamPhase('jail');
      setTimeout(() => setCamPhase('idle'), 1800);
    }
  }, [cinematicEvent]);

  const weather = getWeatherState(game);
  const players = game?.players?.filter(p => !p.isBankrupt) || [];
  const diceLayouts = [0, 1];
  const isDoubles = dice && dice.length === 2 && dice[0] === dice[1] && !rolling;
  const isSpeeding = !!animState?.speedWarning;

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 400, position: 'relative' }}>
      <Canvas shadows camera={{ position: [6, 8, 6], fov: 45 }} dpr={[1, 2]}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      >
        <SoftShadows size={2} samples={8} />
        <Suspense fallback={null}>
          <SceneLights />
          <WeatherSystem weatherState={weather} intensity={weather === 'stormy' ? 1 : 0.5} />

          <Physics gravity={[0, -15, 0]}>
            <Board3D game={game} />
            <BoardCollider />
            <Dice3D diceLayout={diceLayouts[0]} targetValue={dice?.[0]}
              launch={launchDice} isDoubles={isDoubles} isSpeeding={isSpeeding} />
            <Dice3D diceLayout={diceLayouts[1]} targetValue={dice?.[1]}
              launch={launchDice} isDoubles={isDoubles} isSpeeding={isSpeeding} />
          </Physics>

          <GridBloom landingPos={landingPos} group={landingPos !== null ? SPACES[landingPos]?.group : null} />

          <BuildingSystem game={game} animState={animState || {}} />

          {players.map(p => (
            <Token3D key={p.id} player={p} pos={p.position} />
          ))}

          <CinematicEvents cinematicEvent={cinematicEvent} />

          <ContactShadows opacity={0.3} blur={2} far={1} resolution={256} />
          <CameraController phase={camPhase} />
        </Suspense>
      </Canvas>
    </div>
  );
}
