import { useState, useEffect } from 'react';
import { View, Text, Button, Input, Scroller } from '../elements.jsx';
import { useWindowSize, useIsMobile, useIsDesktop } from '../hooks.js';
import { TOKENS } from 'shared/constants.js';

const GOLD = 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)';

export default function Lobby({ socket, connected, playerName, setPlayerName, playerToken, setPlayerToken, playerId, onJoinGame, showNotif }) {
  const { width } = useWindowSize();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const [tab, setTab] = useState('create');
  const [joinCode, setJoinCode] = useState('');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  const scale = isMobile ? Math.min(1, width / 480) : Math.min(1.2, width / 1200);
  const cardW = isMobile ? Math.min(380, width * 0.92) : Math.min(640, width * 0.45);

  useEffect(() => {
    if (!socket) return;
    const interval = setInterval(() => {
      socket.emit('list_rooms', (res) => {
        if (res.success) setRooms(res.rooms);
      });
    }, 3000);
    socket.emit('list_rooms', (res) => {
      if (res.success) setRooms(res.rooms);
    });
    return () => clearInterval(interval);
  }, [socket]);

  const handleCreate = () => {
    if (!playerName.trim()) return showNotif('Enter a name');
    if (!playerToken) return showNotif('Pick a token');
    setLoading(true);
    socket.emit('create_room', { playerName: playerName.trim(), token: playerToken }, (res) => {
      setLoading(false);
      if (res.success) {
        setPlayerToken(playerToken);
        onJoinGame(res.game, res.playerId);
      } else {
        showNotif(res.error);
      }
    });
  };

  const handleJoin = () => {
    if (!playerName.trim()) return showNotif('Enter a name');
    if (!playerToken) return showNotif('Pick a token');
    if (!joinCode.trim()) return showNotif('Enter room code');
    setLoading(true);
    socket.emit('join_room', { roomCode: joinCode.trim().toUpperCase(), playerName: playerName.trim(), token: playerToken }, (res) => {
      setLoading(false);
      if (res.success) {
        setPlayerToken(playerToken);
        onJoinGame(res.game, res.playerId);
      } else {
        showNotif(res.error);
      }
    });
  };

  const g = (v) => Math.round(v * scale);

  return (
    <View style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <View style={{
        width: cardW, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)',
        borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', padding: g(32),
        animation: 'fade-in-up 0.5s ease',
      }}>
        <Text style={{ fontSize: g(36), fontWeight: 800, textAlign: 'center', background: GOLD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: g(8) }}>
          MONOPOLY
        </Text>
        <Text style={{ fontSize: g(13), color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: g(24) }}>
          {connected ? '🟢 Connected' : '🔴 Connecting...'}
        </Text>

        <Text style={{ fontSize: g(13), color: 'rgba(255,255,255,0.6)', marginBottom: g(6) }}>Your Name</Text>
        <Input
          value={playerName}
          onChangeText={setPlayerName}
          placeholder="Enter your name..."
          placeholderTextColor="rgba(255,255,255,0.2)"
          style={{
            width: '100%', padding: `${g(12)}px ${g(16)}px`, fontSize: g(15),
            background: 'rgba(255,255,255,0.04)', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.08)', color: '#fff',
            marginBottom: g(20),
          }}
        />

        <Text style={{ fontSize: g(13), color: 'rgba(255,255,255,0.6)', marginBottom: g(12) }}>Choose Your Token</Text>
        <View style={{ display: 'flex', flexWrap: 'wrap', gap: g(8), marginBottom: g(24) }}>
          {TOKENS.map(t => {
            const selected = playerToken === t;
            return (
              <Button key={t} onPress={() => setPlayerToken(t)}
                style={{
                  padding: `${g(8)}px ${g(14)}px`, borderRadius: 12, fontSize: g(13),
                  background: selected ? GOLD : 'rgba(255,255,255,0.04)',
                  border: selected ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  color: selected ? '#060612' : 'rgba(255,255,255,0.7)',
                  fontWeight: selected ? 700 : 400,
                  transition: 'all 0.2s',
                }}>
                {t.replace('_', ' ')}
              </Button>
            );
          })}
        </View>

        <View style={{ display: 'flex', gap: g(8), marginBottom: g(16) }}>
          <Button onPress={() => setTab('create')} style={{
            flex: 1, padding: `${g(10)}px`, borderRadius: 12, fontSize: g(14), fontWeight: 600,
            background: tab === 'create' ? GOLD : 'rgba(255,255,255,0.04)',
            color: tab === 'create' ? '#060612' : 'rgba(255,255,255,0.5)',
          }}>Create Room</Button>
          <Button onPress={() => setTab('join')} style={{
            flex: 1, padding: `${g(10)}px`, borderRadius: 12, fontSize: g(14), fontWeight: 600,
            background: tab === 'join' ? GOLD : 'rgba(255,255,255,0.04)',
            color: tab === 'join' ? '#060612' : 'rgba(255,255,255,0.5)',
          }}>Join Room</Button>
        </View>

        {tab === 'create' ? (
          <Button onPress={handleCreate} disabled={loading || !connected}
            style={{
              width: '100%', padding: `${g(14)}px`, borderRadius: 14, fontSize: g(16), fontWeight: 700,
              background: GOLD, color: '#060612', boxShadow: '0 4px 20px rgba(245,158,11,0.3)',
            }}>
            {loading ? 'Creating...' : 'Create Room'}
          </Button>
        ) : (
          <>
            <Input
              value={joinCode}
              onChangeText={(v) => setJoinCode(v.toUpperCase())}
              placeholder="Enter room code..."
              placeholderTextColor="rgba(255,255,255,0.2)"
              maxLength={4}
              style={{
                width: '100%', padding: `${g(12)}px ${g(16)}px`, fontSize: g(18),
                textAlign: 'center', letterSpacing: g(4),
                background: 'rgba(255,255,255,0.04)', borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)', color: '#fff',
                marginBottom: g(12),
              }}
            />
            <Button onPress={handleJoin} disabled={loading || !connected}
              style={{
                width: '100%', padding: `${g(14)}px`, borderRadius: 14, fontSize: g(16), fontWeight: 700,
                background: GOLD, color: '#060612', boxShadow: '0 4px 20px rgba(245,158,11,0.3)',
                marginBottom: g(16),
              }}>
              {loading ? 'Joining...' : 'Join Room'}
            </Button>
          </>
        )}

        {rooms.length > 0 && tab === 'join' && (
          <>
            <Text style={{ fontSize: g(12), color: 'rgba(255,255,255,0.3)', marginBottom: g(8) }}>Available Rooms</Text>
            <Scroller style={{ maxHeight: g(150) }}>
              {rooms.map(r => (
                <Button key={r.roomCode} onPress={() => setJoinCode(r.roomCode)}
                  style={{
                    width: '100%', padding: `${g(8)}px ${g(12)}px`, borderRadius: 10,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    marginBottom: g(6), display: 'flex', justifyContent: 'space-between',
                  }}>
                  <Text style={{ fontSize: g(13), color: '#fbbf24', fontWeight: 600 }}>{r.roomCode}</Text>
                  <Text style={{ fontSize: g(12), color: 'rgba(255,255,255,0.4)' }}>{r.hostName} • {r.playerCount}/6</Text>
                </Button>
              ))}
            </Scroller>
          </>
        )}
      </View>
    </View>
  );
}
