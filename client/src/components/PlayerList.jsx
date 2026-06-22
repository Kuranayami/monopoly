import { View, Text } from '../elements.jsx';

const TOKEN_COLORS = {
  top_hat: '#e74c3c', car: '#3498db', dog: '#f39c12',
  iron: '#2ecc71', battleship: '#9b59b6', thimble: '#e91e63',
};

export default function PlayerList({ game, playerId }) {
  return (
    <View style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Text style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
        Players ({game?.players?.filter(p => !p.isBankrupt).length || 0})
      </Text>
      {game?.players?.map((p, i) => {
        const isMe = p.id === playerId;
        const isTurn = game.players[game.currentTurn]?.id === p.id;
        return (
          <View key={p.id} style={{
            padding: '10px 12px',
            borderRadius: 14,
            background: isTurn ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)',
            border: isTurn ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.06)',
            opacity: p.isBankrupt ? 0.4 : 1,
            animation: isTurn ? 'pulse-glow 2s infinite' : 'none',
          }}>
            <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <View style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <View style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: TOKEN_COLORS[p.token] || '#fff',
                  border: '1px solid rgba(255,255,255,0.3)',
                }} />
                <Text style={{
                  fontSize: 14, fontWeight: 600, color: '#fff',
                }}>
                  {p.name}{isMe ? ' (You)' : ''}
                </Text>
              </View>
              <Text style={{
                fontSize: 14, fontWeight: 700, color: p.cash >= 0 ? '#fbbf24' : '#ef4444',
              }}>
                ${p.cash}
              </Text>
            </View>
            <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                {SPACE_NAMES[p.position] || `Space ${p.position}`}
              </Text>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                {p.properties.length} props
                {p.getOutOfJailCards > 0 ? ` 🃏${p.getOutOfJailCards}` : ''}
                {p.inJail ? ' 🔒' : ''}
                {!p.connected ? ' (disconnected)' : ''}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const SPACE_NAMES = [
  'GO', 'Mediterranean', 'Comm Chest', 'Baltic', 'Income Tax',
  'Reading RR', 'Oriental', 'Chance', 'Vermont', 'Connecticut',
  'Jail', 'St. Charles', 'Electric Co', 'States', 'Virginia',
  'Penn RR', 'St. James', 'Comm Chest', 'Tennessee', 'New York',
  'Free Parking', 'Kentucky', 'Chance', 'Indiana', 'Illinois',
  'B&O RR', 'Atlantic', 'Ventnor', 'Water Works', 'Marvin Gardens',
  'Go To Jail', 'Pacific', 'N. Carolina', 'Comm Chest', 'Pennsylvania',
  'Short Line', 'Chance', 'Park Place', 'Luxury Tax', 'Boardwalk',
];
