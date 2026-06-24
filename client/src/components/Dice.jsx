import { View, Text, Button } from '../elements.jsx';

const DICE_FACES = ['', '\u2680', '\u2681', '\u2682', '\u2683', '\u2684', '\u2685'];

export default function Dice({ dice, rolling, onRoll, canRoll, animState }) {
  if (!dice || dice.length === 0) {
    dice = null;
  }

  const isDoubles = dice && dice.length === 2 && dice[0] === dice[1] && !rolling;

  return (
    <View style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {dice ? (
        <>
          <View style={{
            width: 48, height: 48, background: '#fff', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: rolling
              ? '0 4px 12px rgba(0,0,0,0.3)'
              : isDoubles
                ? '0 0 20px rgba(59,130,246,0.6), 0 0 40px rgba(59,130,246,0.3)'
                : '0 4px 12px rgba(0,0,0,0.3)',
            animation: rolling
              ? 'dice-micro-gravity 0.6s ease-in-out, dice-bounce 0.8s ease 0.6s, dice-light-trail 0.3s ease-in-out'
              : isDoubles
                ? 'doubles-pulse 1s ease 3'
                : 'dice-land 0.3s ease',
          }}>
            <Text style={{
              fontSize: 28, lineHeight: 1, color: '#1a1a2e',
              animation: isDoubles ? 'time-slow-mo 1s ease infinite' : 'none',
            }}>
              {DICE_FACES[dice[0]]}
            </Text>
          </View>
          <View style={{
            width: 48, height: 48, background: '#fff', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: rolling
              ? '0 4px 12px rgba(0,0,0,0.3)'
              : isDoubles
                ? '0 0 20px rgba(59,130,246,0.6), 0 0 40px rgba(59,130,246,0.3)'
                : '0 4px 12px rgba(0,0,0,0.3)',
            animation: rolling
              ? 'dice-micro-gravity 0.6s ease-in-out, dice-bounce 0.8s ease 0.6s, dice-light-trail 0.3s ease-in-out'
              : isDoubles
                ? 'doubles-pulse 1s ease 3'
                : 'dice-land 0.3s ease',
          }}>
            <Text style={{
              fontSize: 28, lineHeight: 1, color: '#1a1a2e',
              animation: isDoubles ? 'time-slow-mo 1s ease infinite' : 'none',
            }}>
              {DICE_FACES[dice[1]]}
            </Text>
          </View>
        </>
      ) : (
        <View style={{ display: 'flex', gap: 12 }}>
          {canRoll && (
            <Button onPress={onRoll}
              style={{
                padding: '10px 24px', borderRadius: 12, fontSize: 15, fontWeight: 700,
                background: animState?.speedWarning ? 'linear-gradient(135deg, #ef4444, #dc2626)' : '#3B82F6',
                color: '#F0F0F0',
                boxShadow: animState?.speedWarning
                  ? '0 4px 20px rgba(239,68,68,0.4)'
                  : '0 4px 20px rgba(59,130,246,0.3)',
                animation: animState?.speedWarning ? 'speeding-warning 0.6s ease infinite' : 'pulse-glow 2s infinite',
                transform: animState?.speedWarning ? 'scale(1.05)' : 'none',
                transition: 'all 0.3s ease',
              }}>
              {animState?.speedWarning ? '\u26A0\uFE0F Roll Dice!' : 'Roll Dice'}
            </Button>
          )}
        </View>
      )}
    </View>
  );
}
