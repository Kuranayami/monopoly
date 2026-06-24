import { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text } from '../elements.jsx';
import { SPACES, GRID_POSITIONS, GRID_SIZE } from 'shared/constants.js';

const TOKEN_ICONS = {
  top_hat: '\u{1F3A9}', car: '\u{1F697}', dog: '\u{1F436}',
  iron: '\u{1F527}', battleship: '\u{1F6A2}', thimble: '\u{1F9F5}',
};

const TOKEN_IDLE_ANIMS = {
  top_hat: 'token-idle-top-hat 3s ease-in-out infinite',
  car: 'token-idle-car 2s ease-in-out infinite',
  dog: 'token-idle-dog 2.5s ease-in-out infinite',
  battleship: 'token-idle-battleship 3.5s ease-in-out infinite',
  iron: 'token-idle-iron 4s ease-in-out infinite',
  thimble: 'token-idle-thimble 2s ease-in-out infinite',
};

const HIGH_VALUE_GROUPS = ['dark_blue', 'green', 'yellow'];
const LOW_VALUE_GROUPS = ['brown', 'light_blue'];
const INDUSTRIAL_GROUPS = ['railroad', 'utility'];

const DICE_FACES = ['', '\u2680', '\u2681', '\u2682', '\u2683', '\u2684', '\u2685'];

export default function Board({ game, playerId, cellSize = 72, dice, rolling, animState, visualPositions = {} }) {
  const [displayDice, setDisplayDice] = useState(null);
  const [landedPos, setLandedPos] = useState(null);
  const [shakeBoard, setShakeBoard] = useState(false);
  const intervalRef = useRef(null);
  const prevDiceRef = useRef(null);
  const prevPositionsRef = useRef({});

  const boardPx = cellSize * GRID_SIZE;

  // Weather state derived from game state
  const weatherState = useMemo(() => {
    const hasDebt = game?.players?.some(p => p.owes > 0);
    const bankruptCount = game?.players?.filter(p => p.isBankrupt).length;
    const totalHotels = game?.players?.reduce((sum, p) =>
      sum + Object.keys(p.hotels || {}).length, 0) || 0;
    const totalHouses = game?.players?.reduce((sum, p) =>
      Object.values(p.houses || {}).reduce((a, b) => a + b, 0) + sum, 0) || 0;

    return {
      isStormy: hasDebt || bankruptCount > 0,
      isCloudy: totalHotels > 0 || totalHouses > 4,
      isClear: !hasDebt && bankruptCount === 0 && totalHotels === 0,
    };
  }, [game]);

  // Grid bloom when dice land
  useEffect(() => {
    if (!rolling && dice && dice.length === 2 && prevDiceRef.current === null) {
      const player = game?.players?.[game?.currentTurn];
      if (player && !player.isBankrupt) {
        setLandedPos(player.position);
        setTimeout(() => setLandedPos(null), 1500);
      }
    }
    prevDiceRef.current = rolling ? 'rolling' : (dice ? 'done' : null);
  }, [rolling, dice, game]);

  // Camera shake on doubles / speeding / jail events
  useEffect(() => {
    if (animState?.speedWarning || animState?.jailDrop) {
      setShakeBoard(true);
      setTimeout(() => setShakeBoard(false), 800);
    }
  }, [animState?.speedWarning, animState?.jailDrop]);

  // Dice face animation
  useEffect(() => {
    if (rolling) {
      setDisplayDice(null);
      intervalRef.current = setInterval(() => {
        setDisplayDice([
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
        ]);
      }, 80);
    } else {
      clearInterval(intervalRef.current);
      if (dice && dice.length === 2) {
        setDisplayDice(dice);
      }
    }
    return () => clearInterval(intervalRef.current);
  }, [rolling, dice]);

  // Track token positions for movement animation
  const tokenAnims = useMemo(() => {
    const anims = {};
    game?.players?.forEach(p => {
      if (p.isBankrupt) return;
      if (visualPositions[p.id] !== undefined) return; // visual stepping active, skip CSS
      const prevPos = prevPositionsRef.current[p.id];
      if (prevPos !== undefined && prevPos !== p.position) {
        anims[p.id] = 'token-wind-up 0.3s ease, token-dash 0.4s ease 0.3s, token-impact 0.3s ease 0.7s';
      }
      prevPositionsRef.current[p.id] = p.position;
    });
    return anims;
  }, [game?.players?.map(p => `${p.id}:${p.position}`).join(','), visualPositions]);

  const getTokens = (pos) =>
    game?.players?.filter(p => !p.isBankrupt && (visualPositions[p.id] ?? p.position) === pos) || [];

  const isCorner = (gx, gy) =>
    (gx === 0 && gy === 0) || (gx === 0 && gy === 10) ||
    (gx === 10 && gy === 0) || (gx === 10 && gy === 10);

  const nameFs = Math.max(8, Math.floor(cellSize * 0.12));
  const priceFs = Math.max(7, Math.floor(cellSize * 0.09));
  const cornerFs = Math.max(10, Math.floor(cellSize * 0.16));
  const barH = Math.max(4, Math.floor(cellSize * 0.07));
  const tokenSize = Math.max(18, Math.floor(cellSize * 0.18));

  // Determine space texture style based on group
  const getSpaceStyle = (space, pos) => {
    if (!space) return {};
    const hasOwner = game?.players?.some(p => p.properties.includes(pos) && !p.isBankrupt);
    const isMortgaged = game?.players?.some(p => p.mortgaged?.includes(pos));
    const isLanded = landedPos === pos;

    let bg = 'transparent';
    let boxShadow = 'none';
    let neonGlow = 'none';

    if (space.color && space.type === 'property') {
      if (HIGH_VALUE_GROUPS.includes(space.group)) {
        bg = `linear-gradient(135deg, ${space.color}15, ${space.color}05)`;
        neonGlow = `0 0 8px ${space.color}40, inset 0 0 8px ${space.color}20`;
      } else if (LOW_VALUE_GROUPS.includes(space.group)) {
        bg = `linear-gradient(135deg, ${space.color}10, rgba(80,80,80,0.1))`;
      } else {
        bg = `${space.color}08`;
      }
    } else if (INDUSTRIAL_GROUPS.includes(space?.group)) {
      bg = 'linear-gradient(135deg, rgba(100,100,100,0.15), rgba(60,60,60,0.1))';
    }

    if (isLanded) {
      boxShadow = 'grid-ripple 1.5s ease-out';
    }
    if (isMortgaged) {
      bg = 'linear-gradient(135deg, rgba(50,50,50,0.3), rgba(30,30,30,0.2))';
    }

    return { background: bg, boxShadow, neonGlow, isMortgaged };
  };

  // Render weather overlay
  const renderWeather = () => {
    const drops = [];
    if (weatherState.isStormy) {
      for (let i = 0; i < 30; i++) {
        const delay = Math.random() * 3;
        const left = Math.random() * 100;
        const duration = 1 + Math.random() * 1.5;
        drops.push(
          <View key={`rain-${i}`} style={{
            position: 'absolute', left: `${left}%`, top: 0,
            width: 1.5, height: 12 + Math.random() * 8,
            background: 'linear-gradient(to bottom, transparent, rgba(100,150,255,0.5))',
            animation: `rain-drop ${duration}s linear ${delay}s infinite`,
            pointerEvents: 'none', zIndex: 20,
          }} />
        );
      }
    }
    if (weatherState.isStormy) {
      drops.push(
        <View key="lightning" style={{
          position: 'absolute', inset: 0,
          background: 'rgba(200,220,255,0.15)',
          animation: 'lightning-flash 6s ease-in-out infinite',
          pointerEvents: 'none', zIndex: 21,
        }} />
      );
    }
    if (weatherState.isCloudy && !weatherState.isStormy) {
      for (let i = 0; i < 3; i++) {
        const delay = i * 4 + Math.random() * 2;
        const top = 5 + Math.random() * 20;
        drops.push(
          <View key={`cloud-${i}`} style={{
            position: 'absolute', left: 0, top: `${top}%`,
            width: 60 + Math.random() * 80, height: 20 + Math.random() * 15,
            background: 'radial-gradient(ellipse, rgba(150,150,160,0.2), transparent)',
            borderRadius: '50%',
            animation: `cloudy-drift ${12 + Math.random() * 8}s linear ${delay}s infinite`,
            pointerEvents: 'none', zIndex: 19,
          }} />
        );
      }
    }
    return drops;
  };

  return (
    <View style={{
      position: 'relative', width: boardPx, height: boardPx,
      background: '#1E1E1E', borderRadius: 8,
      border: '2px solid rgba(59,130,246,0.2)',
      animation: shakeBoard ? 'camera-shake 0.5s ease' : 'none',
      overflow: 'hidden',
    }}>
      {/* Weather overlay */}
      {renderWeather()}

      {GRID_POSITIONS.map(({ pos, x, y }) => {
        const space = SPACES[pos];
        const corner = isCorner(x, y);
        const tokens = getTokens(pos);
        const owner = game?.players?.find(p => p.properties.includes(pos) && !p.isBankrupt);
        const houses = owner?.houses?.[pos] || 0;
        const hasHotel = owner?.hotels?.[pos] || false;
        const spaceStyle = getSpaceStyle(space, pos);
        const isMortgaged = spaceStyle.isMortgaged;
        const hasMultipleTokens = tokens.length > 1;

        return (
          <View key={pos} style={{
            position: 'absolute',
            left: x * cellSize, top: y * cellSize,
            width: cellSize, height: cellSize,
            background: spaceStyle.background,
            border: '1px solid rgba(255,255,255,0.04)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center',
            justifyContent: corner ? 'center' : 'flex-start',
            padding: corner ? 4 : '2px 2px 2px 2px',
            overflow: 'hidden',
            transition: 'box-shadow 0.3s ease, filter 0.5s ease',
            filter: isMortgaged ? 'grayscale(1) brightness(0.6)' : 'none',
            boxShadow: spaceStyle.neonGlow !== 'none' ? spaceStyle.neonGlow : undefined,
            animation: landedPos === pos ? 'grid-ripple 1.5s ease-out, grid-energy 0.8s ease-out' : 'none',
          }}>
            {space && !corner && (
              <>
                {space.color && space.type === 'property' && (
                  <View style={{
                    width: '100%', height: barH, background: isMortgaged ? '#555' : space.color,
                    flexShrink: 0,
                    transition: 'background 0.5s ease',
                  }} />
                )}
                <Text style={{
                  fontSize: nameFs,
                  color: isMortgaged ? '#666' : '#F0F0F0',
                  textAlign: 'center', lineHeight: 1.15, padding: '0 2px',
                  marginTop: 2, width: '100%',
                  wordBreak: 'break-word',
                  transition: 'color 0.5s ease',
                }}>
                  {space.name}
                </Text>
                {space.price > 0 && (
                  <Text style={{
                    fontSize: priceFs, color: isMortgaged ? '#555' : '#3B82F6',
                    textAlign: 'center', lineHeight: 1.1, marginTop: 1,
                    transition: 'color 0.5s ease',
                  }}>
                    ${space.price}
                  </Text>
                )}
                {owner && !isMortgaged && (
                  <Text style={{
                    fontSize: Math.max(6, priceFs - 1), color: '#A0A0A0',
                    textAlign: 'center', lineHeight: 1.1, marginTop: 1,
                  }}>
                    {owner.name}
                  </Text>
                )}
                {isMortgaged && (
                  <View style={{
                    position: 'absolute', inset: 0,
                    border: '2px solid rgba(255,50,50,0.3)',
                    borderRadius: 2, pointerEvents: 'none',
                    animation: 'mortgage-barricade 0.5s ease-out',
                  }} />
                )}
                {(hasHotel || houses > 0) && !isMortgaged && (
                  <View style={{
                    animation: hasHotel ? 'hotel-rise 0.8s ease-out' : houses > (prevPositionsRef.current[pos]?.houses || 0) ? 'house-construct 0.6s ease-out' : 'none',
                  }}>
                    <Text style={{
                      fontSize: Math.max(8, cellSize * 0.09), lineHeight: 1.2, marginTop: 1,
                      color: '#3B82F6',
                    }}>
                      {hasHotel ? '\u{1F3E8}' : '\u{1F3E0}'.repeat(houses)}
                    </Text>
                  </View>
                )}
              </>
            )}
            {corner && space && (
              <Text style={{
                fontSize: cornerFs, fontWeight: 700,
                color: landedPos === pos ? '#60A5FA' : '#3B82F6',
                textAlign: 'center', lineHeight: 1.2,
                transition: 'color 0.3s ease',
                animation: landedPos === pos ? 'pulse-energy 1s ease-in-out' : 'none',
              }}>
                {space.name}
              </Text>
            )}
            {tokens.length > 0 && (
              <View style={{
                display: 'flex', flexDirection: 'row', flexWrap: 'wrap',
                gap: 2, justifyContent: 'center', marginTop: 'auto', marginBottom: 2,
              }}>
                {tokens.map((p, i) => (
                  <Text key={i} style={{
                    fontSize: tokenSize + 2,
                    lineHeight: 1.2,
                    filter: p.id === playerId ? 'drop-shadow(0 0 3px rgba(59,130,246,0.8))' : 'none',
                    animation: hasMultipleTokens ? 'token-collision 0.6s ease' : `${visualPositions[p.id] !== undefined ? 'token-hop 0.3s ease' : tokenAnims[p.id] || ''}, ${TOKEN_IDLE_ANIMS[p.token] || 'none'}`,
                    transition: 'transform 0.4s ease',
                  }}>
                    {TOKEN_ICONS[p.token] || '\u{1F3B1}'}
                  </Text>
                ))}
              </View>
            )}
            {/* Construction particles */}
            {animState?.buildingSpaceId === pos && (
              <>
                {[0,1,2,3].map(i => (
                  <View key={`dust-${i}`} style={{
                    position: 'absolute', left: `${20 + i * 20}%`, top: '50%',
                    width: 3 + i, height: 3 + i,
                    background: '#3B82F6', borderRadius: '50%',
                    opacity: 0.8,
                    transition: 'all 0.8s ease-out',
                    animation: `building-dust-${i} 0.8s ease-out ${i * 0.1}s forwards`,
                    pointerEvents: 'none', zIndex: 5,
                  }} />
                ))}
                <View style={{
                  position: 'absolute', left: '30%', top: -10,
                  fontSize: 8, color: '#3B82F6',
                  animation: 'construction-drone 1s ease-out',
                  pointerEvents: 'none', zIndex: 6,
                }}>
                  {'\u{1F4E1}'}
                </View>
              </>
            )}
            {/* Demolition particles */}
            {animState?.demolishSpaceId === pos && (
              <>
                {[0,1,2,3,4].map(i => (
                  <View key={`debris-${i}`} style={{
                    position: 'absolute', left: `${15 + i * 18}%`, top: `${20 + i * 10}%`,
                    width: 4, height: 4,
                    background: '#ef4444', borderRadius: '50%',
                    opacity: 0.8,
                    transition: 'all 0.7s ease-out',
                    animation: `shard-fly-${i} 0.7s ease-out ${i * 0.08}s forwards`,
                    pointerEvents: 'none', zIndex: 5,
                  }} />
                ))}
                <View style={{
                  position: 'absolute', left: '40%', top: '40%',
                  width: 10, height: 10,
                  background: 'rgba(239,68,68,0.3)',
                  borderRadius: '50%',
                  animation: 'dust-cloud 0.8s ease-out',
                  pointerEvents: 'none', zIndex: 4,
                }} />
              </>
            )}
          </View>
        );
      })}

      {/* Center dice / logo */}
      <View style={{
        position: 'absolute', top: cellSize, left: cellSize,
        width: cellSize * (GRID_SIZE - 2), height: cellSize * (GRID_SIZE - 2),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none', zIndex: 10,
      }}>
        {displayDice && displayDice.length === 2 ? (
          <View style={{
            display: 'flex', flexDirection: 'row', gap: Math.max(8, cellSize * 0.15),
            animation: rolling
              ? 'dice-micro-gravity 0.6s ease-in-out, dice-bounce 0.8s ease 0.6s, dice-light-trail 0.3s ease-in-out'
              : 'dice-land 0.3s ease',
          }}>
            <View style={{
              width: cellSize * 0.55, height: cellSize * 0.55,
              background: '#fff', borderRadius: cellSize * 0.1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: rolling
                ? '0 4px 20px rgba(0,0,0,0.4)'
                : animState?.isDoubles
                  ? '0 0 20px rgba(59,130,246,0.6), 0 0 40px rgba(59,130,246,0.3)'
                  : '0 4px 20px rgba(0,0,0,0.4)',
              animation: animState?.isDoubles && !rolling ? 'doubles-pulse 1s ease 3' : 'none',
            }}>
              <Text style={{
                fontSize: cellSize * 0.35, lineHeight: 1,
                color: '#1a1a2e',
                animation: rolling ? 'none' : animState?.isDoubles ? 'time-slow-mo 1s ease' : 'none',
              }}>
                {DICE_FACES[displayDice[0]]}
              </Text>
            </View>
            <View style={{
              width: cellSize * 0.55, height: cellSize * 0.55,
              background: '#fff', borderRadius: cellSize * 0.1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: rolling
                ? '0 4px 20px rgba(0,0,0,0.4)'
                : animState?.isDoubles
                  ? '0 0 20px rgba(59,130,246,0.6), 0 0 40px rgba(59,130,246,0.3)'
                  : '0 4px 20px rgba(0,0,0,0.4)',
              animation: animState?.isDoubles && !rolling ? 'doubles-pulse 1s ease 3' : 'none',
            }}>
              <Text style={{
                fontSize: cellSize * 0.35, lineHeight: 1,
                color: '#1a1a2e',
                animation: rolling ? 'none' : animState?.isDoubles ? 'time-slow-mo 1s ease' : 'none',
              }}>
                {DICE_FACES[displayDice[1]]}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={{
            fontSize: Math.max(10, cellSize * 0.3), fontWeight: 800,
            background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            opacity: 0.3, letterSpacing: 4,
          }}>
            MONOPOLY
          </Text>
        )}
      </View>

      {/* Speeding warning particles on 3rd double */}
      {animState?.speedWarning && (
        <View style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 25,
          animation: 'speeding-warning 0.6s ease 3',
          background: 'radial-gradient(ellipse at center, rgba(239,68,68,0.15), transparent 70%)',
        }}>
          {[0,1,2,3,4,5].map(i => (
            <View key={`particle-${i}`} style={{
              position: 'absolute',
              left: `${30 + Math.random() * 40}%`,
              top: `${30 + Math.random() * 40}%`,
              width: 4 + Math.random() * 4,
              height: 4 + Math.random() * 4,
              background: ['#ef4444', '#ff6b6b', '#ff0000'][i % 3],
              borderRadius: '50%',
              animation: `speeding-particle-${i} 0.5s ease-out ${i * 0.1}s forwards`,
            }} />
          ))}
        </View>
      )}

      {/* Jail overlay */}
      {animState?.jailDrop && (
        <View style={{
          position: 'absolute', inset: 0, zIndex: 30,
          animation: 'jail-vignette 0.5s ease forwards',
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 100%)',
          pointerEvents: 'none',
        }}>
          <View style={{
            position: 'absolute', left: '38%', top: '38%',
            width: '24%', height: '24%',
            border: '4px solid rgba(100,100,100,0.8)',
            borderRadius: 8,
            animation: 'jail-bars-slam 0.5s ease-out',
            display: 'flex', justifyContent: 'space-around', alignItems: 'stretch',
            padding: '2px 0',
          }}>
            {[0,1,2].map(i => (
              <View key={`bar-${i}`} style={{
                width: 4,
                background: 'rgba(150,150,150,0.6)',
                borderRadius: 2,
              }} />
            ))}
            <View style={{
              position: 'absolute', top: '45%', left: '10%', right: '10%',
              height: 3,
              background: 'rgba(150,150,150,0.6)',
              borderRadius: 2,
            }} />
            <View style={{
              position: 'absolute', bottom: '15%', left: '10%', right: '10%',
              height: 3,
              background: 'rgba(150,150,150,0.6)',
              borderRadius: 2,
            }} />
          </View>
        </View>
      )}
    </View>
  );
}
