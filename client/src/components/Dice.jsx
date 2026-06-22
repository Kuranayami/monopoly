import { View, Text, Button } from '../elements.jsx';

const DICE_FACES = ['', '\u2680', '\u2681', '\u2682', '\u2683', '\u2684', '\u2685'];

export default function Dice({ dice, rolling, onRoll, canRoll }) {
  if (!dice || dice.length === 0) {
    dice = null;
  }

  return (
    <View style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {dice ? (
        <>
          <View style={{
            width: 48, height: 48, background: '#fff', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            animation: rolling ? 'dice-shake 0.3s ease' : 'none',
          }}>
            <Text style={{ fontSize: 28, lineHeight: 1, color: '#1a1a2e' }}>{DICE_FACES[dice[0]]}</Text>
          </View>
          <View style={{
            width: 48, height: 48, background: '#fff', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            animation: rolling ? 'dice-shake 0.3s ease' : 'none',
          }}>
            <Text style={{ fontSize: 28, lineHeight: 1, color: '#1a1a2e' }}>{DICE_FACES[dice[1]]}</Text>
          </View>
        </>
      ) : (
        <View style={{ display: 'flex', gap: 12 }}>
          {canRoll && (
            <Button onPress={onRoll}
              style={{
                padding: '10px 24px', borderRadius: 12, fontSize: 15, fontWeight: 700,
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)',
                color: '#060612', boxShadow: '0 4px 20px rgba(245,158,11,0.3)',
                animation: 'pulse-glow 2s infinite',
              }}>
              Roll Dice
            </Button>
          )}
        </View>
      )}
    </View>
  );
}
