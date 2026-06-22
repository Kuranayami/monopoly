import { useMemo } from 'react';
import { View, Text } from '../elements.jsx';
import { SPACES, GRID_POSITIONS, GRID_SIZE } from 'shared/constants.js';

const TOKEN_ICONS = {
  top_hat: '\u{1F3A9}', car: '\u{1F697}', dog: '\u{1F436}',
  iron: '\u{1F527}', battleship: '\u{1F6A2}', thimble: '\u{1F9F5}',
};

export default function Board({ game, playerId, cellSize = 72 }) {
  const boardPx = cellSize * GRID_SIZE;

  const getTokens = (pos) =>
    game?.players?.filter(p => !p.isBankrupt && p.position === pos) || [];

  const isCorner = (gx, gy) =>
    (gx === 0 && gy === 0) || (gx === 0 && gy === 10) ||
    (gx === 10 && gy === 0) || (gx === 10 && gy === 10);

  const nameFs = Math.max(8, Math.floor(cellSize * 0.12));
  const priceFs = Math.max(7, Math.floor(cellSize * 0.09));
  const cornerFs = Math.max(10, Math.floor(cellSize * 0.16));
  const barH = Math.max(4, Math.floor(cellSize * 0.07));
  const tokenSize = Math.max(18, Math.floor(cellSize * 0.18));

  return (
    <View style={{
      position: 'relative', width: boardPx, height: boardPx,
      background: 'rgba(255,255,255,0.02)', borderRadius: 8,
      border: '2px solid rgba(245,158,11,0.2)',
    }}>
      {GRID_POSITIONS.map(({ pos, x, y }) => {
        const space = SPACES[pos];
        const corner = isCorner(x, y);
        const tokens = getTokens(pos);
        const owner = game?.players?.find(p => p.properties.includes(pos) && !p.isBankrupt);
        const houses = owner?.houses?.[pos] || 0;
        const hasHotel = owner?.hotels?.[pos] || false;

        return (
          <View key={pos} style={{
            position: 'absolute',
            left: x * cellSize, top: y * cellSize,
            width: cellSize, height: cellSize,
            background: space?.color ? `${space.color}08` : 'transparent',
            border: '1px solid rgba(255,255,255,0.04)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center',
            justifyContent: corner ? 'center' : 'flex-start',
            padding: corner ? 4 : '2px 2px 2px 2px',
            overflow: 'hidden',
          }}>
            {space && !corner && (
              <>
                {space.color && space.type === 'property' && (
                  <View style={{
                    width: '100%', height: barH, background: space.color,
                    flexShrink: 0,
                  }} />
                )}
                <Text style={{
                  fontSize: nameFs,
                  color: 'rgba(255,255,255,0.7)',
                  textAlign: 'center', lineHeight: 1.15, padding: '0 2px',
                  marginTop: 2, width: '100%',
                  wordBreak: 'break-word',
                }}>
                  {space.name}
                </Text>
                {space.price > 0 && (
                  <Text style={{
                    fontSize: priceFs, color: '#fbbf24',
                    textAlign: 'center', lineHeight: 1.1, marginTop: 1,
                  }}>
                    ${space.price}
                  </Text>
                )}
                {owner && (
                  <Text style={{
                    fontSize: Math.max(6, priceFs - 1), color: 'rgba(255,255,255,0.35)',
                    textAlign: 'center', lineHeight: 1.1, marginTop: 1,
                  }}>
                    {owner.name}
                  </Text>
                )}
                {(hasHotel || houses > 0) && (
                  <Text style={{
                    fontSize: Math.max(8, cellSize * 0.09), lineHeight: 1.2, marginTop: 1,
                    color: hasHotel ? '#ef4444' : '#fbbf24',
                  }}>
                    {hasHotel ? '\u{1F3E8}' : '\u{1F3E0}'.repeat(houses)}
                  </Text>
                )}
              </>
            )}
            {corner && space && (
              <Text style={{
                fontSize: cornerFs, fontWeight: 700, color: '#fbbf24',
                textAlign: 'center', lineHeight: 1.2,
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
                    filter: p.id === playerId ? 'drop-shadow(0 0 3px rgba(245,158,11,0.8))' : 'none',
                  }}>
                    {TOKEN_ICONS[p.token] || '\u{1F3B1}'}
                  </Text>
                ))}
              </View>
            )}
          </View>
        );
      })}

      {/* Center logo */}
      <View style={{
        position: 'absolute', top: cellSize, left: cellSize,
        width: cellSize * (GRID_SIZE - 2), height: cellSize * (GRID_SIZE - 2),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <Text style={{
          fontSize: Math.max(10, cellSize * 0.3), fontWeight: 800,
          background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          opacity: 0.3, letterSpacing: 4,
        }}>
          MONOPOLY
        </Text>
      </View>
    </View>
  );
}
