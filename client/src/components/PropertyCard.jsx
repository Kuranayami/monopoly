import { View, Text } from '../elements.jsx';
import { SPACES } from 'shared/constants.js';

export default function PropertyCard({ spaceId, player }) {
  const space = SPACES[spaceId];
  if (!space) return null;

  const houses = player?.houses?.[spaceId] || 0;
  const hasHotel = player?.hotels?.[spaceId] || false;

  const rentTable = space.type === 'property' ? space.rent : null;

  return (
    <View style={{
      background: 'rgba(255,255,255,0.06)', borderRadius: 14,
      border: '1px solid rgba(255,255,255,0.08)',
      overflow: 'hidden',
      width: '100%',
      animation: 'fade-in-up 0.3s ease',
    }}>
      {space.color && (
        <View style={{ height: 8, background: space.color }} />
      )}
      <View style={{ padding: '14px 16px' }}>
        <Text style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
          {space.name}
        </Text>
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
          {space.group?.replace('_', ' ')} • ${space.price}
        </Text>
        {hasHotel && (
          <Text style={{ fontSize: 12, color: '#ef4444', fontWeight: 600, marginBottom: 4 }}>🏨 Hotel</Text>
        )}
        {houses > 0 && !hasHotel && (
          <Text style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600, marginBottom: 4 }}>
            {'🏠'.repeat(houses)} {houses} house{houses > 1 ? 's' : ''}
          </Text>
        )}
        {rentTable && (
          <View style={{ marginTop: 4 }}>
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>Rent:</Text>
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>
              Base: ${rentTable[0]}
              {rentTable[1] && ` | 1H: $${rentTable[1]}`}
              {rentTable[3] && ` | 2H: $${rentTable[2]}`}
            </Text>
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>
              {rentTable[3] && `3H: $${rentTable[3]} `}
              {rentTable[4] && `| 4H: $${rentTable[4]} `}
              {rentTable[5] && `| Hotel: $${rentTable[5]}`}
            </Text>
          </View>
        )}
        {space.type === 'railroad' && (
          <View style={{ marginTop: 4 }}>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>Rent:</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              1RR: $25 | 2RR: $50 | 3RR: $100 | 4RR: $200
            </Text>
          </View>
        )}
        {space.type === 'utility' && (
          <View style={{ marginTop: 4 }}>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>Rent:</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              1 util: 4× dice | 2 util: 10× dice
            </Text>
          </View>
        )}
        {space.price && (
          <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>
            Mortgage value: ${Math.floor(space.price / 2)}
          </Text>
        )}
      </View>
    </View>
  );
}
