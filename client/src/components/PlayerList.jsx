import { View, Text } from '../elements.jsx';

const TOKEN_ICONS = {
  top_hat: '\u{1F3A9}', car: '\u{1F697}', dog: '\u{1F436}',
  iron: '\u{1F527}', battleship: '\u{1F6A2}', thimble: '\u{1F9F5}',
};

export default function PlayerList({ game, playerId }) {
  return (
    <View style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Text style={{ fontSize: 13, fontWeight: 700, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
        Players ({game?.players?.filter(p => !p.isBankrupt).length || 0})
      </Text>
      {game?.players?.map((p, i) => {
        const isMe = p.id === playerId;
        const isTurn = game.players[game.currentTurn]?.id === p.id;
        return (
          <View key={p.id} style={{
            padding: '10px 12px',
            borderRadius: 14,
            background: isTurn ? 'rgba(59,130,246,0.1)' : '#1E1E1E',
            border: isTurn ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.06)',
            opacity: p.isBankrupt ? 0.4 : 1,
            animation: isTurn ? 'pulse-glow 2s infinite' : 'none',
          }}>
            <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <View style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 16, lineHeight: 1.2 }}>{TOKEN_ICONS[p.token] || '\u{1F3B1}'}</Text>
                <Text style={{
                  fontSize: 14, fontWeight: 600, color: '#F0F0F0',
                }}>
                  {p.name}{isMe ? ' (You)' : ''}
                </Text>
              </View>
              <Text style={{
                fontSize: 14, fontWeight: 700, color: '#3B82F6',
              }}>
                ${p.cash}
              </Text>
            </View>
            <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: '#A0A0A0' }}>
                {SPACE_NAMES[p.position] || `Space ${p.position}`}
              </Text>
              <Text style={{ fontSize: 11, color: '#A0A0A0' }}>
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
