import { View, Text, Button } from '../elements.jsx';

const ACCENT = '#3B82F6';

export default function ActionBar({ game, playerId, socket, isMobile }) {
  const player = game?.players?.find(p => p.id === playerId);
  const isMyTurn = game?.players?.[game?.currentTurn]?.id === playerId;
  const phase = game?.turnPhase;
  const inJail = player?.inJail;

  if (!game || !player) return null;

  const canRoll = isMyTurn && phase === 'pre_roll';
  const canEndTurn = isMyTurn && phase === 'post_roll' && !game.canRollAgain;
  const canRollAgain = isMyTurn && phase === 'post_roll' && game.canRollAgain;
  const canBuy = isMyTurn && phase === 'post_roll';

  const handleRoll = () => socket?.emit('roll_dice');
  const handleEndTurn = () => {
    socket?.emit('end_turn', (res) => {
      if (res?.rollAgain) {
        socket?.emit('roll_dice');
      }
    });
  };
  const handleBuy = () => socket?.emit('buy_property');
  const handlePayBail = () => socket?.emit('pay_jail_bail');
  const handleUseCard = () => socket?.emit('use_jail_card');

  const btnBase = {
    padding: isMobile ? '12px 20px' : '10px 20px',
    borderRadius: 12, fontSize: isMobile ? 15 : 13, fontWeight: 700,
    border: 'none', cursor: 'pointer',
  };

  const goldBtn = { ...btnBase, background: ACCENT, color: '#F0F0F0', boxShadow: '0 4px 16px rgba(59,130,246,0.3)' };
  const glassBtn = { ...btnBase, background: 'rgba(255,255,255,0.06)', color: '#F0F0F0', border: '1px solid rgba(255,255,255,0.1)' };

  return (
    <View style={{
      display: 'flex', flexWrap: 'wrap', gap: 8,
      padding: isMobile ? '12px 16px' : '8px 0',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {!isMyTurn && (
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          Waiting for {game.players[game.currentTurn]?.name}...
        </Text>
      )}
      {inJail && isMyTurn && (
        <>
          <Button onPress={handlePayBail} style={{ ...goldBtn, fontSize: 13 }}>
            Pay $50 Bail
          </Button>
          {player.getOutOfJailCards > 0 && (
            <Button onPress={handleUseCard} style={glassBtn}>
              Use Jail Card ({player.getOutOfJailCards})
            </Button>
          )}
        </>
      )}
      {canRoll && !inJail && (
        <Button onPress={handleRoll} style={{ ...goldBtn, animation: 'pulse-glow 2s infinite', fontSize: 15, padding: '12px 32px' }}>
          Roll Dice
        </Button>
      )}
      {canRollAgain && (
        <Button onPress={handleEndTurn} style={{ ...goldBtn, animation: 'pulse-glow 2s infinite', fontSize: 15, padding: '12px 32px' }}>
          Roll Again
        </Button>
      )}
      {canEndTurn && (
        <Button onPress={handleEndTurn} style={goldBtn}>
          End Turn
        </Button>
      )}
      {canEndTurn && (
        <Button onPress={handleBuy} style={glassBtn}>
          Buy Property
        </Button>
      )}
    </View>
  );
}
